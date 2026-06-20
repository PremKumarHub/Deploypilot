import express from 'express';
import { DeploymentService, DeploymentConfig } from './deploymentService';

const app = express();
const PORT = process.env.PORT || 3002;
const deploymentService = new DeploymentService();

app.use(express.json());

// Execute deployment
app.post('/deploy', async (req, res) => {
  try {
    const config: DeploymentConfig = req.body;
    const deployment = await deploymentService.executeDeployment(config);
    res.status(200).json(deployment);
  } catch (error) {
    res.status(500).json({ error: 'Deployment failed', details: error });
  }
});

// Rollback deployment
app.post('/rollback/:deploymentId', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const deployment = await deploymentService.rollbackDeployment(deploymentId);
    res.status(200).json(deployment);
  } catch (error) {
    res.status(500).json({ error: 'Rollback failed', details: error });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Deployment Engine' });
});

app.listen(PORT, () => {
  console.log(`Deployment Engine running on port ${PORT}`);
});
