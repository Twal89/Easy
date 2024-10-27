export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    try {
        if (req.method !== 'POST') {
            throw new Error('Method not allowed');
        }

        const body = await req.json();
        if (!body.name || !body.age || !body.question || !body.messages) {
            throw new Error('Missing required fields');
        }

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('API key not configured');
        }

        // Première interaction - introduction formelle
        let firstMessage = '';
        if (body.messages.length === 0) {
            firstMessage = `Salut ${body.name}! 😊 Je suis super content de te répondre aujourd'hui! Tu m'as demandé quelque chose sur "${body.question}", c'est vraiment passionnant ! Je vais t'expliquer tout ça ! 🔥`;
        }

        // Adapter le ton à l'âge
        let ageAdaptation = '';
        if (body.age === 'enfant') {
            ageAdaptation = `Utilise des mots simples et pleins d'émotions. N'oublie pas d'utiliser des analogies amusantes (ex : "comme un ballon qui gonfle") pour bien expliquer les concepts.`;
        } else if (body.age === 'ado') {
            ageAdaptation = `Utilise un ton amical et engageant, en évitant les termes trop compliqués. Fais attention à expliquer les mots techniques avec des exemples concrets.`;
        } else if (body.age === 'lyceen') {
            ageAdaptation = `Sois clair et précis, mais reste amical. Utilise des exemples concrets pour expliquer les termes plus complexes.`;
        } else if (body.age === 'adulte') {
            ageAdaptation = `Reste professionnel mais amical. Assure-toi d'expliquer les termes techniques et de rendre l'explication claire et facile à suivre.`;
        }

        const messages = [
            { role: 'system', content: `${firstMessage} ${ageAdaptation}` },
            ...body.messages // Historique des messages
        ];

        // Appel à l'API OpenAI avec l'historique des messages
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: messages,
                temperature: 0.7,
                max_tokens: 800
            })
        });

        if (!openaiResponse.ok) {
            throw new Error(`OpenAI API error: ${await openaiResponse.text()}`);
        }

        const data = await openaiResponse.json();

        // Retourner la réponse de GPT avec l'adaptation selon l'âge et un ton amical
        return new Response(JSON.stringify({
            response: data.choices[0].message.content,
            messages: [...body.messages, { role: 'assistant', content: data.choices[0].message.content }]
        }), {
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
