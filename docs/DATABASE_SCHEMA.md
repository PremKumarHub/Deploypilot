# DeployAI - Database Schema

## Database Overview

**Database**: PostgreSQL  
**Tables**: users, deployments, logs, analysis

## Tables

### users Table

Stores user authentication and profile information.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'developer' CHECK (role IN ('admin', 'developer', 'viewer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

### deployments Table

Stores deployment records and status.

```sql
CREATE TABLE deployments (
  id SERIAL PRIMARY KEY,
  deployment_id VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
  duration VARCHAR(20),
  branch VARCHAR(255),
  commit_hash VARCHAR(255),
  repo VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_deployments_deployment_id ON deployments(deployment_id);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_created_at ON deployments(created_at);
CREATE INDEX idx_deployments_repo_branch ON deployments(repo, branch);
```

### logs Table

Stores deployment logs from different stages.

```sql
CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  deployment_id VARCHAR(50) NOT NULL,
  log_type VARCHAR(20) NOT NULL CHECK (log_type IN ('BUILD', 'DOCKER', 'RUNTIME')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (deployment_id) REFERENCES deployments(deployment_id) ON DELETE CASCADE
);

CREATE INDEX idx_logs_deployment_id ON logs(deployment_id);
CREATE INDEX idx_logs_log_type ON logs(log_type);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
```

### analysis Table

Stores AI analysis results for failed deployments.

```sql
CREATE TABLE analysis (
  id SERIAL PRIMARY KEY,
  deployment_id VARCHAR(50) UNIQUE NOT NULL,
  root_cause TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
  suggestion TEXT NOT NULL,
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (deployment_id) REFERENCES deployments(deployment_id) ON DELETE CASCADE
);

CREATE INDEX idx_analysis_deployment_id ON analysis(deployment_id);
CREATE INDEX idx_analysis_severity ON analysis(severity);
```

## Relationships

```
users (1) ────── (N) deployments
deployments (1) ── (N) logs
deployments (1) ── (1) analysis
```

## Sequelize Models

### User Model

```javascript
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'developer', 'viewer'),
    defaultValue: 'developer'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});
```

### Deployment Model

```javascript
const Deployment = sequelize.define('Deployment', {
  deploymentId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'deployment_id'
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED'),
    defaultValue: 'PENDING'
  },
  duration: DataTypes.STRING(20),
  branch: DataTypes.STRING(255),
  commitHash: {
    type: DataTypes.STRING(255),
    field: 'commit_hash'
  },
  repo: DataTypes.STRING(255),
  startedAt: {
    type: DataTypes.DATE,
    field: 'started_at'
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at'
  }
}, {
  tableName: 'deployments',
  timestamps: true,
  underscored: true
});
```

### Log Model

```javascript
const Log = sequelize.define('Log', {
  deploymentId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'deployment_id'
  },
  logType: {
    type: DataTypes.ENUM('BUILD', 'DOCKER', 'RUNTIME'),
    allowNull: false,
    field: 'log_type'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'logs',
  timestamps: true,
  underscored: true
});
```

### Analysis Model

```javascript
const Analysis = sequelize.define('Analysis', {
  deploymentId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'deployment_id'
  },
  rootCause: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'root_cause'
  },
  severity: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
    allowNull: false
  },
  suggestion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  analyzedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'analyzed_at'
  }
}, {
  tableName: 'analysis',
  timestamps: true,
  underscored: true
});
```

## Database Operations

### Common Queries

**Get all deployments**
```sql
SELECT * FROM deployments ORDER BY created_at DESC;
```

**Get deployment by ID**
```sql
SELECT * FROM deployments WHERE deployment_id = 'DEP001';
```

**Get logs for deployment**
```sql
SELECT * FROM logs WHERE deployment_id = 'DEP001' ORDER BY timestamp ASC;
```

**Get analysis for deployment**
```sql
SELECT * FROM analysis WHERE deployment_id = 'DEP001';
```

**Get failed deployments**
```sql
SELECT * FROM deployments WHERE status = 'FAILED';
```

**Get deployments by repository**
```sql
SELECT * FROM deployments WHERE repo = 'sample-app';
```

**Get deployment with logs and analysis**
```sql
SELECT d.*, 
       (SELECT json_agg(l) FROM logs l WHERE l.deployment_id = d.deployment_id) as logs,
       (SELECT row_to_json(a) FROM analysis a WHERE a.deployment_id = d.deployment_id) as analysis
FROM deployments d
WHERE d.deployment_id = 'DEP001';
```

## Data Validation

### Deployment Status
- Must be one of: PENDING, SUCCESS, FAILED
- Default: PENDING
- Enforced by CHECK constraint

### Log Type
- Must be one of: BUILD, DOCKER, RUNTIME
- Required field
- Enforced by CHECK constraint

### Severity
- Must be one of: LOW, MEDIUM, HIGH
- Required field
- Enforced by CHECK constraint

### User Role
- Must be one of: admin, developer, viewer
- Default: developer
- Enforced by CHECK constraint

## Performance Considerations

- Use indexes on frequently queried fields
- Implement pagination for deployment lists (LIMIT/OFFSET)
- Consider partitioning for large log tables
- Use connection pooling (pg-pool)
- Use EXPLAIN ANALYZE for query optimization
- Consider materialized views for complex queries

## Backup Strategy

- Daily automated backups using pg_dump
- Retention policy: 30 days
- Point-in-time recovery using WAL archiving
- Cross-region replication for production
- Use pgBackRest for enterprise backup solutions

### Backup Commands

**Full backup**
```bash
pg_dump -U admin -d deployai -F c -f /backup/deployai_$(date +%Y%m%d).dump
```

**Restore backup**
```bash
pg_restore -U admin -d deployai /backup/deployai_20240115.dump
```

**Automated backup script**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/postgresql"
mkdir -p $BACKUP_DIR
pg_dump -U admin -d deployai -F c -f $BACKUP_DIR/deployai_$DATE.dump
# Keep only last 30 days
find $BACKUP_DIR -name "deployai_*.dump" -mtime +30 -delete
```
