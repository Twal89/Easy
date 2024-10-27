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
        let introMessage = `Tu t'adresses à ${body.name}, âgé de ${body.age}, qui pose la question suivante : ${body.question}. Réponds de manière très détaillée, engageante et structurée en paragraphes.`;

        // Adapter le ton à l'âge sélectionné
        if (body.age === 'enfant') {
            introMessage += `
Instructions pour un enfant (6-11 ans) :
1. Utilise un ton **très enthousiaste** avec beaucoup d'**emojis**. 🎉🤩
2. Fais des analogies amusantes et simples. Par exemple, compare le Soleil à une "énorme boule de feu".
3. Explique chaque concept clairement avec des phrases courtes et simples.
4. Utilise des comparaisons amusantes (jouets, animaux, jeux) et pose des mini-questions ("Tu veux en savoir plus ? 😊").`;

        } else if (body.age === 'ado') {
            introMessage += `
Instructions pour un adolescent (12-15 ans) :
1. Utilise un ton **amical et engageant**, avec des **emojis** modérés. 💡⚡
2. Donne des analogies pertinentes pour leur âge (ex : réseaux sociaux, technologie).
3. Explique les concepts simplement mais introduis quelques termes techniques en les expliquant brièvement.`;

        } else if (body.age === 'lyceen') {
            introMessage += `
Instructions pour un lycéen (16-18 ans) :
1. Utilise un ton **respectueux et structuré**. 📘
2. Explique les concepts de manière plus approfondie et claire.
3. Utilise des exemples un peu plus sophistiqués ou des analogies complexes.`;

        } else if (body.age === 'adulte') {
            introMessage += `
Instructions pour un adulte (18+ ans) :
1. Utilise un ton **professionnel mais amical**. 🌍
2. Structure l'explication en **plusieurs points** bien détaillés.
3. Utilise des exemples concrets de la vie quotidienne et limite les emojis, sauf s'ils ajoutent une valeur claire.`;
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
