export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: req.body.prompt }] }],
        generationConfig: { temperature: 1.0 }
      })
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0].content) {
      let text = data.candidates[0].content.parts[0].text;
      
      // Trim spaces and remove all markdown-style codeblock indicators
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      // Locate the start of the JSON array and end of it
      const startIdx = text.indexOf('[');
      const endIdx = text.lastIndexOf(']');
      
      if (startIdx !== -1 && endIdx !== -1) {
        text = text.substring(startIdx, endIdx + 1);
        
        // Ensure it's valid JSON format
        JSON.parse(text);
        
        return res.status(200).json({
          candidates: [{
            content: {
              parts: [{ text: text }]
            }
          }]
        });
      }
    }

    return res.status(500).json({ error: "Failed to format response properly from the AI model." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
