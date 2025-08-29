import React, { useState } from 'react';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  language?: string;
}

interface ChatProps {
  onCreateFile?: (name: string, content: string, language: string) => Promise<void>;
}

const Chat: React.FC<ChatProps> = ({ onCreateFile }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || busy) return;
    setError(null);
    const next: Message[] = [...messages, { role: 'user', content: prompt, language }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const resp = await axios.post('/.netlify/functions/api-generate', {
        prompt,
        language,
        context: ''
      });
      const code = resp.data?.code ?? '// No code returned';
      setMessages([...next, { role: 'assistant', content: code, language }]);
    } catch (e: any) {
      setError('Failed to generate.');
    } finally {
      setBusy(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const createFileFromLast = async () => {
    const last = [...messages].reverse().find(m => m.role === 'assistant');
    if (!last) return;
    const lang = language;
    const ext = lang === 'javascript' ? 'js' : lang === 'python' ? 'py' : lang === 'java' ? 'java' : 'txt';
    const name = `gen-${Date.now()}.${ext}`;
    if (onCreateFile) {
      await onCreateFile(name, last.content, lang);
    } else {
      await axios.post('/.netlify/functions/api-files', {
        id: Date.now().toString(),
        name,
        content: last.content,
        language: lang,
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 10, borderBottom: '1px solid #333', display: 'flex', gap: 8, alignItems: 'center' }}>
        <strong>Chat</strong>
        <select value={language} onChange={e => setLanguage(e.target.value)} style={{ marginLeft: 'auto' }}>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>
      </div>
      {error && <div style={{ background: '#3b1f1f', color: '#fca5a5', padding: '8px 12px' }}>{error}</div>}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 ? (
          <div style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>
            Ask for code — e.g., "Create a Node HTTP server that responds with Hello".
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{
                whiteSpace: 'pre-wrap',
                background: m.role === 'user' ? '#2a2a2a' : '#1e1e1e',
                border: '1px solid #333',
                padding: 10,
                borderRadius: 8,
                fontFamily: m.role === 'assistant' ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' : 'inherit'
              }}>
                {m.content}
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{ padding: 10, borderTop: '1px solid #333', display: 'flex', gap: 8 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message the AI..."
          style={{ flex: 1, minHeight: 60, resize: 'vertical' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={send} disabled={busy || !input.trim()}>Send</button>
          <button onClick={createFileFromLast} disabled={!messages.some(m => m.role === 'assistant')}>Save as file</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
