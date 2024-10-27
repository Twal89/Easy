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

        // Adapter le ton et la mise en forme avec un style friendly et plus d'emojis
        let introMessage = `Tu t'adresses à ${body.name}, âgé(e) de ${body.age}, qui pose la question suivante : "${body.question}". Réponds de manière détaillée, engageante, friendly et structurée avec des paragraphes et des emojis 🎉 :
        1. Mets en <strong>gras</strong> les mots ou concepts importants.
        2. Utilise des <strong>titres</strong> ou sous-titres pour organiser la réponse.
        3. Utilise l'<em>italique</em> pour ajouter de l'emphase.
        4. Pour les mots techniques, utilise des balises de lien <u>souligné</u> et propose plus d'explications si l'utilisateur clique dessus.`;

        if (body.age === 'enfant') {
            introMessage += `
            Instructions pour un enfant (6-11 ans) :
            1. Utilise un ton très enthousiaste avec BEAUCOUP d'emojis 🎉🤩😊.
            2. Explique les concepts avec des phrases courtes et claires.
            3. Mets en <strong>gras</strong> les mots simples comme "soleil" ☀️, "énergie" ⚡, "chaud" 🔥.
            4. Utilise des comparaisons amusantes (ex. jouets, animaux, jeux).`;

        } else if (body.age === 'ado') {
            introMessage += `
            Instructions pour un adolescent (12-15 ans) :
            1. Utilise un ton amical et engageant avec des emojis 🎯💡.
            2. Utilise des analogies pertinentes (ex. technologies, réseaux sociaux 📱).
            3. Introduis des termes techniques avec des mots en <strong>gras</strong> et des emojis pour souligner l'importance.`;

        } else if (body.age === 'lyceen') {
            introMessage += `
            Instructions pour un lycéen (16-18 ans) :
            1. Utilise un ton respectueux et structuré avec quelques emojis pour dynamiser la réponse 📚👍.
            2. Explique les concepts avec des exemples concrets, en mettant les points clés en <strong>gras</strong>.
            3. Encourage la curiosité avec des questions ("Tu veux en savoir plus ?").`;

        } else if (body.age === 'adulte') {
            introMessage += `
            Instructions pour un adulte (18+ ans) :
            1. Utilise un ton amical et professionnel, avec des emojis adaptés pour illustrer les concepts 🌍💼.
            2. Structure l'explication en plusieurs points clairs et détaillés, en mettant en <strong>gras</strong> les concepts principaux.
            3. Utilise des exemples concrets de la vie quotidienne avec quelques emojis pour illustrer des idées.`;
        }

        // Ajouter l'historique des messages
        const messages = [
            { role: 'system', content: introMessage }, // Message initial avec le ton friendly et emojis
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
                model: "gpt-4",  // Utilisation du modèle GPT-4
                messages: messages,
                temperature: 0.7,
                max_tokens: 800
            })
        });

        if (!openaiResponse.ok) {
            throw new Error(`OpenAI API error: ${await response.text()}`);
        }

        const data = await openaiResponse.json();
        
        // Retourner la réponse de GPT avec les balises HTML et emojis pour le formatage
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
