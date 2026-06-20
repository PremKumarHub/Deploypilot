import { Router } from 'express';
import { Log } from '../models';
import { LogService, LogFilter } from '../services/logService';

const router = Router();
const logService = new LogService();

// Get all logs with filtering
router.get('/', async (req, res) => {
  try {
    const filter: LogFilter = {
      deploymentId: req.query.deploymentId as string,
      logType: req.query.logType as 'BUILD' | 'DOCKER' | 'RUNTIME',
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      search: req.query.search as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const { logs, total } = await logService.getLogs(filter);
    res.json({ logs, total, limit: filter.limit, offset: filter.offset });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs', details: error });
  }
});

// Get logs for a deployment
router.get('/deployment/:deploymentId', async (req, res) => {
  try {
    const logs = await logService.getLogsByDeployment(req.params.deploymentId);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deployment logs' });
  }
});

// Get log statistics
router.get('/stats', async (req, res) => {
  try {
    const deploymentId = req.query.deploymentId as string;
    const stats = await logService.getLogStats(deploymentId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch log statistics' });
  }
});

// Get recent logs
router.get('/recent', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const logs = await logService.getRecentLogs(limit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent logs' });
  }
});

// Search logs
router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    
    const logs = await logService.searchLogs(searchTerm, limit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search logs' });
  }
});

// Create log entry
router.post('/', async (req, res) => {
  try {
    const log = await logService.createLog(req.body);
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create log' });
  }
});

// Delete logs for a deployment
router.delete('/deployment/:deploymentId', async (req, res) => {
  try {
    const count = await logService.deleteLogs(req.params.deploymentId);
    res.json({ message: `Deleted ${count} logs` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete logs' });
  }
});

export default router;
