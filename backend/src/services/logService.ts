import { Log } from '../models';
import { Op } from 'sequelize';

export interface LogFilter {
  deploymentId?: string;
  logType?: 'BUILD' | 'DOCKER' | 'RUNTIME';
  startDate?: Date;
  endDate?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface LogStats {
  totalLogs: number;
  logsByType: Record<string, number>;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

export class LogService {
  async getLogs(filter: LogFilter): Promise<{ logs: Log[]; total: number }> {
    const whereClause: any = {};
    
    if (filter.deploymentId) {
      whereClause.deploymentId = filter.deploymentId;
    }
    
    if (filter.logType) {
      whereClause.logType = filter.logType;
    }
    
    if (filter.startDate || filter.endDate) {
      whereClause.timestamp = {};
      if (filter.startDate) {
        whereClause.timestamp[Op.gte] = filter.startDate;
      }
      if (filter.endDate) {
        whereClause.timestamp[Op.lte] = filter.endDate;
      }
    }
    
    if (filter.search) {
      whereClause.content = {
        [Op.like]: `%${filter.search}%`
      };
    }
    
    const total = await Log.count({ where: whereClause });
    
    const logs = await Log.findAll({
      where: whereClause,
      order: [['timestamp', 'DESC']],
      limit: filter.limit || 100,
      offset: filter.offset || 0
    });
    
    return { logs, total };
  }
  
  async getLogStats(deploymentId?: string): Promise<LogStats> {
    const whereClause: any = deploymentId ? { deploymentId } : {};
    
    const totalLogs = await Log.count({ where: whereClause });
    
    const logsByType: Record<string, number> = {};
    const types: ('BUILD' | 'DOCKER' | 'RUNTIME')[] = ['BUILD', 'DOCKER', 'RUNTIME'];
    
    for (const type of types) {
      logsByType[type] = await Log.count({
        where: {
          ...whereClause,
          logType: type
        }
      });
    }
    
    const errorLogs = await Log.count({
      where: {
        ...whereClause,
        content: { [Op.iLike]: '%error%' }
      }
    });
    
    const warningLogs = await Log.count({
      where: {
        ...whereClause,
        content: { [Op.iLike]: '%warning%' }
      }
    });
    
    const infoLogs = await Log.count({
      where: {
        ...whereClause,
        content: { [Op.iLike]: '%info%' }
      }
    });
    
    return {
      totalLogs,
      logsByType,
      errorCount: errorLogs,
      warningCount: warningLogs,
      infoCount: infoLogs
    };
  }
  
  async getRecentLogs(limit: number = 10): Promise<Log[]> {
    return await Log.findAll({
      order: [['timestamp', 'DESC']],
      limit
    });
  }
  
  async getLogsByDeployment(deploymentId: string): Promise<Log[]> {
    return await Log.findAll({
      where: { deploymentId },
      order: [['timestamp', 'ASC']]
    });
  }
  
  async createLog(logData: {
    deploymentId: string;
    logType: 'BUILD' | 'DOCKER' | 'RUNTIME';
    content: string;
  }): Promise<Log> {
    return await Log.create({
      ...logData,
      timestamp: new Date()
    });
  }
  
  async deleteLogs(deploymentId: string): Promise<number> {
    return await Log.destroy({
      where: { deploymentId }
    });
  }
  
  async searchLogs(searchTerm: string, limit: number = 50): Promise<Log[]> {
    return await Log.findAll({
      where: {
        content: {
          [Op.like]: `%${searchTerm}%`
        }
      },
      order: [['timestamp', 'DESC']],
      limit
    });
  }
}
