# 🚀 ReverseQR - Getting Started Guide

## What You Have

A complete, production-ready secure file and text sharing application built with Node.js and modern encryption standards.

### Key Components

```
/home/armand/Documents/reverseqr/
├── src/
│   ├── server.js               # Main Express application
│   ├── connectionManager.js      # Session management
│   ├── diffieHellman.js          # DH key exchange
│   ├── encryptionManager.js      # AES-256-GCM encryption
│   └── pgpWordlist.js            # Human-readable code encoding
├── public/
│   ├── index.html               # Standard receiver page
│   ├── sender.html              # Sender page
│   ├── receiver.html            # Alternative receiver
│   └── uploads/                 # Encrypted file storage
├── package.json                 # Dependencies
├── README.md                    # Project overview
├── SETUP.md                     # Detailed setup guide
├── TROUBLESHOOTING.md           # Common issues & fixes
├── nginx.conf                   # Nginx reverse proxy config
├── Dockerfile                   # Docker configuration
├── docker-compose.yml           # Docker Compose setup
├── reverseqr.service            # Systemd service
└── deploy.sh                    # Automated deployment
```

## Step 1: Install & Run Locally

### 1A. Quick Start (30 seconds)

```bash
cd /home/armand/Documents/reverseqr
npm install
npm start
```

You'll see:
```
🚀 ReverseQR server running at http://localhost:3000
📊 Receiver: http://localhost:3000/
📤 Sender: http://localhost:3000/sender
🔄 Alternative Receiver: http://localhost:3000/receiver
```

### 1B. Test in Browser

Open **two browser windows/tabs**:

**Window 1 (Receiver):**
- Open http://localhost:3000
- Copy the 6-character code (e.g., "ABC-DEF-GHI")

**Window 2 (Sender):**
- Open http://localhost:3000/sender
- Paste the code
- Type a message or upload files
- Click "Send Securely"

**Result:** Message appears in Window 1!

## Step 2: Understanding the Flow

### Mode 1: Standard QR (Receiver Displays Code)

```
┌─────────────┐                              ┌────────────┐
│  RECEIVER   │                              │   SENDER   │
│             │                              │            │
│ 1. Opens /  │◄──── Scans QR Code ────────│ Opens /sender
│    Gets code│                              │ with code  │
│    Displays │                              │            │
│    QR + text│──── Enters Code/DH Key ────►│ Joins      │
│             │◄─── DH Public Key ────────--|            │
│             │                              │            │
│             │◄─── Encrypted Message ────--|            │
│ Decrypts    │                              │            │
│ & verifies  │                              │            │
└─────────────┘                              └────────────┘
```

### Mode 2: Alternative (Sender Displays Code)

```
┌────────────┐                              ┌─────────────┐
│   SENDER   │                              │  RECEIVER   │
│            │                              │             │
│ Opens /    │◄────── Generates Code ──────│ Opens /     │
│ sender     │                              │ receiver    │
│            │                              │             │
│ Enters code│──── Code transmitted ──────►│ Displays    │
│ & joins    │                              │ code        │
│            │◄────── DH Key Exchange ─────│             │
│            │                              │             │
│ Sends data │──────► Encrypted Data ─────►│ Receives    │
│            │                              │ & decrypts  │
└────────────┘                              └─────────────┘
```

## Step 3: Deploying to Production

### Option A: Simple Server (Linux/Mac)

```bash
# 1. Install Node.js if not already installed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Navigate to project
cd /home/armand/Documents/reverseqr

# 3. Install dependencies
npm install

# 4. Start the server
npm start
```

Access via: `http://your-ip:3000`

### Option B: With PM2 Process Manager (Recommended)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Navigate to project
cd /home/armand/Documents/reverseqr

# Start with PM2 (2 instances for load balancing)
pm2 start src/server.js --name reverseqr --instances 2 --exec-mode cluster

# Save configuration
pm2 save

# Setup auto-startup
sudo pm2 startup
```

Verify with: `pm2 status` or `pm2 logs reverseqr`

### Option C: With Nginx Reverse Proxy (Best for Production)

**Prerequisites:**
- Nginx installed: `sudo apt install nginx`
- Domain name (e.g., reverseqr.example.com)
- SSL certificate from Let's Encrypt

**Steps:**

```bash
# 1. Setup Node.js application with PM2
sudo npm install -g pm2
cd /home/armand/Documents/reverseqr
npm install
pm2 start src/server.js --name reverseqr
pm2 save
sudo pm2 startup

# 2. Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/reverseqr

# 3. Edit the domain
sudo sed -i 's/yourdomain.com/your-actual-domain.com/g' /etc/nginx/sites-available/reverseqr

# 4. Enable the site
sudo ln -s /etc/nginx/sites-available/reverseqr /etc/nginx/sites-enabled/

# 5. Test Nginx configuration
sudo nginx -t

# 6. Restart Nginx
sudo systemctl restart nginx

# 7. Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com

# 8. Enable auto-renewal
sudo systemctl enable certbot.timer
```

Access via: `https://your-domain.com`

### Option D: Docker Deployment

```bash
# Build and run with Docker Compose
cd /home/armand/Documents/reverseqr

# Set environment
export PORT=3000
export BASE_URL=http://localhost:3000

# Start
docker-compose up -d

# View logs
docker-compose logs -f reverseqr

# Stop
docker-compose down
```

## Step 4: Customizing the URL

The URL shown in QR codes and sent to users is controlled by the `BASE_URL` environment variable.

### Change the URL:

```bash
# For localhost testing
export BASE_URL=http://localhost:3000

# For your domain
export BASE_URL=https://yourdomain.com

# For subdomain
export BASE_URL=https://qr.yourdomain.com

# Then start
npm start
```

### Persistent Configuration (in `.env` file)

```bash
# Create .env from example
cp .env.example .env

# Edit .env
nano .env
```

Change:
```
BASE_URL=https://your-actual-domain.com
```

Then start normally: `npm start`

## Step 5: Common Tasks

### View Logs

```bash
# With PM2
pm2 logs reverseqr

# With systemd
sudo journalctl -u reverseqr -f

# With docker
docker-compose logs -f reverseqr
```

### Restart Server

```bash
# PM2
pm2 restart reverseqr

# Docker
docker-compose restart reverseqr

# Manual
npm start
```

### Stop Server

```bash
# PM2
pm2 stop reverseqr

# Docker
docker-compose stop

# Manual (Ctrl+C in terminal)
```

### Monitor Performance

```bash
# PM2
pm2 monit

# Docker stats
docker stats reverseqr

# System resources
top -p $(pgrep -f "node src/server.js")
```

### Update the Application

```bash
# Stop
pm2 stop reverseqr

# Pull latest code (if using git)
git pull

# Install any new dependencies
npm install

# Restart
pm2 restart reverseqr
```

## Step 6: Security Checklist

### Before Going Public

- [ ] **HTTPS Enabled**: Use SSL/TLS certificate
- [ ] **Strong Firewall**: Only allow needed ports
- [ ] **Regular Updates**: Keep Node.js and dependencies updated
- [ ] **Monitoring**: Setup logs and alerts
- [ ] **Backups**: Regular backups of uploaded files
- [ ] **Rate Limiting**: Prevent abuse (optional, in nginx.conf)
- [ ] **CORS Configured**: Restrict origins if needed
- [ ] **Password Protection** (optional): Add authentication layer

### Quick Security Check

```bash
# Verify HTTPS works
curl -I https://yourdomain.com

# Check security headers
curl -I https://yourdomain.com | grep -i "strict-transport\|x-frame\|x-content"

# Test encryption
openssl s_client -connect yourdomain.com:443
```

## Step 7: Troubleshooting

### Issue: "Connection not found"

- **Cause**: Session expired (15 min timeout)
- **Fix**: Create new session and connect faster

### Issue: "Port already in use"

```bash
# Kill process using port 3000
sudo lsof -ti:3000 | xargs kill -9
```

### Issue: Files won't upload

- **Cause**: File too large or upload directory permission issue
- **Fix**: Check max file size (500MB default) and directory permissions

### Issue: QR code not showing

- **Cause**: JavaScript not loading or CDN issue
- **Fix**: Check browser console (F12), try different domain

**More issues?** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## Step 8: Advanced Configuration

### Change Session Timeout

Edit `src/connectionManager.js`:

```javascript
this.sessionTimeout = 30 * 60 * 1000;  // 30 minutes instead of 15
```

### Change Connection Code Format

Edit `src/connectionManager.js`:

```javascript
// Change from 6 to 8 character codes
code = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
```

### Change Upload Directory

```bash
export UPLOAD_DIR=/custom/path
npm start
```

### Custom Domain for QR Codes

```bash
export BASE_URL=https://qr.mycompany.com
npm start
```

## Step 9: Performance Optimization

### For Multiple Concurrent Users:

```bash
# Use PM2 cluster mode with multiple instances
pm2 start src/server.js --name reverseqr --instances 4 --exec-mode cluster

# Monitor load
pm2 monit
```

### Enable Caching in Nginx:

The nginx.conf already includes caching for static files (7 days).

### Enable Gzip Compression:

Nginx config already has gzip enabled for:
- JavaScript
- CSS
- JSON
- Images

## Step 10: Monitoring & Maintenance

### Daily Tasks

```bash
# Check application status
pm2 status

# Review logs
pm2 logs reverseqr --lines 50

# Verify uptime
pm2 info reverseqr
```

### Weekly Tasks

```bash
# Check disk usage
du -sh public/uploads

# Verify SSL certificate (auto-renewal usually handles this)
sudo certbot certificates

# Check system resources
free -h  # Memory
df -h    # Disk space
```

### Monthly Tasks

```bash
# Update Node.js packages
npm update

# Review security updates
npm audit

# Restart application (clean state)
pm2 restart reverseqr

# Archive old logs
find logs/ -type f -mtime +30 -compress
```

## Quick Reference

### URLs

- **Main**: `http://localhost:3000`
- **Receiver**: `http://localhost:3000/`
- **Sender**: `http://localhost:3000/sender`
- **Alternative Receiver**: `http://localhost:3000/receiver`
- **Health Check**: `http://localhost:3000/health`

### Commands

```bash
# Development
npm start                    # Start server
npm run dev                  # With hot reload (after configuring nodemon)

# Production with PM2
pm2 start src/server.js     # Start
pm2 stop reverseqr          # Stop
pm2 restart reverseqr       # Restart
pm2 logs reverseqr          # View logs

# Docker
docker-compose up -d        # Start
docker-compose down         # Stop
docker-compose logs -f      # View logs

# Deployment
./deploy.sh                 # Automated deployment script
```

### Files to Know

- **Main Code**: `src/server.js`
- **Encryption**: `src/encryptionManager.js`
- **Key Exchange**: `src/diffieHellman.js`
- **Sessions**: `src/connectionManager.js`
- **Frontend**: `public/*.html`
- **Configuration**: `.env`
- **Deployment**: `SETUP.md`
- **Help**: `TROUBLESHOOTING.md`

## Next Steps

1. **Test Locally**: Follow Step 1 above
2. **Choose Deployment**: Use Option A, B, C, or D
3. **Configure Domain**: Set BASE_URL environment variable
4. **Enable HTTPS**: Use Let's Encrypt for SSL
5. **Monitor**: Setup logging and alerts
6. **Maintain**: Regular updates and backups

## Support Resources

- **README.md**: Project overview and features
- **SETUP.md**: Detailed deployment guide
- **TROUBLESHOOTING.md**: Common issues and solutions
- **nginx.conf**: Reverse proxy configuration
- **docker-compose.yml**: Docker setup

---

**You're all set!** Start with Step 1 to test locally, then pick your deployment method in Step 3.

Questions? Check the relevant documentation file above.
