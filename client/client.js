// reverseqr client.js
const BASE_URL = location.origin;
let ws, dh, sharedSecret, sessionCode;

function $(id) { return document.getElementById(id); }

function show(id) {
  $("modeSelect").classList.add("hidden");
  $("receiverUI").classList.add("hidden");
  $("senderUI").classList.add("hidden");
  $(id).classList.remove("hidden");
}

function toHex(buf) {
  return Array.from(new Uint8Array(buf)).map(x => x.toString(16).padStart(2, '0')).join('');
}

function hashBuffer(buf) {
  return crypto.subtle.digest('SHA-256', buf).then(h => toHex(h));
}

async function startReceiver() {
  const resp = await fetch('/api/new-session');
  const { code, url } = await resp.json();
  sessionCode = code;
  $("connCode").textContent = code;
  const qrResp = await fetch('/api/qr/' + code);
  const { qr } = await qrResp.json();
  $("qr").innerHTML = `<img src='${qr}' alt='QR code' />`;
  show("receiverUI");
  connectWS(code, true);
}

function startSender() {
  show("senderUI");
}

function connectWS(code, isReceiver) {
  ws = new WebSocket(`ws${location.protocol === 'https:' ? 's' : ''}://${location.host}`.replace('http', 'ws'));
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'join', code }));
  };
  ws.onmessage = async (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'joined') {
      $(isReceiver ? 'waitSender' : 'senderConnStatus').textContent = 'Connected!';
      // Start DH
      dh = window.crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey', 'deriveBits']);
      dh.then(async keyPair => {
        const pub = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
        ws.send(JSON.stringify({ type: 'dh-public', key: Array.from(new Uint8Array(pub)) }));
        ws.keyPair = keyPair;
      });
    } else if (msg.type === 'dh-public') {
      // Complete DH
      const theirPub = new Uint8Array(msg.key);
      const theirKey = await window.crypto.subtle.importKey('raw', theirPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
      const secret = await window.crypto.subtle.deriveBits({ name: 'ECDH', public: theirKey }, ws.keyPair.privateKey, 256);
      sharedSecret = await window.crypto.subtle.importKey('raw', secret, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    } else if (msg.type === 'text') {
      // Decrypt and show text
      const enc = new Uint8Array(msg.text.data);
      const iv = enc.slice(0, 12);
      const ct = enc.slice(12);
      const dec = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, sharedSecret, ct);
      const text = new TextDecoder().decode(dec);
      const hash = await hashBuffer(dec);
      if (hash !== msg.hash) {
        $("output").textContent = 'Hash mismatch!';
      } else {
        $("output").textContent = text;
      }
    } else if (msg.type === 'file-meta') {
      $("output").textContent = 'Receiving file: ' + msg.meta.name;
      ws.fileMeta = msg.meta;
      ws.fileChunks = [];
    } else if (msg.type === 'file-chunk') {
      ws.fileChunks[msg.index] = new Uint8Array(msg.chunk.data);
      if (ws.fileChunks.length === ws.fileMeta.chunks) {
        // All chunks received
        const fileData = new Uint8Array([].concat(...ws.fileChunks));
        const iv = fileData.slice(0, 12);
        const ct = fileData.slice(12);
        window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, sharedSecret, ct).then(dec => {
          hashBuffer(dec).then(hash => {
            if (hash !== msg.hash) {
              $("output").textContent = 'File hash mismatch!';
            } else {
              const blob = new Blob([dec], { type: ws.fileMeta.type });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = ws.fileMeta.name;
              a.textContent = 'Download ' + ws.fileMeta.name;
              $("output").appendChild(a);
            }
          });
        });
      }
    }
  };
}

$("asReceiver").onclick = startReceiver;
$("asSender").onclick = startSender;
$("connectBtn").onclick = () => {
  const code = $("senderCodeInput").value.trim();
  sessionCode = code;
  connectWS(code, false);
};

$("sendBtn").onclick = async () => {
  if (!sharedSecret) return alert('Not connected!');
  const text = $("textInput").value.trim();
  if (text) {
    const enc = new TextEncoder().encode(text);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sharedSecret, enc);
    const buf = new Uint8Array([...iv, ...new Uint8Array(ct)]);
    const hash = await hashBuffer(enc);
    ws.send(JSON.stringify({ type: 'text', text: buf, hash }));
    $("output").textContent = 'Text sent!';
  }
  const files = $("fileInput").files;
  for (let file of files) {
    const arr = new Uint8Array(await file.arrayBuffer());
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sharedSecret, arr);
    const buf = new Uint8Array([...iv, ...new Uint8Array(ct)]);
    const hash = await hashBuffer(arr);
    ws.send(JSON.stringify({ type: 'file-meta', meta: { name: file.name, type: file.type, size: file.size, chunks: 1 } }));
    ws.send(JSON.stringify({ type: 'file-chunk', chunk: buf, index: 0, hash }));
    $("output").textContent = 'File sent!';
  }
};
