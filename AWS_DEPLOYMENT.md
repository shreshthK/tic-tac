# AWS EC2 Deployment Guide for Tic-Tac-Toe

This guide covers deploying the Tic-Tac-Toe application to AWS EC2 using Docker containers with GitHub Actions CI/CD.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites](#prerequisites)
4. [Phase 1: AWS Account & EC2 Setup](#phase-1-aws-account--ec2-setup)
5. [Phase 2: EC2 Instance Configuration](#phase-2-ec2-instance-configuration)
6. [Phase 3: Deploy Application](#phase-3-deploy-application)
7. [Phase 4: CI/CD Setup](#phase-4-cicd-setup)
8. [Phase 5: Security Hardening](#phase-5-security-hardening)
9. [Operations & Maintenance](#operations--maintenance)
10. [Troubleshooting](#troubleshooting)
11. [Appendix A: CI/CD Method Comparison](#appendix-a-cicd-method-comparison)
12. [Appendix B: SSL/HTTPS Setup](#appendix-b-sslhttps-setup)

---

## Quick Start

**Recommended setup for learning AWS:**
- **CI/CD Method:** SSM (Systems Manager) - More secure, teaches IAM concepts
- **Instance Type:** t2.micro (free tier eligible)
- **OS:** Ubuntu 22.04 LTS

**Estimated setup:** Follow Phases 1-4 to get your application running.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                         │
│                              │                                   │
│                    (push to main branch)                         │
└─────────────────────────────┬───────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Actions                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │    Build     │───▶│     Test     │───▶│   Deploy     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
└─────────────────────────────┬───────────────────────────────────┘
                              │ (via SSM/SSH)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EC2 Instance (Public IP)                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Nginx (Port 80/443)                      │ │
│  │                    Reverse Proxy                           │ │
│  │  ┌────────────────────┬───────────────────────────────┐   │ │
│  │  │    / (frontend)    │        /ws (websocket)        │   │ │
│  │  └─────────┬──────────┴────────────────┬──────────────┘   │ │
│  └────────────┼───────────────────────────┼──────────────────┘ │
│               ▼                           ▼                     │
│  ┌────────────────────┐      ┌────────────────────────┐        │
│  │ Frontend Container │      │   Backend Container    │        │
│  │   (React/Vite)     │      │    (Bun/Hono)          │        │
│  │     Port 80        │      │     Port 3000          │        │
│  └────────────────────┘      └──────────┬─────────────┘        │
│                                         │                       │
│                              ┌──────────▼─────────────┐        │
│                              │   SQLite Database      │        │
│                              │  (Persistent Volume)   │        │
│                              └────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

**Traffic Flow:**
1. User accesses `http://<public-ip>/`
2. Nginx receives request on port 80
3. Static files (/) → proxied to Frontend container
4. WebSocket (/ws) → proxied to Backend container with upgrade headers
5. Backend reads/writes to SQLite database on persistent volume

---

## Prerequisites

- AWS Account (free tier eligible)
- GitHub repository with your code
- Basic terminal/SSH knowledge
- (Optional) AWS CLI installed locally

---

## Phase 1: AWS Account & EC2 Setup

### 1.1 Create AWS Account

1. Sign up at https://aws.amazon.com
2. Complete identity verification
3. Add payment method (free tier won't charge if you stay within limits)

**Free Tier Includes:**
- 750 hours/month of t2.micro EC2 instances (first 12 months)
- 30 GB of EBS storage
- 15 GB of outbound data transfer

### 1.2 Create EC2 Instance

1. Go to **EC2 Dashboard** → **Launch Instance**

2. **Configure instance:**

   | Setting | Value |
   |---------|-------|
   | Name | `tic-tac-toe-server` |
   | AMI | Ubuntu 22.04 LTS (free tier eligible) |
   | Instance Type | `t2.micro` (1 vCPU, 1 GB RAM) |
   | Key Pair | Create new → Download `.pem` file → **Save securely!** |

3. **Network Settings** → Edit:
   - Allow SSH (port 22) from **My IP** (more secure)
   - Allow HTTP (port 80) from **Anywhere** (0.0.0.0/0)
   - Allow HTTPS (port 443) from **Anywhere** (optional)

4. **Storage:** 8 GB gp3 (you have 30 GB free tier available)

5. Click **Launch Instance**

6. **Save your Public IP address** from the instance details page

### 1.3 Create Elastic IP (Recommended)

Elastic IPs prevent your public IP from changing when you stop/start the instance.

1. Go to **EC2** → **Elastic IPs** → **Allocate Elastic IP address**
2. Select the new Elastic IP → **Actions** → **Associate Elastic IP address**
3. Select your instance → **Associate**

**Note:** Elastic IPs are free while associated with a running instance. You're charged if the instance is stopped.

---

## Phase 2: EC2 Instance Configuration

### 2.1 Connect to Your Instance

```bash
# Set correct permissions on key file
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@<YOUR_PUBLIC_IP>
```

### 2.2 Update System & Install Docker

Run these commands on your EC2 instance:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group (avoids needing sudo)
sudo usermod -aG docker ubuntu

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Log out and back in for group changes to take effect
exit
```

Reconnect and verify installation:

```bash
ssh -i your-key.pem ubuntu@<YOUR_PUBLIC_IP>

# Verify Docker
docker --version
docker compose version
```

### 2.3 Clone Repository

```bash
# Create application directory
mkdir -p ~/tic-tac-toe
cd ~/tic-tac-toe

# Clone your repository
git clone https://github.com/YOUR_USERNAME/tic-tac.git .

# Or if using SSH
git clone git@github.com:YOUR_USERNAME/tic-tac.git .
```

### 2.4 Set Up SSM Agent (For CI/CD)

The SSM agent is pre-installed on Ubuntu 22.04, but we need to configure IAM.

**On AWS Console:**

1. **Create IAM Role for EC2:**
   - Go to **IAM** → **Roles** → **Create role**
   - Select **AWS service** → **EC2**
   - Attach policy: `AmazonSSMManagedInstanceCore`
   - Name: `EC2-SSM-Role`
   - Create role

2. **Attach Role to EC2 Instance:**
   - Go to **EC2** → **Instances** → Select your instance
   - **Actions** → **Security** → **Modify IAM role**
   - Select `EC2-SSM-Role` → **Update IAM role**

3. **Verify SSM Agent (on EC2):**
   ```bash
   sudo systemctl status snap.amazon-ssm-agent.amazon-ssm-agent.service
   ```

---

## Phase 3: Deploy Application

### 3.1 Build and Start Containers

On your EC2 instance:

```bash
cd ~/tic-tac-toe

# Build all containers
docker compose build

# Start containers in detached mode
docker compose up -d

# Verify containers are running
docker compose ps
```

Expected output:
```
NAME                IMAGE                    STATUS
tic-tac-nginx       nginx:alpine            Up (healthy)
tic-tac-frontend    tic-tac-toe-frontend    Up (healthy)
tic-tac-backend     tic-tac-toe-backend     Up (healthy)
```

### 3.2 Verify Deployment

```bash
# Check container logs
docker compose logs

# Test health endpoints
curl http://localhost/health        # Nginx health
curl http://localhost:3000/health   # Backend health (internal)

# Test from your browser
# Open http://<YOUR_PUBLIC_IP>/
```

### 3.3 Set Up Auto-Start on Reboot

The `docker-compose.yml` includes `restart: unless-stopped`, which handles most cases. For additional reliability:

```bash
# Enable Docker to start on boot
sudo systemctl enable docker

# Create systemd service for docker compose (optional)
sudo tee /etc/systemd/system/tic-tac-toe.service > /dev/null <<EOF
[Unit]
Description=Tic-Tac-Toe Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/tic-tac-toe
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
User=ubuntu

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable tic-tac-toe.service
```

---

## Phase 4: CI/CD Setup

### 4.1 Create IAM User for GitHub Actions

1. Go to **IAM** → **Users** → **Create user**
2. Name: `github-actions-deploy`
3. **Attach policies directly:**
   - `AmazonSSMFullAccess` (or create a custom policy with limited permissions)
4. **Create user** → **Security credentials** → **Create access key**
5. Select **Application running outside AWS**
6. **Save the Access Key ID and Secret Access Key securely!**

### 4.2 Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `AWS_ACCESS_KEY_ID` | Your IAM user access key ID |
| `AWS_SECRET_ACCESS_KEY` | Your IAM user secret access key |
| `AWS_REGION` | Your AWS region (e.g., `us-east-1`) |
| `EC2_INSTANCE_ID` | Your EC2 instance ID (e.g., `i-0123456789abcdef0`) |

**Finding your Instance ID:** EC2 → Instances → Copy from the Instance ID column

### 4.3 Deploy via GitHub Actions

The workflow file (`.github/workflows/deploy.yml`) is already configured. To deploy:

1. Push changes to the `main` branch
2. Go to **Actions** tab in GitHub to monitor the deployment
3. The workflow will:
   - Build and test the application
   - Deploy to EC2 via SSM
   - Verify the deployment

### 4.4 Manual Deployment (Alternative)

If you prefer to deploy manually without CI/CD:

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@<YOUR_PUBLIC_IP>

# Navigate to app directory
cd ~/tic-tac-toe

# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d

# Verify
docker compose ps
docker compose logs --tail=50
```

---

## Phase 5: Security Hardening

### 5.1 Configure UFW Firewall

```bash
# Enable UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (use your IP for better security)
sudo ufw allow from YOUR_IP to any port 22

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Verify rules
sudo ufw status
```

### 5.2 Install Fail2ban

Protects against brute-force SSH attacks:

```bash
sudo apt install fail2ban -y

# Create local config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit config
sudo nano /etc/fail2ban/jail.local
```

Add/modify:
```ini
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 5.3 Secure SQLite Database

```bash
# Set proper permissions on the data volume
docker exec tic-tac-backend chmod 600 /app/data/data.db

# Verify
docker exec tic-tac-backend ls -la /app/data/
```

### 5.4 Regular Security Updates

Create a cron job for automatic security updates:

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Operations & Maintenance

### Viewing Logs

```bash
# All container logs
docker compose logs

# Specific container logs
docker compose logs backend
docker compose logs frontend
docker compose logs nginx

# Follow logs in real-time
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100
```

### Database Backup

```bash
# Create backup directory
mkdir -p ~/backups

# Backup SQLite database
docker exec tic-tac-backend cat /app/data/data.db > ~/backups/data-$(date +%Y%m%d-%H%M%S).db

# Automated daily backup (add to crontab)
crontab -e
# Add: 0 2 * * * docker exec tic-tac-backend cat /app/data/data.db > /home/ubuntu/backups/data-$(date +\%Y\%m\%d).db
```

### Rollback Procedure

**Via GitHub Actions:**
1. Go to **Actions** tab
2. Select **Build and Deploy** workflow
3. Click **Run workflow** → Select **rollback** job

**Manual Rollback:**
```bash
cd ~/tic-tac-toe

# View recent commits
git log --oneline -10

# Rollback to specific commit
git reset --hard <COMMIT_HASH>

# Or rollback one commit
git reset --hard HEAD~1

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Zero-Downtime Updates

For updates without downtime:

```bash
# Update containers one at a time
docker compose up -d --no-deps --build backend
docker compose up -d --no-deps --build frontend

# Reload nginx without dropping connections
docker compose exec nginx nginx -s reload
```

### Monitoring

**Check resource usage:**
```bash
# Container stats
docker stats

# System resources
htop
df -h
free -h
```

**Set up CloudWatch (optional):**
1. Install CloudWatch agent on EC2
2. Configure metrics collection
3. Set up alarms for CPU, memory, disk usage

---

## Troubleshooting

### Common Issues

#### Can't Connect to Application

```bash
# Check containers are running
docker compose ps

# Check nginx is listening
sudo netstat -tlnp | grep :80

# Check security group in AWS Console allows port 80

# Check UFW isn't blocking
sudo ufw status
```

#### WebSocket Connection Fails

```bash
# Check backend container logs
docker compose logs backend

# Verify nginx WebSocket config
docker compose exec nginx cat /etc/nginx/nginx.conf | grep -A20 "location /ws"

# Test WebSocket directly
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost/ws
```

#### Database Resets on Restart

```bash
# Check volume exists
docker volume ls | grep backend-data

# Check volume is mounted
docker inspect tic-tac-backend | grep -A10 Mounts

# Verify data persists
docker exec tic-tac-backend ls -la /app/data/
```

#### High Memory Usage

```bash
# Check which container is using memory
docker stats --no-stream

# Consider upgrading to t2.small or t3.small for 2GB RAM

# Or optimize container memory limits in docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       memory: 256M
```

#### CI/CD Deployment Fails

**SSM Issues:**
```bash
# Check SSM agent status
sudo systemctl status snap.amazon-ssm-agent.amazon-ssm-agent.service

# Restart SSM agent
sudo systemctl restart snap.amazon-ssm-agent.amazon-ssm-agent.service

# Verify IAM role is attached (AWS Console)
# Check CloudWatch logs for SSM command execution
```

**Permission Issues:**
```bash
# Ensure ubuntu user owns the app directory
sudo chown -R ubuntu:ubuntu ~/tic-tac-toe

# Ensure ubuntu is in docker group
groups ubuntu
```

---

## Appendix A: CI/CD Method Comparison

| Method | Security | Complexity | AWS Services | Best For |
|--------|----------|------------|--------------|----------|
| **SSM** (Recommended) | High | Medium | EC2, IAM, SSM | Production, learning AWS |
| **SSH** | Medium | Low | EC2 only | Quick setup, simple needs |
| **CodeDeploy** | High | Medium-High | EC2, CodeDeploy, S3 | Enterprise, deployment history |
| **ECR** | High | Medium-High | EC2, ECR, IAM | Container-first, multiple envs |
| **CodePipeline** | High | High | Multiple services | Complex workflows |

### SSH Method Setup (Alternative)

If you prefer SSH over SSM:

1. **Generate SSH key pair:**
   ```bash
   ssh-keygen -t ed25519 -C "github-actions" -f github-deploy-key
   ```

2. **Add public key to EC2:**
   ```bash
   cat github-deploy-key.pub >> ~/.ssh/authorized_keys
   ```

3. **Add GitHub Secrets:**
   - `EC2_HOST`: Your EC2 public IP
   - `EC2_USER`: `ubuntu`
   - `EC2_SSH_KEY`: Contents of `github-deploy-key` (private key)

4. **Uncomment SSH job in workflow:**
   Edit `.github/workflows/deploy.yml` and uncomment the `deploy-ssh` job.

---

## Appendix B: SSL/HTTPS Setup

### Using Let's Encrypt (Free SSL)

1. **Install Certbot:**
   ```bash
   sudo apt install certbot -y
   ```

2. **Get certificate:**
   ```bash
   # Stop nginx temporarily
   docker compose stop nginx

   # Get certificate (replace with your domain)
   sudo certbot certonly --standalone -d yourdomain.com

   # Certificates will be at:
   # /etc/letsencrypt/live/yourdomain.com/fullchain.pem
   # /etc/letsencrypt/live/yourdomain.com/privkey.pem
   ```

3. **Create SSL directory and copy certs:**
   ```bash
   mkdir -p ~/tic-tac-toe/ssl
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ~/tic-tac-toe/ssl/
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ~/tic-tac-toe/ssl/
   sudo chown ubuntu:ubuntu ~/tic-tac-toe/ssl/*
   ```

4. **Update nginx.conf:**
   Uncomment the HTTPS server block in `nginx.conf` and update paths.

5. **Restart containers:**
   ```bash
   docker compose up -d
   ```

6. **Auto-renewal:**
   ```bash
   # Test renewal
   sudo certbot renew --dry-run

   # Add cron job for renewal
   sudo crontab -e
   # Add: 0 3 * * * certbot renew --quiet && docker compose -f /home/ubuntu/tic-tac-toe/docker-compose.yml exec nginx nginx -s reload
   ```

---

## Environment Variables Reference

See `.env.example` for all available configuration options:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Application environment |
| `PORT` | `3000` | Backend server port |
| `DATABASE_PATH` | `/app/data/data.db` | SQLite database file path |
| `CORS_ORIGIN` | (empty) | Allowed CORS origins |

---

## Cost Estimation (Free Tier)

For the first 12 months with AWS Free Tier:

| Resource | Free Tier | Our Usage | Cost |
|----------|-----------|-----------|------|
| EC2 t2.micro | 750 hours/month | 720 hours | Free |
| EBS Storage | 30 GB | 8 GB | Free |
| Data Transfer | 15 GB/month | ~1 GB | Free |
| Elastic IP | Free if attached | 1 | Free |

**After Free Tier:** Approximately $8-15/month for t2.micro running 24/7.

---

## Quick Reference Commands

```bash
# Start application
docker compose up -d

# Stop application
docker compose down

# View logs
docker compose logs -f

# Rebuild and restart
docker compose down && docker compose build --no-cache && docker compose up -d

# Check container status
docker compose ps

# Enter container shell
docker compose exec backend sh
docker compose exec frontend sh

# Database backup
docker exec tic-tac-backend cat /app/data/data.db > backup.db

# Update from git
git pull origin main && docker compose build && docker compose up -d
```
