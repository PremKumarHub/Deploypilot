# DeployAI - Architecture

## System Architecture

```
┌─────────────────┐
│ Developer       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Repo     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│ Node.js Deployment API   │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Deployment Engine        │
│ Clone Repo               │
│ Build App                │
│ Dockerize                │
│ Deploy                   │
└──────────┬───────────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
 MongoDB      Docker
     │           │
     └─────┬─────┘
           ▼
┌──────────────────────────┐
│ AI Analysis Service      │
│ OpenAI API               │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Next.js Dashboard        │
└──────────────────────────┘
```

## Project Flow

### Step 1: Developer Pushes Code
```bash
git push origin main
```

### Step 2: GitHub Actions Triggered
- GitHub Actions sends POST request to deployment API
- Payload: `{ "repo": "sample-app", "branch": "main" }`

### Step 3: Deployment Created
- Backend creates deployment record in PostgreSQL
- Status: PENDING

### Step 4: Deployment Engine Starts
- Clone Repository
- Install Dependencies
- Build Application
- Create Docker Image
- Run Container

### Step 5: Success Scenario
- Store metrics
- Update dashboard
- Status: SUCCESS

### Step 6: Failure Scenario
- Collect logs
- AI analysis
- Generate suggestions
- Status: FAILED

## Component Architecture

### Frontend (Next.js Dashboard)
- Deployment List View
- Deployment Details Page
- Logs Viewer
- AI Insights Panel

### Backend (Node.js/Express API)
- REST API Endpoints
- Deployment Orchestration
- Log Processing
- AI Integration

### Deployment Engine
- Git Clone Module
- Build Module
- Docker Module
- Container Management

### Database (PostgreSQL)
- Users Table
- Deployments Table
- Logs Table
- Analysis Table

### AI Analysis Service
- Log Analysis
- Root Cause Detection
- Fix Recommendations

## Project Structure

```
deployai/
├── frontend/              # Next.js dashboard
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── styles/
│   ├── public/
│   └── package.json
├── backend/               # Node.js/Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   └── package.json
├── deployment-engine/    # Deployment orchestration
│   ├── src/
│   │   ├── clone.js
│   │   ├── build.js
│   │   ├── docker.js
│   │   └── deploy.js
│   └── package.json
├── docs/                  # Documentation
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── deploy.yml
└── README.md
```

## Data Flow

### Deployment Request Flow
1. GitHub Actions → Backend API (POST /deploy)
2. Backend API → MongoDB (Create deployment record)
3. Backend API → Deployment Engine (Start deployment)
4. Deployment Engine → Git (Clone repository)
5. Deployment Engine → Build System (Install & build)
6. Deployment Engine → Docker (Build image & run container)
7. Deployment Engine → MongoDB (Update deployment status)
8. Deployment Engine → AI Service (Analyze logs if failed)
9. AI Service → MongoDB (Store analysis results)
10. Frontend → Backend API (Fetch deployment data)
11. Frontend → Display results

### Log Collection Flow
1. Deployment Engine captures build logs
2. Deployment Engine captures Docker logs
3. Deployment Engine captures runtime logs
4. Logs stored in PostgreSQL
5. AI Service retrieves logs for analysis
6. Frontend displays logs in viewer

## Technology Stack Details

### Frontend Stack
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Hooks

### Backend Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Sequelize
- **AI Integration**: OpenAI API
- **HTTP Client**: Axios

### DevOps Stack
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **CI/CD**: GitHub Actions
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt

## Security Considerations

- API Key authentication for deployment triggers
- Environment variables for sensitive data
- PostgreSQL authentication
- SSL/TLS for all communications
- Input validation on all API endpoints
- Rate limiting on API endpoints
