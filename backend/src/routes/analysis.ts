import { Router } from 'express';
import { Analysis } from '../models';
import { AIAnalysisService } from '../services/aiAnalysisService';

const router = Router();
const aiAnalysisService = new AIAnalysisService();

// Get all analysis
router.get('/', async (req, res) => {
  try {
    const analysis = await Analysis.findAll();
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// Get analysis for a deployment
router.get('/deployment/:deploymentId', async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      where: { deploymentId: req.params.deploymentId },
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// Analyze deployment with AI
router.post('/analyze/:deploymentId', async (req, res) => {
  try {
    const result = await aiAnalysisService.analyzeAndSave(req.params.deploymentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze deployment', details: error });
  }
});

// Create analysis
router.post('/', async (req, res) => {
  try {
    const analysis = await Analysis.create(req.body);
    res.status(201).json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create analysis' });
  }
});

export default router;
