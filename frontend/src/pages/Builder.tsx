import React from 'react';
import { useLocation } from 'react-router-dom';
import Chat from '../components/Chat';
import FileManager from '../components/FileManager';

const Builder: React.FC = () => {
  const location = useLocation() as any;
  const draft = location?.state?.draft as string | undefined;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '45%', borderRight: '1px solid #333', minWidth: 0 }}>
        <Chat />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <FileManager />
      </div>
    </div>
  );
};

export default Builder;
