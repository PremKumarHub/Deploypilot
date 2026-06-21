# DeployMind - AI-Powered Deployment Orchestration Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

**DeployMind** is a sophisticated DevOps orchestration platform that automates application deployments and leverages Generative AI to provide intelligent, automated troubleshooting of deployment failures.

## 🚀 The Problem
Modern deployment pipelines generate thousands of lines of logs across different stages (Build, Docker, Runtime). When a deployment fails, developers often spend hours manually parsing these logs to identify root causes.

## ✨ The Solution
DeployMind automates the entire pipeline—from GitHub ingestion to container deployment—and integrates LLMs (GPT-4) to:
1. **Instantly analyze build/runtime failures.**
2. **Identify precise root causes.**
3. **Provide actionable remediation suggestions.**

## 🛠️ Technology Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, HeroIcons
- **Backend**: Node.js, Express, TypeScript, Sequelize ORM
- **Database**: PostgreSQL
- **Orchestration**: Docker, Docker Compose
- **Intelligence**: OpenAI API (GPT-4)
- **Infrastructure**: Nginx, Linux (Ubuntu)

## 📦 Project Structure
- `frontend/`: Premium Next.js dashboard for real-time monitoring.
- `backend/`: Robust API layer for pipeline management and database interaction.
- `deployment-engine/`: Core logic for container orchestration and system health.

## 🔧 Core Features
- ✅ **Automated Pipeline**: End-to-end orchestration from repository cloning to Docker deployment.
- ✅ **AI Diagnostic Engine**: Intelligent analysis of deployment logs with root-cause detection.
- ✅ **Real-time Ops Console**: High-fidelity dashboard with glassmorphic design and live status updates.
- ✅ **Log Ingestion System**: Centralized collection and storage of build and runtime logs.
- ✅ **Rollback & Health Checks**: (In Progress) Ability to restore previous versions and verify container health.

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Docker & Docker Compose
- OpenAI API Key

### One-Command Setup
Go to the root directory and run:
```bash
docker-compose up --build -d
```
Access the dashboard at `http://localhost:3000`.

## 📈 Impact on Resume
This project demonstrates expertise in:
- **System Architecture**: Designing multi-service distributed systems.
- **DevOps/SRE**: Deep understanding of Docker, CI/CD, and log management.
- **Generative AI**: Practical application of LLMs for operational efficiency.
- **Fullstack Engineering**: Building high-performance, aesthetically premium React applications.

---
Developed with ❤️ for the future of AI-driven DevOps.
