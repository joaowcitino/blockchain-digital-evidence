import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { evidenceApi } from '../services/api';

function EvidenceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Transfer custody form
  const [transferForm, setTransferForm] = useState({
    newCustodian: '',
    reason: '',
  });
  const [showTransferForm, setShowTransferForm] = useState(false);

  // Status change form
  const [newStatus, setNewStatus] = useState('');
  const [showStatusForm, setShowStatusForm] = useState(false);

  // Add file form
  const [addFileForm, setAddFileForm] = useState({
    file: null,
    fileType: '',
  });
  const [showAddFileForm, setShowAddFileForm] = useState(false);

  useEffect(() => {
    fetchEvidence();
  }, [id]);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const response = await evidenceApi.getEvidenceById(id);
      setEvidence(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferCustody = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);

    try {
      await evidenceApi.transferCustody(
        id,
        transferForm.newCustodian,
        transferForm.reason
      );

      setActionMessage({ type: 'success', text: 'Custódia transferida com sucesso' });
      setShowTransferForm(false);
      setTransferForm({ newCustodian: '', reason: '' });
      await fetchEvidence();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.error || err.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeStatus = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);

    try {
      await evidenceApi.changeStatus(id, parseInt(newStatus));

      setActionMessage({ type: 'success', text: 'Status alterado com sucesso' });
      setShowStatusForm(false);
      setNewStatus('');
      await fetchEvidence();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.error || err.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddFile = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);

    try {
      await evidenceApi.addFile(id, addFileForm.file, addFileForm.fileType);

      setActionMessage({ type: 'success', text: 'Arquivo adicionado com sucesso' });
      setShowAddFileForm(false);
      setAddFileForm({ file: null, fileType: '' });
      document.getElementById('add-file-input').value = '';
      await fetchEvidence();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.error || err.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAddress = (address) => {
    return address;
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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Carregando detalhes da evidência...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="alert alert-error">
          <strong>Erro:</strong> {error}
        </div>
        <button onClick={() => navigate('/list')} className="btn btn-secondary">
          Voltar à Lista
        </button>
      </div>
    );
  }

  if (!evidence) {
    return null;
  }

  return (
    <div>
      {/* Action Message */}
      {actionMessage && (
        <div className={`alert ${actionMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {actionMessage.text}
        </div>
      )}

      {/* Evidence Details */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">Evidência #{evidence.id}</h2>
            <span className={`evidence-status ${getStatusClass(evidence.statusText)}`}>
              {translateStatus(evidence.statusText)}
            </span>
          </div>
        </div>

        <div className="info-box">
          <div className="info-box-title">ID do Caso</div>
          <div className="info-box-content">{evidence.caseId}</div>
        </div>

        <div className="info-box">
          <div className="info-box-title">Descrição</div>
          <div className="info-box-content">{evidence.description}</div>
        </div>

        <div className="info-box">
          <div className="info-box-title">Hash do Arquivo (SHA-256)</div>
          <div className="info-box-content" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
            {evidence.fileHash}
          </div>
        </div>

        <div className="info-box">
          <div className="info-box-title">CID IPFS</div>
          <div className="info-box-content" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
            {evidence.ipfsCid}
            <br />
            <a href={evidence.ipfsGateway} target="_blank" rel="noopener noreferrer" style={{ color: '#2c3e50' }}>
              Ver no Gateway IPFS →
            </a>
          </div>
        </div>

        <div className="info-box">
          <div className="info-box-title">Criador</div>
          <div className="info-box-content" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
            {formatAddress(evidence.creator)}
          </div>
        </div>

        <div className="info-box">
          <div className="info-box-title">Custodiante Atual</div>
          <div className="info-box-content" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
            {formatAddress(evidence.currentCustodian)}
          </div>
        </div>

        <div className="info-box">
          <div className="info-box-title">Criado em</div>
          <div className="info-box-content">{formatDate(evidence.createdAt)}</div>
        </div>
      </div>

      {/* Custody History */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Cadeia de Custódia</h3>
        </div>

        <div className="custody-timeline">
          {evidence.custodyHistory.map((event, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="timeline-date">{event.date}</div>
                <div className="timeline-text">
                  <strong>De:</strong> {event.fromAddress === '0x0000000000000000000000000000000000000000' ? 'Registro Inicial' : formatAddress(event.fromAddress)}
                  <br />
                  <strong>Para:</strong> {formatAddress(event.toAddress)}
                  <br />
                  <strong>Razão:</strong> {event.reason}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Files */}
      {evidence.additionalFiles && evidence.additionalFiles.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Arquivos Adicionais</h3>
          </div>

          {evidence.additionalFiles.map((file, index) => (
            <div key={index} className="info-box">
              <div className="info-box-title">{file.fileType}</div>
              <div className="info-box-content">
                <strong>CID IPFS:</strong> {file.ipfsCid}
                <br />
                <strong>Adicionado por:</strong> {formatAddress(file.addedBy)}
                <br />
                <strong>Data:</strong> {file.date}
                <br />
                <a href={file.ipfsGateway} target="_blank" rel="noopener noreferrer" style={{ color: '#2c3e50' }}>
                  Ver no Gateway IPFS →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Ações</h3>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowTransferForm(!showTransferForm)}
            className="btn btn-primary"
          >
            Transferir Custódia
          </button>

          <button
            onClick={() => setShowStatusForm(!showStatusForm)}
            className="btn btn-secondary"
          >
            Alterar Status
          </button>

          <button
            onClick={() => setShowAddFileForm(!showAddFileForm)}
            className="btn btn-success"
          >
            Adicionar Arquivo
          </button>
        </div>

        {/* Transfer Custody Form */}
        {showTransferForm && (
          <form onSubmit={handleTransferCustody} style={{ marginTop: '1.5rem', borderTop: '2px solid #f0f0f0', paddingTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>Transferir Custódia</h4>

            <div className="form-group">
              <label className="form-label">Endereço do Novo Custodiante</label>
              <input
                type="text"
                className="form-input"
                placeholder="0x..."
                value={transferForm.newCustodian}
                onChange={(e) => setTransferForm({ ...transferForm, newCustodian: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Razão</label>
              <textarea
                className="form-textarea"
                placeholder="Razão da transferência..."
                value={transferForm.reason}
                onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Processando...' : 'Transferir'}
            </button>
          </form>
        )}

        {/* Change Status Form */}
        {showStatusForm && (
          <form onSubmit={handleChangeStatus} style={{ marginTop: '1.5rem', borderTop: '2px solid #f0f0f0', paddingTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>Alterar Status</h4>

            <div className="form-group">
              <label className="form-label">Novo Status</label>
              <select
                className="form-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                required
              >
                <option value="">Selecione o status...</option>
                <option value="0">Coletado</option>
                <option value="1">Em Análise</option>
                <option value="2">Arquivado</option>
                <option value="3">Invalidado</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Processando...' : 'Alterar Status'}
            </button>
          </form>
        )}

        {/* Add File Form */}
        {showAddFileForm && (
          <form onSubmit={handleAddFile} style={{ marginTop: '1.5rem', borderTop: '2px solid #f0f0f0', paddingTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>Adicionar Arquivo à Evidência</h4>

            <div className="form-group">
              <label className="form-label">Arquivo</label>
              <input
                id="add-file-input"
                type="file"
                className="form-input file-input"
                onChange={(e) => setAddFileForm({ ...addFileForm, file: e.target.files[0] })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tipo/Descrição do Arquivo</label>
              <input
                type="text"
                className="form-input"
                placeholder="ex: Laudo Pericial, Resultados da Análise"
                value={addFileForm.fileType}
                onChange={(e) => setAddFileForm({ ...addFileForm, fileType: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-success" disabled={actionLoading}>
              {actionLoading ? 'Processando...' : 'Adicionar Arquivo'}
            </button>
          </form>
        )}
      </div>

      <button onClick={() => navigate('/list')} className="btn btn-secondary">
        Voltar à Lista
      </button>
    </div>
  );
}

export default EvidenceDetails;
