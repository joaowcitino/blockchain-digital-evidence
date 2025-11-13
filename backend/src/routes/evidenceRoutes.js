const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const evidenceController = require('../controllers/evidenceController');

/**
 * Evidence Routes
 */

// Register new evidence with file upload
router.post('/', upload.single('file'), evidenceController.registerEvidence);

// Get all evidences
router.get('/', evidenceController.getAllEvidences);

// Get evidence by ID
router.get('/:id', evidenceController.getEvidenceById);

// Transfer custody
router.post('/:id/transfer', evidenceController.transferCustody);

// Change status
router.post('/:id/status', evidenceController.changeStatus);

// Add additional file to evidence
router.post('/:id/files', upload.single('file'), evidenceController.addFile);

module.exports = router;
