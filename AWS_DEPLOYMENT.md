# AWS EC2 Deployment Guide for Tic-Tac-Toe

This guide covers deploying the Tic-Tac-Toe application to AWS EC2 using Docker containers with GitHub Actions CI/CD via AWS SSM.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: AWS Account & EC2 Setup](#phase-1-aws-account--ec2-setup)
4. [Phase 2: EC2 Instance Configuration](#phase-2-ec2-instance-configuration)
5. [Phase 3: Deploy Application](#phase-3-deploy-application)
6. [Phase 4: CI/CD Setup with GitHub Actions](#phase-4-cicd-setup-with-github-actions)
7. [Phase 5: Elastic IP Setup](#phase-5-elastic-ip-setup)
8. [Operations & Maintenance](#operations--maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Appendix: SSL/HTTPS Setup](#appendix-sslhttps-setup)

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
                              │ (via AWS SSM)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EC2 Instance (Elastic IP)                     │
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

---

## Prerequisites

- AWS Account (free tier eligible)
- GitHub repository with your code
- AWS CLI installed locally (`brew install awscli` on Mac)
- GitHub CLI installed (`brew install gh` on Mac)

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
   | AMI | Ubuntu 24.04 LTS (free tier eligible) |
   | Instance Type | `t2.micro` (1 vCPU, 1 GB RAM) |
   | Key Pair | Create new → Download `.pem` file → **Save securely!** |

3. **Network Settings** → Edit:
   - Allow SSH (port 22) from **My IP**
   - Allow HTTP (port 80) from **Anywhere** (0.0.0.0/0)
   - Allow HTTPS (port 443) from **Anywhere** (optional)

4. **Storage:** 8 GB gp3

5. Click **Launch Instance**

6. Note your **Instance ID** (e.g., `i-0910ff6d66bc9d231`)

---

## Phase 2: EC2 Instance Configuration

### 2.1 Connect to Your Instance

```bash
# Set correct permissions on key file
chmod 400 ~/Downloads/your-key.pem

# Connect via SSH (replace with your instance's public IP)
ssh -i ~/Downloads/your-key.pem ubuntu@<PUBLIC_IP>
```

### 2.2 Install Docker

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

Reconnect and verify:

```bash
ssh -i ~/Downloads/your-key.pem ubuntu@<PUBLIC_IP>

# Verify Docker
docker --version
docker compose version
```

### 2.3 Clone Repository

```bash
# Create application directory and clone
mkdir -p ~/tic-tac-toe
cd ~/tic-tac-toe
git clone https://github.com/YOUR_USERNAME/tic-tac.git .
```

---

## Phase 3: Deploy Application

### 3.1 Build and Start Containers

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
NAME               IMAGE                    STATUS
tic-tac-nginx      nginx:alpine            Up (healthy)
tic-tac-frontend   tic-tac-toe-frontend    Up (healthy)
tic-tac-backend    tic-tac-toe-backend     Up (healthy)
```

### 3.2 Verify Deployment

```bash
# Test health endpoint
curl http://localhost/health

# Test from your browser
# Open http://<PUBLIC_IP>/
```

---

## Phase 4: CI/CD Setup with GitHub Actions

This section sets up automatic deployments when you push to the `main` branch.

### 4.1 Create IAM Role for EC2 (SSM Access)

Run these commands locally (requires AWS CLI configured):

```bash
# Create the IAM role
aws iam create-role \
  --role-name EC2-SSM-Role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "ec2.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }' \
  --description "Allows EC2 instances to communicate with SSM"

# Attach SSM policy to role
aws iam attach-role-policy \
  --role-name EC2-SSM-Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore

# Create instance profile
aws iam create-instance-profile --instance-profile-name EC2-SSM-Profile

# Add role to instance profile
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-SSM-Profile \
  --role-name EC2-SSM-Role

# Wait a few seconds for propagation
sleep 5

# Attach instance profile to EC2 (replace YOUR_INSTANCE_ID)
aws ec2 associate-iam-instance-profile \
  --instance-id YOUR_INSTANCE_ID \
  --iam-instance-profile Name=EC2-SSM-Profile
```

### 4.2 Restart SSM Agent on EC2

SSH into your EC2 instance and restart the SSM agent to pick up the new role:

```bash
ssh -i ~/Downloads/your-key.pem ubuntu@<PUBLIC_IP>

sudo systemctl restart snap.amazon-ssm-agent.amazon-ssm-agent.service
sudo systemctl status snap.amazon-ssm-agent.amazon-ssm-agent.service
```

### 4.3 Verify SSM Connectivity

Back on your local machine:

```bash
aws ssm describe-instance-information \
  --filters "Key=InstanceIds,Values=YOUR_INSTANCE_ID" \
  --query "InstanceInformationList[0].PingStatus"
```

Should return: `"Online"`

### 4.4 Create IAM User for GitHub Actions

```bash
# Create user
aws iam create-user --user-name github-actions-deploy

# Create scoped policy (more secure than full SSM access)
aws iam create-policy \
  --policy-name GitHubActionsSSMDeployPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "ssm:SendCommand",
          "ssm:GetCommandInvocation",
          "ssm:ListCommandInvocations",
          "ssm:DescribeInstanceInformation"
        ],
        "Resource": "*"
      },
      {
        "Effect": "Allow",
        "Action": ["ec2:DescribeInstances"],
        "Resource": "*"
      }
    ]
  }' \
  --description "Allows GitHub Actions to deploy via SSM"

# Attach policy to user (replace ACCOUNT_ID with your AWS account ID)
aws iam attach-user-policy \
  --user-name github-actions-deploy \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/GitHubActionsSSMDeployPolicy

# Create access keys (SAVE THESE - shown only once!)
aws iam create-access-key --user-name github-actions-deploy
```

Save the `AccessKeyId` and `SecretAccessKey` from the output.

### 4.5 Add Secrets to GitHub Repository

Using GitHub CLI:

```bash
# Set each secret
gh secret set AWS_ACCESS_KEY_ID --body "YOUR_ACCESS_KEY_ID" --repo YOUR_USERNAME/tic-tac
gh secret set AWS_SECRET_ACCESS_KEY --body "YOUR_SECRET_ACCESS_KEY" --repo YOUR_USERNAME/tic-tac
gh secret set AWS_REGION --body "us-east-1" --repo YOUR_USERNAME/tic-tac
gh secret set EC2_INSTANCE_ID --body "YOUR_INSTANCE_ID" --repo YOUR_USERNAME/tic-tac

# Verify secrets are set
gh secret list --repo YOUR_USERNAME/tic-tac
```

Or via GitHub web UI:
1. Go to Repository → **Settings** → **Secrets and variables** → **Actions**
2. Add each secret:

| Secret Name | Value |
|-------------|-------|
| `AWS_ACCESS_KEY_ID` | Your IAM user access key ID |
| `AWS_SECRET_ACCESS_KEY` | Your IAM user secret access key |
| `AWS_REGION` | `us-east-1` (or your region) |
| `EC2_INSTANCE_ID` | Your EC2 instance ID |

### 4.6 Test the CI/CD Pipeline

```bash
# Make a small change and push
git add .
git commit -m "Test CI/CD"
git push origin main

# Watch the workflow
gh run watch --repo YOUR_USERNAME/tic-tac
```

Or view at: `https://github.com/YOUR_USERNAME/tic-tac/actions`

---

## Phase 5: Elastic IP Setup

Elastic IPs give your instance a permanent public IP that doesn't change on stop/start.

```bash
# Allocate an Elastic IP
aws ec2 allocate-address --domain vpc

# Note the AllocationId and PublicIp from output

# Associate with your instance
aws ec2 associate-address \
  --instance-id YOUR_INSTANCE_ID \
  --allocation-id YOUR_ALLOCATION_ID

# Verify
curl http://YOUR_ELASTIC_IP/health
```

**Note:** Elastic IPs are free while associated with a running instance. You're charged ~$0.005/hour if the instance is stopped.

---

## Operations & Maintenance

### Viewing Logs

```bash
# SSH into EC2 first
ssh -i ~/Downloads/your-key.pem ubuntu@<ELASTIC_IP>

# All container logs
docker compose logs

# Specific container
docker compose logs backend
docker compose logs frontend

# Follow logs in real-time
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100
```

### Manual Deployment

```bash
cd ~/tic-tac-toe
git pull origin main
docker compose down
docker compose build --no-cache
docker compose up -d
docker compose ps
```

### Database Backup

```bash
# Create backup
mkdir -p ~/backups
docker exec tic-tac-backend cat /app/data/data.db > ~/backups/data-$(date +%Y%m%d-%H%M%S).db

# Automated daily backup (add to crontab -e)
0 2 * * * docker exec tic-tac-backend cat /app/data/data.db > /home/ubuntu/backups/data-$(date +\%Y\%m\%d).db
```

### Rollback

```bash
cd ~/tic-tac-toe

# View recent commits
git log --oneline -10

# Rollback to specific commit
git reset --hard COMMIT_HASH

# Or rollback one commit
git reset --hard HEAD~1

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## Troubleshooting

### Can't Connect to Application

```bash
# Check containers are running
docker compose ps

# Check nginx is listening
sudo netstat -tlnp | grep :80

# Check security group in AWS Console allows port 80
```

### WebSocket Connection Fails

```bash
# Check backend logs
docker compose logs backend

# Test WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost/ws
```

### SSM Agent Not Connecting

```bash
# SSH into EC2 and check agent status
sudo systemctl status snap.amazon-ssm-agent.amazon-ssm-agent.service

# Restart agent
sudo systemctl restart snap.amazon-ssm-agent.amazon-ssm-agent.service

# Verify IAM role is attached in AWS Console
# EC2 → Instances → Select instance → Security tab → IAM Role
```

### CI/CD Deployment Fails

```bash
# Check GitHub Actions logs
gh run view --repo YOUR_USERNAME/tic-tac --log-failed

# Verify SSM connectivity
aws ssm describe-instance-information \
  --filters "Key=InstanceIds,Values=YOUR_INSTANCE_ID"

# Test SSM command manually
aws ssm send-command \
  --instance-ids "YOUR_INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["echo Hello"]'
```

---

## Appendix: SSL/HTTPS Setup

### Using Let's Encrypt (Free SSL)

1. **Point your domain to your Elastic IP** (A record in DNS)

2. **Install Certbot on EC2:**
   ```bash
   sudo apt install certbot -y
   ```

3. **Get certificate:**
   ```bash
   # Stop nginx temporarily
   cd ~/tic-tac-toe
   docker compose stop nginx

   # Get certificate (replace with your domain)
   sudo certbot certonly --standalone -d yourdomain.com

   # Copy certs to project
   mkdir -p ~/tic-tac-toe/ssl
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ~/tic-tac-toe/ssl/
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ~/tic-tac-toe/ssl/
   sudo chown ubuntu:ubuntu ~/tic-tac-toe/ssl/*
   ```

4. **Update nginx.conf** - Uncomment the HTTPS server block

5. **Restart containers:**
   ```bash
   docker compose up -d
   ```

6. **Auto-renewal:**
   ```bash
   # Add to crontab
   sudo crontab -e
   # Add: 0 3 * * * certbot renew --quiet && docker compose -f /home/ubuntu/tic-tac-toe/docker-compose.yml exec nginx nginx -s reload
   ```

---

## Quick Reference Commands

```bash
# SSH into EC2
ssh -i ~/Downloads/your-key.pem ubuntu@<ELASTIC_IP>

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

# Update from git and redeploy
git pull origin main && docker compose build && docker compose up -d

# Watch GitHub Actions
gh run watch --repo YOUR_USERNAME/tic-tac
```

---

## Cost Summary

| Resource | Free Tier | After Free Tier |
|----------|-----------|-----------------|
| EC2 t2.micro | 750 hours/month (12 months) | ~$8-10/month |
| EBS Storage (8GB) | 30 GB free | ~$0.80/month |
| Elastic IP | Free if attached to running instance | $0.005/hour if stopped |
| Data Transfer | 15 GB/month | $0.09/GB |

**Estimated monthly cost after free tier:** $10-15/month
