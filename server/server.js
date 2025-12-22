const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const QRCode = require('qrcode');
const crypto = require('crypto');
const pgpWords = require('./pgpWordlist');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:' + PORT;

const sessions = {};
const upload = multer({ dest: 'server/uploads/' });

function randomCode(bytes = 4) {
  const buf = crypto.randomBytes(bytes);
  return Array.from(buf).map(b => pgpWords[b]).join('-');
}

function codeToBytes(code) {
  return code.split('-').map(word => pgpWords.indexOf(word));
}

app.use(express.static(path.join(__dirname, '../client')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/new-session', (req, res) => {
  const code = randomCode();
  sessions[code] = { ws: null, files: [], text: null, hash: null };
  res.json({ code, url: `${BASE_URL}/?code=${code}` });
});

app.get('/api/qr/:code', async (req, res) => {
  const url = `${BASE_URL}/?code=${req.params.code}`;
  const qr = await QRCode.toDataURL(url);
  res.json({ qr });
});

wss.on('connection', (ws, req) => {
  ws.on('message', async (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch { return; }
    if (data.type === 'join') {
      const session = sessions[data.code];
      if (!session) return ws.send(JSON.stringify({ type: 'error', error: 'Invalid code' }));
      session.ws = ws;
      ws.sessionCode = data.code;
      ws.send(JSON.stringify({ type: 'joined', code: data.code }));
    } else if (data.type === 'dh-public') {
      // Relay DH public key
      const session = sessions[ws.sessionCode];
      if (session && session.ws && session.ws !== ws) {
        session.ws.send(JSON.stringify({ type: 'dh-public', key: data.key }));
      }
    } else if (data.type === 'text') {
      // Relay encrypted text
      const session = sessions[ws.sessionCode];
      if (session && session.ws && session.ws !== ws) {
        session.ws.send(JSON.stringify({ type: 'text', text: data.text, hash: data.hash }));
      }
    } else if (data.type === 'file-meta') {
      // Relay file meta
      const session = sessions[ws.sessionCode];
      if (session && session.ws && session.ws !== ws) {
        session.ws.send(JSON.stringify({ type: 'file-meta', meta: data.meta }));
      }
    } else if (data.type === 'file-chunk') {
      // Relay file chunk
      const session = sessions[ws.sessionCode];
      if (session && session.ws && session.ws !== ws) {
        session.ws.send(JSON.stringify({ type: 'file-chunk', chunk: data.chunk, index: data.index, hash: data.hash }));
      }
    }
  });
  ws.on('close', () => {
    if (ws.sessionCode && sessions[ws.sessionCode]) {
      sessions[ws.sessionCode].ws = null;
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at ${BASE_URL}`);
});
