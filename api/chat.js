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

        const prompt = `En tant que tuteur pédagogique s'adressant personnellement à ${body.name}, âgé de ${body.age}, je vais t'expliquer : ${body.question}

Consignes de réponse :
- Commence par une introduction amicale en t'adressant directement à ${body.name}
- Structure ta réponse avec des parties claires (utilise des sauts de ligne pour séparer)
- Adapte ton langage et tes exemples à l'âge de ${body.age}
- Utilise des analogies avec la vie quotidienne pour faciliter la compréhension
- Ajoute des emojis pertinents pour rendre l'explication plus engageante
- Pose quelques questions rhétoriques pour maintenir l'engagement
- Termine par un petit résumé et un encouragement personnalisé

Important :
- Pour 6-11 ans : Utilise un langage très simple, beaucoup d'exemples concrets et d'analogies amusantes
- Pour 12-15 ans : Équilibre entre simplicité et concepts plus avancés, avec des références à leur quotidien
- Pour 16-18 ans : Introduis des concepts plus complexes tout en restant accessible
- Pour 18+ ans : Garde un ton amical mais plus mature, avec des explications détaillées

N'oublie pas d'ajouter des sauts de ligne pour une meilleure lisibilité.`;

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
