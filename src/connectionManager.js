const crypto = require('crypto');

/**
 * Connection manager to track active sessions and DH exchanges
 */
class ConnectionManager {
  constructor() {
    this.connections = new Map(); // connectionCode -> session data
    this.sessionTimeout = 15 * 60 * 1000; // 15 minutes
    this.cleanupInterval = 5 * 60 * 1000; // Cleanup every 5 minutes
    this.startCleanupTimer();
  }

  /**
   * Generate a random connection code
   * @returns {string} 6-character random code
   */
  generateConnectionCode() {
    let code;
    do {
      code = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 6);
    } while (this.connections.has(code));
    return code;
  }

  /**
   * Create a new connection session
   * @param {Object} options - {mode, initiatorDhPublicKey}
   * @returns {string} Connection code
   */
  createConnection(options = {}) {
    const code = this.generateConnectionCode();
    this.connections.set(code, {
      mode: options.mode || 'receiver', // 'receiver' or 'sender'
      initiatorDhPublicKey: options.initiatorDhPublicKey || null,
      responderDhPublicKey: null,
      messages: [],
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout,
      status: 'waiting' // 'waiting', 'established', 'complete'
    });
    return code;
  }

  /**
   * Get connection by code
   * @param {string} code - Connection code
   * @returns {Object|null} Connection object or null
   */
  getConnection(code) {
    const conn = this.connections.get(code);
    if (conn && conn.expiresAt > Date.now()) {
      return conn;
    }
    if (conn) {
      this.connections.delete(code);
    }
    return null;
  }

  /**
   * Update responder's DH public key
   * @param {string} code - Connection code
   * @param {string} responderDhPublicKey - DH public key from responder
   */
  setResponderPublicKey(code, responderDhPublicKey) {
    const conn = this.getConnection(code);
    if (!conn) throw new Error('Connection not found');
    conn.responderDhPublicKey = responderDhPublicKey;
    conn.status = 'established';
  }

  /**
   * Store encrypted message
   * @param {string} code - Connection code
   * @param {Object} messageData - Encrypted message with metadata
   */
  storeMessage(code, messageData) {
    const conn = this.getConnection(code);
    if (!conn) throw new Error('Connection not found');
    conn.messages.push({
      data: messageData,
      timestamp: Date.now()
    });
  }

  /**
   * Get all messages for a connection
   * @param {string} code - Connection code
   * @returns {Array} Array of messages
   */
  getMessages(code) {
    const conn = this.getConnection(code);
    if (!conn) throw new Error('Connection not found');
    return conn.messages;
  }

  /**
   * Clean up expired connections
   */
  cleanup() {
    const now = Date.now();
    for (const [code, conn] of this.connections.entries()) {
      if (conn.expiresAt < now) {
        this.connections.delete(code);
      }
    }
  }

  /**
   * Start automatic cleanup timer
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Stop cleanup timer (for graceful shutdown)
   */
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  /**
   * Delete a connection
   * @param {string} code - Connection code
   */
  deleteConnection(code) {
    this.connections.delete(code);
  }
}

module.exports = ConnectionManager;
