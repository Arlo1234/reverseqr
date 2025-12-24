let connectionCode = null;
    let receiverDhPublicKey = null;

    async function startReceiving() {
      try {
        document.getElementById('error').style.display = 'none';
        const response = await fetch('/api/session/create', { method: 'POST' });
        const data = await response.json();

        connectionCode = data.code;
        receiverDhPublicKey = data.initiatorDhPublicKey;

        document.getElementById('pgpCode').textContent = data.pgpCode;
        document.getElementById('displaySection').style.display = 'block';
        event.target.disabled = true;
        event.target.textContent = '✓ Code Generated';

        // Derive encryption key from connection code
        const encoder = new TextEncoder();
        const codeData = encoder.encode(connectionCode);
        
        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          codeData,
          { name: 'PBKDF2' },
          false,
          ['deriveBits']
        );
        
        const derivedBits = await crypto.subtle.deriveBits(
          {
            name: 'PBKDF2',
            salt: codeData,
            hash: 'SHA-256',
            iterations: 100000
          },
          keyMaterial,
          256
        );
        
        const encryptionKey = new Uint8Array(derivedBits);

        // Hash the encryption key and display as 3-word code
        try {
          const keyHash = await hashBuffer(encryptionKey);
          const keyWords = await hashToWords(keyHash);
          const keyHashDisplay = document.getElementById('keyHashDisplay');
          if (keyHashDisplay) {
            keyHashDisplay.innerHTML = `<strong>🔐 Security Fingerprint:</strong><br><span class="key-words">${keyWords}</span>`;
            keyHashDisplay.style.display = 'block';
          } else {
            console.warn('keyHashDisplay element not found');
          }
        } catch (hashError) {
          console.error('Error displaying key hash:', hashError);
        }

        // Start polling for messages
        startMessagePolling();
      } catch (error) {
        showError('Failed to create session: ' + error.message);
        console.error(error);
      }
    }

    async function startMessagePolling() {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/message/retrieve/${connectionCode}`);
          const data = await response.json();

          if (data.messages && data.messages.length > 0) {
            clearInterval(pollInterval);
            displayMessages(data.messages);
          }
        } catch (error) {
          console.error('Error polling for messages:', error);
        }
      }, 2000);
    }

    async function displayMessages(messages) {
      const messagesSection = document.getElementById('messagesSection');
      const messagesList = document.getElementById('messagesList');
      messagesSection.style.display = 'block';

      messagesList.innerHTML = '';

      for (const msg of messages) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message';

        if (msg.type === 'text') {
          msgDiv.innerHTML = `
            <div class="message-type">📝 Text Message</div>
            <div class="message-text">${escapeHtml(msg.text || '[Message content]')}</div>
          `;
        } else if (msg.type === 'files') {
          msgDiv.innerHTML = `
            <div class="message-type">📦 Files</div>
            <div class="message-files">
              ${msg.files ? msg.files.map(f => `
                <div class="file-item">
                  <div style="flex: 1;">
                    <div>📥 ${escapeHtml(f.encryptedName || 'File')}</div>
                    <div style="font-size: 12px; color: #999;">Size: ${formatFileSize(f.size)}</div>
                  </div>
                  <button class="file-action-btn" onclick="handleFileDownload(event)">⬇️ Download</button>
                </div>
              `).join('') : ''}
            </div>
          `;
        }

        messagesList.appendChild(msgDiv);
      }
    }

    function copyCode() {
      const codeElement = document.getElementById('pgpCode');
      const text = codeElement.textContent;
      navigator.clipboard.writeText(text).then(() => {
        const button = event.target;
        button.textContent = '✓ Copied!';
        button.classList.add('copied');
        setTimeout(() => {
          button.textContent = '📋 Copy Code';
          button.classList.remove('copied');
        }, 2000);
      });
    }

    function showError(message) {
      const errorDiv = document.getElementById('error');
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }

    function escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    function handleFileDownload(event) {
      event.preventDefault();
      // File download functionality would be implemented here
      // For now, encryption key hash verification provides integrity assurance
      alert('File download functionality to be implemented');
    }

    async function hashBuffer(buffer) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function hashToWords(hashHex) {
      // Load EFF wordlist
      const response = await fetch('/eff_wordlist.json');
      const data = await response.json();
      const wordlist = data.eff_wordlist;
      const listLength = wordlist.length;
      
      // Convert hex hash to bytes
      const hashBytes = [];
      for (let i = 0; i < hashHex.length; i += 2) {
        hashBytes.push(parseInt(hashHex.substr(i, 2), 16));
      }
      
      // Take first 6 bytes (48 bits) of hash and split into 3 chunks
      // Each chunk is used with modulo to get wordlist index
      const words = [];
      for (let i = 0; i < 3; i++) {
        const byte1 = hashBytes[i * 2] || 0;
        const byte2 = hashBytes[i * 2 + 1] || 0;
        const twoBytes = (byte1 << 8) | byte2;
        const index = twoBytes % listLength;
        words.push(wordlist[index]);
      }
      
      return words.join(' ');
    }
