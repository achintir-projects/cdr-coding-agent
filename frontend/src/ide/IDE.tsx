import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import CodeEditor from '../components/CodeEditor';

export interface IdeFile {
  id: string;
  name: string;
  content: string;
  language: string; // 'javascript' | 'python' | 'java' | ...
}

type Tab = {
  id: string;
};

const useKey = (combo: (e: KeyboardEvent) => void) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => combo(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [combo]);
};

const Toolbar: React.FC<{ onTogglePreview: () => void; onToggleTerminal: () => void; onOpenPalette: () => void; previewOpen: boolean; terminalOpen: boolean; }>
= ({ onTogglePreview, onToggleTerminal, onOpenPalette, previewOpen, terminalOpen }) => {
  return (
    <div style={{ padding: '8px 10px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: 8 }}>
      <strong>IDE</strong>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <button onClick={onOpenPalette} title="Command Palette (Ctrl/Cmd+K)">⌘K</button>
        <button onClick={onTogglePreview}>{previewOpen ? 'Hide Preview' : 'Show Preview'}</button>
        <button onClick={onToggleTerminal}>{terminalOpen ? 'Hide Terminal' : 'Show Terminal'}</button>
      </div>
    </div>
  );
};

const FileTree: React.FC<{ files: IdeFile[]; activeId?: string; onOpen: (id: string) => void; }>
= ({ files, activeId, onOpen }) => (
  <div style={{ padding: 8, overflowY: 'auto', height: '100%' }}>
    <div style={{ fontSize: 12, color: '#aaa', marginBottom: 6 }}>Files</div>
    {files.length === 0 ? (
      <div style={{ color: '#888', fontSize: 13 }}>No files yet. Use ⌘K to create a file.</div>
    ) : files.map(f => (
      <div key={f.id}
        onClick={() => onOpen(f.id)}
        style={{ padding: '6px 8px', cursor: 'pointer', borderRadius: 4, background: activeId === f.id ? '#333' : 'transparent' }}>
        {f.name}
      </div>
    ))}
  </div>
);

const Tabs: React.FC<{ files: IdeFile[]; openTabs: Tab[]; activeId?: string; onActivate: (id: string) => void; onClose: (id: string) => void; }>
= ({ files, openTabs, activeId, onActivate, onClose }) => {
  const byId = useMemo(() => Object.fromEntries(files.map(f => [f.id, f])), [files]);
  return (
    <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #333', padding: '6px 8px', overflowX: 'auto' }}>
      {openTabs.map(t => {
        const f = byId[t.id];
        if (!f) return null;
        const active = activeId === t.id;
        return (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, background: active ? '#2a2a2a' : '#1b1b1b', border: '1px solid #333' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => onActivate(t.id)}>{f.name}</span>
            <button onClick={() => onClose(t.id)} style={{ padding: '0 6px' }}>×</button>
          </div>
        );
      })}
    </div>
  );
};

const Preview: React.FC<{ srcDoc: string }>= ({ srcDoc }) => (
  <iframe title="preview" style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} srcDoc={srcDoc} />
);

const Terminal: React.FC<{ lines: string[] }>= ({ lines }) => (
  <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: 12, padding: 8, height: '100%', overflowY: 'auto' }}>
    {lines.length === 0 ? <div style={{ color: '#888' }}>Terminal ready.</div> : lines.map((l, i) => <div key={i}>{l}</div>)}
  </div>
);

const CommandPalette: React.FC<{ visible: boolean; onClose: () => void; onRun: (cmd: string) => void; }>
= ({ visible, onClose, onRun }) => {
const [query, setQuery] = useState('');
const commands = useMemo(() => ([
{ id: 'create', title: 'Create file' },
{ id: 'rename', title: 'Rename file' },
{ id: 'generate', title: 'Generate code (AI) into current file' },
{ id: 'run', title: 'Run (Preview)' },
{ id: 'format', title: 'Format active file' },
  { id: 'reload', title: 'Reload file list' },
  ].filter(c => c.title.toLowerCase().includes(query.toLowerCase()))), [query]);

if (!visible) return null;
return (
<div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'start center', paddingTop: '10vh', zIndex: 50 }}>
<div onClick={e => e.stopPropagation()} style={{ width: 640, maxWidth: '90vw', background: '#151515', border: '1px solid #333', borderRadius: 10, overflow: 'hidden' }}>
<input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Type a command..." style={{ width: '100%', padding: 12, border: 'none', outline: 'none', background: '#1b1b1b', color: '#eee' }} />
<div style={{ maxHeight: 300, overflowY: 'auto' }}>
{commands.map(c => (
  <div key={c.id} onClick={() => onRun(c.id)} style={{ padding: 12, borderTop: '1px solid #222', cursor: 'pointer' }}>{c.title}</div>
))}
  {commands.length === 0 && <div style={{ padding: 12, color: '#888' }}>No commands</div>}
  </div>
  </div>
  </div>
  );
};

const IDE: React.FC = () => {
  const [files, setFiles] = useState<IdeFile[]>([]);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  const appendTerminal = (l: string) => setTerminalLines(prev => [...prev, l]);

  const activeFile = useMemo(() => files.find(f => f.id === activeId), [files, activeId]);

  const inferLanguage = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'js' || ext === 'mjs' || ext === 'cjs') return 'javascript';
    if (ext === 'ts') return 'typescript';
    if (ext === 'py') return 'python';
    if (ext === 'java') return 'java';
    if (ext === 'html') return 'html';
    if (ext === 'css') return 'css';
    return 'javascript';
  };

  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/.netlify/functions/api-files');
      let list: IdeFile[] = Array.isArray(res.data?.files) ? res.data.files : [];

      // Bootstrap workspace if empty
      if (!list.length) {
        const starter = [
          { name: 'index.html', language: 'html', content: '<!doctype html>\n<html><head><meta charset="utf-8" /><title>App</title></head><body><div id="app"></div><script src="./app.js"></script></body></html>' },
          { name: 'app.js', language: 'javascript', content: "console.log('Hello from the IDE starter!');" },
          { name: 'styles.css', language: 'css', content: 'body { font-family: system-ui, sans-serif; }' },
        ];
        for (const f of starter) {
          const payload = { id: Date.now().toString() + Math.random().toString(16).slice(2), ...f };
          await axios.post('/.netlify/functions/api-files', payload);
        }
        const res2 = await axios.get('/.netlify/functions/api-files');
        list = Array.isArray(res2.data?.files) ? res2.data.files : [];
      }

      setFiles(list);
      if (list.length) {
        // Prefer a JS/TS file if present
        const preferred = list.find(f => /(\.|^)app\.(js|ts)$/i.test(f.name)) || list[0];
        setActiveId(preferred.id);
        setOpenTabs([{ id: preferred.id }]);
      }
      setError(null);
    } catch (e: any) {
      setError('Failed to load files');
      setFiles([]);
      setActiveId(undefined);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => { loadFiles(); }, []);

  useKey((e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setPaletteOpen(true);
    }
  });

  const openFile = (id: string) => {
    setActiveId(id);
    setOpenTabs(t => t.find(x => x.id === id) ? t : [...t, { id }]);
  };

  const closeTab = (id: string) => {
    setOpenTabs(t => t.filter(x => x.id !== id));
    if (activeId === id) {
      const remaining = openTabs.filter(x => x.id !== id);
      setActiveId(remaining[remaining.length - 1]?.id);
    }
  };

  const updateContent = async (content: string) => {
    if (!activeFile) return;
    const payload = { id: activeFile.id, name: activeFile.name, content, language: activeFile.language };
    try {
      await axios.post('/.netlify/functions/api-files', payload);
      setFiles(fs => fs.map(f => f.id === activeFile.id ? { ...f, content } : f));
    } catch (e) {
      appendTerminal('save failed');
    }
  };

  const createFile = async (name: string, language: string, content = '') => {
    const newFile: IdeFile = { id: Date.now().toString(), name, language, content };
    await axios.post('/.netlify/functions/api-files', newFile);
    setFiles(fs => [...fs, newFile]);
    openFile(newFile.id);
  };

  const renameFile = async (id: string, name: string) => {
    const f = files.find(x => x.id === id);
    if (!f) return;
    await axios.post('/.netlify/functions/api-files', { ...f, name });
    setFiles(fs => fs.map(x => x.id === id ? { ...x, name } : x));
  };

  const runPreview = () => {
    appendTerminal('Running preview...');
    setPreviewOpen(true);
  };

  const formatActive = async () => {
    if (!activeFile) return;
    try {
      const prettier = (await import('prettier/standalone')) as any;
      const format = (prettier?.format || prettier?.default?.format) as (code: string, opts: any) => Promise<string> | string;
      const pluginBabel = ((await import('prettier/plugins/babel')) as any).default;
      const pluginEstree = ((await import('prettier/plugins/estree')) as any).default;
      const pluginTs = ((await import('prettier/plugins/typescript')) as any).default;
      const parser = activeFile.language === 'typescript' ? 'typescript' : 'babel';
      const formatted = await format(activeFile.content, {
        parser,
        plugins: [pluginBabel, pluginEstree, pluginTs],
        semi: true,
        singleQuote: true,
      });
      updateContent(formatted);
      appendTerminal('Formatted current file');
    } catch (e) {
      appendTerminal('prettier failed; applied fallback');
      const fallback = activeFile.content.replace(/\t/g, '  ').trimEnd();
      updateContent(fallback);
    }
  };

  const onRunCommand = async (cmd: string) => {
    switch (cmd) {
      case 'create': {
        const name = prompt('Enter file name (e.g., app.js):');
        if (!name) return;
        const lang = inferLanguage(name);
        await createFile(name, lang, '// New file');
        setPaletteOpen(false);
        break;
      }
      case 'rename': {
        if (!activeFile) return;
        const name = prompt('New name:', activeFile.name);
        if (!name) return;
        await renameFile(activeFile.id, name);
        setPaletteOpen(false);
        break;
      }
      case 'generate': {
        const promptText = prompt('Describe the code to generate:');
        if (!promptText || !activeFile) { setPaletteOpen(false); break; }
        try {
          appendTerminal('Generating code...');
          const resp = await axios.post('/.netlify/functions/api-generate', {
            prompt: promptText,
            language: activeFile.language,
            context: activeFile.content,
          });
          const code = resp.data?.code || '';
          const merged = activeFile.content + (code ? ('\n\n' + code) : '');
          await updateContent(merged);
          appendTerminal('Code generated and appended');
        } catch (e: any) {
          appendTerminal('Generation failed');
        }
        setPaletteOpen(false);
        break;
      }
      case 'run':
        runPreview(); setPaletteOpen(false); break;
      case 'format':
        await formatActive(); setPaletteOpen(false); break;
      case 'reload':
        await loadFiles(); setPaletteOpen(false); break;
      default:
        setPaletteOpen(false);
    }
  };

  // Build preview srcDoc from current files for basic web projects
  const srcDoc = useMemo(() => {
    const html = files.find(f => /index\.html$/i.test(f.name))?.content;
    const css = files.find(f => /\.css$/i.test(f.name))?.content;
    const js = files.find(f => /\.(js|mjs)$/i.test(f.name))?.content || activeFile?.content || '';
    if (html) return html;
    return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />${css ? `<style>${css}</style>` : ''}</head><body><div id="app"></div><script>${js}</script></body></html>`;
  }, [files, activeFile]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Toolbar
        onTogglePreview={() => setPreviewOpen(v => !v)}
        onToggleTerminal={() => setTerminalOpen(v => !v)}
        onOpenPalette={() => setPaletteOpen(true)}
        previewOpen={previewOpen}
        terminalOpen={terminalOpen}
      />

      {error && <div style={{ background: '#3b1f1f', color: '#fca5a5', padding: '6px 10px' }}>{error}</div>}

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* File tree */}
        <div style={{ width: 260, borderRight: '1px solid #333', minWidth: 200, maxWidth: 360 }}>
          {loading ? <div style={{ padding: 8, color: '#888' }}>Loading files...</div> : <FileTree files={files} activeId={activeId} onOpen={openFile} />}
        </div>

        {/* Main code + preview */}
        <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
          <div style={{ flex: previewOpen ? 0.6 : 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Tabs files={files} openTabs={openTabs} activeId={activeId} onActivate={setActiveId} onClose={closeTab} />
            <div style={{ flex: 1, minHeight: 0 }}>
              {activeFile ? (
                <CodeEditor
                  language={activeFile.language}
                  value={activeFile.content}
                  onChange={updateContent}
                />
              ) : (
                <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#888' }}>Open a file from the tree or press ⌘K</div>
              )}
            </div>
          </div>
          {previewOpen && (
            <div style={{ flex: 0.4, borderLeft: '1px solid #333' }}>
              <Preview srcDoc={srcDoc} />
            </div>
          )}
        </div>
      </div>

      {terminalOpen && (
        <div style={{ height: 160, borderTop: '1px solid #333' }}>
          <Terminal lines={terminalLines} />
        </div>
      )}

      <CommandPalette visible={paletteOpen} onClose={() => setPaletteOpen(false)} onRun={onRunCommand} />
    </div>
  );
};

export default IDE;
