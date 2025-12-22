# ReverseQR - Testing & Troubleshooting Guide

## Quick Testing

### 1. Installation Check
```bash
cd /home/armand/Documents/reverseqr
npm install
npm start
```

Should see: `🚀 ReverseQR server running at http://localhost:3000`

### 2. Quick Browser Test
- **Receiver**: Open http://localhost:3000 in browser
- **Sender**: Open http://localhost:3000/sender in another browser/tab

### 3. Test with curl

**Health Check:**
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

**Create Session:**
```bash
curl -X POST http://localhost:3000/api/session/create
# Should return JSON with code, pgpCode, qrCode, baseUrl
```

**Join Session:**
```bash
curl -X POST http://localhost:3000/api/session/join \
  -H "Content-Type: application/json" \
  -d '{"code":"ABC123"}'
# Should return session details
```

## Common Issues & Solutions

### Issue 1: Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000
# or
netstat -tulpn | grep 3000

# Kill the process
kill -9 <PID>
# or use different port
PORT=3001 npm start
```

### Issue 2: Module Not Found

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue 3: QR Code Not Displaying

**Error:** QR code canvas is empty

**Possible causes:**
- QRCode library not loading from CDN
- JavaScript execution blocked
- Browser incompatibility

**Solution:**
```javascript
// Check browser console for errors
// F12 → Console tab

// Verify QRCode library is loaded:
console.log(QRCode);

// Test with different browser
```

### Issue 4: CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
- Only occurs with Nginx reverse proxy if misconfigured
- Ensure `proxy_set_header` settings are correct
- Check Origin header: `curl -v -H "Origin: https://yourdomain.com" http://localhost:3000/`

### Issue 5: File Upload Fails

**Error:** `413 Payload Too Large`

**Solution:**
```bash
# Check Nginx client_max_body_size
nginx -T | grep client_max_body_size

# Should be 500M:
client_max_body_size 500M;

# If using Node.js directly:
# Check express.json limit in src/server.js
```

### Issue 6: Session Timeout

**Error:** `Connection not found` or `404`

**Solutions:**
- Session expires after 15 minutes
- Connection code must be used within timeout window
- Try creating new session

### Issue 7: Nginx Not Forwarding Requests

**Error:** `502 Bad Gateway`

**Solutions:**
```bash
# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Verify Node.js is running
pm2 status

# Check upstream connectivity
curl http://127.0.0.1:3000/health

# Verify Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Issue 8: PM2 Process Won't Start

**Error:** `npm ERR!` or process keeps crashing

**Solutions:**
```bash
# Check PM2 logs
pm2 logs reverseqr

# View error output
pm2 monit

# Increase restart interval
pm2 start src/server.js --max-restarts 5 --min-uptime 10s

# Check Node.js version compatibility
node --version  # Should be 16+
```

### Issue 9: SSL Certificate Issues

**Error:** `ERR_CERT_AUTHORITY_INVALID` or `SSL_ERROR_SELF_SIGNED_CERT`

**Solutions:**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal

# Check expiration
openssl x509 -noout -dates -in /etc/letsencrypt/live/yourdomain.com/cert.pem

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Issue 10: Memory Leak or Slow Performance

**Symptoms:** Server gets slower over time, uses more memory

**Solutions:**
```bash
# Monitor memory usage
pm2 monit

# Check for old sessions
# Automatic cleanup runs every 5 minutes
# Check connectionManager cleanup function

# Increase Node.js memory
pm2 start src/server.js --max-memory-restart 1G

# Use PM2 cluster mode
pm2 start src/server.js -i 4  # 4 instances
```

## Performance Debugging

### 1. Enable Verbose Logging

```bash
# Add to src/server.js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});
```

### 2. Monitor Network Traffic

```bash
# Using curl with verbose output
curl -v -X POST http://localhost:3000/api/session/create

# Using Wireshark (GUI)
sudo wireshark

# Using tcpdump
sudo tcpdump -i lo -A 'tcp port 3000'
```

### 3. Check Database Queries (if using DB)

```bash
# For future MongoDB/PostgreSQL integration
# Monitor slow queries
```

## Integration Testing

### Test Scenario 1: Text Message

**Receiver:**
1. Open http://localhost:3000
2. Note the connection code

**Sender:**
1. Open http://localhost:3000/sender
2. Enter the code
3. Type a message
4. Click "Send Securely"

**Verify:** Message appears on receiver

### Test Scenario 2: File Upload

**Receiver:**
1. Open http://localhost:3000
2. Note code

**Sender:**
1. Open http://localhost:3000/sender
2. Enter code
3. Upload a file (drag & drop works)
4. Click "Send Securely"

**Verify:** File appears in receiver list, can download

### Test Scenario 3: Both Text and Files

**Sender:**
1. Type message
2. Upload files
3. Send

**Verify:** Both appear on receiver

### Test Scenario 4: Hash Verification

**Check in browser console:**
```javascript
// After receiving message
console.log('Hash verified:', hashVerification);
```

## Load Testing

### Using Apache Bench

```bash
# Single request
ab -n 1 -c 1 http://localhost:3000/

# Multiple concurrent requests
ab -n 100 -c 10 http://localhost:3000/

# Health check endpoint
ab -n 1000 -c 50 http://localhost:3000/health
```

### Using wrk

```bash
# Install wrk
git clone https://github.com/wg/wrk.git
cd wrk && make

# Run load test
./wrk -t4 -c100 -d30s http://localhost:3000/health
```

## Browser Console Testing

Open browser DevTools (F12) and run:

```javascript
// Test API connectivity
fetch('/api/session/create', { method: 'POST' })
  .then(r => r.json())
  .then(d => console.log('Session created:', d))
  .catch(e => console.error('Error:', e));

// Test WebSocket (if implemented)
// new WebSocket('ws://localhost:3000/ws');

// Check local storage
console.log(localStorage);

// Check cookies
console.log(document.cookie);
```

## Logging

### Check PM2 Logs
```bash
pm2 logs reverseqr
pm2 logs reverseqr --err
pm2 logs reverseqr --lines 100
```

### Check Nginx Logs
```bash
# Access log
sudo tail -f /var/log/nginx/reverseqr_access.log

# Error log
sudo tail -f /var/log/nginx/reverseqr_error.log

# Combined
sudo tail -f /var/log/nginx/reverseqr_*.log
```

### Check System Logs
```bash
# View ReverseQR systemd service logs
sudo journalctl -u reverseqr -f

# See last 50 lines
sudo journalctl -u reverseqr -n 50
```

## Security Testing

### 1. Test SSL/TLS Configuration

```bash
# Check SSL grade
curl -I https://yourdomain.com/

# Get certificate info
openssl s_client -connect yourdomain.com:443

# Check cipher strength
testssl.sh https://yourdomain.com/
```

### 2. Test Security Headers

```bash
curl -I https://yourdomain.com/ | grep -i "strict-transport-security\|x-frame-options\|x-content-type-options"
```

### 3. Test CORS Headers

```bash
curl -H "Origin: https://other-domain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS https://yourdomain.com/ -v
```

## Cleanup & Reset

### Clear All Sessions and Files

```bash
# Stop server
pm2 stop reverseqr

# Clear uploads
rm -rf public/uploads/*

# Restart
pm2 start reverseqr
```

### Reset to Fresh State

```bash
# Stop server
npm stop

# Clear everything
rm -rf node_modules package-lock.json public/uploads/* logs/*

# Reinstall and start
npm install
npm start
```

## Advanced Debugging

### Enable Node.js Inspector

```bash
# Run with inspector
node --inspect src/server.js

# In Chrome, go to: chrome://inspect
# Click "inspect" next to the Node process
```

### Memory Profiling

```bash
# Create heap snapshot
node --expose-gc src/server.js

# In Node REPL:
# require('v8').writeHeapSnapshot();
```

## Helpful Tools

- **pm2**: Process management
- **nginx**: Reverse proxy
- **certbot**: SSL certificates
- **curl**: Testing API
- **ab (Apache Bench)**: Load testing
- **wrk**: High-performance load testing
- **testssl.sh**: SSL testing
- **Postman**: API testing GUI

## Getting Help

If issues persist:

1. **Check logs**: `pm2 logs reverseqr`
2. **Review errors**: Check browser console (F12)
3. **Test connectivity**: `curl http://localhost:3000/health`
4. **Verify configuration**: Check `.env` file
5. **Restart service**: `pm2 restart reverseqr`
6. **Check documentation**: See SETUP.md and README.md
