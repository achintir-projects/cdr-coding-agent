import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CodeEditor from './CodeEditor';

interface File {
  id: string;
  name: string;
  content: string;
  language: string;
}

const FileManager: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/.netlify/functions/api-files');
      const list: File[] = Array.isArray(response.data?.files) ? response.data.files : [];
      setFiles(list);
      if (list.length > 0) {
        setActiveFileId(list[0].id);
      } else {
        setActiveFileId('');
      }
      setError(null);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to load files.');
      setFiles([]);
      setActiveFileId('');
    } finally {
      setIsLoading(false);
    }
  };

  // Load files from the backend on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  const activeFile = files.find(file => file.id === activeFileId);

  const handleFileChange = async (content: string) => {
    if (!activeFile) return;
    
    try {
      await axios.post('/.netlify/functions/api-files', {
        id: activeFile.id,
        name: activeFile.name,
        content,
        language: activeFile.language
      });
      
      setFiles(files.map(file => 
        file.id === activeFileId ? { ...file, content } : file
      ));
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const createNewFile = async () => {
    const newFile: File = {
      id: Date.now().toString(),
      name: 'new-file.js',
      content: '// Your code here',
      language: 'javascript'
    };
    
    try {
      await axios.post('/.netlify/functions/api-files', newFile);
      setFiles([...files, newFile]);
      setActiveFileId(newFile.id);
    } catch (error) {
      console.error('Error creating file:', error);
    }
  };

  const deleteFile = async (id: string) => {
    try {
      await axios.delete('/.netlify/functions/api-files', {
        data: { id }
      });
      
      const newFiles = files.filter(file => file.id !== id);
      setFiles(newFiles);
      
      if (activeFileId === id && newFiles.length > 0) {
        setActiveFileId(newFiles[0].id);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const generateCode = async () => {
    if (!activeFile || !prompt) return;
    
    try {
      const response = await axios.post('/.netlify/functions/api-generate', {
        prompt,
        language: activeFile.language,
        context: activeFile.content
      });
      
      const generatedCode = response.data?.code ?? '';
      const newContent = activeFile.content + (generatedCode ? ('\n\n' + generatedCode) : '');
      
      await axios.post('/.netlify/functions/api-files', {
        id: activeFile.id,
        name: activeFile.name,
        content: newContent,
        language: activeFile.language
      });
      
      setFiles(files.map(file => 
        file.id === activeFileId ? { ...file, content: newContent } : file
      ));
      
      setPrompt('');
    } catch (error) {
      console.error('Error generating code:', error);
      setError('Failed to generate code.');
    }
  };

  if (isLoading) {
  return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center', color: '#888' }}>
         Loading files...
      </div>
  );
  }
  
  return (
  <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
  {/* Header */}
  <div style={{ padding: '10px 12px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: 8 }}>
  <strong style={{ fontSize: 16 }}>Intelligent App Builder</strong>
  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
    <button onClick={loadFiles}>Refresh</button>
    <button onClick={createNewFile}>New File</button>
  </div>
  </div>
  {/* Error banner */}
  {error && (
  <div style={{ background: '#3b1f1f', color: '#fca5a5', padding: '8px 12px' }}>
  {error}
  </div>
  )}
  <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
  {/* Sidebar */}
  <div style={{ width: '260px', borderRight: '1px solid #333', padding: '10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
  <div style={{ fontSize: 12, color: '#aaa' }}>Files</div>
  <div style={{ overflowY: 'auto', flex: 1 }}>
    {files.length === 0 ? (
        <div style={{ color: '#888', fontSize: 13 }}>
          No files yet.
        <div style={{ marginTop: 8 }}>
        <button onClick={createNewFile}>Create first file</button>
    </div>
  </div>
  ) : (
  files.map(file => (
  <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <div 
  onClick={() => setActiveFileId(file.id)}
  style={{ 
      padding: '6px 8px', 
      cursor: 'pointer',
        backgroundColor: activeFileId === file.id ? '#333' : 'transparent',
        flex: 1,
      borderRadius: 4
  }}
  >
  {file.name}
  </div>
  <button onClick={() => deleteFile(file.id)} style={{ padding: '2px 6px', marginLeft: 6 }}>×</button>
  </div>
  ))
  )}
  </div>
  </div>
  {/* Main panel */}
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
  {activeFile ? (
  <>
  <div style={{ padding: '10px', borderBottom: '1px solid #333' }}>
    <div style={{ display: 'flex', marginBottom: '10px' }}>
    <input
      type="text"
      value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a prompt to generate code..."
            style={{ flex: 1, padding: '6px', marginRight: '10px' }}
            />
              <button onClick={generateCode}>Generate</button>
              </div>
                <div>
                  <select 
                    value={activeFile.language}
                    onChange={(e) => {
                      const updatedFile = { ...activeFile, language: e.target.value };
                      axios.post('/.netlify/functions/api-files', updatedFile);
                      setFiles(files.map(file => 
                        file.id === activeFileId ? updatedFile : file
                      ));
                    }}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                  </select>
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <CodeEditor
                  language={activeFile.language}
                  value={activeFile.content}
                  onChange={handleFileChange}
                />
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: '#888' }}>
              Select a file on the left or create a new one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileManager;