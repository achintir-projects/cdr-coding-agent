import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const nav = useNavigate();
  const [draft, setDraft] = useState('');

  const go = () => {
    nav('/builder', { state: { draft } });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <button aria-label="menu" style={{ borderRadius: 20, padding: '6px 10px' }}>☰</button>
        <nav style={{ display: 'flex', gap: 12 }}>
          <button>Home</button>
          <button>Demos</button>
          <button>History</button>
        </nav>
      </header>
      <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ maxWidth: 900, width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontSize: 48, margin: '20px 0' }}>The best AI agent for builders</h1>
          <p style={{ fontSize: 18, color: '#aaa', marginTop: 0 }}>
            AI Agent for developers and creators to build full‑stack applications and UI components.
            From rapid prototyping to production‑ready software.
          </p>

          <div style={{ margin: '40px auto 0', maxWidth: 800 }}>
            <div style={{
              background: '#151515',
              border: '1px solid #333',
              borderRadius: 16,
              padding: 16,
              display: 'flex',
              gap: 8,
              alignItems: 'center'
            }}>
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Describe what you want to build..."
                style={{ flex: 1, padding: '10px 12px' }}
              />
              <button onClick={go} style={{ borderRadius: 20, padding: '10px 14px' }}>Build →</button>
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12, color: '#aaa' }}>
              <span>GitHub</span>
              <span>Upload Image</span>
              <span>Figma</span>
              <span>Clone Website</span>
              <span>Public</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
