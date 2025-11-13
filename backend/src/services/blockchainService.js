const { ethers } = require('ethers');
const config = require('../config');
const contractABI = require('../config/contractABI.json');

/**
 * Blockchain service for interacting with the Digital Evidence smart contract
 */
class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.initialized = false;
  }

  /**
   * Initialize blockchain connection
   */
  async initialize() {
    try {
      // Validate configuration
      if (!config.blockchain.contractAddress) {
        throw new Error('CONTRACT_ADDRESS not configured');
      }
      if (!config.blockchain.privateKey) {
        throw new Error('PRIVATE_KEY not configured');
      }

      // Connect to blockchain
      this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
      this.wallet = new ethers.Wallet(config.blockchain.privateKey, this.provider);

      // Initialize contract instance
      this.contract = new ethers.Contract(
        config.blockchain.contractAddress,
        contractABI,
        this.wallet
      );

      // Test connection
      const network = await this.provider.getNetwork();
      console.log(`✅ Connected to blockchain (Chain ID: ${network.chainId})`);

      this.initialized = true;
    } catch (error) {
      console.error('❌ Blockchain initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Ensure blockchain is initialized
   */
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Blockchain service not initialized');
    }
  }

  /**
   * Register new evidence on blockchain
   * @param {string} fileHash - SHA-256 hash as hex string (with 0x prefix)
   * @param {string} ipfsCid - IPFS Content Identifier
   * @param {string} description - Evidence description
   * @param {string} caseId - Case identifier
   * @returns {Promise<{evidenceId: number, txHash: string}>}
   */
  async registerEvidence(fileHash, ipfsCid, description, caseId) {
    this._ensureInitialized();

    try {
      console.log('📝 Registering evidence on blockchain...');

      // Validate inputs
      if (!fileHash.startsWith('0x') || fileHash.length !== 66) {
        throw new Error('Invalid file hash format');
      }

      // Call smart contract
      const tx = await this.contract.register_evidence(
        fileHash,
        ipfsCid,
        description,
        caseId
      );

      console.log(`⏳ Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

      // Extract evidence ID from events
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'EvidenceRegistered';
        } catch {
          return false;
        }
      });

      let evidenceId;
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        evidenceId = Number(parsed.args.id);
      } else {
        // Fallback: get current counter
        evidenceId = Number(await this.contract.evidence_counter());
      }

      return {
        evidenceId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('❌ Error registering evidence:', error.message);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  }

  /**
   * Transfer custody of evidence
   * @param {number} evidenceId - Evidence ID
   * @param {string} newCustodian - New custodian address
   * @param {string} reason - Transfer reason
   * @returns {Promise<{txHash: string}>}
   */
  async transferCustody(evidenceId, newCustodian, reason) {
    this._ensureInitialized();

    try {
      console.log(`🔄 Transferring custody of evidence ${evidenceId}...`);

      const tx = await this.contract.transfer_custody(
        evidenceId,
        newCustodian,
        reason
      );

      const receipt = await tx.wait();
      console.log(`✅ Custody transferred in block ${receipt.blockNumber}`);

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('❌ Error transferring custody:', error.message);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  }

  /**
   * Change evidence status
   * @param {number} evidenceId - Evidence ID
   * @param {number} newStatus - New status (0=Collected, 1=InAnalysis, 2=Archived, 3=Invalidated)
   * @returns {Promise<{txHash: string}>}
   */
  async setStatus(evidenceId, newStatus) {
    this._ensureInitialized();

    try {
      console.log(`📊 Setting status of evidence ${evidenceId} to ${newStatus}...`);

      const tx = await this.contract.set_status(evidenceId, newStatus);
      const receipt = await tx.wait();
      console.log(`✅ Status changed in block ${receipt.blockNumber}`);

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('❌ Error setting status:', error.message);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  }

  /**
   * Add additional file to evidence
   * @param {number} evidenceId - Evidence ID
   * @param {string} fileHash - File hash
   * @param {string} ipfsCid - IPFS CID
   * @param {string} fileType - File type description
   * @returns {Promise<{txHash: string}>}
   */
  async addFileToEvidence(evidenceId, fileHash, ipfsCid, fileType) {
    this._ensureInitialized();

    try {
      console.log(`📎 Adding file to evidence ${evidenceId}...`);

      const tx = await this.contract.add_file_to_evidence(
        evidenceId,
        fileHash,
        ipfsCid,
        fileType
      );

      const receipt = await tx.wait();
      console.log(`✅ File added in block ${receipt.blockNumber}`);

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('❌ Error adding file:', error.message);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  }

  /**
   * Get evidence details
   * @param {number} evidenceId - Evidence ID
   * @returns {Promise<Object>}
   */
  async getEvidence(evidenceId) {
    this._ensureInitialized();

    try {
      const evidence = await this.contract.get_evidence(evidenceId);

      return {
        id: Number(evidence.id),
        fileHash: evidence.file_hash,
        ipfsCid: evidence.ipfs_cid,
        description: evidence.description,
        caseId: evidence.case_id,
        creator: evidence.creator,
        currentCustodian: evidence.current_custodian,
        createdAt: Number(evidence.created_at),
        status: Number(evidence.status),
        exists: evidence.exists,
      };
    } catch (error) {
      console.error('❌ Error getting evidence:', error.message);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  }

  /**
   * Get custody history
   * @param {number} evidenceId - Evidence ID
   * @returns {Promise<Array>}
   */
  async getCustodyHistory(evidenceId) {
    this._ensureInitialized();

    try {
      const history = await this.contract.get_custody_history(evidenceId);

      return history.map(event => ({
        fromAddress: event.from_address,
        toAddress: event.to_address,
        timestamp: Number(event.timestamp),
        reason: event.reason,
      }));
    } catch (error) {
      console.error('❌ Error getting custody history:', error.message);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  }

  /**
   * Get additional files for evidence
   * @param {number} evidenceId - Evidence ID
   * @returns {Promise<Array>}
   */
  async getEvidenceFiles(evidenceId) {
    this._ensureInitialized();

    try {
      const files = await this.contract.get_evidence_files(evidenceId);

      return files.map(file => ({
        fileHash: file.file_hash,
        ipfsCid: file.ipfs_cid,
        fileType: file.file_type,
        addedBy: file.added_by,
        addedAt: Number(file.added_at),
      }));
    } catch (error) {
      console.error('❌ Error getting evidence files:', error.message);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  }

  /**
   * Get total evidence count
   * @returns {Promise<number>}
   */
  async getEvidenceCount() {
    this._ensureInitialized();

    try {
      const count = await this.contract.evidence_counter();
      return Number(count);
    } catch (error) {
      console.error('❌ Error getting evidence count:', error.message);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  }

  /**
   * Get all evidences (by iterating through IDs)
   * @returns {Promise<Array>}
   */
  async getAllEvidences() {
    this._ensureInitialized();

    try {
      const count = await this.getEvidenceCount();
      const evidences = [];

      for (let i = 1; i <= count; i++) {
        try {
          const evidence = await this.getEvidence(i);
          if (evidence.exists) {
            evidences.push(evidence);
          }
        } catch (error) {
          console.warn(`Evidence ${i} not found or error:`, error.message);
        }
      }

      return evidences;
    } catch (error) {
      console.error('❌ Error getting all evidences:', error.message);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  }

  /**
   * Verify evidence integrity
   * @param {number} evidenceId - Evidence ID
   * @param {string} fileHash - Hash to verify
   * @returns {Promise<boolean>}
   */
  async verifyIntegrity(evidenceId, fileHash) {
    this._ensureInitialized();

    try {
      return await this.contract.verify_integrity(evidenceId, fileHash);
    } catch (error) {
      console.error('❌ Error verifying integrity:', error.message);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  }

  /**
   * Grant role to address
   * @param {string} address - Address to grant role
   * @param {number} role - Role bitmap (1=ADMIN, 2=POLICE, 4=LAB, 8=JUDGE)
   * @returns {Promise<{txHash: string}>}
   */
  async grantRole(address, role) {
    this._ensureInitialized();

    try {
      const tx = await this.contract.grant_role(address, role);
      const receipt = await tx.wait();

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('❌ Error granting role:', error.message);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new BlockchainService();
