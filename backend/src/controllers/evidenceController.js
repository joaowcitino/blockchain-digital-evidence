const blockchainService = require('../services/blockchainService');
const ipfsService = require('../services/ipfsService');
const { computeHash } = require('../utils/hashUtils');

/**
 * Evidence Controller
 * Handles all evidence-related operations
 */

/**
 * Register new evidence
 * POST /api/evidences
 */
async function registerEvidence(req, res, next) {
  try {
    const { description, caseId } = req.body;
    const file = req.file;

    // Validation
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Description is required',
      });
    }

    if (!caseId || caseId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Case ID is required',
      });
    }

    // Compute file hash
    const fileHash = computeHash(file.buffer);
    console.log(`📊 File hash: ${fileHash}`);

    // Upload to IPFS
    const ipfsResult = await ipfsService.uploadFile(file.buffer, file.originalname);
    console.log(`📦 IPFS CID: ${ipfsResult.cid}`);

    // Pin file to ensure persistence
    await ipfsService.pinFile(ipfsResult.cid);

    // Register on blockchain
    const blockchainResult = await blockchainService.registerEvidence(
      fileHash,
      ipfsResult.cid,
      description,
      caseId
    );

    res.status(201).json({
      success: true,
      message: 'Evidence registered successfully',
      data: {
        evidenceId: blockchainResult.evidenceId,
        fileHash,
        ipfsCid: ipfsResult.cid,
        ipfsGateway: ipfsService.getGatewayUrl(ipfsResult.cid),
        txHash: blockchainResult.txHash,
        blockNumber: blockchainResult.blockNumber,
        description,
        caseId,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all evidences
 * GET /api/evidences
 */
async function getAllEvidences(req, res, next) {
  try {
    const evidences = await blockchainService.getAllEvidences();

    // Add gateway URLs
    const enrichedEvidences = evidences.map(evidence => ({
      ...evidence,
      ipfsGateway: ipfsService.getGatewayUrl(evidence.ipfsCid),
      statusText: getStatusText(evidence.status),
    }));

    res.json({
      success: true,
      data: enrichedEvidences,
      count: evidences.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get evidence by ID
 * GET /api/evidences/:id
 */
async function getEvidenceById(req, res, next) {
  try {
    const { id } = req.params;
    const evidenceId = parseInt(id);

    if (isNaN(evidenceId) || evidenceId < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid evidence ID',
      });
    }

    // Get evidence details
    const evidence = await blockchainService.getEvidence(evidenceId);

    // Get custody history
    const custodyHistory = await blockchainService.getCustodyHistory(evidenceId);

    // Get additional files
    const additionalFiles = await blockchainService.getEvidenceFiles(evidenceId);

    res.json({
      success: true,
      data: {
        ...evidence,
        ipfsGateway: ipfsService.getGatewayUrl(evidence.ipfsCid),
        statusText: getStatusText(evidence.status),
        custodyHistory: custodyHistory.map(event => ({
          ...event,
          date: new Date(event.timestamp * 1000).toISOString(),
        })),
        additionalFiles: additionalFiles.map(file => ({
          ...file,
          ipfsGateway: ipfsService.getGatewayUrl(file.ipfsCid),
          date: new Date(file.addedAt * 1000).toISOString(),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Transfer custody
 * POST /api/evidences/:id/transfer
 */
async function transferCustody(req, res, next) {
  try {
    const { id } = req.params;
    const { newCustodian, reason } = req.body;
    const evidenceId = parseInt(id);

    // Validation
    if (isNaN(evidenceId) || evidenceId < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid evidence ID',
      });
    }

    if (!newCustodian || !newCustodian.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid custodian address',
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transfer reason is required',
      });
    }

    const result = await blockchainService.transferCustody(
      evidenceId,
      newCustodian,
      reason
    );

    res.json({
      success: true,
      message: 'Custody transferred successfully',
      data: {
        evidenceId,
        newCustodian,
        txHash: result.txHash,
        blockNumber: result.blockNumber,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change evidence status
 * POST /api/evidences/:id/status
 */
async function changeStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const evidenceId = parseInt(id);

    // Validation
    if (isNaN(evidenceId) || evidenceId < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid evidence ID',
      });
    }

    const statusNum = parseInt(status);
    if (isNaN(statusNum) || statusNum < 0 || statusNum > 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status (0=Collected, 1=InAnalysis, 2=Archived, 3=Invalidated)',
      });
    }

    const result = await blockchainService.setStatus(evidenceId, statusNum);

    res.json({
      success: true,
      message: 'Status changed successfully',
      data: {
        evidenceId,
        newStatus: statusNum,
        statusText: getStatusText(statusNum),
        txHash: result.txHash,
        blockNumber: result.blockNumber,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add additional file to evidence
 * POST /api/evidences/:id/files
 */
async function addFile(req, res, next) {
  try {
    const { id } = req.params;
    const { fileType } = req.body;
    const file = req.file;
    const evidenceId = parseInt(id);

    // Validation
    if (isNaN(evidenceId) || evidenceId < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid evidence ID',
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    if (!fileType || fileType.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'File type is required',
      });
    }

    // Compute file hash
    const fileHash = computeHash(file.buffer);

    // Upload to IPFS
    const ipfsResult = await ipfsService.uploadFile(file.buffer, file.originalname);

    // Pin file
    await ipfsService.pinFile(ipfsResult.cid);

    // Add to blockchain
    const result = await blockchainService.addFileToEvidence(
      evidenceId,
      fileHash,
      ipfsResult.cid,
      fileType
    );

    res.status(201).json({
      success: true,
      message: 'File added to evidence successfully',
      data: {
        evidenceId,
        fileHash,
        ipfsCid: ipfsResult.cid,
        ipfsGateway: ipfsService.getGatewayUrl(ipfsResult.cid),
        fileType,
        txHash: result.txHash,
        blockNumber: result.blockNumber,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Helper function to convert status number to text
 */
function getStatusText(status) {
  const statusMap = {
    0: 'Collected',
    1: 'In Analysis',
    2: 'Archived',
    3: 'Invalidated',
  };
  return statusMap[status] || 'Unknown';
}

module.exports = {
  registerEvidence,
  getAllEvidences,
  getEvidenceById,
  transferCustody,
  changeStatus,
  addFile,
};
