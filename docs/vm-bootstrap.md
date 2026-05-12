# Nutanix VM Bootstrap Guide

This guide provisions an Ubuntu VM on Nutanix and prepares it for Docker Compose hosting.

## 1) VM Provisioning (Nutanix)

- Guest OS: Ubuntu Server 22.04 LTS or 24.04 LTS
- Recommended size (beta):
  - vCPU: 4
  - RAM: 8 GB
  - Disk: 80 GB
- Network:
  - Static private IP
  - DNS A record (recommended)
  - Security group / ACL for SSH (22), HTTP (80), HTTPS (443), app ports if needed

## 2) OS Preparation

```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install ca-certificates curl gnupg lsb-release git ufw nginx
```

Set timezone (optional):

```bash
sudo timedatectl set-timezone America/New_York
```

## 3) Install Docker Engine + Compose Plugin

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Allow your user to run Docker:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

## 4) Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

## 5) Reverse Proxy + TLS (Nginx + Let's Encrypt)

Install certbot:

```bash
sudo apt -y install certbot python3-certbot-nginx
```

Create an Nginx site block pointing to frontend `localhost:3000` and (optional) backend `localhost:4000`.
Then request cert:

```bash
sudo certbot --nginx -d <your-domain>
```

## 6) Directory Layout on VM

Recommended:

```bash
sudo mkdir -p /opt/ntnx-translator
sudo chown -R $USER:$USER /opt/ntnx-translator
```

Clone repository into `/opt/ntnx-translator` and use `docs/deploy-runbook.md` for first deploy.

