# ReverseQR - Setup & Deployment Guide

## Overview

ReverseQR is a secure file and text sharing application that uses:
- **QR Codes** for easy code transmission
- **PGP Wordlist** for human-readable connection codes
- **Diffie-Hellman** key exchange for secure communication
- **AES-256-GCM** encryption for data protection
- **SHA-256** hashing for integrity verification

## Installation

### Prerequisites
- Node.js 16+ (download from https://nodejs.org/)
- npm (comes with Node.js)
- A domain name (for production use)

### Local Setup

1. **Navigate to project directory:**
```bash
cd /home/armand/Documents/reverseqr
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set environment variables (optional):**
```bash
export BASE_URL=http://localhost:3000
export PORT=3000
export NODE_ENV=development
```

4. **Start the server:**
```bash
npm start
```

The server will start at `http://localhost:3000`

- **Receiver Mode**: http://localhost:3000/
- **Sender Mode**: http://localhost:3000/sender
- **Alternative Receiver**: http://localhost:3000/receiver

## Usage Modes

### Mode 1: Standard QR Code Exchange
1. Receiver opens http://localhost:3000/
2. A QR code is displayed along with a human-readable code (PGP words)
3. Sender scans the QR code or visits the sender page and enters the code
4. Sender uploads files/text and sends
5. Receiver automatically receives and can decrypt

### Mode 2: Sender Displays Code
1. Sender opens http://localhost:3000/sender
2. Receiver opens http://localhost:3000/receiver
3. Receiver clicks "Generate Code" and gets a PGP-encoded code
4. Receiver shares the code with sender (verbally, email, etc.)
5. Sender enters the code and establishes connection
6. Sender uploads and sends files/text
7. Receiver receives encrypted data

## Production Deployment with Reverse Proxy

### Using Nginx as Reverse Proxy

**1. Install Nginx:**

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nginx
```

**2. Create Nginx Configuration:**

Create `/etc/nginx/sites-available/reverseqr`:
```nginx
upstream reverseqr {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Certificate (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Logging
    access_log /var/log/nginx/reverseqr_access.log;
    error_log /var/log/nginx/reverseqr_error.log;
    
    # Upload size limit
    client_max_body_size 500M;
    
    # Proxy configuration
    location / {
        proxy_pass http://reverseqr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        
        # WebSocket support
        proxy_read_timeout 86400;
    }
    
    # Static files caching
    location ~* ^/public/ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

**3. Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/reverseqr /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

**4. Set up SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
```

### Using PM2 to Manage Node.js Process

**1. Install PM2 globally:**
```bash
sudo npm install -g pm2
```

**2. Start the application:**
```bash
cd /home/armand/Documents/reverseqr
pm2 start src/server.js --name reverseqr
pm2 save
sudo pm2 startup
```

**3. Monitor the application:**
```bash
pm2 monit
pm2 logs reverseqr
```

### Setting Environment Variables

Create `.env` file in project root:
```
PORT=3000
NODE_ENV=production
BASE_URL=https://yourdomain.com
UPLOAD_DIR=/var/lib/reverseqr/uploads
```

Update PM2 startup to load environment:
```bash
pm2 start src/server.js --name reverseqr --env production
```

## Docker Deployment (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

ENV NODE_ENV=production
CMD ["node", "src/server.js"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  reverseqr:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
      - BASE_URL=http://localhost:3000
    volumes:
      - ./public/uploads:/app/public/uploads
    restart: unless-stopped
```

Run with Docker:
```bash
docker-compose up -d
```

## Configuration

### Changing the Base URL

To change the URL the QR code points to, update the `BASE_URL` environment variable:

```bash
export BASE_URL=https://yourdomain.com
npm start
```

### Upload Directory Configuration

By default, files are saved to `./public/uploads/`. To change this:

```bash
export UPLOAD_DIR=/custom/path
npm start
```

## Security Considerations

1. **HTTPS Required**: Always use HTTPS in production
2. **Session Timeout**: Sessions expire after 15 minutes
3. **File Size Limits**: Maximum 500MB per file
4. **Upload Directory**: Should be outside web root in production
5. **Regular Cleanup**: Expired sessions and old files are automatically cleaned up
6. **Firewall**: Configure firewall to allow only necessary ports

## Monitoring & Logs

**View recent logs:**
```bash
pm2 logs reverseqr
```

**Check system resources:**
```bash
pm2 monit
```

**Clear old uploaded files (optional):**
```bash
# Add to crontab for daily cleanup of files older than 7 days
find /var/lib/reverseqr/uploads -type f -mtime +7 -delete
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process using port 3000
sudo lsof -ti:3000 | xargs kill -9
```

### Nginx Not Proxying Correctly
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues
```bash
# Renew certificate manually
sudo certbot renew

# Auto-renewal should work, but you can test with:
sudo certbot renew --dry-run
```

### Session Not Found Error
- Sessions expire after 15 minutes
- Connection codes must be entered within the timeout window
- Check server logs for more details

## Performance Tuning

### Nginx Configuration
- Increase `worker_connections` if handling many concurrent users
- Enable gzip compression
- Configure caching for static files

### Node.js Configuration
- Use clustering with PM2
- Monitor memory usage
- Set appropriate garbage collection thresholds

### Database Optimization
Currently using in-memory storage. For high traffic:
- Consider Redis for session storage
- Implement persistent database for file metadata

## Backup & Maintenance

**Back up uploaded files:**
```bash
sudo tar -czf reverseqr_backup.tar.gz /var/lib/reverseqr/uploads/
```

**Update the application:**
```bash
cd /home/armand/Documents/reverseqr
git pull
npm install
pm2 restart reverseqr
```

## Advanced Configuration

### Custom Connection Code Length

Edit `src/connectionManager.js`:
```javascript
generateConnectionCode() {
    let code;
    do {
      // Change the slice(0, 6) to change code length
      code = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 8); // 8 chars
    } while (this.connections.has(code));
    return code;
  }
```

### Session Timeout

Edit `src/connectionManager.js`:
```javascript
this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
```

## Support

For issues or questions, check the logs:
```bash
pm2 logs reverseqr --err
```

---

## Production Checklist

- [ ] Domain name configured
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Nginx reverse proxy configured
- [ ] PM2 process manager set up
- [ ] Base URL environment variable set
- [ ] Upload directory properly configured
- [ ] Firewall rules configured
- [ ] Monitoring and alerting configured
- [ ] Regular backups scheduled
- [ ] Log rotation configured
- [ ] Rate limiting configured (optional)
- [ ] DDoS protection enabled (Cloudflare, etc.)
