import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import RegisterEvidence from './pages/RegisterEvidence';
import EvidenceList from './pages/EvidenceList';
import EvidenceDetails from './pages/EvidenceDetails';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/register" replace />} />
            <Route path="/register" element={<RegisterEvidence />} />
            <Route path="/list" element={<EvidenceList />} />
            <Route path="/evidence/:id" element={<EvidenceDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1>Sistema de Gestão de Evidências Digitais</h1>
        <nav className="nav">
          <Link to="/register">Registrar Evidência</Link>
          <Link to="/list">Lista de Evidências</Link>
        </nav>
      </div>
    </header>
  );
}

export default App;
