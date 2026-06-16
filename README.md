# DeployAI - AI-Powered Deployment Automation Platform

## Overview

DeployAI is an intelligent DevOps platform that automates application deployments and uses artificial intelligence to analyze and troubleshoot deployment failures.

## Features

- ✅ Automated deployment pipeline
- ✅ AI-powered log analysis
- ✅ Root cause detection
- ✅ Fix recommendations
- ✅ Real-time dashboard
- ✅ Deployment history tracking

## Technology Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB
- **DevOps**: Docker, Docker Compose, GitHub Actions
- **AI**: OpenAI API

## Project Structure

```
deployai/
├── frontend/              # Next.js dashboard
├── backend/               # Node.js/Express API
├── deployment-engine/    # Deployment orchestration
├── docs/                  # Documentation
└── .github/              # GitHub Actions workflows
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker & Docker Compose
- PostgreSQL
- OpenAI API Key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Frontend
   cd frontend && npm install
   
   # Backend
   cd backend && npm install
   
   # Deployment Engine
   cd deployment-engine && npm install
   ```

3. Configure environment variables
4. Start the services:
   ```bash
   docker-compose up
   ```

## Documentation

- [Project Planning](./docs/PROJECT_PLANNING.md)
- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)

## License

MIT
