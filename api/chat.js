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

        // Adapter le ton en fonction de l'âge de l'utilisateur
        let introMessage = `En tant que tuteur pédagogique s'adressant à ${body.name} (${body.age}), explique de façon claire et engageante : ${body.question}.`;

        if (body.age === 'enfant') {
            introMessage += `
Instructions pour un enfant :
1. Utilise un ton très enthousiaste avec BEAUCOUP d'emojis et des analogies amusantes 🎉.
2. Explique les concepts en utilisant des phrases simples et courtes.
3. Pose des mini-questions ("Tu veux en savoir plus ? 😊").
4. Utilise des comparaisons amusantes (ex. jouets, animaux, jeux).`;

        } else if (body.age === 'ado') {
            introMessage += `
Instructions pour un adolescent :
1. Utilise un ton amical et encourageant 💡.
2. Utilise des analogies pertinentes (sports, technologie).
3. Introduis des termes techniques simples en les expliquant brièvement.`;

        } else if (body.age === 'lyceen') {
            introMessage += `
Instructions pour un lycéen :
1. Utilise un ton respectueux et structuré 📚.
2. Explique les concepts avec un peu plus de profondeur.
3. Utilise des exemples et des analogies plus sophistiqués.`;

        } else if (body.age === 'adulte') {
            introMessage += `
Instructions pour un adulte :
1. Utilise un ton amical et accessible tout en restant informatif 🌍.
2. Structure l'explication en plusieurs points clairs et détaillés.
3. Utilise des exemples concrets de la vie quotidienne.
4. Inclure quelques emojis pour garder une touche conviviale.`;
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
                model: "gpt-4o",
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
