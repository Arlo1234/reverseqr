# 📖 ReverseQR - Documentation Index

Welcome to ReverseQR! Here's your guide to all available documentation.

## 🚀 Quick Start (Start Here!)

**⏱️ 5 minutes to running:**

```bash
cd /home/armand/Documents/reverseqr
npm install
npm start
```

Then open:
- Receiver: http://localhost:3000
- Sender: http://localhost:3000/sender

👉 **Next:** Read [GETTING_STARTED.md](GETTING_STARTED.md)

## 📚 Documentation Files

### For Everyone

#### [README.md](README.md)
**What it is:** Project overview and features  
**Read time:** 10 minutes  
**What you'll learn:**
- What ReverseQR does
- Key features and security capabilities
- Architecture overview
- Quick start instructions

#### [GETTING_STARTED.md](GETTING_STARTED.md)
**What it is:** Step-by-step guide to get running  
**Read time:** 15 minutes  
**What you'll learn:**
- How to install locally
- Different deployment options (PM2, Nginx, Docker)
- How to customize the domain
- Basic troubleshooting

### For Deployers

#### [SETUP.md](SETUP.md)
**What it is:** Comprehensive deployment guide  
**Read time:** 20 minutes  
**What you'll learn:**
- Nginx reverse proxy setup
- Let's Encrypt SSL certificates
- PM2 process management
- Docker deployment
- Environment configuration
- Production checklist

#### [PROCESS_WALKTHROUGH.md](PROCESS_WALKTHROUGH.md)
**What it is:** Complete technical walkthrough  
**Read time:** 30 minutes  
**What you'll learn:**
- How the encryption works
- Connection establishment flow
- Diffie-Hellman key exchange details
- AES-256-GCM encryption explained
- Architecture diagrams
- Performance and scaling

### For Troubleshooting

#### [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
**What it is:** Common issues and solutions  
**Read time:** Variable (use as reference)  
**What you'll find:**
- 10 common issues with solutions
- Network debugging
- SSL certificate issues
- Performance problems
- Memory leak detection
- Integration testing guide
- Load testing instructions

## 🛠️ Configuration Files

### Application Config
- **[package.json](package.json)** - Dependencies and scripts
- [**.env.example**](.env.example) - Environment variables template
- [**.gitignore**](.gitignore) - Git ignore rules

### Deployment Config
- **[nginx.conf](nginx.conf)** - Nginx reverse proxy configuration
- **[Dockerfile](Dockerfile)** - Docker container definition
- **[docker-compose.yml](docker-compose.yml)** - Docker Compose setup
- **[reverseqr.service](reverseqr.service)** - Systemd service file
- **[deploy.sh](deploy.sh)** - Automated deployment script

## 💻 Source Code

### Backend
```
src/
├── server.js                 # Express.js main application
├── connectionManager.js       # Session and connection handling
├── diffieHellman.js          # Diffie-Hellman key exchange
├── encryptionManager.js      # AES-256-GCM encryption
└── pgpWordlist.js            # PGP wordlist encoding/decoding
```

### Frontend
```
public/
├── index.html                # Receiver page (displays QR)
├── sender.html               # Sender page (uploads files)
├── receiver.html             # Alternative receiver (enters code)
└── uploads/                  # Encrypted file storage
```

## 🗺️ Which Document Should I Read?

### I want to...

**Test locally (right now)**
→ Read [GETTING_STARTED.md](GETTING_STARTED.md) → Step 1

**Deploy to production**
→ Read [SETUP.md](SETUP.md) → Choose deployment method

**Understand how it works**
→ Read [PROCESS_WALKTHROUGH.md](PROCESS_WALKTHROUGH.md)

**Fix an error**
→ Read [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**Learn all features**
→ Read [README.md](README.md)

**Customize the domain**
→ Read [GETTING_STARTED.md](GETTING_STARTED.md) → Step 4

**Setup Nginx reverse proxy**
→ Read [SETUP.md](SETUP.md) → "Using Nginx as Reverse Proxy"

**Monitor the application**
→ Read [TROUBLESHOOTING.md](TROUBLESHOOTING.md) → "Monitoring & Logs"

**Scale for many users**
→ Read [PROCESS_WALKTHROUGH.md](PROCESS_WALKTHROUGH.md) → "Performance & Scaling"

## ⚡ Quick Commands Reference

```bash
# Start server
npm start

# Install dependencies
npm install

# Start with PM2 (production)
pm2 start src/server.js --name reverseqr

# View logs
pm2 logs reverseqr

# Deploy with Docker
docker-compose up -d

# Run automated deployment
./deploy.sh

# Check health
curl http://localhost:3000/health
```

## 🔐 Security Features

The application includes:
- **Diffie-Hellman Key Exchange** (RFC 3526)
- **AES-256-GCM Encryption**
- **SHA-256 Hash Verification**
- **HTTPS/TLS Support**
- **Automatic Session Cleanup**
- **Secure File Handling**

Learn more: [PROCESS_WALKTHROUGH.md](PROCESS_WALKTHROUGH.md) → "Encryption Details"

## 📊 Architecture Overview

```
Sender (Browser)                    Receiver (Browser)
        ↓                                   ↓
        └─────────── HTTPS/TLS ───────────┘
                        ↓
            Express.js Server (Node.js)
                        ↓
         ├─ Diffie-Hellman Manager
         ├─ Session Manager
         ├─ Encryption Manager
         └─ File Storage Manager
                        ↓
            /public/uploads (Encrypted files)
```

For detailed diagrams: [PROCESS_WALKTHROUGH.md](PROCESS_WALKTHROUGH.md)

## 🎓 Learning Path

### Beginner (30 minutes)
1. Read [README.md](README.md) (10 min)
2. Follow [GETTING_STARTED.md](GETTING_STARTED.md) → Step 1 (5 min)
3. Test locally in browser (10 min)
4. Deploy to production using Option A (5 min)

### Intermediate (1 hour)
1. All of Beginner
2. Read [SETUP.md](SETUP.md) (20 min)
3. Deploy with Nginx/PM2 (30 min)
4. Configure SSL certificate (10 min)

### Advanced (2 hours)
1. All of Intermediate
2. Read [PROCESS_WALKTHROUGH.md](PROCESS_WALKTHROUGH.md) (30 min)
3. Review source code (30 min)
4. Setup monitoring and scaling (30 min)

## 📞 Support Resources

### Common Questions

**Q: How do I change the domain?**  
A: Read [GETTING_STARTED.md](GETTING_STARTED.md) → Step 4

**Q: How do I get HTTPS/SSL?**  
A: Read [SETUP.md](SETUP.md) → "Set up SSL with Let's Encrypt"

**Q: What if I get an error?**  
A: Search [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**Q: How many users can it handle?**  
A: Read [PROCESS_WALKTHROUGH.md](PROCESS_WALKTHROUGH.md) → "Performance & Scaling"

**Q: Is my data really encrypted?**  
A: Read [PROCESS_WALKTHROUGH.md](PROCESS_WALKTHROUGH.md) → "Encryption Details"

**Q: Can I run this with Docker?**  
A: Yes! Read [SETUP.md](SETUP.md) → "Docker Deployment"

## 📋 Deployment Checklist

Before going live:
- [ ] Read [GETTING_STARTED.md](GETTING_STARTED.md)
- [ ] Test locally
- [ ] Choose deployment method (SETUP.md)
- [ ] Configure environment variables
- [ ] Setup SSL certificate
- [ ] Configure reverse proxy (if using Nginx)
- [ ] Test again in production
- [ ] Setup monitoring
- [ ] Configure backups
- [ ] Document your setup

## 🆘 Emergency Reference

**Server won't start:**
```bash
# Check if port is in use
lsof -i :3000

# Check logs
npm start  # Look at console output

# See TROUBLESHOOTING.md → Issue 1
```

**Getting "Connection not found":**
- Likely session expired (15 min timeout)
- Create new session and connect faster
- See TROUBLESHOOTING.md → Issue 6

**Nginx not proxying:**
```bash
# Test Nginx
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check logs
sudo tail -f /var/log/nginx/error.log

# See TROUBLESHOOTING.md → Issue 7
```

## 🎯 Next Steps

1. **Start here:** [GETTING_STARTED.md](GETTING_STARTED.md)
2. **Then deploy:** [SETUP.md](SETUP.md)
3. **Need help?** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
4. **Want to learn?** [PROCESS_WALKTHROUGH.md](PROCESS_WALKTHROUGH.md)

---

**You have everything you need to get started!** Pick a documentation file above and begin.

Last updated: December 22, 2024  
Project: ReverseQR v1.0  
Location: `/home/armand/Documents/reverseqr/`
