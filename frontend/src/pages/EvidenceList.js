import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { evidenceApi } from '../services/api';

function EvidenceList() {
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvidences();
  }, []);

  const fetchEvidences = async () => {
    try {
      setLoading(true);
      const response = await evidenceApi.getAllEvidences();
      setEvidences(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (statusText) => {
    const statusMap = {
      'Collected': 'status-collected',
      'Coletado': 'status-collected',
      'In Analysis': 'status-in-analysis',
      'Em Análise': 'status-in-analysis',
      'Archived': 'status-archived',
      'Arquivado': 'status-archived',
      'Invalidated': 'status-invalidated',
      'Invalidado': 'status-invalidated',
    };
    return statusMap[statusText] || '';
  };

  const translateStatus = (statusText) => {
    const statusTranslation = {
      'Collected': 'Coletado',
      'In Analysis': 'Em Análise',
      'Archived': 'Arquivado',
      'Invalidated': 'Invalidado',
    };
    return statusTranslation[statusText] || statusText;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Carregando evidências...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="alert alert-error">
          <strong>Erro:</strong> {error}
        </div>
        <button onClick={fetchEvidences} className="btn btn-primary">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Lista de Evidências ({evidences.length})</h2>
      </div>

      {evidences.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>Nenhuma Evidência Encontrada</h3>
          <p>Registre uma nova evidência para começar</p>
        </div>
      ) : (
        <div className="evidence-list">
          {evidences.map((evidence) => (
            <div
              key={evidence.id}
              className="evidence-item"
              onClick={() => navigate(`/evidence/${evidence.id}`)}
            >
              <div className="evidence-header">
                <div className="evidence-id">Evidência #{evidence.id}</div>
                <span className={`evidence-status ${getStatusClass(evidence.statusText)}`}>
                  {translateStatus(evidence.statusText)}
                </span>
              </div>

              <div className="evidence-details">
                <div className="detail-row">
                  <span className="detail-label">ID do Caso:</span>
                  <span className="detail-value">{evidence.caseId}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Descrição:</span>
                  <span className="detail-value">{evidence.description}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Custodiante Atual:</span>
                  <span className="detail-value">{formatAddress(evidence.currentCustodian)}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Criado em:</span>
                  <span className="detail-value">{formatDate(evidence.createdAt)}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">CID IPFS:</span>
                  <span className="detail-value" style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    {evidence.ipfsCid}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={fetchEvidences}
        className="btn btn-secondary"
        style={{ marginTop: '1rem' }}
      >
        Atualizar
      </button>
    </div>
  );
}

export default EvidenceList;
