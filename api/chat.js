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

        // Pour la première question : inclure une introduction formelle
        let firstMessage = '';
        if (body.messages.length === 0) {
            firstMessage = `Salut ${body.name}! 🌟 Je suis super content de t'aider aujourd'hui! Tu veux savoir quelque chose sur "${body.question}" ? Allons-y ! 👇`;
        }

        // Adapter le ton à l'âge de l'utilisateur
        let ageAdaptation = '';
        if (body.age === 'enfant') {
            ageAdaptation = `Utilise des termes simples et des analogies amusantes pour expliquer ce qu'est ${body.question}. Si des mots compliqués comme "gravité" sont utilisés, assure-toi de les expliquer.`;
        } else if (body.age === 'ado') {
            ageAdaptation = `Adapte ton explication pour un adolescent. Utilise des exemples modernes et évite les mots trop compliqués, mais n'hésite pas à introduire des concepts un peu plus détaillés.`;
        } else if (body.age === 'lyceen') {
            ageAdaptation = `Explique ${body.question} de manière détaillée avec des termes scientifiques, mais assure-toi de les expliquer simplement si nécessaire. Utilise des exemples pertinents.`;
        } else if (body.age === 'adulte') {
            ageAdaptation = `Réponds de manière précise et détaillée, sans infantiliser l'utilisateur. Utilise des explications claires avec des exemples concrets et des termes techniques si nécessaire.`;
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

        // Retourner la réponse de GPT avec l'adaptation selon l'âge
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
