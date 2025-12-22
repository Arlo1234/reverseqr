const express = require('express');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const multer = require('multer');

const ConnectionManager = require('./connectionManager');
const { DiffieHellman, deriveEncryptionKey } = require('./diffieHellman');
const EncryptionManager = require('./encryptionManager');
const { encodeToPgp, decodeFromPgp } = require('./pgpWordlist');

const app = express();

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://v0mcxr014hp6joe9.myfritz.net';
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, '../public/uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Middleware
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ limit: '1gb', extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Multer for file uploads - use disk storage to support files > 2GB
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 * 1024  // 5GB limit
  }
});

// Connection manager
const connManager = new ConnectionManager();

// Store DH instances temporarily (keyed by connection code)
const dhInstances = new Map();

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
 */
app.post('/api/session/create', async (req, res) => {
  try {
    // Create DH for receiver
    const dh = new DiffieHellman();
    const code = connManager.createConnection({
      mode: 'receiver',
      initiatorDhPublicKey: dh.getPublicKeyHex()
    });

    dhInstances.set(code, dh);

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
 */
app.post('/api/session/join', (req, res) => {
  try {
    let { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    // Normalize code to uppercase for consistency
    code = code.toUpperCase();

    const conn = connManager.getConnection(code);
    if (!conn) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Create DH for sender
    const dh = new DiffieHellman();
    dhInstances.set(`${code}_sender`, dh);

    // Store sender's DH public key
    connManager.setResponderPublicKey(code, dh.getPublicKeyHex());

    res.json({
      success: true,
      initiatorPublicKey: conn.initiatorDhPublicKey,
      responderPublicKey: dh.getPublicKeyHex(),
      code
    });
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * API: Exchange DH keys and get shared secret
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

/**
 * API: Send encrypted message/files
 */
app.post('/api/message/send', upload.array('files'), (req, res) => {
  try {
    let { code, messageType, ciphertext, iv, authTag, hash, text } = req.body;

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
      // Handle file uploads
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }

      const encryptedFiles = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        // With disk storage, files are already saved - just reference them
        const filename = file.filename; // filename from disk storage

        encryptedFiles.push({
          filename,
          originalName: file.originalname,
          size: file.size,
          hash: hash || ''
        });
      }

      messageData = {
        ...messageData,
        files: encryptedFiles
      };
    }

    // Store the message
    connManager.storeMessage(code, messageData);

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

// ============ ERROR HANDLING ============

// Handle multer errors (file too large, etc.)
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: `File too large. Maximum size is 5GB. Received: ${formatBytes(error.limit)}`
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
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  connManager.stopCleanupTimer();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  connManager.stopCleanupTimer();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
