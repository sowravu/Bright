# 🚀 Bright Production Deployment Guide

This guide walks you through deploying **Bright**:
- **Frontend**: [Vercel](https://vercel.com) (Next.js 16 App Router — fast Edge CDN, automatic SSR)
- **Backend**: [AWS EC2 Free Tier](https://aws.amazon.com) (Node.js 20 + Express + PM2 + Nginx)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) (Managed Cloud Database)

---

## 📐 Architecture

```
┌─────────────────────────────────┐
│     Client (Web Browser)        │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│     Vercel (Frontend)           │
│     Next.js 16 App Router       │
│     Domain: your-app.vercel.app │
└───────────────┬─────────────────┘
                │ Rewrites /api/* & /uploads/*
                ▼
┌─────────────────────────────────┐
│     AWS EC2 (Backend)           │
│     Ubuntu 24.04 + Node 20      │
│     PM2 + Nginx Reverse Proxy   │
│     Persistent /uploads disk    │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│     MongoDB Atlas (Database)    │
│     Cluster: cluster0.txuto     │
└─────────────────────────────────┘
```

---

## Step 1: Whitelist AWS in MongoDB Atlas

Your backend `.env` is already configured with MongoDB Atlas:
`mongodb+srv://sowravu:...@cluster0.txuto.mongodb.net/bright`

Before EC2 can connect to your database:
1. Log into [cloud.mongodb.com](https://cloud.mongodb.com) with `sowravu@gmail.com`.
2. In the left sidebar, click **Network Access** (under *Security*).
3. Click **Add IP Address**.
4. Select **Allow Access From Anywhere** (`0.0.0.0/0`) or enter your EC2 Elastic IP.
5. Click **Confirm**.

---

## Step 2: Launch AWS EC2 Instance (Free Tier)

1. Log into the [AWS Management Console](https://console.aws.amazon.com) with `sowravu@gmail.com`.
2. In the top search bar, type **EC2** and select **EC2**.
3. Ensure your region is set to one near your users (e.g., `ap-south-1` Mumbai or `us-east-1` N. Virginia).
4. Click **Launch Instance** (orange button).
5. Configure the instance:
   - **Name**: `bright-backend`
   - **Application and OS Images (AMI)**: Select **Ubuntu** (Ubuntu Server 24.04 LTS, 64-bit x86, Free Tier eligible).
   - **Instance Type**: Select `t2.micro` (or `t3.micro` if in regions where t3 is Free Tier).
   - **Key pair (login)**:
     - Click **Create new key pair**.
     - Name: `bright-ec2-key`.
     - Key pair type: `RSA`, format: `.pem`.
     - Download and save `bright-ec2-key.pem` safely on your computer.
   - **Network settings**:
     - Check ✅ **Allow SSH traffic from** (`Anywhere 0.0.0.0/0` or `My IP`)
     - Check ✅ **Allow HTTP traffic from the internet** (port 80)
     - Check ✅ **Allow HTTPS traffic from the internet** (port 443)
     - Click **Edit** (top right of Network settings), click **Add security group rule**:
       - Type: `Custom TCP`
       - Port range: `5000`
       - Source: `0.0.0.0/0`
       - Description: `Express API`
   - **Configure storage**: `30 GiB` gp3 (Free Tier allows up to 30 GB).
6. Click **Launch Instance**.
7. Note down your instance's **Public IPv4 address** (e.g., `13.233.xx.xx`).

---

## Step 3: Setup & Run Backend on EC2

### Option A: 1-Click AWS EC2 Instance Connect (No SSH tool needed)
1. In the EC2 Console, select your `bright-backend` instance.
2. Click the **Connect** button at the top.
3. Choose **EC2 Instance Connect** and click **Connect**. A terminal window opens in your browser!

### Option B: Connect via SSH terminal
```bash
chmod 400 bright-ec2-key.pem
ssh -i bright-ec2-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

---

### Run Setup on EC2

Inside your EC2 terminal, run:

```bash
# 1. Clone your repository
git clone https://github.com/sowravu/Bright.git
cd Bright/backend

# 2. Run the automated setup script (installs Node 20, PM2, Nginx & Firewall)
chmod +x setup-ec2.sh
sudo bash setup-ec2.sh

# 3. Create your production .env file
cp .env.example .env
nano .env
```

In `nano .env`, paste your credentials (from your local `backend/.env` file):
```env
PORT=5000
NODE_ENV=production
CLIENT_URL=*

MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_production_jwt_secret
JWT_EXPIRES_IN=7d

EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password
EMAIL_FROM_NAME=Bright

GOOGLE_CLIENT_ID=your_google_client_id
GEMINI_API_KEY=your_gemini_api_key

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```
*(Press `Ctrl+O` then `Enter` to save, and `Ctrl+X` to exit nano)*.

```bash
# 4. Install dependencies and start server with PM2
npm install --omit=dev
pm2 start ecosystem.config.js
pm2 save
sudo pm2 startup
```

### Verify Backend Health
Test in your terminal:
```bash
curl http://localhost:5000/api/health
```
You should see: `{"status":"ok","service":"bright-backend"}`.

Also test from your browser on your computer:
```
http://<YOUR_EC2_PUBLIC_IP>/api/health
```
*(Nginx proxies port 80 directly to port 5000)*.

---

## Step 4: Deploy Frontend on Vercel

1. Push latest changes to GitHub (if not already pushed):
   ```bash
   git add .
   git commit -m "Add AWS EC2 setup and PM2 ecosystem config"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
3. Click **Add New...** -> **Project**.
4. Find the **Bright** (or `sowravu/Bright`) repository and click **Import**.
5. In the configuration screen:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Environment Variables**:
     Add this key-value pair:
     - `BACKEND_URL`: `http://<YOUR_EC2_PUBLIC_IP>` (e.g., `http://13.233.45.67`)
     - `NEXT_PUBLIC_BACKEND_URL`: `http://<YOUR_EC2_PUBLIC_IP>`
6. Click **Deploy**.
7. In ~60 seconds, your site is live at a URL like `https://bright-sowravu.vercel.app`!

---

## Step 5: Final Security & CORS Polish

Once you have your Vercel URL (e.g., `https://bright-sowravu.vercel.app`):
1. Connect back to your EC2 instance:
   ```bash
   cd Bright/backend
   nano .env
   ```
2. Update `CLIENT_URL`:
   ```env
   CLIENT_URL=https://bright-sowravu.vercel.app
   ```
3. Restart PM2:
   ```bash
   pm2 restart bright-backend
   ```

---

## 🛠️ Useful EC2 Maintenance Commands

- **View Live Backend Logs**:
  ```bash
  pm2 logs bright-backend
  ```
- **Check Backend Status**:
  ```bash
  pm2 status
  ```
- **Restart Backend**:
  ```bash
  pm2 restart bright-backend
  ```
- **Pull Code Updates from GitHub**:
  ```bash
  cd ~/Bright
  git pull origin main
  cd backend
  npm install
  pm2 reload bright-backend
  ```
