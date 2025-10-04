# Deployment Guide - Multi-Agent Browser Testing System

## ⚠️ Important: Why NOT Supabase Edge Functions?

**DO NOT** deploy Playwright agents to Supabase Edge Functions because:

| Requirement | Edge Functions   | Your Agents                      |
| ----------- | ---------------- | -------------------------------- |
| **Runtime** | 60s timeout      | Run indefinitely                 |
| **Memory**  | ~128MB           | 150-200MB per browser            |
| **State**   | Stateless        | Need persistent browser sessions |
| **CPU**     | Limited          | Heavy browser operations         |
| **Cost**    | Invocation-based | Always-on processes              |

**Result:** Edge Functions will timeout and fail immediately. ❌

---

## ✅ Recommended Hosting Options

### Option 1: Docker + Fly.io (Recommended for Starting)

**Cost:** ~$5-10/month per agent server  
**Scalability:** Easy horizontal scaling  
**Setup Time:** 15 minutes

#### Why Fly.io?

- Persistent VMs (not serverless)
- Global edge locations
- Built-in video streaming support
- Pay per second of runtime
- Free allowance: 3 shared-cpu-1x VMs

#### Setup Steps

1. **Install Fly CLI**

```bash
curl -L https://fly.io/install.sh | sh
```

2. **Create Dockerfile** (already included below)

3. **Initialize Fly App**

```bash
fly launch --name multi-agent-testing
```

4. **Set Environment Variables**

```bash
fly secrets set SUPABASE_URL=your-url
fly secrets set SUPABASE_ANON_KEY=your-key
fly secrets set SUPABASE_SERVICE_KEY=your-service-key
fly secrets set CONCURRENT_AGENTS=5
fly secrets set HEADLESS=true
```

5. **Deploy**

```bash
fly deploy
```

6. **Scale**

```bash
# Scale up
fly scale count 3

# Scale down
fly scale count 1
```

---

### Option 2: Railway (Easiest, Great UI)

**Cost:** ~$5/month per agent server  
**Scalability:** Easy vertical scaling  
**Setup Time:** 5 minutes

#### Why Railway?

- Deploy from GitHub in 1 click
- Beautiful dashboard
- Automatic HTTPS
- Simple pricing
- Great for startups

#### Setup Steps

1. **Push to GitHub**

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Go to Railway**

- Visit [railway.app](https://railway.app)
- Click "New Project"
- Select "Deploy from GitHub"
- Choose your repository

3. **Add Environment Variables** (in Railway dashboard)

```
SUPABASE_URL=your-url
SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_KEY=your-service-key
CONCURRENT_AGENTS=5
HEADLESS=true
```

4. **Deploy**

- Railway deploys automatically
- Check logs to verify agents started

---

### Option 3: DigitalOcean Droplet (Full Control)

**Cost:** $6-12/month  
**Scalability:** Manual but powerful  
**Setup Time:** 30 minutes

#### Why DigitalOcean?

- Full VM control
- Predictable pricing
- Can run many agents on one server
- Direct SSH access

#### Setup Steps

1. **Create Droplet**

- OS: Ubuntu 22.04 LTS
- Size: 2GB RAM ($12/mo) or 4GB RAM ($24/mo)
- Region: Closest to your users

2. **SSH into Server**

```bash
ssh root@your-droplet-ip
```

3. **Install Dependencies**

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Playwright dependencies
npx playwright install-deps chromium
```

4. **Clone and Setup**

```bash
# Clone your repo
git clone <your-repo-url>
cd yc-supabase

# Install packages
npm install

# Install browsers
npx playwright install chromium

# Setup environment
nano .env
# (paste your environment variables)
```

5. **Install PM2 (Process Manager)**

```bash
npm install -g pm2

# Start system
pm2 start src/index.js --name "agent-system"

# Auto-start on reboot
pm2 startup
pm2 save
```

6. **Monitor**

```bash
pm2 status
pm2 logs agent-system
```

---

### Option 4: AWS ECS with Fargate (Enterprise Scale)

**Cost:** ~$30-100/month (depends on usage)  
**Scalability:** Auto-scaling, unlimited  
**Setup Time:** 1-2 hours

#### Why AWS?

- Enterprise-grade reliability
- Auto-scaling based on load
- Integrates with AWS ecosystem
- Can handle thousands of agents

#### Setup Steps

1. **Create ECR Repository**

```bash
aws ecr create-repository --repository-name multi-agent-testing
```

2. **Build and Push Docker Image**

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <your-ecr-url>

# Build image
docker build -t multi-agent-testing .

# Tag image
docker tag multi-agent-testing:latest <your-ecr-url>/multi-agent-testing:latest

# Push image
docker push <your-ecr-url>/multi-agent-testing:latest
```

3. **Create ECS Cluster**

```bash
aws ecs create-cluster --cluster-name agent-cluster
```

4. **Create Task Definition** (see `aws-task-definition.json` below)

5. **Create Service**

```bash
aws ecs create-service \
  --cluster agent-cluster \
  --service-name agent-service \
  --task-definition agent-task \
  --desired-count 5 \
  --launch-type FARGATE
```

---

## 📦 Docker Configuration

Create `Dockerfile` in project root:

```dockerfile
# Dockerfile
FROM node:18-slim

# Install Playwright dependencies
RUN apt-get update && \
    apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Install Playwright browsers
RUN npx playwright install chromium --with-deps

# Copy application code
COPY . .

# Expose port for health checks (optional)
EXPOSE 3000

# Start the application
CMD ["node", "src/index.js"]
```

Create `.dockerignore`:

```
node_modules
npm-debug.log
.env
.git
.gitignore
logs
screenshots
*.md
.DS_Store
```

---

## 🚀 Production Configuration

### Environment Variables for Production

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Agent Configuration
CONCURRENT_AGENTS=10
HEADLESS=true
SCREENSHOT_QUALITY=60

# Browser (Production)
BROWSER_TYPE=chromium
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080

# Retry
MAX_RETRIES=3
RETRY_DELAY_MS=2000

# Health Check
AGENT_HEARTBEAT_INTERVAL_MS=10000
AGENT_TIMEOUT_MS=600000

# Logging
LOG_LEVEL=info

# Video Recording (for live preview)
ENABLE_VIDEO=true
VIDEO_STREAM_URL=ws://your-domain.com/video-stream
```

---

## 📊 Scaling Strategies

### Vertical Scaling (Bigger Servers)

**When to use:** Starting out, predictable load

```bash
# Increase server resources
# Fly.io
fly scale vm shared-cpu-2x --memory 2048

# Railway
# Use dashboard to select larger instance

# DigitalOcean
# Resize droplet in dashboard
```

### Horizontal Scaling (More Servers)

**When to use:** High volume, need redundancy

```bash
# Fly.io
fly scale count 5  # 5 separate VMs

# Railway
# Deploy to multiple services

# AWS ECS
aws ecs update-service \
  --cluster agent-cluster \
  --service agent-service \
  --desired-count 10
```

### Auto-Scaling (Based on Load)

**When to use:** Variable load, cost optimization

```yaml
# Kubernetes HPA (Horizontal Pod Autoscaler)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: agent-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: agent-deployment
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

## 💰 Cost Comparison

### Light Load (1-10 agents, ~100 tests/day)

| Provider         | Cost/Month | Pros         | Cons              |
| ---------------- | ---------- | ------------ | ----------------- |
| **Fly.io**       | $5-10      | Easy, global | Limited free tier |
| **Railway**      | $5         | Beautiful UI | Single region     |
| **DigitalOcean** | $12        | Full control | Manual setup      |
| **AWS**          | $30+       | Enterprise   | Complex setup     |

### Medium Load (10-50 agents, ~1000 tests/day)

| Provider         | Cost/Month | Pros         | Cons                 |
| ---------------- | ---------- | ------------ | -------------------- |
| **Fly.io**       | $30-60     | Easy scaling | Cost adds up         |
| **Railway**      | $40-80     | Simple       | Higher cost at scale |
| **DigitalOcean** | $24-48     | Predictable  | Manual management    |
| **AWS**          | $100-200   | Auto-scaling | Requires expertise   |

### High Load (100+ agents, ~10,000 tests/day)

| Provider                 | Cost/Month | Recommended      |
| ------------------------ | ---------- | ---------------- |
| **AWS ECS**              | $300-600   | ✅ Yes           |
| **Kubernetes (GKE/EKS)** | $400-800   | ✅ Yes           |
| **DigitalOcean**         | $200-400   | ⚠️ Manual        |
| **Fly.io**               | $500+      | ❌ Too expensive |

---

## 🔒 Security Best Practices

### 1. Use Secrets Management

```bash
# Never commit secrets to Git
# Use environment variables or secret managers

# AWS Secrets Manager
aws secretsmanager create-secret \
  --name supabase-service-key \
  --secret-string "your-secret-key"

# Railway/Fly - Use built-in secrets
fly secrets set SUPABASE_SERVICE_KEY=your-key
```

### 2. Network Security

```bash
# Only allow outbound connections (no inbound needed)
# Agents poll Supabase, don't expose ports

# If using DigitalOcean Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw enable
```

### 3. Regular Updates

```bash
# Set up automatic security updates
apt-get install unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades
```

---

## 📈 Monitoring & Alerts

### Health Check Endpoint (Optional)

Add to `src/index.js`:

```javascript
import express from "express";

const app = express();

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    agents: spawner.agents.length,
    uptime: process.uptime(),
  });
});

app.listen(3000);
```

### Set Up Alerts

```bash
# UptimeRobot - Free monitoring
# - Add your health endpoint
# - Get alerts via email/SMS if down

# Sentry - Error tracking
npm install @sentry/node
```

---

## 🎯 Quick Start Recommendation

**For YC or starting out:**

1. **Start with Railway** ✅

   - Deploy in 5 minutes
   - Free $5 credit
   - Beautiful dashboard
   - Perfect for demos

2. **Scale to Fly.io** when growing

   - More flexible
   - Better pricing at scale
   - Global locations

3. **Move to AWS/GKE** when enterprise-ready
   - Auto-scaling
   - Enterprise features
   - Full control

---

## 📚 Next Steps

1. ✅ Choose hosting provider
2. ✅ Set up Docker container
3. ✅ Configure environment variables
4. ✅ Deploy and test
5. ✅ Set up monitoring
6. ✅ Configure auto-scaling (if needed)

---

## 🆘 Troubleshooting

### Issue: Container keeps restarting

**Check logs:**

```bash
# Fly.io
fly logs

# Railway
# Check logs in dashboard

# Docker
docker logs <container-id>
```

### Issue: High memory usage

**Reduce concurrent agents:**

```env
CONCURRENT_AGENTS=3  # Instead of 5
SCREENSHOT_QUALITY=50  # Reduce from 80
```

### Issue: Tests timing out

**Increase timeout:**

```env
AGENT_TIMEOUT_MS=600000  # 10 minutes
```

---

**Ready to deploy? Choose your platform and follow the steps above!** 🚀
