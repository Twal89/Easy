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

        // Adapter le ton et insister sur les réponses fluides et contextuelles
        let introMessage = `En tant que tuteur pédagogique, continue la conversation de manière fluide et engageante avec ${body.name} (${body.age}). Réponds à sa question avec des explications claires et détaillées : ${body.question}.
        
        - Les réponses doivent être cohérentes avec les messages précédents, sans réintroduire formellement le nom de l'utilisateur.
        - Assure-toi que chaque réponse fait un lien logique avec le fil de la discussion précédente.
        - Identifie et souligne les termes techniques avec des balises [TERM] et [/TERM].
        - Structure la réponse en paragraphes bien distincts avec des emojis si nécessaire.
        - Utilise un ton adapté à l'âge (${body.age}).

        Voici l'historique de la conversation :`;

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
        console.log(data.response);

        // Retourner la réponse de GPT avec les mots techniques soulignés
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
