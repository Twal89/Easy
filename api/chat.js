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

        // Adapter le ton en fonction de l'âge de l'utilisateur tout en restant friendly pour tous les âges
        let introMessage = `Tu t'adresses à ${body.name}, âgé(e) de ${body.age}, qui pose la question suivante : "${body.question}". Réponds de manière détaillée, engageante et structurée en paragraphes, avec des explications riches et précises.`;

        // Adapter le ton en fonction de l'âge, mais garder un style friendly et engageant avec des emojis pour tous les âges
        if (body.age === 'enfant') {
            introMessage += `
Instructions pour un enfant (6-11 ans) :
1. Utilise un ton **très enthousiaste** avec **beaucoup d'emojis**. 🎉🤩
2. Fais des analogies simples et amusantes, comme comparer le Soleil à une "énorme boule de feu". ☀️🔥
3. Explique chaque concept avec des phrases courtes et claires.
4. Encourage la curiosité en posant des questions comme "Tu veux en savoir plus ? 😊".`;

        } else if (body.age === 'ado') {
            introMessage += `
Instructions pour un adolescent (12-15 ans) :
1. Utilise un ton **amical et engageant**, avec des **emojis modérés**. 💡⚡
2. Donne des analogies pertinentes pour leur âge, comme des comparaisons avec la technologie ou les réseaux sociaux.
3. Introduis des termes techniques simples mais expliques-les brièvement pour qu'ils comprennent bien.`;

        } else if (body.age === 'lyceen') {
            introMessage += `
Instructions pour un lycéen (16-18 ans) :
1. Utilise un ton **respectueux mais engageant**. 📘
2. Donne des explications plus détaillées, avec des exemples un peu plus complexes, mais garde des analogies accessibles.
3. N'hésite pas à poser des questions pour stimuler la curiosité.`;

        } else if (body.age === 'adulte') {
            introMessage += `
Instructions pour un adulte (18+ ans) :
1. Utilise un ton **amical et professionnel**, mais toujours engageant. 🌍
2. Structure bien les explications en paragraphes détaillés.
3. Utilise des emojis pour illustrer ou rendre l'explication plus visuelle (ex: 🌞 pour le Soleil, ⚛️ pour la science).`;
        }

        // Ajouter l'historique des messages
        const messages = [
            { role: 'system', content: introMessage }, // Message initial avec le ton
            ...body.messages // Historique des messages passés
        ];

        // Appel à l'API OpenAI avec l'historique des messages
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "chatgpt-4o-latest",
                messages: messages,
                temperature: 0.7,
                max_tokens: 800
            })
        });

        if (!openaiResponse.ok) {
            throw new Error(`OpenAI API error: ${await openaiResponse.text()}`);
        }

        const data = await openaiResponse.json();
        
        // Retourner la réponse de GPT
        return new Response(JSON.stringify({
            response: data.choices[0].message.content,
            messages: [...body.messages, { role: 'assistant', content: data.choices[0].message.content }] // Ajout de la réponse dans l'historique
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
