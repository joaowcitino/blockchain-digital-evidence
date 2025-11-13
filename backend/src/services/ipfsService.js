const config = require('../config');

/**
 * IPFS service for storing and retrieving files
 */
class IPFSService {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  /**
   * Initialize IPFS client
   */
  async initialize() {
    try {
      // Dynamically import ipfs-http-client (ES module)
      const { create } = await import('ipfs-http-client');

      // Create IPFS HTTP client
      this.client = create({
        host: config.ipfs.host,
        port: config.ipfs.port,
        protocol: config.ipfs.protocol,
      });

      // Test connection
      const version = await this.client.version();
      console.log(`✅ Connected to IPFS (Version: ${version.version})`);

      this.initialized = true;
    } catch (error) {
      console.error('❌ IPFS initialization failed:', error.message);
      console.warn('⚠️  Make sure IPFS daemon is running: ipfs daemon');
      throw error;
    }
  }

  /**
   * Ensure IPFS is initialized
   */
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('IPFS service not initialized');
    }
  }

  /**
   * Upload file to IPFS
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} filename - Original filename
   * @returns {Promise<{cid: string, size: number}>}
   */
  async uploadFile(fileBuffer, filename) {
    this._ensureInitialized();

    try {
      console.log(`📤 Uploading file to IPFS: ${filename}`);

      // Add file to IPFS
      const result = await this.client.add({
        path: filename,
        content: fileBuffer,
      });

      console.log(`✅ File uploaded to IPFS: ${result.cid.toString()}`);

      return {
        cid: result.cid.toString(),
        size: result.size,
        path: result.path,
      };
    } catch (error) {
      console.error('❌ Error uploading to IPFS:', error.message);
      throw new Error(`IPFS upload error: ${error.message}`);
    }
  }

  /**
   * Get file from IPFS
   * @param {string} cid - IPFS Content Identifier
   * @returns {Promise<Buffer>}
   */
  async getFile(cid) {
    this._ensureInitialized();

    try {
      console.log(`📥 Retrieving file from IPFS: ${cid}`);

      const chunks = [];
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
      }

      const fileBuffer = Buffer.concat(chunks);
      console.log(`✅ File retrieved from IPFS (${fileBuffer.length} bytes)`);

      return fileBuffer;
    } catch (error) {
      console.error('❌ Error retrieving from IPFS:', error.message);
      throw new Error(`IPFS retrieval error: ${error.message}`);
    }
  }

  /**
   * Get file stats from IPFS
   * @param {string} cid - IPFS Content Identifier
   * @returns {Promise<Object>}
   */
  async getFileStats(cid) {
    this._ensureInitialized();

    try {
      const stats = await this.client.files.stat(`/ipfs/${cid}`);
      return {
        cid: stats.cid.toString(),
        size: stats.size,
        cumulativeSize: stats.cumulativeSize,
        type: stats.type,
      };
    } catch (error) {
      console.error('❌ Error getting IPFS stats:', error.message);
      throw new Error(`IPFS stats error: ${error.message}`);
    }
  }

  /**
   * Pin file to ensure it's not garbage collected
   * @param {string} cid - IPFS Content Identifier
   * @returns {Promise<void>}
   */
  async pinFile(cid) {
    this._ensureInitialized();

    try {
      console.log(`📌 Pinning file: ${cid}`);
      await this.client.pin.add(cid);
      console.log(`✅ File pinned: ${cid}`);
    } catch (error) {
      console.error('❌ Error pinning file:', error.message);
      throw new Error(`IPFS pin error: ${error.message}`);
    }
  }

  /**
   * Get gateway URL for a file
   * @param {string} cid - IPFS Content Identifier
   * @returns {string}
   */
  getGatewayUrl(cid) {
    return `${config.ipfs.gateway}${cid}`;
  }
}

// Export singleton instance
module.exports = new IPFSService();
