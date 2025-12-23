# IV Debugging Guide

I've added comprehensive console logging to trace the IV through the entire flow. Here's what to look for:

## Browser Console (Sender Side)
1. Open browser developer tools (F12 → Console tab)
2. Select files and click "Send Securely"
3. Look for logs like:
```
[SENDER] File: myfile.txt
[SENDER] IV (hex): a1b2c3d4e5f6... (should be 32 characters = 16 bytes)
[SENDER] Appended fileIvs[]: a1b2c3d4e5f6...
```

## Server Console (Terminal)
1. Look at the terminal running `npm start`
2. You should see logs like:
```
[SERVER /api/message/send] messageType: files
[SERVER] Files received: 1
[SERVER] Body keys: ['code', 'messageType', 'fileIvs[]', 'fileHashes[]', ...]
[SERVER] fileIvs[] value: a1b2c3d4e5f6...
[SERVER] Parsed fileIvs: ['a1b2c3d4e5f6...']
[SERVER] Storing file 0: "myfile.txt"
[SERVER]   IV: "a1b2c3d4e5f6..." (length: 32)
```

**Important**: Compare the IV sent by sender with what the server receives. They should match exactly!

## Browser Console (Receiver Side)  
1. Open developer tools on the receiver page
2. Wait for files to be displayed
3. Look for logs like:
```
[RECEIVER] Message type: files
[RECEIVER] Files: 1
[RECEIVER]   [0] filename="1702950000000_abc123_myfile.txt", iv="a1b2c3d4e5f6..."
```

4. When you click download, look for:
```
IV available: yes (32 chars)
Encryption key available: yes
```

## Tracing the IV Flow

The IV should follow this path:
1. **Sender generates**: Random 16 bytes → converted to hex string (32 chars)
2. **Sender sends**: Added to FormData as `fileIvs[]`
3. **Server receives**: Parsed from FormData and stored with file metadata
4. **Receiver fetches**: Retrieved from message data and passed to downloadFile()
5. **Download works**: IV used to decrypt the file

## If IV is missing somewhere:

1. **Missing on sender side**: Check [sender.html](sender.html#L608) - encryption key issue?
2. **Lost in transit**: Check server logs - formData parsing issue?
3. **Not stored on server**: Check [server.js](src/server.js#L242-L248) - file metadata issue?
4. **Not displayed on receiver**: Check [index.html](index.html#L398-L407) - message display issue?
5. **Not passed to download**: Check function call parameters - HTML generation issue?

## Commands to Run Tests

```bash
# Clear uploads directory if files are corrupted
rm -rf public/uploads/*

# Restart server
npm start
```

Then send a test file and share:
1. All [SENDER] logs from browser console
2. All [SERVER] logs from terminal  
3. All [RECEIVER] logs from browser console
4. The exact error message when trying to download
