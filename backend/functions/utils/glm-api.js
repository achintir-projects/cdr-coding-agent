const axios = require('axios');

// This function will integrate with GLM 4.5 API
const generateCode = async (prompt, language, context = '') => {
  try {
    // Replace with actual GLM 4.5 API endpoint and authentication
    const response = await axios.post('https://api.glm-4.5.example.com/generate', {
      prompt: `Generate ${language} code for: ${prompt}\n\nContext: ${context}`,
      max_tokens: 1000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].text;
  } catch (error) {
    console.error('Error generating code:', error);
    return `// Error generating code: ${error.message}`;
  }
};

module.exports = { generateCode };