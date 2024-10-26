export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, age, question } = req.body;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [{
          role: "user",
          content: `En tant que tuteur pédagogique s'adressant à ${name}, qui a le niveau ${age}, explique de manière adaptée et personnalisée : ${question}. Utilise un langage approprié à l'âge, des analogies pertinentes et des emojis pour rendre l'explication plus engageante.`
        }]
      })
    });

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: 'Error processing your request' });
  }
}
