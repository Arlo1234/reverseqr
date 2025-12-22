#!/bin/bash

# ReverseQR Deployment Script
# This script automates the setup and deployment of ReverseQR

set -e

echo "🚀 ReverseQR Deployment Script"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root for production setup
if [[ $EUID -eq 0 ]]; then
    PRODUCTION=true
    echo -e "${GREEN}Running as root - Production setup${NC}"
else
    PRODUCTION=false
    echo -e "${YELLOW}Running as user - Development setup${NC}"
fi

# Configuration
PROJECT_DIR="/home/armand/Documents/reverseqr"
SERVICE_NAME="reverseqr"
DOMAIN=""
PORT=3000

# Functions
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Step 1: Check prerequisites
echo ""
echo "Step 1: Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi
print_status "Node.js $(node --version) is installed"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_status "npm $(npm --version) is installed"

# Step 2: Navigate to project directory
echo ""
echo "Step 2: Setting up project..."
cd "$PROJECT_DIR" || exit 1
print_status "Navigated to $PROJECT_DIR"

# Step 3: Install dependencies
echo ""
echo "Step 3: Installing dependencies..."
if [ -f "package.json" ]; then
    npm install
    print_status "Dependencies installed"
else
    print_error "package.json not found"
    exit 1
fi

# Step 4: Production setup with PM2
if [ "$PRODUCTION" = true ]; then
    echo ""
    echo "Step 4: Setting up PM2 process manager..."
    
    # Install PM2 globally if not already installed
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
        print_status "PM2 installed globally"
    else
        print_status "PM2 is already installed"
    fi
    
    # Start the application with PM2
    pm2 start src/server.js --name "$SERVICE_NAME" --instances 2 --exec-mode cluster
    pm2 save
    print_status "Application started with PM2"
    
    # Setup PM2 startup script
    if ! pm2 startup > /dev/null 2>&1; then
        sudo pm2 startup
    fi
    print_status "PM2 startup configured"
fi

# Step 5: Nginx setup (production only)
if [ "$PRODUCTION" = true ]; then
    echo ""
    echo "Step 5: Setting up Nginx reverse proxy..."
    read -p "Enter your domain name (e.g., example.com): " DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        print_warning "No domain provided, skipping Nginx setup"
    else
        # Check if Nginx is installed
        if ! command -v nginx &> /dev/null; then
            print_warning "Nginx not installed. Install with: sudo apt install nginx"
        else
            print_status "Nginx is installed"
            
            # Create Nginx config
            NGINX_CONF="/etc/nginx/sites-available/$SERVICE_NAME"
            if [ ! -f "$NGINX_CONF" ]; then
                sudo cp nginx.conf "$NGINX_CONF"
                # Replace yourdomain.com with actual domain
                sudo sed -i "s/yourdomain.com/$DOMAIN/g" "$NGINX_CONF"
                
                # Enable the site
                sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/$SERVICE_NAME"
                
                # Test Nginx configuration
                if sudo nginx -t; then
                    sudo systemctl restart nginx
                    print_status "Nginx configured and restarted"
                else
                    print_error "Nginx configuration test failed"
                fi
            else
                print_warning "Nginx config already exists at $NGINX_CONF"
            fi
        fi
        
        # Setup SSL with Let's Encrypt
        echo ""
        read -p "Set up SSL with Let's Encrypt? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if ! command -v certbot &> /dev/null; then
                sudo apt-get install certbot python3-certbot-nginx -y
                print_status "Certbot installed"
            fi
            
            # Request certificate
            sudo certbot certonly --nginx -d "$DOMAIN" -d "www.$DOMAIN"
            print_status "SSL certificate obtained"
            
            # Setup auto-renewal
            sudo systemctl enable certbot.timer
            sudo systemctl start certbot.timer
            print_status "SSL auto-renewal configured"
        fi
    fi
fi

# Step 6: Environment configuration
echo ""
echo "Step 6: Environment configuration..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status ".env created from .env.example"
        
        if [ ! -z "$DOMAIN" ]; then
            sed -i "s|BASE_URL=.*|BASE_URL=https://$DOMAIN|" .env
            print_status "BASE_URL set to https://$DOMAIN"
        fi
    fi
else
    print_warning ".env file already exists, skipping"
fi

# Step 7: Create necessary directories
echo ""
echo "Step 7: Creating necessary directories..."
mkdir -p public/uploads
mkdir -p logs
chmod 755 public/uploads
print_status "Directories created and permissions set"

# Step 8: Health check
echo ""
echo "Step 8: Checking application health..."
sleep 2
if curl -s http://localhost:$PORT/health | grep -q "ok"; then
    print_status "Application is running and healthy"
else
    print_warning "Could not verify application health (it may still be starting)"
fi

# Step 9: Print summary
echo ""
echo "=============================="
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo "=============================="
echo ""
echo "Application Details:"
echo "  Service Name: $SERVICE_NAME"
echo "  Port: $PORT"
if [ ! -z "$DOMAIN" ]; then
    echo "  Domain: https://$DOMAIN"
fi
echo "  Project Dir: $PROJECT_DIR"
echo ""
echo "Access the application:"
if [ "$PRODUCTION" = true ]; then
    echo "  Receiver: https://$DOMAIN/"
    echo "  Sender: https://$DOMAIN/sender"
else
    echo "  Receiver: http://localhost:$PORT/"
    echo "  Sender: http://localhost:$PORT/sender"
fi
echo ""
echo "Useful Commands:"
if [ "$PRODUCTION" = true ]; then
    echo "  View logs: pm2 logs $SERVICE_NAME"
    echo "  Monitor: pm2 monit"
    echo "  Restart: pm2 restart $SERVICE_NAME"
    echo "  Stop: pm2 stop $SERVICE_NAME"
else
    echo "  Start: npm start"
    echo "  Dev: npm run dev"
fi
echo ""
echo "Documentation:"
echo "  Setup Guide: README.md"
echo "  Deployment: SETUP.md"
echo ""
