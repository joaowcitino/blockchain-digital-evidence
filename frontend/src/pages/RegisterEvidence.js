import React, { useState } from 'react';
import { evidenceApi } from '../services/api';

function RegisterEvidence() {
  const [formData, setFormData] = useState({
    file: null,
    description: '',
    caseId: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Validation
      if (!formData.file) {
        throw new Error('Por favor, selecione um arquivo');
      }
      if (!formData.description.trim()) {
        throw new Error('Por favor, insira uma descrição');
      }
      if (!formData.caseId.trim()) {
        throw new Error('Por favor, insira um ID de caso');
      }

      // Register evidence
      const response = await evidenceApi.registerEvidence(
        formData.file,
        formData.description,
        formData.caseId
      );

      setResult(response.data);

      // Reset form
      setFormData({
        file: null,
        description: '',
        caseId: '',
      });
      // Reset file input
      document.getElementById('file-input').value = '';
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Registrar Nova Evidência</h2>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Erro:</strong> {error}
        </div>
      )}

      {result && (
        <div className="alert alert-success">
          <strong>Sucesso!</strong> Evidência registrada com sucesso.
          <div style={{ marginTop: '1rem' }}>
            <strong>ID da Evidência:</strong> {result.evidenceId}
            <br />
            <strong>Hash da Transação:</strong> {result.txHash}
            <br />
            <strong>CID IPFS:</strong> {result.ipfsCid}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="file-input">
            Arquivo da Evidência *
          </label>
          <input
            id="file-input"
            type="file"
            className="form-input file-input"
            onChange={handleFileChange}
            required
          />
          {formData.file && (
            <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
              Selecionado: {formData.file.name} ({(formData.file.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="case-id">
            ID do Caso *
          </label>
          <input
            id="case-id"
            type="text"
            name="caseId"
            className="form-input"
            placeholder="ex: CASO-2024-001"
            value={formData.caseId}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">
            Descrição *
          </label>
          <textarea
            id="description"
            name="description"
            className="form-textarea"
            placeholder="Descreva a evidência..."
            value={formData.description}
            onChange={handleInputChange}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Evidência'}
        </button>
      </form>

      <div className="info-box" style={{ marginTop: '2rem' }}>
        <div className="info-box-title">Informações Importantes</div>
        <div className="info-box-content">
          • Os arquivos de evidência são armazenados no IPFS para armazenamento descentralizado
          <br />
          • Hash do arquivo e metadados são registrados na blockchain
          <br />
          • Apenas usuários com perfil POLÍCIA podem registrar novas evidências
          <br />• Uma vez registrada, os dados da evidência são imutáveis
        </div>
      </div>
    </div>
  );
}

export default RegisterEvidence;
