export const config = { 
    runtime: 'edge',
};

export default async function handler(req) {
    try {
        // Vérification de la méthode
        if (req.method !== 'POST') {
            throw new Error('Method not allowed');
        }

        // Récupération et vérification du corps
        const body = await req.json();
        if (!body.name || !body.age || !body.question) {
            throw new Error('Missing required fields');
        }

        // Vérification de la clé API
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('API key not configured');
        }

        // Construction du prompt avec des sauts de ligne explicites
const prompt = `En tant que tuteur pédagogique s'adressant personnellement à ${body.name}, qui a ${body.age}, explique de manière pédagogique et engageante : ${body.question}

Instructions spécifiques :
1. Commence par une introduction personnelle et amicale
2. TRÈS IMPORTANT : Pour CHAQUE terme technique ou scientifique que tu utilises :
   - Donne immédiatement une définition simple
   - Utilise une comparaison avec la vie quotidienne
   - Propose un synonyme plus simple si possible
   - Explique le concept avec une analogie concrète

3. Structure ton explication :
   - Divise en petites parties faciles à comprendre
   - Commence par les concepts de base avant d'aller plus loin
   - Après chaque nouvelle notion, vérifie la compréhension avec une question simple
   - Utilise beaucoup d'exemples concrets du quotidien

4. Adaptation selon l'âge :
   - 6-11 ans : Uniquement des mots simples, remplace TOUS les termes techniques
   - 12-15 ans : Introduis les termes techniques mais explique-les comme à un ami
   - 16-18 ans : Utilise les termes techniques mais avec des exemples concrets
   - 18+ ans : Termes techniques acceptés mais toujours accompagnés d'explications

5. Rends l'explication vivante :
   - Ajoute des emojis pertinents
   - Pose des questions rhétoriques
   - Utilise des "imagine que..." pour les concepts difficiles
   - Fais des liens avec des situations que ${body.name} pourrait connaître

Format de réponse :
- Chaque nouveau concept sur une nouvelle ligne
- Utilise des tirets pour les listes d'explications
- Mets en gras les mots-clés importants
- Termine par un mini-quiz amusant pour vérifier la compréhension

N'oublie jamais : AUCUN terme technique ne doit rester inexpliqué. Si tu utilises un mot compliqué, tu DOIS l'expliquer immédiatement de manière simple.`;

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                temperature: 0.7,
                max_tokens: 800,
                presence_penalty: 0.6,
                frequency_penalty: 0.5
            })
        });

        if (!openaiResponse.ok) {
            const error = await openaiResponse.json();
            throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
        }

        const data = await openaiResponse.json();
        
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message || 'An error occurred',
            details: error.toString()
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
