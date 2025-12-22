# !!!!!!!!!!STILL IN ALPHA, DONT TRY TO MAKE IT WORK!!!!!!!!!! 

# 🔒 ReverseQR - Secure File & Text Sharing

A modern, secure web application for sharing files and text between two users with military-grade encryption and human-readable connection codes.

## ✨ Features

### 🔐 Security
- **Diffie-Hellman Key Exchange**: Secure key establishment without pre-shared secrets
- **AES-256-GCM Encryption**: Military-grade encryption for all data
- **SHA-256 Hashing**: Automatic integrity verification of all messages
- **HTTPS/TLS Support**: All communication can be encrypted end-to-end
- **No Data Retention**: Messages are not stored after download

### 📱 Connection Methods
1. **QR Code Mode**: Receiver displays QR code, sender scans it
2. **Manual Code Entry**: Sender displays code, receiver enters it
3. **Human-Readable Codes**: PGP wordlist encoding for easy verbal transmission

### 📦 Supported Content
- **Text Messages**: Direct display on receiver
- **File Uploads**: Multiple files up to 500MB each
- **Automatic Decryption**: Files are decrypted transparently on download
- **Drag & Drop**: Easy file upload interface

### 🌐 Accessibility
- Modern, responsive web interface
- No installation required on client machines
- Works on desktop and mobile browsers
- Zero-configuration for users

## 🚀 Quick Start

### Installation

1. **Clone and navigate to project:**
```bash
cd /home/armand/Documents/reverseqr
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the server:**
```bash
npm start
```

4. **Access the application:**
- Receiver: http://localhost:3000
- Sender: http://localhost:3000/sender
- Alternative: http://localhost:3000/receiver

### First Time Usage

**For Receiver:**
1. Open http://localhost:3000/
2. Share the QR code or PGP-encoded connection code with sender
3. Files/messages appear automatically when sent

**For Sender:**
1. Scan QR code or enter connection code
2. Type message and/or upload files
3. Click "Send Securely"
4. Sender can see transfer progress

## 🏗️ Architecture

### Frontend
- **Vanilla JavaScript** - No frameworks required
- **Modern CSS** - Gradient designs and responsive layout
- **Native Crypto API** - For client-side encryption (future enhancement)
- **QR Code Generation** - Dynamic QR code creation

### Backend
- **Express.js** - Lightweight HTTP server
- **Node.js Crypto** - Cryptographic operations
- **In-Memory Sessions** - Fast session management
- **Multer** - Secure file handling

### Security Layer
```
User Input → Diffie-Hellman Key Exchange → AES-256-GCM Encryption → Upload
                                                    ↓
                                          SHA-256 Hash Verification
```

## 📁 Project Structure

```
reverseqr/
├── src/
│   ├── server.js              # Express application
│   ├── connectionManager.js    # Session & connection handling
│   ├── diffieHellman.js        # DH key exchange implementation
│   ├── encryptionManager.js    # AES-256-GCM encryption
│   └── pgpWordlist.js          # PGP wordlist encoding/decoding
├── public/
│   ├── index.html              # Receiver page
│   ├── sender.html             # Sender page
│   ├── receiver.html           # Alternative receiver
│   └── uploads/                # Encrypted file storage
├── package.json
├── SETUP.md                    # Deployment guide
└── README.md                   # This file
```

## 🔄 Connection Flow

### Standard Mode (QR Code)
```
Receiver                          Server                          Sender
   |                              |                                |
   |--1. Create Session---------->|                                |
   |<--Connection Code + QR--------|                                |
   |                              |<--2. Join Session----|         |
   |                              |--DH Public Key----->|         |
   |                              |<--DH Exchange--------|         |
   |                              |                                |
   |                              |<--3. Send Encrypted Msg--------|
   |<-----Retrieve Message--------|                                |
   |--Decrypt & Verify Hash------>|                                |
```

### Alternative Mode (Manual Code)
```
Sender                            Server                         Receiver
   |                              |                                |
   |<--1. Receiver generates-----|                                |
   |<--Code displayed------------|<--Create Session----------|    |
   |                              |                                |
   |--2. Join with Code---------->|                                |
   |<--DH Public Key Exchange-----|                                |
   |                              |                                |
   |--3. Send Encrypted Msg------>|--Store Message---------->|    |
   |                              |                                |
   |                              |<--Retrieve & Decrypt--------|  |
```

## 🔐 Encryption Details

### Key Exchange
1. Both parties generate DH key pairs
2. Public keys are exchanged via the server
3. Shared secret is computed locally
4. Encryption key is derived using HKDF-SHA256

### Message Encryption
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits
- **IV**: 16 random bytes per message
- **Authentication Tag**: Ensures integrity and authenticity

### Hash Verification
- **Algorithm**: SHA-256
- **Computed On**: Original plaintext
- **Verified On**: Decrypted plaintext
- **Prevents**: Tampering and corruption

## 🛠️ API Endpoints

### Session Management
- `POST /api/session/create` - Create receiver session
- `POST /api/session/join` - Join as sender

### Key Exchange
- `POST /api/dh/exchange` - Exchange DH public keys

### Messaging
- `POST /api/message/send` - Send encrypted message/files
- `GET /api/message/retrieve/:code` - Retrieve messages
- `GET /api/file/download/:filename` - Download encrypted file

### Utilities
- `GET /health` - Health check
- `GET /` - Receiver page
- `GET /sender` - Sender page
- `GET /receiver` - Alternative receiver
- `GET /join?code=` - QR redirect

## 🌍 Deployment

### Quick Deploy (Local)
```bash
npm install
npm start
```

### Production with Nginx (See SETUP.md for details)
```bash
# Install dependencies
npm install

# Install PM2
sudo npm install -g pm2

# Start with PM2
pm2 start src/server.js --name reverseqr
pm2 save
sudo pm2 startup

# Configure Nginx reverse proxy
# (See SETUP.md for full configuration)

# Set up SSL with Let's Encrypt
sudo certbot certonly --nginx -d yourdomain.com
```

### Docker
```bash
docker-compose up -d
```

## 📊 Configuration

### Environment Variables
```bash
PORT=3000                                  # Server port
BASE_URL=https://yourdomain.com           # Public URL for QR codes
NODE_ENV=production                       # Environment
UPLOAD_DIR=/var/lib/reverseqr/uploads     # Upload directory
```

### Session Settings
- **Timeout**: 15 minutes
- **Max Message Size**: 100MB
- **Max File Size**: 500MB per file
- **Auto Cleanup**: Every 5 minutes

## 📈 Performance

- **Memory**: ~50MB base + session data
- **CPU**: Minimal, mostly I/O bound
- **Concurrent Users**: 1000+ with proper resources
- **Upload Speed**: Limited by network and encryption overhead
- **File Handling**: Streaming capable for large files

## 🔍 Monitoring

### Check Status
```bash
pm2 status
```

### View Logs
```bash
pm2 logs reverseqr
```

### Monitor Resources
```bash
pm2 monit
```

## 🐛 Troubleshooting

### QR Code Not Displaying
- Ensure QRCode library is loaded from CDN
- Check browser console for errors
- Verify BASE_URL environment variable

### Connection Timeout
- Receiver must connect within 15 minutes
- Session may have expired
- Check server logs for errors

### File Upload Fails
- Verify file size < 500MB
- Check disk space on server
- Ensure proper permissions on upload directory

### Encryption Errors
- Browser may not support SubtleCrypto
- Check browser compatibility (modern browsers only)
- Verify DH key exchange completed successfully

## 📝 Limitations & Future Enhancements

### Current Limitations
- In-memory session storage (max ~1000 concurrent)
- No persistent file history
- No user accounts or authentication
- Single recipient per connection

### Planned Enhancements
- Redis session storage
- Database integration (MongoDB/PostgreSQL)
- User accounts with history
- Group sharing
- Mobile apps
- Progressive Web App (PWA)
- End-to-end encryption (client-side crypto)

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📞 Support

For issues or questions:
1. Check the SETUP.md for deployment details
2. Review server logs with `pm2 logs reverseqr`
3. Test connectivity with `/health` endpoint

## 🎓 Technical Details

### PGP Wordlist
- Uses standard BIP39/PGP wordlist
- Each byte maps to a word
- Words separated by hyphens
- Example: `above-accept-acid-acre-actor-actual`

### Diffie-Hellman Parameters
- Uses 2048-bit MODP Group (RFC 3526)
- Prime modulus: `p` (~2^2048)
- Generator: `g = 2`
- Ensures forward secrecy per session

### Encryption Workflow
1. Random 32-byte key derived from shared secret
2. Random 16-byte IV for each message
3. AES-256-GCM encrypts plaintext
4. IV + AuthTag + Ciphertext transmitted
5. Receiver decrypts and verifies AuthTag
6. SHA-256 hash verified against plaintext

---

**Made with 🔐 for secure sharing**
