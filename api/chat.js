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
            const prompt = `En tant que tuteur pédagogique répondant à ${body.name}, évalue sa réponse : ${body.question}. 
            
            Consignes importantes :
            1. Commence DIRECTEMENT par une réaction naturelle comme "Exactement !", "Pas tout à fait !", "Tu y es presque !" ou "Non, ce n'est pas ça."
            2. Enchaîne avec l'explication détaillée sans transition forcée
            3. TOUS les termes techniques doivent être expliqués simplement
            4. Adapte ton langage à l'âge : ${body.age}
            5. Utilise des analogies de la vie quotidienne
            6. Termine par une nouvelle question QCM avec 3 choix

            Format de réponse souhaité :
            1. Réaction + Explication
            2. [QCM]
            - Option A
            - Option B
            - Option C`;

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
                const error = await response.json();
                throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
            }

            const data = await response.json();
            return new Response(JSON.stringify({
                ...data,
                type: 'quiz-response'
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // Si c'est une nouvelle question
        const initialPrompt = `En tant que tuteur pédagogique s'adressant à ${body.name} (${body.age}), explique : ${body.question}

Instructions spécifiques :
1. Commence par une introduction amicale et personnalisée
2. CHAQUE terme technique DOIT être expliqué simplement
3. Utilise des analogies avec la vie quotidienne
4. Adapte le langage selon l'âge
5. Termine par une question QCM avec 3 options

Format de réponse :
1. Explication claire et structurée
2. [QCM]
- Option A
- Option B
- Option C`;

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
                    content: initialPrompt
                }],
                temperature: 0.7,
                max_tokens: 800
            })
        });

        if (!openaiResponse.ok) {
            const error = await openaiResponse.json();
            throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
        }

        const data = await openaiResponse.json();
        
        return new Response(JSON.stringify({
            ...data,
            type: 'initial-response'
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
