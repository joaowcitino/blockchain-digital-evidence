const crypto = require('crypto');

/**
 * Utility functions for hashing
 */

/**
 * Compute SHA-256 hash of a buffer
 * @param {Buffer} buffer - File buffer
 * @returns {string} Hash as hex string with 0x prefix
 */
function computeHash(buffer) {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  return `0x${hash}`;
}

/**
 * Verify hash matches buffer
 * @param {Buffer} buffer - File buffer
 * @param {string} expectedHash - Expected hash (with or without 0x prefix)
 * @returns {boolean}
 */
function verifyHash(buffer, expectedHash) {
  const computedHash = computeHash(buffer);
  const normalizedExpected = expectedHash.startsWith('0x')
    ? expectedHash
    : `0x${expectedHash}`;

  return computedHash.toLowerCase() === normalizedExpected.toLowerCase();
}

module.exports = {
  computeHash,
  verifyHash,
};
