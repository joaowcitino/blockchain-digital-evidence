import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Evidence API Service
 */

export const evidenceApi = {
  /**
   * Register new evidence
   * @param {File} file - File to upload
   * @param {string} description - Evidence description
   * @param {string} caseId - Case ID
   */
  async registerEvidence(file, description, caseId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    formData.append('caseId', caseId);

    const response = await api.post('/evidences', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Get all evidences
   */
  async getAllEvidences() {
    const response = await api.get('/evidences');
    return response.data;
  },

  /**
   * Get evidence by ID
   * @param {number} id - Evidence ID
   */
  async getEvidenceById(id) {
    const response = await api.get(`/evidences/${id}`);
    return response.data;
  },

  /**
   * Transfer custody
   * @param {number} id - Evidence ID
   * @param {string} newCustodian - New custodian address
   * @param {string} reason - Transfer reason
   */
  async transferCustody(id, newCustodian, reason) {
    const response = await api.post(`/evidences/${id}/transfer`, {
      newCustodian,
      reason,
    });
    return response.data;
  },

  /**
   * Change evidence status
   * @param {number} id - Evidence ID
   * @param {number} status - New status (0-3)
   */
  async changeStatus(id, status) {
    const response = await api.post(`/evidences/${id}/status`, {
      status,
    });
    return response.data;
  },

  /**
   * Add file to evidence
   * @param {number} id - Evidence ID
   * @param {File} file - File to add
   * @param {string} fileType - File type description
   */
  async addFile(id, file, fileType) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);

    const response = await api.post(`/evidences/${id}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};

export default api;
