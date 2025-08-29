const { getStore } = require('@netlify/blobs');

// Persistent file store using Netlify Blobs (KV)
// Structure:
// - Key 'index': array of { id, name, language }
// - Key `file:${id}`: content string

async function readIndex(store) {
  const raw = await store.get('index', { type: 'json' });
  return Array.isArray(raw) ? raw : [];
}

async function writeIndex(store, list) {
  await store.set('index', JSON.stringify(list));
}

exports.handler = async (event) => {
  try {
    const method = event.httpMethod;
    const store = getStore({ name: 'files' });

    if (method === 'GET') {
      const index = await readIndex(store);
      // Inflate with content for convenience
      const files = await Promise.all(
        index.map(async (meta) => ({
          ...meta,
          content: (await store.get(`file:${meta.id}`)) || '',
        }))
      );
      return { statusCode: 200, body: JSON.stringify({ files }) };
    }

    if (method === 'POST') {
      const { id, name, content, language } = JSON.parse(event.body);
      if (!name || !language) {
        return { statusCode: 400, body: JSON.stringify({ error: 'name and language are required' }) };
      }

      const index = await readIndex(store);
      let fileId = id || Date.now().toString();
      const existing = index.find((f) => f.id === fileId);

      if (existing) {
        existing.name = name;
        existing.language = language;
      } else {
        index.push({ id: fileId, name, language });
      }

      await store.set(`file:${fileId}`, content ?? '');
      await writeIndex(store, index);

      return { statusCode: 200, body: JSON.stringify({ success: true, id: fileId }) };
    }

    if (method === 'DELETE') {
      const { id } = JSON.parse(event.body || '{}');
      if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'id required' }) };

      const index = await readIndex(store);
      const next = index.filter((f) => f.id !== id);
      await store.delete(`file:${id}`);
      await writeIndex(store, next);
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};