const axios = require('axios');

// Best-effort code generator. If GLM_API_KEY and GLM_API_BASE are not set,
// it returns a sensible stub so the demo keeps working.
const generateCode = async (prompt, language, context = '') => {
  const key = process.env.GLM_API_KEY;
  const base = process.env.GLM_API_BASE; // e.g. https://api.provider.com

  if (!key || !base) {
    // Fallback stubbed generation
    const header = `// Generated stub for: ${prompt}\n`;
    switch (language) {
      case 'javascript':
        return (
          header +
          `function main() {\n  console.log('Hello from stub generator');\n}\n\n// Context (truncated):\n/* ${context?.slice(0, 120) || ''} */\n\nmain();\n`
        );
      case 'python':
        return (
          header +
          `def main():\n    print('Hello from stub generator')\n\n# Context (truncated):\n# ${context?.slice(0, 120) || ''}\n\nif __name__ == '__main__':\n    main()\n`
        );
      case 'java':
        return (
          header +
          `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello from stub generator");\n  }\n}\n// Context: ${context?.slice(0, 120) || ''}\n`
        );
      default:
        return header + (context ? `/* Context: ${context.slice(0, 120)} */\n` : '') + '// TODO: implement\n';
    }
  }

  // Real provider call
  try {
    const url = `${base.replace(/\/$/, '')}/generate`;
    const response = await axios.post(
      url,
      {
        prompt: `Generate ${language} code for: ${prompt}\n\nContext: ${context}`,
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    // Try common shapes
    if (response.data?.choices?.[0]?.text) return response.data.choices[0].text;
    if (response.data?.code) return response.data.code;
    if (typeof response.data === 'string') return response.data;

    return '// Provider returned unexpected payload.';
  } catch (error) {
    console.error('Error generating code:', error?.response?.data || error?.message || error);
    return `// Error generating code: ${error?.response?.data?.error || error.message}`;
  }
};

module.exports = { generateCode };