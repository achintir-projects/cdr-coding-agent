import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Builder from './pages/Builder';
import './App.css';

function App() {
return (
<Routes>
<Route path="/" element={<Home />} />
<Route path="/builder" element={<Builder />} />
</Routes>
);
}

export default App;