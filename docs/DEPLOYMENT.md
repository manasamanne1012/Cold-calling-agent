# AI Cold Call Agent Website Deployment Guide

This document outlines the steps to deploy the AI Cold Call Agent Website to your Vultr server.

## Prerequisites
- Vultr server running Ubuntu
- Docker and Docker Compose installed
- Nginx installed

## Step 1: Upload Project Files
Use SCP to upload the project files to your server:

```bash
scp -r ./ai-cold-call-website/* YOUR_USER@YOUR_SERVER_IP:~/applications/ai-cold-call-website/
```

## Step 2: Create Required Directories
```bash
mkdir -p ~/applications/ai-cold-call-website/data/workflow-history
mkdir -p ~/applications/ai-cold-call-website/data/contacts-local
```

## Step 3: Update Environment Variables
```bash
cd ~/applications/ai-cold-call-website
cp .env.example .env
```

Edit the `.env` file with your specific settings:
```
PORT=3000
GOOGLE_SHEET_ID=YOUR_GOOGLE_SHEET_ID
GOOGLE_SHEET_RANGE='AI Cold Call'!A:Z
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY

# n8n Integration - Update with your server IP
N8N_BASE_URL=http://YOUR_SERVER_IP/n8n
N8N_WEBHOOK_PATH=/webhook/ai-cold-call
```

## Step 4: Configure Nginx
```bash
sudo cp ~/applications/ai-cold-call-website/nginx.conf /etc/nginx/sites-available/ai-cold-call
sudo ln -s /etc/nginx/sites-available/ai-cold-call /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## Step 5: Set Up n8n
```bash
mkdir -p ~/applications/n8n
cd ~/applications/n8n

# Create docker-compose.yml for n8n
cat > docker-compose.yml << 'EOF'
version: '3'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=YOUR_N8N_PASSWORD
      - N8N_HOST=n8n
      - N8N_PORT=5678
      - NODE_ENV=production
    volumes:
      - ./n8n_data:/home/node/.n8n
    networks:
      - n8n-network

networks:
  n8n-network:
    driver: bridge
EOF

# Start n8n
docker-compose up -d
```

## Step 6: Start the Website
```bash
cd ~/applications/ai-cold-call-website
docker-compose up -d
```

## Step 7: Configure n8n Workflow
1. Access n8n at http://YOUR_SERVER_IP/n8n/
2. Login with your n8n credentials
3. Create a new workflow with a Webhook node:
   - Set the Method to POST
   - Set the Path to "ai-cold-call"
   - Save the node
4. Add other nodes for your cold calling workflow
5. Activate the workflow

## Step 8: Test the Integration
1. Visit your website at http://YOUR_SERVER_IP/
2. Try triggering a workflow using the dashboard
3. Check n8n to confirm the workflow execution

## Troubleshooting
- Check Docker logs: `docker logs -f <container_id>`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Restart services if needed: 
  ```
  docker-compose restart  # In respective directories
  sudo systemctl restart nginx
  ```
