// Simple in-memory file storage for demo purposes
// In production, you would use a database
let files = [
  { id: '1', name: 'index.js', content: '// Your code here', language: 'javascript' }
];

exports.handler = async (event, context) => {
  try {
    const method = event.httpMethod;
    
    if (method === 'GET') {
      // Return all files
      return {
        statusCode: 200,
        body: JSON.stringify({ files })
      };
    } else if (method === 'POST') {
      // Create or update a file
      const { id, name, content, language } = JSON.parse(event.body);
      
      if (id) {
        // Update existing file
        const index = files.findIndex(f => f.id === id);
        if (index !== -1) {
          files[index] = { id, name, content, language };
        } else {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'File not found' })
          };
        }
      } else {
        // Create new file
        const newFile = {
          id: Date.now().toString(),
          name,
          content,
          language
        };
        files.push(newFile);
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } else if (method === 'DELETE') {
      // Delete a file
      const { id } = JSON.parse(event.body);
      files = files.filter(f => f.id !== id);
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }
    
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};