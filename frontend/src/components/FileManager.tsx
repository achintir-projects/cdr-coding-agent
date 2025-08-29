import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
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
  const [prompt, setPrompt] = useState<string>('');

  // Load files from the backend on component mount
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get('/.netlify/functions/api/files');
        setFiles(response.data.files);
        if (response.data.files.length > 0) {
          setActiveFileId(response.data.files[0].id);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const activeFile = files.find(file => file.id === activeFileId);

  const handleFileChange = async (content: string) => {
    if (!activeFile) return;
    
    try {
      await axios.post('/.netlify/functions/api/files', {
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
      await axios.post('/.netlify/functions/api/files', newFile);
      setFiles([...files, newFile]);
      setActiveFileId(newFile.id);
    } catch (error) {
      console.error('Error creating file:', error);
    }
  };

  const deleteFile = async (id: string) => {
    try {
      await axios.delete('/.netlify/functions/api/files', {
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
      const response = await axios.post('/.netlify/functions/api/generate', {
        prompt,
        language: activeFile.language,
        context: activeFile.content
      });
      
      const generatedCode = response.data.code;
      const newContent = activeFile.content + '\n\n' + generatedCode;
      
      await axios.post('/.netlify/functions/api/files', {
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
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ width: '250px', borderRight: '1px solid #333', padding: '10px' }}>
          <div style={{ marginBottom: '10px' }}>
            <button onClick={createNewFile}>New File</button>
          </div>
          <div>
            {files.map(file => (
              <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div 
                  onClick={() => setActiveFileId(file.id)}
                  style={{ 
                    padding: '5px', 
                    cursor: 'pointer',
                    backgroundColor: activeFileId === file.id ? '#333' : 'transparent',
                    flex: 1
                  }}
                >
                  {file.name}
                </div>
                <button onClick={() => deleteFile(file.id)} style={{ padding: '2px 5px' }}>×</button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeFile && (
            <>
              <div style={{ padding: '10px', borderBottom: '1px solid #333' }}>
                <div style={{ display: 'flex', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter a prompt to generate code..."
                    style={{ flex: 1, padding: '5px', marginRight: '10px' }}
                  />
                  <button onClick={generateCode}>Generate</button>
                </div>
                <div>
                  <select 
                    value={activeFile.language}
                    onChange={(e) => {
                      const updatedFile = { ...activeFile, language: e.target.value };
                      axios.post('/.netlify/functions/api/files', updatedFile);
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
              <CodeEditor
                language={activeFile.language}
                value={activeFile.content}
                onChange={handleFileChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileManager;