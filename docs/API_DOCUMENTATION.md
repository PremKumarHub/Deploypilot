# DeployAI - API Documentation

## Base URL

```
http://localhost:3001/api
```

## Authentication

All API endpoints require authentication via API key in the header:

```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### Deployments

#### Create Deployment

**POST** `/deploy`

Trigger a new deployment.

**Request Body:**
```json
{
  "repo": "sample-app",
  "branch": "main",
  "commit": "abc123def456"
}
```

**Response:**
```json
{
  "success": true,
  "deploymentId": "DEP001",
  "status": "PENDING",
  "message": "Deployment started"
}
```

#### Get All Deployments

**GET** `/deployments`

Retrieve all deployments with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by status (PENDING, SUCCESS, FAILED)
- `repo` (optional): Filter by repository
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "deployments": [
    {
      "deploymentId": "DEP001",
      "status": "SUCCESS",
      "duration": "45s",
      "branch": "main",
      "commitHash": "abc123",
      "repo": "sample-app",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

#### Get Deployment by ID

**GET** `/deployments/:deploymentId`

Retrieve details of a specific deployment.

**Response:**
```json
{
  "success": true,
  "deployment": {
    "deploymentId": "DEP001",
    "status": "SUCCESS",
    "duration": "45s",
    "branch": "main",
    "commitHash": "abc123",
    "repo": "sample-app",
    "createdAt": "2024-01-15T10:30:00Z",
    "startedAt": "2024-01-15T10:30:05Z",
    "completedAt": "2024-01-15T10:30:50Z"
  }
}
```

#### Cancel Deployment

**POST** `/deployments/:deploymentId/cancel`

Cancel a running deployment.

**Response:**
```json
{
  "success": true,
  "message": "Deployment cancelled"
}
```

### Logs

#### Get Deployment Logs

**GET** `/deployments/:deploymentId/logs`

Retrieve logs for a specific deployment.

**Query Parameters:**
- `type` (optional): Filter by log type (BUILD, DOCKER, RUNTIME)

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "_id": "log001",
      "deploymentId": "DEP001",
      "logType": "BUILD",
      "content": "npm install completed successfully",
      "timestamp": "2024-01-15T10:30:10Z"
    }
  ]
}
```

#### Search Logs

**GET** `/logs/search`

Search logs by content.

**Query Parameters:**
- `query` (required): Search query
- `limit` (optional): Number of results (default: 50)

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "deploymentId": "DEP001",
      "logType": "BUILD",
      "content": "Error: Module not found",
      "timestamp": "2024-01-15T10:30:15Z"
    }
  ]
}
```

### Analysis

#### Get Deployment Analysis

**GET** `/deployments/:deploymentId/analysis`

Retrieve AI analysis for a deployment.

**Response:**
```json
{
  "success": true,
  "analysis": {
    "deploymentId": "DEP001",
    "rootCause": "Database connection string missing",
    "severity": "HIGH",
    "suggestion": "Add DATABASE_URL to environment variables",
    "analyzedAt": "2024-01-15T10:31:00Z"
  }
}
```

#### Trigger Manual Analysis

**POST** `/deployments/:deploymentId/analyze`

Manually trigger AI analysis for a deployment.

**Response:**
```json
{
  "success": true,
  "message": "Analysis triggered",
  "analysisId": "ANA001"
}
```

### Health

#### Health Check

**GET** `/health`

Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "database": "connected",
  "ai": "available"
}
```

## Error Responses

All endpoints may return error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `UNAUTHORIZED`: Invalid or missing API key
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `INTERNAL_ERROR`: Server error
- `DEPLOYMENT_NOT_FOUND`: Deployment does not exist
- `DEPLOYMENT_ALREADY_RUNNING`: Deployment is already in progress

## Rate Limiting

- 100 requests per minute per API key
- 1000 requests per hour per API key

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

## WebSocket Events

### Deployment Status Updates

Connect to WebSocket endpoint for real-time updates:

```
ws://localhost:3001/ws
```

**Events:**

**deployment.started**
```json
{
  "event": "deployment.started",
  "deploymentId": "DEP001",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**deployment.completed**
```json
{
  "event": "deployment.completed",
  "deploymentId": "DEP001",
  "status": "SUCCESS",
  "duration": "45s",
  "timestamp": "2024-01-15T10:30:50Z"
}
```

**deployment.failed**
```json
{
  "event": "deployment.failed",
  "deploymentId": "DEP001",
  "error": "Build failed",
  "timestamp": "2024-01-15T10:30:30Z"
}
```

**log.appended**
```json
{
  "event": "log.appended",
  "deploymentId": "DEP001",
  "logType": "BUILD",
  "content": "npm install completed",
  "timestamp": "2024-01-15T10:30:10Z"
}
```

## Testing with cURL

### Create Deployment
```bash
curl -X POST http://localhost:3001/api/deploy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"repo":"sample-app","branch":"main","commit":"abc123"}'
```

### Get All Deployments
```bash
curl -X GET http://localhost:3001/api/deployments \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Get Deployment Logs
```bash
curl -X GET http://localhost:3001/api/deployments/DEP001/logs \
  -H "Authorization: Bearer YOUR_API_KEY"
```
