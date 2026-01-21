# AWS EC2 Deployment Plan for Tic-Tac-Toe App

This plan covers deploying your Bun-based backend and React frontend to AWS EC2 using Docker containers, accessible via public IP address.

## Quick Decision Guide: Which CI/CD Method Should I Use?

**For Learning AWS Concepts (Recommended):**
- **Option B: SSM (Systems Manager)** - Teaches IAM roles, SSM, CloudWatch, and is more secure than SSH

**For Quickest Setup:**
- **Option A: SSH** - Simplest, but less secure (requires opening SSH port)

**For Production/Enterprise:**
- **Option C: CodeDeploy** - Built-in deployment tracking and rollback capabilities

**For Container-First Approach:**
- **Option D: ECR** - Store Docker images in AWS, better for multiple environments

**For Complex Workflows:**
- **Option E: CodePipeline** - Fully managed AWS CI/CD service

**Our Recommendation:** Start with **Option B (SSM)** as it teaches important AWS concepts (IAM, SSM, CloudWatch) while being more secure than SSH.

## Architecture Overview

```
GitHub Repository
  ↓ (on push to main)
GitHub Actions (CI/CD)
  ├── Build & Test
  ├── Build Docker Images
  └── Deploy via SSH/SSM/CodeDeploy
      ↓
EC2 Instance (Public IP)
  ├── Nginx (Port 80/443) - Reverse Proxy
  │   ├── Serves Frontend Static Files
  │   └── Proxies /ws → Backend WebSocket
  ├── Frontend Container (React/Vite)
  └── Backend Container (Bun/Hono)
      └── SQLite Database (Persistent Volume)
```

## Prerequisites

- AWS Account (free tier eligible)
- AWS CLI installed locally (optional, for easier management)
- Basic terminal/SSH knowledge

## Step-by-Step Deployment Guide

### Phase 1: AWS Account & EC2 Setup

1. **Create AWS Account**
   - Sign up at https://aws.amazon.com
   - Complete account verification
   - Note: Free tier includes 750 hours/month of t2.micro EC2 instances

2. **Create EC2 Instance**
   - Go to EC2 Dashboard → Launch Instance
   - Name: `tic-tac-toe-server`
   - AMI: Ubuntu 22.04 LTS (free tier eligible)
   - Instance Type: `t2.micro` (1 vCPU, 1 GB RAM) - free tier eligible
   - Key Pair: Create new or use existing SSH key pair
   - Network Settings:
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 80) from anywhere (0.0.0.0/0)
     - Allow HTTPS (port 443) from anywhere (0.0.0.0/0) - optional
   - Storage: 8 GB gp3 (free tier: 30 GB)
   - Launch instance
   - **Save the public IP address** shown after launch

3. **Configure Security Group**
   - EC2 → Security Groups → Select your instance's security group
   - Inbound Rules should include:
     - SSH (22) from your IP
     - HTTP (80) from 0.0.0.0/0
     - HTTPS (443) from 0.0.0.0/0 (optional)
   - Outbound: Allow all (default)

### Phase 2: Prepare Docker Configuration Files

4. **Create Backend Dockerfile**
   - File: `apps/backend/Dockerfile`
   - Multi-stage build: install dependencies, build, run
   - Expose port 3000
   - Use Bun runtime
   - Mount volume for SQLite database persistence

5. **Create Frontend Dockerfile**
   - File: `apps/frontend/Dockerfile`
   - Build React app with Vite
   - Serve static files with nginx
   - Expose port 80

6. **Create Docker Compose File**
   - File: `docker-compose.yml` (root)
   - Define backend and frontend services
   - Configure volumes for database persistence
   - Set up networking between containers

7. **Create Nginx Configuration**
   - File: `nginx.conf`
   - Reverse proxy configuration
   - Serve frontend static files
   - Proxy `/ws` WebSocket connections to backend
   - Handle HTTP → HTTPS redirect (optional)

8. **Create Environment Configuration**
   - File: `.env.example` for reference
   - Document required environment variables
   - Backend port, database path, etc.

### Phase 3: Application Configuration Updates

9. **Update Frontend WebSocket Connection**
   - Modify `apps/frontend/src/hooks/useWebSocket.ts`
   - Ensure WebSocket URL works with production setup
   - Current code should work (uses `window.location.host`)

10. **Create Production Build Scripts**
    - Update `package.json` scripts if needed
    - Ensure build commands work in Docker context

### Phase 4: Deploy to EC2

11. **Connect to EC2 Instance**
    - SSH: `ssh -i your-key.pem ubuntu@<PUBLIC_IP>`
    - Update system: `sudo apt update && sudo apt upgrade -y`

12. **Install Docker & Docker Compose**
    - Install Docker Engine
    - Install Docker Compose plugin
    - Add ubuntu user to docker group
    - Verify installation

13. **Transfer Application Files**
    - Option A: Clone from Git repository
    - Option B: Use `scp` to copy files
    - Ensure all source files are present

14. **Build and Run Containers**
    - Run `docker-compose build`
    - Run `docker-compose up -d`
    - Verify containers are running

15. **Set Up Nginx Reverse Proxy**
    - Install nginx on host (not in container)
    - Configure nginx to proxy to frontend container
    - Configure WebSocket proxy for `/ws` endpoint
    - Test configuration and restart nginx

16. **Configure Database Persistence**
    - Ensure SQLite database file persists in Docker volume
    - Test database writes survive container restarts

17. **Set Up Auto-Start on Reboot**
    - Configure Docker Compose to start on boot
    - Use systemd service or Docker restart policies

### Phase 5: Testing & Verification

18. **Test Application**
    - Access via `http://<PUBLIC_IP>`
    - Test WebSocket connection
    - Play a game to verify functionality
    - Check database persistence

19. **Monitor Logs**
    - View container logs: `docker-compose logs`
    - Check nginx logs: `/var/log/nginx/`
    - Monitor EC2 instance metrics in AWS Console

### Phase 6: CI/CD Setup with GitHub Actions

**Choose Your Deployment Method:**

There are several approaches to deploy from GitHub to AWS EC2. Choose the one that best fits your needs:

#### Option A: SSH Deployment (Simplest, Current Plan)
- **Pros**: Simple, direct, no additional AWS services needed
- **Cons**: Requires opening SSH port, managing SSH keys
- **Best for**: Learning AWS basics, quick setup

#### Option B: AWS Systems Manager (SSM) Session Manager (Recommended)
- **Pros**: More secure (no SSH port needed), uses AWS IAM, audit logs
- **Cons**: Requires SSM agent setup, IAM roles
- **Best for**: Production deployments, better security
- **How it works**: GitHub Actions uses AWS SDK to send commands via SSM

#### Option C: AWS CodeDeploy
- **Pros**: Native AWS service, built-in rollback, deployment tracking
- **Cons**: More complex setup, requires CodeDeploy agent
- **Best for**: Enterprise deployments, need deployment history
- **How it works**: GitHub Actions triggers CodeDeploy, which deploys to EC2

#### Option D: Docker Registry Approach (ECR)
- **Pros**: Clean separation, images stored in AWS, can reuse images
- **Cons**: Requires ECR setup, more moving parts
- **Best for**: Container-first approach, multiple environments
- **How it works**: Build images in GitHub Actions → Push to ECR → EC2 pulls and runs

#### Option E: AWS CodePipeline (Full CI/CD)
- **Pros**: Fully managed, integrates with many AWS services
- **Cons**: More complex, potentially more expensive
- **Best for**: Complex workflows, multiple environments
- **How it works**: GitHub → CodePipeline → CodeBuild → CodeDeploy → EC2

**For learning AWS concepts, we recommend Option B (SSM) as it teaches IAM roles, SSM, and is more secure than SSH.**

---

20. **Prepare EC2 for Automated Deployment** (Choose based on selected option above)

**For SSH Method (Option A):**
- Create deployment user on EC2 (or use ubuntu user)
- Generate SSH key pair for GitHub Actions
- Add public key to EC2 `~/.ssh/authorized_keys`
- Test SSH connection from local machine
- Create deployment directory structure on EC2

**For SSM Method (Option B - Recommended):**
- Ensure SSM agent is installed (pre-installed on Amazon Linux 2, Ubuntu 22.04)
- Create IAM role for EC2 instance:
  - Go to IAM → Roles → Create Role
  - Select "EC2" as service
  - Attach policy: `AmazonSSMManagedInstanceCore`
  - Name: `EC2-SSM-Role`
- Attach IAM role to EC2 instance:
  - EC2 → Instances → Select instance → Actions → Security → Modify IAM role
  - Select the created role
- Create IAM user for GitHub Actions:
  - IAM → Users → Create User
  - Attach policy: `AmazonSSMFullAccess` (or create custom policy with SSM permissions)
  - Create access keys for this user
  - Save access key ID and secret (needed for GitHub secrets)
- Create deployment script on EC2: `~/deploy.sh`
- Test SSM connection: `aws ssm send-command --instance-ids <INSTANCE_ID> --document-name "AWS-RunShellScript" --parameters commands="echo 'test'"`

**For CodeDeploy Method (Option C):**
- Install CodeDeploy agent on EC2
- Create IAM role for EC2 with CodeDeploy permissions
- Create CodeDeploy application and deployment group
- Create `appspec.yml` file in repository root

**For ECR Method (Option D):**
- Create ECR repository for Docker images
- Set up IAM roles for EC2 and GitHub Actions
- Configure EC2 to pull from ECR
- Use SSM to trigger image pull and container restart

**For CodePipeline Method (Option E):**
- Set up CodePipeline in AWS Console
- Connect GitHub repository as source
- Configure CodeBuild for building
- Configure CodeDeploy for deployment

21. **Configure GitHub Repository**
- Ensure code is pushed to GitHub repository
- Go to Repository → Settings → Secrets and variables → Actions
- Add secrets based on chosen deployment method:

**For SSH (Option A):**
- `EC2_HOST`: Public IP or Elastic IP of EC2 instance
- `EC2_USER`: SSH username (usually `ubuntu`)
- `EC2_SSH_KEY`: Private SSH key content (the .pem file content)
- `EC2_SSH_KEY_PASSPHRASE`: If SSH key has passphrase (optional)

**For SSM (Option B):**
- `AWS_ACCESS_KEY_ID`: AWS access key with SSM permissions
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `AWS_REGION`: AWS region (e.g., `us-east-1`)
- `EC2_INSTANCE_ID`: EC2 instance ID (e.g., `i-0123456789abcdef0`)

**For CodeDeploy (Option C):**
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `AWS_REGION`: AWS region
- `CODE_DEPLOY_APPLICATION_NAME`: CodeDeploy application name
- `CODE_DEPLOY_DEPLOYMENT_GROUP`: Deployment group name

**For ECR (Option D):**
- `AWS_ACCESS_KEY_ID`: AWS access key with ECR permissions
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `AWS_REGION`: AWS region
- `ECR_REPOSITORY`: ECR repository name
- `EC2_HOST`: EC2 instance IP (for triggering pull)

**For CodePipeline (Option E):**
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `AWS_REGION`: AWS region

22. **Create GitHub Actions Workflow**
- File: `.github/workflows/deploy.yml`
- Workflow triggers: On push to `main` branch (or specific branches)
- Steps vary based on chosen deployment method:

**Common Steps (all methods):**
1. **Checkout code**: Get latest code from repository
2. **Set up pnpm**: Install pnpm package manager
3. **Install dependencies**: Run `pnpm install` for all workspaces
4. **Run tests**: Execute test suite (if configured)
5. **Build application**: Build frontend and backend

**Deploy Steps by Method:**

**Option A - SSH:**
- Set up SSH connection using GitHub secrets
- SSH into EC2 and execute deployment commands:
  - Navigate to application directory
  - Pull latest code: `git pull origin main`
  - Stop containers: `docker-compose down`
  - Build new images: `docker-compose build --no-cache`
  - Start containers: `docker-compose up -d`
  - Health check and verify deployment

**Option B - SSM (Recommended):**
- Configure AWS credentials in GitHub Actions
- Use `aws ssm send-command` to execute deployment script on EC2
- Or use `aws ssm start-session` for interactive deployment
- Deployment script on EC2 handles: git pull, docker-compose operations
- More secure: No SSH port needed, uses IAM roles

**Option C - CodeDeploy:**
- Build application artifacts
- Create deployment package (zip file)
- Upload to S3
- Trigger CodeDeploy deployment via AWS CLI
- CodeDeploy agent on EC2 handles deployment
- Built-in rollback and deployment tracking

**Option D - ECR:**
- Build Docker images
- Authenticate with ECR
- Push images to ECR repository
- Use SSM or CodeDeploy to trigger EC2 to:
  - Pull latest images from ECR
  - Restart containers with new images
- Clean separation: images stored in AWS

**Option E - CodePipeline:**
- GitHub webhook triggers CodePipeline
- CodePipeline orchestrates: CodeBuild → CodeDeploy
- Fully managed by AWS
- More complex but powerful

- Include error handling and rollback capability
- Add workflow status badges to README (optional)

23. **Test CI/CD Pipeline**
- Make a small change to code
- Push to `main` branch
- Monitor GitHub Actions workflow execution
- Verify deployment on EC2
- Test application functionality

### Phase 7: Security & Maintenance

24. **Security Hardening** (Optional but Recommended)
- Set up firewall (UFW) on EC2
- Configure fail2ban for SSH protection
- Restrict SSH access to GitHub Actions IP ranges (optional)
- Set up CloudWatch monitoring
- Regular security updates

25. **Backup Strategy**
- Backup SQLite database regularly
- Consider using AWS S3 for backups
- Document restore procedure
- Automate backups via cron job or GitHub Actions

## Files to Create/Modify

### New Files:
- `apps/backend/Dockerfile` - Backend container definition
- `apps/frontend/Dockerfile` - Frontend container definition  
- `docker-compose.yml` - Multi-container orchestration
- `nginx.conf` - Reverse proxy configuration
- `.dockerignore` - Exclude unnecessary files from Docker builds
- `.github/workflows/deploy.yml` - GitHub Actions CI/CD workflow
- `AWS_DEPLOYMENT.md` - This deployment guide

### Files to Review:
- `apps/frontend/src/hooks/useWebSocket.ts` - Verify WebSocket URL logic
- `apps/backend/src/index.ts` - Verify port configuration
- `package.json` scripts - Ensure build commands work

## Important Notes

- **Public IP Changes**: EC2 public IPs change on stop/start. Use Elastic IP for permanent IP (free if instance is running)
- **Database Persistence**: SQLite file must be in Docker volume to persist data
- **WebSocket Support**: Nginx must be configured with proper WebSocket upgrade headers
- **Resource Limits**: t2.micro has limited RAM (1GB) - monitor usage
- **Cost**: Free tier covers 750 hours/month. Stop instance when not in use to avoid charges

## Troubleshooting

- **Can't connect**: Check security group rules
- **WebSocket fails**: Verify nginx WebSocket proxy configuration
- **Database resets**: Check Docker volume mounting
- **High memory usage**: Consider upgrading to t2.small or optimize containers
- **CI/CD fails**: 
  - **SSH Method**: Verify GitHub secrets are correctly set, check SSH key permissions (should be 600), verify EC2 security group allows SSH from GitHub Actions IPs
  - **SSM Method**: Verify IAM roles are attached, check SSM agent is running (`sudo systemctl status amazon-ssm-agent`), verify IAM user has correct permissions, check CloudWatch logs for SSM command execution
  - **CodeDeploy**: Verify CodeDeploy agent is running, check IAM roles, verify `appspec.yml` is correct
  - **General**: Check GitHub Actions logs for specific error messages, ensure deployment script has execute permissions, verify AWS credentials are valid

## CI/CD Workflow Details

### Deployment Method Comparison

| Method | Security | Complexity | AWS Services Used | Best For |
|--------|----------|------------|-------------------|----------|
| **SSH** | Medium | Low | EC2 only | Learning, quick setup |
| **SSM** | High | Medium | EC2, IAM, SSM | Production, security-focused |
| **CodeDeploy** | High | Medium | EC2, CodeDeploy, S3 | Enterprise, deployment tracking |
| **ECR** | High | Medium-High | EC2, ECR, IAM | Container-first, multiple envs |
| **CodePipeline** | High | High | Multiple AWS services | Complex workflows |

### GitHub Actions Workflow Flow (SSH Method)

1. **Trigger**: Push to `main` branch
2. **Build Phase**:
   - Checkout repository
   - Install pnpm and dependencies
   - Run linting/tests (if configured)
   - Build frontend and backend
3. **Deploy Phase**:
   - Connect to EC2 via SSH using secrets
   - Pull latest code or transfer built artifacts
   - Stop running containers gracefully
   - Build new Docker images
   - Start containers with new images
   - Health check to verify deployment
   - Send notification on success/failure (optional)

### GitHub Actions Workflow Flow (SSM Method - Recommended)

1. **Trigger**: Push to `main` branch
2. **Build Phase**: Same as SSH method
3. **Deploy Phase**:
   - Configure AWS credentials in workflow
   - Use AWS CLI to send SSM command to EC2
   - EC2 executes deployment script via SSM agent
   - No SSH port needed, uses IAM for authentication
   - All commands logged in CloudWatch
   - More secure and AWS-native approach

### GitHub Secrets Configuration

**For SSH Method (Option A):**
- `EC2_HOST`: EC2 instance public IP or Elastic IP
- `EC2_USER`: SSH username (typically `ubuntu`)
- `EC2_SSH_KEY`: Complete content of private SSH key (.pem file)
- `EC2_SSH_KEY_PASSPHRASE`: Only if SSH key has passphrase

**For SSM Method (Option B - Recommended):**
- `AWS_ACCESS_KEY_ID`: AWS access key with SSM permissions
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `AWS_REGION`: AWS region (e.g., `us-east-1`)
- `EC2_INSTANCE_ID`: EC2 instance ID (e.g., `i-0123456789abcdef0`)

**For CodeDeploy Method (Option C):**
- `AWS_ACCESS_KEY_ID`: AWS access key with CodeDeploy permissions
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `AWS_REGION`: AWS region
- `CODE_DEPLOY_APPLICATION_NAME`: CodeDeploy application name
- `CODE_DEPLOY_DEPLOYMENT_GROUP`: Deployment group name

**For ECR Method (Option D):**
- `AWS_ACCESS_KEY_ID`: AWS access key with ECR permissions
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `AWS_REGION`: AWS region
- `ECR_REPOSITORY`: ECR repository name
- `EC2_INSTANCE_ID`: EC2 instance ID (for SSM commands)

### Deployment Strategy

- **Zero-downtime**: Use `docker-compose up -d --no-deps` to update containers individually
- **Rollback**: Keep previous Docker images, can rollback by restarting old containers
- **Database migrations**: Run migrations as part of deployment script if needed
- **Health checks**: Verify containers start successfully before marking deployment complete
- **Notifications**: Optional Slack/Discord/email notifications on deployment status

### Alternative: Deploy Script on EC2

Instead of running commands directly in GitHub Actions, create a deployment script on EC2:
- File: `~/deploy.sh` on EC2
- Script handles: git pull, docker-compose operations, health checks
- GitHub Actions just triggers the script via SSH/SSM
- Easier to maintain and test locally

## Next Steps After Deployment

- Set up Elastic IP for permanent address
- Configure CloudWatch alarms
- Set up automated backups
- Consider adding SSL certificate (Let's Encrypt) for HTTPS
- Add deployment notifications (Slack, email, etc.)
- Set up staging environment for testing before production
