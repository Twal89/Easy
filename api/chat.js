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

        // Adapter le ton et la mise en forme selon l'âge de l'utilisateur
        let introMessage = `En tant que tuteur pédagogique s'adressant à ${body.name} (${body.age}), explique de façon claire et engageante : ${body.question}.
        Assure-toi d'utiliser les balises HTML pour formater correctement les réponses :
        1. Mets en <strong>gras</strong> les mots ou concepts importants.
        2. Utilise des <strong>titres</strong> ou sous-titres pour introduire des sections.
        3. Utilise l'<em>italique</em> pour ajouter de l'emphase.
        4. Pour les mots techniques, utilise des balises de lien <u>souligné</u> et propose plus d'explications si l'utilisateur clique dessus.`;

        if (body.age === 'enfant') {
            introMessage += `
            Instructions pour un enfant :
            1. Utilise un ton très enthousiaste avec BEAUCOUP d'emojis 🎉.
            2. Explique les concepts en utilisant des phrases simples et courtes.
            3. Mets en <strong>gras</strong> les mots simples mais importants comme "soleil", "énergie", "chaud".
            4. Utilise des comparaisons amusantes (ex. jouets, animaux, jeux).`;

        } else if (body.age === 'ado') {
            introMessage += `
            Instructions pour un adolescent :
            1. Utilise un ton amical et engageant 💡.
            2. Utilise des analogies pertinentes (sports, technologie).
            3. Introduis des termes techniques avec des mots en <strong>gras</strong> pour souligner leur importance, et <u>souligner</u> les liens vers d'autres concepts.`;

        } else if (body.age === 'lyceen') {
            introMessage += `
            Instructions pour un lycéen :
            1. Utilise un ton respectueux et structuré 📚.
            2. Explique les concepts avec un peu plus de profondeur.
            3. Utilise des exemples et des analogies plus sophistiqués, en mettant les points clés en <strong>gras</strong>.`;

        } else if (body.age === 'adulte') {
            introMessage += `
            Instructions pour un adulte :
            1. Utilise un ton professionnel et amical 🌍.
            2. Structure l'explication en plusieurs points clairs et détaillés, en mettant en <strong>gras</strong> les concepts principaux.
            3. Utilise des exemples concrets de la vie quotidienne.
            4. Utilise <em>peu ou pas d'emojis</em>, sauf s'ils ajoutent de la valeur.`;
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
                model: "gpt-4",  // Modification pour utiliser GPT-4
                messages: messages,
                temperature: 0.7,
                max_tokens: 800
            })
        });

        if (!openaiResponse.ok) {
            throw new Error(`OpenAI API error: ${await openaiResponse.text()}`);
        }

        const data = await openaiResponse.json();
        
        // Retourner la réponse de GPT avec les balises HTML pour le formatage
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
