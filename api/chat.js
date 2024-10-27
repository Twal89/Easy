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

        // Adapter le ton en fonction de l'âge de l'utilisateur et détecter les termes techniques
        let introMessage = `En tant que tuteur pédagogique s'adressant à ${body.name} (${body.age}), explique de façon claire et engageante : ${body.question}.
        
        - Détecte automatiquement les mots techniques ou complexes dans ta réponse.
        - Répertorie les mots techniques en les entourant de balises [TERM] et [/TERM].
        - Garde un ton adapté à l'âge (${body.age}) et à la question initiale.`;

        const messages = [
            { role: 'system', content: introMessage },
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

        // Ajouter un console.log pour voir la réponse renvoyée par GPT
        console.log(data.response); // Ceci affichera la réponse avec les termes entourés de balises [TERM]

        // Retourner la réponse de GPT avec les mots techniques
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
