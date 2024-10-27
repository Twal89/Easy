export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    try {
        if (req.method !== 'POST') {
            throw new Error('Method not allowed');
        }

        const body = await req.json();
        if (!body.name || !body.age || !body.question) {
            throw new Error('Missing required fields');
        }

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('API key not configured');
        }

        // Si c'est une réponse à un QCM
        if (body.question.startsWith('Response:')) {
            const prompt = `
En tant que tuteur pédagogique super enthousiaste s'adressant à ${body.name} (${body.age}), adapte ton ton à l'âge sélectionné et explique de façon amusante, engageante et accessible : ${body.question}.

Instructions :
1. Si ${body.age === 'enfant'} :
   - Utilise un ton très enthousiaste avec beaucoup d'emojis et des analogies amusantes (ex. des comparaisons avec des jeux, des jouets ou des animaux).
   - Utilise des phrases simples et courtes pour faciliter la compréhension.
   - Pose des questions pour encourager la participation et l'interaction ("Tu veux savoir pourquoi ? 😊").

2. Si ${body.age === 'ado'} :
   - Utilise un ton amical et encourageant avec des emojis, mais moins exagéré.
   - Utilise des analogies pertinentes pour leur âge (ex. sports, technologies, réseaux sociaux).
   - Introduis des termes techniques simples en expliquant brièvement ce qu'ils signifient.

3. Si ${body.age === 'lyceen'} :
   - Utilise un ton respectueux et légèrement plus mature.
   - Structure l'explication de manière claire et détaillée, en introduisant des concepts plus complexes mais toujours expliqués simplement.
   - Utilise des analogies plus sophistiquées (ex. le fonctionnement d'une entreprise, la biologie, ou les phénomènes naturels).

4. Si ${body.age === 'adulte'} :
   - Utilise un ton professionnel mais amical, sans être infantilisant.
   - Structure l'explication en plusieurs points clairs et détaillés.
   - Explique les concepts avec des exemples concrets (ex. les sciences, les technologies de tous les jours).
   - Utilise peu ou pas d'emojis, sauf si cela peut enrichir l'explication.

Termine toujours par une question ou un petit défi pour encourager l'utilisateur à poser une nouvelle question.

Voici l'explication adaptée à ${body.age} :

[Explication principale adaptée]

À toi de jouer !`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{
                        role: "user",
                        content: prompt
                    }],
                    temperature: 0.7,
                    max_tokens: 800
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${await response.text()}`);
            }

            const data = await response.json();
            return new Response(JSON.stringify(data), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // Pour une nouvelle question (pas une réponse à un QCM)
        let prompt = `En tant que tuteur pédagogique super enthousiaste s'adressant à ${body.name} (${body.age}), explique de façon amusante et engageante : ${body.question}`;

        // Adapter le ton en fonction de l'âge sélectionné
        if (body.age === 'enfant') {
            prompt += `
Instructions essentielles pour un enfant :
1. Utilise un ton très enthousiaste avec BEAUCOUP d'emojis et des analogies amusantes 🎉.
2. Explique les concepts en utilisant des phrases simples et courtes.
3. Pose des mini-questions ("Tu veux en savoir plus ? 😊").
4. Conclus avec une question amusante pour maintenir l'intérêt.`;

        } else if (body.age === 'ado') {
            prompt += `
Instructions essentielles pour un adolescent :
1. Utilise un ton amical et encourageant 💡.
2. Utilise des analogies pertinentes (sports, technologie).
3. Introduis des termes techniques simples.
4. Termine avec une question engageante ou un défi.`;

        } else if (body.age === 'lyceen') {
            prompt += `
Instructions essentielles pour un lycéen :
1. Utilise un ton respectueux et structuré 📚.
2. Explique les concepts avec un peu plus de profondeur.
3. Utilise des exemples et des analogies plus sophistiqués.
4. Conclus avec une question ou un défi intellectuel.`;

        } else if (body.age === 'adulte') {
            prompt += `
Instructions essentielles pour un adulte :
1. Utilise un ton professionnel et amical 🌍.
2. Structure l'explication en plusieurs points clairs.
3. Utilise des exemples concrets de la vie quotidienne.
4. Termine par une question engageante, mais évite les emojis superflus.`;
        }

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                temperature: 0.7,
                max_tokens: 800
            })
        });

        if (!openaiResponse.ok) {
            throw new Error(`OpenAI API error: ${await openaiResponse.text()}`);
        }

        const data = await openaiResponse.json();
        
        return new Response(JSON.stringify(data), {
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
