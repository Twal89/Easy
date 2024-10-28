export const config = {
    runtime: 'edge',
};

// Variable pour suivre si c'est la première réponse
let isFirstResponse = true;

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

        // Adapter le ton en fonction de l'âge de l'utilisateur pour la première réponse uniquement
        let introMessage = isFirstResponse
            ? `En tant que tuteur pédagogique s'adressant à ${body.name} (${body.age}), explique de façon claire, structurée et engageante : ${body.question}.`
            : `${body.question}`;

        if (body.age === 'enfant') {
            introMessage += `
Instructions pour un enfant :
1. Utilise un ton très enthousiaste avec BEAUCOUP d'emojis 🎉.
2. Explique les concepts en utilisant des phrases simples et courtes.
3. Inclure des sous-titres sous forme de questions pour garder leur attention.
4. Utilise des listes à puces et des termes en **gras** pour les rendre plus accessibles.`;
        } else if (body.age === 'ado') {
            introMessage += `
Instructions pour un adolescent :
1. Utilise un ton amical et encourageant avec des emojis💡.
2. Explique les concepts avec des analogies pertinentes.
3. Ajoute des sous-titres pour structurer l'information.
4. Utilise des exemples pratiques, des listes et des mots importants en **gras**.`;
        } else if (body.age === 'lyceen') {
            introMessage += `
Instructions pour un lycéen :
1. Utilise un ton respectueux et structuré avec des emojis📚.
2. Introduis des concepts plus avancés en les expliquant simplement.
3. Utilise des titres pour introduire des sections et des listes à puces pour résumer les idées clés.
4. Utilise des exemples concrets et des éléments en **gras** pour les points essentiels.`;
        } else if (body.age === 'adulte') {
            introMessage += `
Instructions pour un adulte :
1. Utilise un ton amical avec des emojis🌍.
2. Structure l'explication en plusieurs sections avec des sous-titres.
3. Utilise des **points en gras**, des puces et des exemples concrets pour rendre l'explication plus fluide et lisible.
4. Utilise quelques emojis pour rendre l'explication plus conviviale, mais sans exagération.`;
        }

        // Historique des messages
        const messages = [
            { role: 'system', content: introMessage },
            ...body.messages
        ];

        // Appel à l'API OpenAI
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!openaiResponse.ok) {
            throw new Error(`OpenAI API error: ${await openaiResponse.text()}`);
        }

        const data = await openaiResponse.json();

        // Mettre à jour l'état pour supprimer l'introduction sur les prochaines réponses
        isFirstResponse = false;

        // Retourner la réponse formatée
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
