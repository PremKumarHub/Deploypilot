import { Router } from 'express';
import { Deployment, Log, Analysis } from '../models';
import { DeploymentService, DeploymentConfig } from '../services/deploymentService';

const router = Router();
const deploymentService = new DeploymentService();

// Get all deployments
router.get('/', async (req, res) => {
  try {
    const deployments = await Deployment.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json(deployments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deployments' });
  }
});

// Get deployment by ID
router.get('/:id', async (req, res) => {
  try {
    const deployment = await Deployment.findOne({
      where: { deploymentId: req.params.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    res.json(deployment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deployment', details: error });
  }
});

// Create new deployment
router.post('/', async (req, res) => {
  try {
    const deployment = await Deployment.create(req.body);
    res.status(201).json(deployment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create deployment' });
  }
});

// Execute deployment (Deployment Engine)
router.post('/execute', async (req, res) => {
  try {
    const config: DeploymentConfig = req.body;
    const deployment = await deploymentService.executeDeployment(config);
    res.status(200).json(deployment);
  } catch (error) {
    res.status(500).json({ error: 'Deployment execution failed', details: error });
  }
});

// Rollback deployment
router.post('/rollback/:deploymentId', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const deployment = await deploymentService.rollbackDeployment(deploymentId);
    res.status(200).json(deployment);
  } catch (error) {
    res.status(500).json({ error: 'Rollback failed', details: error });
  }
});

// Update deployment status
router.patch('/:id', async (req, res) => {
  try {
    const deployment = await Deployment.findOne({
      where: { deploymentId: req.params.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    await deployment.update(req.body);
    res.json(deployment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update deployment' });
  }
});

export default router;
