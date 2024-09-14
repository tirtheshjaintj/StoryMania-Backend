const { validationResult } = require('express-validator');
const Groq = require('groq-sdk'); // Import Groq SDK

const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey) {
  console.error('Error: Missing GROQ_API_KEY in .env file');
  process.exit(1);
}

// Initialize Groq AI client
const groq = new Groq({ apiKey: groqApiKey });

async function getGroqData(prompt) {
  try {
    const result = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192",
    });
    return result.choices[0]?.message?.content || "";
  } catch (error) {
    console.error('Error calling Groq AI API:', error);
    throw error;
  }
}

async function handleGroqRequest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let { prompt } = req.body;
  prompt = "take this query for me and please act as a chat bot for my interactive fiction story telling platform website keep answers asa creative as possible, humanly without any bold text or formatting just simple text and add a friendly and professional sense: " + prompt;

  try {
    const result = await getGroqData(prompt);
    return res.status(200).send(result);
  } catch (error) {
    console.error('Error calling Groq AI API:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
}

module.exports = { handleGroqRequest };
