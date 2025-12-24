const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const QRCode = require('qrcode');
const multer = require('multer');
const WebSocket = require('ws');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ConnectionManager = require('./connectionManager');
const { DiffieHellman, deriveEncryptionKey } = require('./diffieHellman');
const EncryptionManager = require('./encryptionManager');
const { encodeToPgp, decodeFromPgp } = require('./pgpWordlist');

const app = express();

// Parse size strings like "100mb", "1gb", etc. into bytes
function parseSize(sizeStr) {
  if (typeof sizeStr === 'number') return sizeStr;
  if (!sizeStr) return null;
  
  const match = sizeStr.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb|tb)?$/);
  if (!match) {
    // Try parsing as plain number
    const num = parseInt(sizeStr);
    return isNaN(num) ? null : num;
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  const multipliers = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024,
    'tb': 1024 * 1024 * 1024 * 1024
  };
  
  return Math.floor(value * multipliers[unit]);
}

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://v0mcxr014hp6joe9.myfritz.net';
const PORT = process.env.PORT || 3000;
const MAX_FILE_SIZE_BYTES = parseSize(process.env.MAX_FILE_SIZE_BYTES) || 5368709120; // 5GB default
const BODY_SIZE_LIMIT = process.env.BODY_SIZE_LIMIT || '1gb';
const SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT_MS || '900000'); // 15 minutes default
const CLEANUP_INTERVAL_MS = parseInt(process.env.CLEANUP_INTERVAL_MS || '300000'); // 5 minutes default
const FILE_RETENTION_TIME = parseInt(process.env.FILE_RETENTION_TIME || '30') * 60 * 1000; // Convert minutes to milliseconds
const UPLOAD_DIR = path.join(__dirname, '../public/uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Map to track uploaded files and their creation timestamps
const uploadedFiles = new Map();

// Middleware
app.use(express.json({ limit: BODY_SIZE_LIMIT }));
app.use(express.urlencoded({ limit: BODY_SIZE_LIMIT, extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Multer for file uploads - use disk storage to support files > 2GB
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Use random filename without original name for privacy
    const randomName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${crypto.randomBytes(8).toString('hex')}`;
    cb(null, randomName);
  }
});

const upload = multer({ 
  storage,
  limits: { 
    fileSize: MAX_FILE_SIZE_BYTES
  }
});

// Connection manager
const connManager = new ConnectionManager({
  sessionTimeoutMs: SESSION_TIMEOUT_MS,
  cleanupIntervalMs: CLEANUP_INTERVAL_MS
});

// Store DH instances temporarily (keyed by connection code)
const dhInstances = new Map();

// Store WebSocket connections (keyed by connection code)
// Each session can have multiple websocket clients (receiver + sender)
const wsConnections = new Map();

// Helper to broadcast to all clients in a session
function broadcastToSession(code, message) {
  const clients = wsConnections.get(code);
  if (clients) {
    const messageStr = JSON.stringify(message);
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }
}

// Helper to notify specific role in a session
function notifySessionRole(code, role, message) {
  const clients = wsConnections.get(code);
  if (clients) {
    const messageStr = JSON.stringify(message);
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN && ws.role === role) {
        ws.send(messageStr);
      }
    });
  }
}

// ============ FILE CLEANUP FUNCTIONALITY ============

/**
 * Clean up expired uploaded files
 * Scans the actual filesystem to catch files from previous server sessions
 */
function cleanupExpiredFiles() {
  const now = Date.now();
  let deletedCount = 0;

  try {
    // Read all files in the upload directory
    const files = fs.readdirSync(UPLOAD_DIR);
    
    files.forEach((filename) => {
      const filepath = path.join(UPLOAD_DIR, filename);
      
      try {
        // Get file stats to check creation time
        const stats = fs.statSync(filepath);
        const fileAge = now - stats.mtimeMs; // Use modification time
        
        // If file is older than retention time, delete it
        if (fileAge > FILE_RETENTION_TIME) {
          fs.unlinkSync(filepath);
          uploadedFiles.delete(filename); // Also remove from map if present
          console.log(`✓ Deleted expired file: ${filename} (age: ${Math.round(fileAge / 1000 / 60)} min)`);
          deletedCount++;
        }
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error(`Error processing file ${filename}:`, err.message);
        }
      }
    });
    
    if (deletedCount > 0) {
      console.log(`🧹 Cleanup complete: deleted ${deletedCount} expired file(s)`);
    }
  } catch (err) {
    console.error('Error during cleanup:', err.message);
  }
}

// Run cleanup on startup to clean up files from previous sessions
console.log('🧹 Running initial cleanup of expired files...');
cleanupExpiredFiles();

// Start cleanup timer for recurring cleanup
const cleanupInterval = setInterval(cleanupExpiredFiles, CLEANUP_INTERVAL_MS);

// ============ ROUTES ============

/**
 * Receiver page - displays QR code with connection code
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

/**
 * Sender page - scans QR code or inputs connection code
 */
app.get('/sender', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/sender.html'));
});

/**
 * Alternative receiver page - receiver inputs code from sender's display
 */
app.get('/receiver', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/receiver.html'));
});

/**
 * API: Create a new receiver session (receiver initiates)
 * Now accepts the receiver's DH public key from the browser
 */
app.post('/api/session/create', async (req, res) => {
  try {
    const { initiatorDhPublicKey } = req.body;
    
    const code = connManager.createConnection({
      mode: 'receiver',
      initiatorDhPublicKey: initiatorDhPublicKey || null
    });

    // Generate QR code URL
    const qrUrl = `${BASE_URL}/join?code=${code}`;
    const qrCode = await QRCode.toDataURL(qrUrl, { width: 300 });

    // Encode connection code as PGP words (from hex string to bytes)
    const codeBuffer = Buffer.from(code, 'hex');
    const pgpCode = encodeToPgp(codeBuffer);

    res.json({
      code,
      pgpCode,
      qrCode,
      baseUrl: BASE_URL
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * API: Join an existing session as sender
 * Now accepts the sender's DH public key from the browser
 * Only one sender allowed per session
 */
app.post('/api/session/join', (req, res) => {
  try {
    let { code, responderDhPublicKey } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    // Normalize code to uppercase for consistency
    code = code.toUpperCase();

    const conn = connManager.getConnection(code);
    if (!conn) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Check if a sender is already connected
    if (conn.senderConnected) {
      return res.status(409).json({ error: 'A sender is already connected to this session. Only one sender allowed.' });
    }

    // Mark that a sender is now connected
    conn.senderConnected = true;

    // Store sender's DH public key if provided
    if (responderDhPublicKey) {
      connManager.setResponderPublicKey(code, responderDhPublicKey);
      
      // Notify receiver via WebSocket that sender's key is available
      notifySessionRole(code, 'receiver', {
        type: 'sender-key-available',
        responderPublicKey: responderDhPublicKey
      });
    }

    res.json({
      success: true,
      initiatorPublicKey: conn.initiatorDhPublicKey,
      responderPublicKey: conn.responderDhPublicKey,
      code
    });
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * API: Get session status and DH public keys (for receiver to poll for sender's key)
 */
app.get('/api/session/status/:code', (req, res) => {
  try {
    let code = req.params.code;
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    
    code = code.toUpperCase();
    const conn = connManager.getConnection(code);
    
    if (!conn) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    res.json({
      status: conn.status,
      initiatorPublicKey: conn.initiatorDhPublicKey,
      responderPublicKey: conn.responderDhPublicKey
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * API: Exchange DH keys and get shared secret (legacy - no longer needed with browser-side DH)
 */
app.post('/api/dh/exchange', (req, res) => {
  try {
    const { code, publicKey } = req.body;

    if (!code || !publicKey) {
      return res.status(400).json({ error: 'Code and publicKey are required' });
    }

    const dh = dhInstances.get(code);
    if (!dh) {
      return res.status(404).json({ error: 'DH instance not found' });
    }

    // Compute shared secret
    const sharedSecret = dh.computeSharedSecret(publicKey);
    const encryptionKey = deriveEncryptionKey(sharedSecret);

    res.json({
      success: true,
      sharedSecretHash: require('crypto')
        .createHash('sha256')
        .update(sharedSecret)
        .digest('hex')
    });
  } catch (error) {
    console.error('Error in DH exchange:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/message/send', upload.array('files'), (req, res) => {
  try {
    let { code, messageType, ciphertext, iv, authTag, hash, text } = req.body;
    console.log('[SERVER /api/message/send] messageType:', messageType);
    console.log('[SERVER] Files received:', req.files ? req.files.length : 0);
    console.log('[SERVER] Body keys:', Object.keys(req.body));
    
    // Handle file IVs and hashes from FormData
    // Note: form-data parser converts 'fileIvs[]' to 'fileIvs' when parsing multipart
    let fileIvs = [];
    let fileHashes = [];
    let fileNames = [];
    let fileNameIvs = [];
    
    // Try both forms: 'fileIvs[]' and 'fileIvs' (form-data strips the brackets)
    const ivKey = req.body['fileIvs[]'] !== undefined ? 'fileIvs[]' : 'fileIvs';
    const hashKey = req.body['fileHashes[]'] !== undefined ? 'fileHashes[]' : 'fileHashes';
    const nameKey = req.body['fileNames[]'] !== undefined ? 'fileNames[]' : 'fileNames';
    const nameIvKey = req.body['fileNameIvs[]'] !== undefined ? 'fileNameIvs[]' : 'fileNameIvs';
    
    if (req.body[ivKey]) {
      fileIvs = Array.isArray(req.body[ivKey]) 
        ? req.body[ivKey] 
        : [req.body[ivKey]];
    }
    
    if (req.body[hashKey]) {
      fileHashes = Array.isArray(req.body[hashKey]) 
        ? req.body[hashKey] 
        : [req.body[hashKey]];
    }
    
    if (req.body[nameKey]) {
      fileNames = Array.isArray(req.body[nameKey]) 
        ? req.body[nameKey] 
        : [req.body[nameKey]];
    }
    
    if (req.body[nameIvKey]) {
      fileNameIvs = Array.isArray(req.body[nameIvKey]) 
        ? req.body[nameIvKey] 
        : [req.body[nameIvKey]];
    }

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    // Normalize code to uppercase
    code = code.toUpperCase();

    const conn = connManager.getConnection(code);
    if (!conn) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    let messageData = {
      type: messageType || 'text',
      timestamp: Date.now()
    };

    if (messageType === 'text') {
      // Store encrypted text message
      messageData = {
        ...messageData,
        ciphertext,
        iv,
        authTag,
        hash,
        text: text || ''
      };
    } else if (messageType === 'files') {
      // Handle encrypted file uploads
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }

      const encryptedFiles = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        // With disk storage, files are already saved - just reference them
        const filename = file.filename; // filename from disk storage
        const iv = fileIvs[i] || '';
        const hash = fileHashes[i] || '';
        const encryptedName = fileNames[i] || '';
        const nameIv = fileNameIvs[i] || '';

        // Track the file for cleanup
        uploadedFiles.set(filename, Date.now());

        encryptedFiles.push({
          filename,
          size: file.size,
          iv: iv,
          hash: hash,
          encryptedName: encryptedName,
          nameIv: nameIv
        });
      }

      messageData = {
        ...messageData,
        files: encryptedFiles
      };
    }

    // Store the message
    connManager.storeMessage(code, messageData);
    
    // Notify receiver via WebSocket that a new message is available
    notifySessionRole(code, 'receiver', {
      type: 'message-available',
      messageId: messageData.timestamp,
      messageType: messageData.type
    });

    res.json({
      success: true,
      messageId: messageData.timestamp
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * API: Retrieve encrypted messages for a connection
 */
app.get('/api/message/retrieve/:code', (req, res) => {
  try {
    let { code } = req.params;

    // Normalize code to uppercase
    code = code.toUpperCase();

    const conn = connManager.getConnection(code);
    if (!conn) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const messages = connManager.getMessages(code);
    res.json({
      messages
    });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * API: Download encrypted file
 */
app.get('/api/file/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Security: prevent directory traversal
    if (!filepath.startsWith(UPLOAD_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Stream file as binary instead of loading entire file into memory
    res.setHeader('Content-Type', 'application/octet-stream');
    const stream = fs.createReadStream(filepath);
    stream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
    stream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Redirect from QR code
 */
app.get('/join', (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.redirect('/sender');
  }
  res.redirect(`/sender?code=${code}`);
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * API: Get server configuration
 */
app.get('/api/config', (req, res) => {
  res.json({
    maxFileSize: MAX_FILE_SIZE_BYTES,
    maxFileSizeFormatted: formatBytes(MAX_FILE_SIZE_BYTES),
    bodyLimit: BODY_SIZE_LIMIT,
    sessionTimeout: SESSION_TIMEOUT_MS,
    fileRetention: FILE_RETENTION_TIME
  });
});

// ============ ERROR HANDLING ============

// Handle multer errors (file too large, etc.)
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: `File too large. Maximum size is ${formatBytes(MAX_FILE_SIZE_BYTES)}`
      });
    }
    if (error.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({ error: 'Too many parts in form data' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files' });
    }
  } else if (error.status === 413) {
    return res.status(413).json({ error: 'Payload too large' });
  }
  
  // Pass other errors to default handler
  next(error);
});

// Default error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: error.message || 'Internal server error'
  });
});

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============ START SERVER ============

const server = app.listen(PORT, () => {
  console.log(`🚀 ReverseQR server running at ${BASE_URL}`);
  console.log(`📊 Receiver: ${BASE_URL}/`);
  console.log(`📤 Sender: ${BASE_URL}/sender`);
  console.log(`🔄 Alternative Receiver: ${BASE_URL}/receiver`);
  console.log(`\n⚙️  Configuration:`);
  console.log(`   • Max file size: ${formatBytes(MAX_FILE_SIZE_BYTES)}`);
  console.log(`   • Body size limit: ${BODY_SIZE_LIMIT}`);
  console.log(`   • Session timeout: ${SESSION_TIMEOUT_MS / 1000 / 60} minutes`);
  console.log(`   • File retention: ${FILE_RETENTION_TIME / 1000 / 60} minutes`);
  console.log(`   • Cleanup interval: ${CLEANUP_INTERVAL_MS / 1000 / 60} minutes`);
  console.log(`   • WebSocket: enabled\n`);
});

// ============ WEBSOCKET SERVER ============

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket: New client connected');
  
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle subscription to a session
      if (data.type === 'subscribe') {
        const { code, role } = data;
        if (!code) {
          ws.send(JSON.stringify({ type: 'error', message: 'No session code provided' }));
          return;
        }
        
        // Store the session code and role on the websocket
        ws.sessionCode = code;
        ws.role = role || 'unknown';
        
        // Add this websocket to the session's client list
        if (!wsConnections.has(code)) {
          wsConnections.set(code, new Set());
        }
        wsConnections.get(code).add(ws);
        
        console.log(`WebSocket: ${ws.role} subscribed to session ${code}`);
        ws.send(JSON.stringify({ type: 'subscribed', code, role: ws.role }));
        
        // Check if there's already data to send
        const session = connManager.getConnection(code);
        if (session) {
          // If receiver subscribes and sender's key is available, notify immediately
          if (ws.role === 'receiver' && session.responderDhPublicKey) {
            ws.send(JSON.stringify({
              type: 'sender-key-available',
              responderPublicKey: session.responderDhPublicKey
            }));
          }
          // If sender subscribes and receiver's key is available, notify immediately
          if (ws.role === 'sender' && session.initiatorDhPublicKey) {
            ws.send(JSON.stringify({
              type: 'receiver-key-available',
              initiatorPublicKey: session.initiatorDhPublicKey
            }));
          }
        }
      }
      
      // Handle ping/keepalive
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
      
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    // Remove from session's client list
    if (ws.sessionCode) {
      const clients = wsConnections.get(ws.sessionCode);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) {
          wsConnections.delete(ws.sessionCode);
        }
      }
      
      // If a sender disconnects, clear the senderConnected flag
      if (ws.role === 'sender') {
        const conn = connManager.getConnection(ws.sessionCode);
        if (conn) {
          conn.senderConnected = false;
          console.log(`WebSocket: Sender disconnected from session ${ws.sessionCode}, session available for new sender`);
        }
      } else {
        console.log(`WebSocket: ${ws.role || 'client'} disconnected from session ${ws.sessionCode}`);
      }
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Ping all clients every 30 seconds to keep connections alive
const wsHeartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      console.log('WebSocket: Terminating inactive client');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// Graceful shutdown handler
function gracefulShutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`);
  
  // Clear all intervals
  clearInterval(cleanupInterval);
  clearInterval(wsHeartbeat);
  connManager.stopCleanupTimer();
  
  // Force exit after 5 seconds if graceful shutdown fails
  const forceExitTimeout = setTimeout(() => {
    console.log('Forcing exit after timeout...');
    process.exit(1);
  }, 5000);
  
  // Close all WebSocket connections
  wss.clients.forEach((client) => {
    try {
      client.terminate();
    } catch (e) {
      // Ignore errors during cleanup
    }
  });
  
  // Close WebSocket server
  wss.close(() => {
    console.log('WebSocket server closed');
    
    // Close HTTP server
    server.close(() => {
      console.log('Server closed');
      clearTimeout(forceExitTimeout);
      process.exit(0);
    });
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
