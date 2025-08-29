const { generateCode } = require('../utils/glm-api');

exports.handler = async (event, context) => {
  try {
    const { prompt, language, context } = JSON.parse(event.body);
    
    if (!prompt || !language) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters: prompt and language' })
      };
    }
    
    const generatedCode = await generateCode(prompt, language, context);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        code: generatedCode
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};