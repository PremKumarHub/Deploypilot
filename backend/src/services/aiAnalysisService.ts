import OpenAI from 'openai';
import { Analysis, Log } from '../models';

export interface AnalysisRequest {
  deploymentId: string;
  logs: Log[];
}

export interface AnalysisResult {
  rootCause: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestion: string;
  errorPatterns: string[];
  performanceMetrics: {
    buildTime: number;
    deployTime: number;
    errorRate: number;
  };
}

export class AIAnalysisService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
  }

  async analyzeDeployment(request: AnalysisRequest): Promise<AnalysisResult> {
    const { deploymentId, logs } = request;

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return this.getFallbackAnalysis(logs);
    }

    try {
      // Prepare log summary for AI analysis
      const logSummary = this.prepareLogSummary(logs);

      // Call OpenAI API for analysis
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a deployment analysis expert. Analyze deployment logs to identify issues, root causes, and provide actionable suggestions.`
          },
          {
            role: 'user',
            content: `Analyze these deployment logs:\n\n${logSummary}\n\nProvide analysis in JSON format with:
            - rootCause: Main issue description
            - severity: LOW, MEDIUM, or HIGH
            - suggestion: Actionable recommendation
            - errorPatterns: Array of error patterns found
            - performanceMetrics: Object with buildTime, deployTime, errorRate`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return this.normalizeAnalysis(analysis);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getFallbackAnalysis(logs);
    }
  }

  private prepareLogSummary(logs: Log[]): string {
    return logs.map(log => {
      return `[${log.logType}] ${log.content}`;
    }).join('\n');
  }

  private normalizeAnalysis(analysis: any): AnalysisResult {
    return {
      rootCause: analysis.rootCause || 'Unable to determine root cause',
      severity: this.normalizeSeverity(analysis.severity),
      suggestion: analysis.suggestion || 'Review logs manually for issues',
      errorPatterns: Array.isArray(analysis.errorPatterns) ? analysis.errorPatterns : [],
      performanceMetrics: {
        buildTime: analysis.performanceMetrics?.buildTime || 0,
        deployTime: analysis.performanceMetrics?.deployTime || 0,
        errorRate: analysis.performanceMetrics?.errorRate || 0
      }
    };
  }

  private normalizeSeverity(severity: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const upperSeverity = severity?.toUpperCase();
    if (upperSeverity === 'LOW' || upperSeverity === 'MEDIUM' || upperSeverity === 'HIGH') {
      return upperSeverity as 'LOW' | 'MEDIUM' | 'HIGH';
    }
    return 'MEDIUM';
  }

  private getFallbackAnalysis(logs: Log[]): AnalysisResult {
    const errorLogs = logs.filter(log => 
      log.content.toLowerCase().includes('error') || 
      log.content.toLowerCase().includes('failed')
    );
    
    const warningLogs = logs.filter(log => 
      log.content.toLowerCase().includes('warning')
    );

    const errorPatterns = this.extractErrorPatterns(logs);
    
    return {
      rootCause: errorLogs.length > 0 
        ? 'Deployment encountered errors during execution' 
        : 'Deployment completed without critical errors',
      severity: errorLogs.length > 3 ? 'HIGH' : errorLogs.length > 0 ? 'MEDIUM' : 'LOW',
      suggestion: errorLogs.length > 0 
        ? 'Review error logs and fix identified issues before redeploying' 
        : 'Monitor deployment metrics for optimization opportunities',
      errorPatterns,
      performanceMetrics: {
        buildTime: this.estimateBuildTime(logs),
        deployTime: this.estimateDeployTime(logs),
        errorRate: errorLogs.length / logs.length
      }
    };
  }

  private extractErrorPatterns(logs: Log[]): string[] {
    const patterns = new Set<string>();
    
    logs.forEach(log => {
      const content = log.content.toLowerCase();
      
      if (content.includes('timeout')) patterns.add('Timeout issues');
      if (content.includes('memory')) patterns.add('Memory issues');
      if (content.includes('network')) patterns.add('Network connectivity');
      if (content.includes('permission')) patterns.add('Permission errors');
      if (content.includes('dependency')) patterns.add('Dependency conflicts');
      if (content.includes('syntax')) patterns.add('Syntax errors');
    });

    return Array.from(patterns);
  }

  private estimateBuildTime(logs: Log[]): number {
    const buildLogs = logs.filter(log => log.logType === 'BUILD');
    if (buildLogs.length < 2) return 0;
    
    const firstLog = buildLogs[0];
    const lastLog = buildLogs[buildLogs.length - 1];
    
    const timeDiff = new Date(lastLog.timestamp).getTime() - new Date(firstLog.timestamp).getTime();
    return Math.round(timeDiff / 1000); // Return in seconds
  }

  private estimateDeployTime(logs: Log[]): number {
    const deployLogs = logs.filter(log => log.logType === 'DOCKER' || log.logType === 'RUNTIME');
    if (deployLogs.length < 2) return 0;
    
    const firstLog = deployLogs[0];
    const lastLog = deployLogs[deployLogs.length - 1];
    
    const timeDiff = new Date(lastLog.timestamp).getTime() - new Date(firstLog.timestamp).getTime();
    return Math.round(timeDiff / 1000); // Return in seconds
  }

  async saveAnalysis(deploymentId: string, result: AnalysisResult): Promise<Analysis> {
    return await Analysis.create({
      deploymentId,
      rootCause: result.rootCause,
      severity: result.severity,
      suggestion: result.suggestion,
      analyzedAt: new Date()
    });
  }

  async getAnalysis(deploymentId: string): Promise<Analysis | null> {
    return await Analysis.findOne({
      where: { deploymentId }
    });
  }

  async analyzeAndSave(deploymentId: string): Promise<AnalysisResult> {
    const logs = await Log.findAll({
      where: { deploymentId },
      order: [['timestamp', 'ASC']]
    });

    const result = await this.analyzeDeployment({ deploymentId, logs });
    await this.saveAnalysis(deploymentId, result);
    
    return result;
  }
}
