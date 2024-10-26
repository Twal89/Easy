export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const body = await req.json();
    const { name, age, question } = body;

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not defined');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // On essaie avec ce modèle qui est plus stable
        messages: [{
          role: "user",
          content: `En tant que tuteur pédagogique s'adressant à ${name}, qui a le niveau ${age}, explique de manière adaptée et personnalisée : ${question}. Utilise un langage approprié à l'âge, des analogies pertinentes et des emojis pour rendre l'explication plus engageante.`
        }],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error details:', error);
    return new Response(JSON.stringify({ 
      error: 'Error processing your request',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
