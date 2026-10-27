#!/bin/bash
# ==============================================================================
# Bright Backend — AWS EC2 (Ubuntu 22.04 / 24.04 LTS) Automated Setup Script
# Run with: sudo bash setup-ec2.sh
# ==============================================================================

set -e

echo "🚀 [1/6] Updating system packages..."
sudo apt update -y
sudo apt upgrade -y
sudo apt install -y curl git ufw build-essential

echo "📦 [2/6] Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

echo "⚙️ [3/6] Installing PM2 Process Manager..."
sudo npm install -g pm2

echo "🌐 [4/6] Installing & Configuring Nginx Reverse Proxy..."
sudo apt install -y nginx

# Create Nginx site config for Bright Backend
cat << 'EOF' | sudo tee /etc/nginx/sites-available/bright-backend
server {
    listen 80;
    server_name _;

    # Allow up to 50MB image/catalog uploads
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site and test configuration
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/bright-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "🛡️ [5/6] Configuring UFW Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 5000/tcp
sudo ufw --force enable

echo "📂 [6/6] Setting permissions for uploads..."
mkdir -p uploads
chmod -R 755 uploads

echo "=============================================================================="
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Create/edit your .env file:  nano .env"
echo "2. Install backend dependencies: npm install"
echo "3. Start with PM2:              pm2 start ecosystem.config.js"
echo "4. Save PM2 startup list:       pm2 save && sudo pm2 startup"
echo "=============================================================================="
