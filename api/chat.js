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

        // Vérifier si c'est le premier message pour ajouter une salutation formelle
        let firstMessage = '';
        if (body.messages.length === 0) {
            firstMessage = `Salut ${body.name} ! 😊 Je suis super content de pouvoir t'aider aujourd'hui ! Tu veux comprendre quelque chose sur "${body.question}" ? Super, on va voir ça ensemble ! 🔥`;
        }

        // Adapter le ton et la formulation à l'âge
        let ageAdaptation = '';
        if (body.age === 'enfant') {
            ageAdaptation = `Utilise des phrases courtes et simples. Prends des exemples du quotidien (comme des jouets, des animaux, etc.) pour expliquer les choses compliquées.`;
        } else if (body.age === 'ado') {
            ageAdaptation = `Sois amical et engageant, mais ajoute des détails techniques en les expliquant simplement. Utilise des exemples pertinents pour leur âge (sports, réseaux sociaux, etc.).`;
        } else if (body.age === 'lyceen') {
            ageAdaptation = `Utilise un ton respectueux et un peu plus formel. Explique des concepts plus avancés, mais reste simple et clair.`;
        } else if (body.age === 'adulte') {
            ageAdaptation = `Sois professionnel mais toujours amical. Ajoute des exemples concrets et des explications plus détaillées.`;
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
                max_tokens: 1000
            })
        });

        if (!openaiResponse.ok) {
            throw new Error(`OpenAI API error: ${await response.text()}`);
        }

        const data = await openaiResponse.json();

        // Retourner la réponse de GPT
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
