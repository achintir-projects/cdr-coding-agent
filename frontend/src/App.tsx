import React from 'react';
import FileManager from './components/FileManager';
import Chat from './components/Chat';
import './App.css';
 
function App() {
return (
<div className="App" style={{ display: 'flex', height: '100vh' }}>
  <div style={{ width: '45%', borderRight: '1px solid #333', minWidth: 0 }}>
      <Chat />
      </div>
     <div style={{ flex: 1, minWidth: 0 }}>
        <FileManager />
      </div>
    </div>
  );
}
 
export default App;