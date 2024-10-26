export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    try {
        if (req.method !== 'POST') {
            throw new Error('Method not allowed');
        }

        const body = await req.json();
        if (!body.name || !body.age || !body.question) {
            throw new Error('Missing required fields');
        }

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('API key not configured');
        }

        // Si c'est une réponse à un QCM
        if (body.question.startsWith('Response:')) {
            const prompt = `En tant que tuteur pédagogique super enthousiaste répondant à ${body.name}, évalue sa réponse au QCM : ${body.question}

Instructions importantes :
1. Commence DIRECTEMENT par une réaction spontanée et encourageante :
   - Si correct : "Bravo ! 🌟", "Excellent ! ⭐", "Super ! 🎉"
   - Si incorrect : "Pas tout à fait ! 🤔", "Presque ! ✨", "Essayons de voir ça ensemble ! 💡"
2. Donne une explication détaillée et encourageante avec BEAUCOUP d'emojis
3. Utilise des analogies simples et amusantes
4. Garde un ton super positif et amical
5. Termine par une nouvelle question QCM amusante

Format de réponse souhaité :
[Réaction] 🌟
[Explication avec emojis]

[Nouvelle Question] 📝
A) [Option fun] 🔵
B) [Option fun] 🟢
C) [Option fun] 🟡`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
                    max_tokens: 800
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${await response.text()}`);
            }

            const data = await response.json();
            return new Response(JSON.stringify(data), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // Pour une nouvelle question
        const initialPrompt = `En tant que tuteur pédagogique super enthousiaste s'adressant à ${body.name} (${body.age}), explique de façon amusante et engageante : ${body.question}

Instructions essentielles :
1. Commence par une introduction super accueillante avec des emojis 👋 ⭐
2. Utilise BEAUCOUP d'emojis pertinents tout au long de l'explication 🌟 ✨
3. Chaque concept doit être expliqué avec une analogie amusante du quotidien 🎯
4. TOUS les termes techniques doivent être expliqués simplement 📚
5. Adapte ton langage à l'âge tout en restant super dynamique 🎈
6. Pose des mini-questions rhétoriques pour maintenir l'engagement 🤔
7. Termine par un QCM ludique et amusant 🎮

Format de réponse souhaité :
[Introduction amicale avec emojis]

[Explication principale avec beaucoup d'emojis et d'analogies]

[Question finale] 📝
A) [Option fun] 🔵
B) [Option fun] 🟢
C) [Option fun] 🟡

À toi de jouer ! ✨`;

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
                    content: initialPrompt
                }],
                temperature: 0.7,
                max_tokens: 800
            })
        });

        if (!openaiResponse.ok) {
            throw new Error(`OpenAI API error: ${await openaiResponse.text()}`);
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
