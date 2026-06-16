# DeployAI - Deployment Guide

## Local Development Setup

### Prerequisites

- Node.js (v18+)
- Docker & Docker Compose
- Git
- PostgreSQL (local or cloud)
- OpenAI API Key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/deployai.git
cd deployai
```

2. **Install dependencies**
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# Deployment Engine
cd ../deployment-engine
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
DATABASE_URL=postgresql://admin:password@localhost:5432/deployai
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
NODE_ENV=development
DEPLOYMENT_API_KEY=your_deployment_api_key_here
GITHUB_TOKEN=your_github_token_here
```

4. **Start PostgreSQL**
```bash
# Using Docker Compose
docker-compose up -d postgres

# Or use local PostgreSQL
# Make sure PostgreSQL is installed and running
# Create database: createdb deployai
```

5. **Start the application**
```bash
# Start all services
docker-compose up

# Or start individually
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev

# Deployment Engine
cd deployment-engine
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Dashboard: http://localhost:3000/dashboard

## Production Deployment

### Server Setup

1. **Provision a Linux server**
- Oracle Cloud Free Tier (recommended)
- AWS EC2 (free tier available)
- Ubuntu 20.04+ recommended

2. **Connect to server**
```bash
ssh ubuntu@your-server-ip
```

3. **Update system**
```bash
sudo apt update && sudo apt upgrade -y
```

4. **Install Docker**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

5. **Install Docker Compose**
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

6. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

7. **Install Nginx**
```bash
sudo apt install -y nginx
```

### Application Deployment

1. **Clone repository**
```bash
cd /var/www
sudo git clone https://github.com/yourusername/deployai.git
sudo chown -R $USER:$USER deployai
cd deployai
```

2. **Configure environment variables**
```bash
cp .env.example .env
nano .env
```

Set production values:
```env
DATABASE_URL=postgresql://admin:password@localhost:5432/deployai
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
NODE_ENV=production
DEPLOYMENT_API_KEY=your_deployment_api_key_here
GITHUB_TOKEN=your_github_token_here
```

3. **Build and start services**
```bash
# Build Docker images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

4. **Configure Nginx**

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/deployai
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/deployai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. **Setup SSL with Let's Encrypt**

Install Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

Auto-renewal is configured automatically.

### PostgreSQL Setup (Production)

**Option 1: Local PostgreSQL**

```bash
# Create PostgreSQL container
docker run -d \
  --name deployai-postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=your_secure_password \
  -e POSTGRES_DB=deployai \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16
```

**Option 2: Cloud PostgreSQL**

1. Create account at a cloud provider:
   - Supabase (free tier available)
   - Neon (free tier available)
   - AWS RDS (free tier available)
2. Create a database instance
3. Get connection string
4. Update `DATABASE_URL` in `.env`

### GitHub Actions Configuration

1. **Add secrets to GitHub repository**
- Go to repository Settings → Secrets and variables → Actions
- Add following secrets:
  - `DEPLOYMENT_API_URL`: Your backend API URL
  - `DEPLOYMENT_API_KEY`: Your deployment API key

2. **Configure workflow**

The workflow file is already created at `.github/workflows/deploy.yml`

Update the workflow with your API URL if needed.

### Monitoring

**View logs**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Check service status**
```bash
docker-compose ps
```

**Restart services**
```bash
docker-compose restart
```

**Update application**
```bash
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

### Troubleshooting

**PostgreSQL connection issues**
```bash
# Check PostgreSQL container
docker ps | grep postgres
docker logs deployai-postgres

# Test connection
docker exec -it deployai-postgres psql -U admin -d deployai
```

**Port already in use**
```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>
```

**Nginx issues**
```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log
```

**Docker issues**
```bash
# Clean up
docker system prune -a

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Security Best Practices

1. **Use strong passwords** for MongoDB and API keys
2. **Enable firewall** (UFW)
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```
3. **Keep system updated**
```bash
sudo apt update && sudo apt upgrade -y
```
4. **Use SSH key authentication** instead of passwords
5. **Regular backups** of MongoDB data
6. **Monitor logs** for suspicious activity

### Backup Strategy

**PostgreSQL Backup**
```bash
# Create backup
docker exec deployai-postgres pg_dump -U admin deployai > /backup/deployai_$(date +%Y%m%d).sql

# Restore backup
docker exec -i deployai-postgres psql -U admin deployai < /backup/deployai_20240115.sql
```

**Automated Backup Script**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/postgresql"
mkdir -p $BACKUP_DIR
docker exec deployai-postgres pg_dump -U admin deployai > $BACKUP_DIR/deployai_$DATE.sql
# Keep only last 30 days
find $BACKUP_DIR -name "deployai_*.sql" -mtime +30 -delete
```

Add to crontab for daily backups:
```bash
0 2 * * * /path/to/backup-script.sh
```
