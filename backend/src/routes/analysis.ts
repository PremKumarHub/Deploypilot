import { Router, Request, Response } from 'express';
import { Analysis, Log, Deployment } from '../models';
import axios from 'axios';
import OpenAI from 'openai';

const router = Router();

// Try available AI providers in order: Gemini -> OpenAI -> null
type AIResult = { text: string; provider: 'gemini' | 'openai' };
const callAI = async (prompt: string): Promise<AIResult | null> => {
  // 1) Gemini via REST
  const geminiKey = process.env.GEMINI_API_KEY || '';
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${geminiKey}`;
      const response = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }]
      }, { timeout: 20000 });
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return { text, provider: 'gemini' };
    } catch (e: any) {
      console.error('[Gemini REST Error]', e.response?.status, e.response?.data?.error?.message || e.message);
    }
  }

  // 2) OpenAI via official SDK
  const openaiKey = process.env.OPENAI_API_KEY || '';
  if (openaiKey) {
    try {
      const client = new OpenAI({ apiKey: openaiKey });
      const model = process.env.OPENAI_MODEL || 'gpt-4';
      const resp: any = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1500
      });
      const content = resp?.choices?.[0]?.message?.content;
      if (content) return { text: content, provider: 'openai' };
    } catch (e: any) {
      console.error('[OpenAI Error]', e.message || e);
    }
  }

  // No provider worked
  return null;
};

// Local deterministic 'AI' fallback that returns a JSON string.
const localAIAnalyze = (logSummary: string): string => {
  const lower = logSummary.toLowerCase();
  let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let rootCause = 'No significant issues detected';
  let suggestion = 'Monitor application health and logs.';

  if (lower.includes('error') || lower.includes('failed') || lower.includes('npm err')) {
    const lines = logSummary.split('\n').map(l => l.trim()).filter(Boolean);
    const firstErrorLine = lines.find(l => /error|failed|npm err|warning/i.test(l)) || lines[0] || logSummary;
    rootCause = firstErrorLine.length > 300 ? firstErrorLine.substring(0, 300) : firstErrorLine;
    const errorCount = (lower.match(/error/g) || []).length + (lower.match(/warning/g) || []).length;
    severity = errorCount > 3 ? 'HIGH' : 'MEDIUM';
    suggestion = `Fix: ${rootCause}. Check full logs for details.`;
  }

  // Return strict JSON string (no markdown)
  return JSON.stringify({ rootCause, severity, suggestion });
};

// Get all analysis
router.get('/', async (req: Request, res: Response) => {
  try {
    const analysis = await Analysis.findAll();
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// Get analysis for a deployment
router.get('/deployment/:deploymentId', async (req: Request, res: Response) => {
  try {
    const analysis = await Analysis.findOne({ where: { deploymentId: req.params.deploymentId } });
    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// Analyze deployment with Gemini AI
router.post('/analyze/:deploymentId', async (req: Request, res: Response) => {
  const { deploymentId } = req.params;
  try {
    const logs = await Log.findAll({ where: { deploymentId } });
    console.log(`[AI Analysis] ${logs.length} logs found for ${deploymentId}`);

    let rootCause: string;
    let severity: 'LOW' | 'MEDIUM' | 'HIGH';
    let suggestion: string;
    let providerUsed: string = 'fallback';
    let localAnalyzerOutput: string | undefined = undefined;

    if (logs.length === 0) {
      rootCause = 'No logs found for this deployment';
      severity = 'LOW';
      suggestion = 'Trigger a new deployment to generate logs for analysis';
    } else {
      const logSummary = logs.map(l => `[${l.logType}] ${l.content}`).join('\n');
      const prompt = `You are a senior DevOps engineer. Analyze these deployment logs and respond ONLY with a valid JSON object, no markdown, no extra text:\n\n${logSummary}\n\nRespond with exactly this JSON:\n{"rootCause":"specific technical reason for success or failure","severity":"LOW or MEDIUM or HIGH","suggestion":"specific commands or steps to fix the issue"}`;

      console.log('[AI Analysis] Calling AI providers...');
      const aiResult = await callAI(prompt);

      if (aiResult) {
        providerUsed = aiResult.provider;
        console.log(`[AI Analysis] ${providerUsed} responded. Parsing...`);
        try {
          const cleaned = aiResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const json = JSON.parse(cleaned);
          rootCause = json.rootCause || 'Analysis complete';
          severity = (['LOW', 'MEDIUM', 'HIGH'].includes(json.severity) ? json.severity : 'MEDIUM') as any;
          suggestion = json.suggestion || 'Review detailed logs for more information';
          console.log('[AI Analysis] SUCCESS:', rootCause.substring(0, 100));
        } catch (parseErr: any) {
            console.error('[AI Analysis] JSON parse failed. Falling back to local deterministic analyzer. Error:', parseErr.message || parseErr);
            // Try deterministic local analyzer on the original logs summary to avoid using raw AI echo as root cause
            try {
            const localJsonText = localAIAnalyze(logSummary);
            localAnalyzerOutput = localJsonText;
            const localJson = JSON.parse(localJsonText);
              rootCause = localJson.rootCause || 'Analysis complete';
              severity = (['LOW', 'MEDIUM', 'HIGH'].includes(localJson.severity) ? localJson.severity : 'MEDIUM') as any;
              suggestion = localJson.suggestion || 'Review detailed logs for more information';
              providerUsed = `${providerUsed || 'ai'}-fallback-to-local`;
              console.log('[AI Analysis] Fallback local analysis used. Root:', rootCause.substring(0, 100));
            } catch (localErr: any) {
              console.error('[AI Analysis] Local fallback failed as well:', localErr.message || localErr);
              // As a last resort, use raw AI text but mark accordingly so UI can display clearly
              rootCause = 'AI Report: ' + aiResult.text.substring(0, 300);
              severity = 'MEDIUM';
              suggestion = 'See root cause field for AI analysis output';
            }
        }
      } else {
        // Use deterministic local AI fallback that returns structured JSON
        console.warn('[AI Analysis] No external AI provider responded, using local AI fallback');
        providerUsed = 'local';

        // Prefer extracting the first problematic log entry directly from the logs
        const problemLog = logs.find(l => /error|failed|npm err|warning/i.test(l.content));
        if (problemLog) {
          const firstLine = (problemLog.content.split('\n')[0] || problemLog.content).trim();
          console.log('[AI Analysis] Using problemLog for fallback:', firstLine.substring(0,200));
          localAnalyzerOutput = firstLine;
          rootCause = `[${problemLog.logType}] ${firstLine}`;
          const lower = problemLog.content.toLowerCase();
          const errorCount = (lower.match(/error/g) || []).length + (lower.match(/warning/g) || []).length;
          severity = errorCount > 3 ? 'HIGH' : 'MEDIUM';
          suggestion = `Fix: ${firstLine}. Check full logs for details.`;
        } else {
          // Fallback to the string-based analyzer if no single problematic log found
          try {
            const aiText = localAIAnalyze(logSummary);
            localAnalyzerOutput = aiText;
            const json = JSON.parse(aiText);
            rootCause = json.rootCause || 'Analysis complete';
            severity = (['LOW', 'MEDIUM', 'HIGH'].includes(json.severity) ? json.severity : 'MEDIUM') as any;
            suggestion = json.suggestion || 'Review detailed logs for more information';
          } catch (e: any) {
            console.error('[AI Analysis] local AI JSON parse failed', e.message || e);
            rootCause = 'Local AI failed to produce JSON';
            severity = 'MEDIUM';
            suggestion = 'See logs for local AI output';
          }
        }
      }
    }

    // Log final analysis values and any local analyzer output for debugging
    console.log('[AI Analysis] Final analysis:', { providerUsed, rootCause: rootCause?.substring(0,200), severity, suggestion: suggestion?.substring(0,200), localAnalyzerOutput: localAnalyzerOutput ? localAnalyzerOutput.substring(0,1000) : undefined });

    // Save to DB (include providerUsed). Ensure Deployment exists to satisfy FK.
    await Deployment.findOrCreate({ where: { deploymentId }, defaults: { deploymentId, repo: 'unknown' } });
    const data = { deploymentId, rootCause, severity, suggestion, providerUsed, analyzedAt: new Date() };
    const existing = await Analysis.findOne({ where: { deploymentId } });
    if (existing) {
      await existing.update(data);
    } else {
      await Analysis.create(data);
    }

    res.json({ rootCause, severity, suggestion, providerUsed, errorPatterns: [], performanceMetrics: { buildTime: 0, deployTime: 0, errorRate: 0 } });
  } catch (error: any) {
    console.error('[AI Analysis] Fatal error:', error.message);
    res.status(500).json({ error: 'Failed to analyze deployment', details: error.message });
  }
});

// Create analysis manually
router.post('/', async (req: Request, res: Response) => {
  try {
    const analysis = await Analysis.create(req.body);
    res.status(201).json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create analysis' });
  }
});

// Return raw external AI provider response for a deployment (no local fallback)
router.post('/analyze/raw/:deploymentId', async (req: Request, res: Response) => {
  const { deploymentId } = req.params;
  try {
    const logs = await Log.findAll({ where: { deploymentId } });
    if (!logs || logs.length === 0) return res.status(404).json({ error: 'No logs found for this deployment' });
    const logSummary = logs.map(l => `[${l.logType}] ${l.content}`).join('\n');
    const prompt = `You are a senior DevOps engineer. Analyze these deployment logs and respond ONLY with a valid JSON object, no markdown, no extra text:\n\n${logSummary}\n\nRespond with exactly this JSON:\n{"rootCause":"specific technical reason for success or failure","severity":"LOW or MEDIUM or HIGH","suggestion":"specific commands or steps to fix the issue"}`;

    console.log('[AI Analysis/raw] Calling external AI providers...');
    const aiResult = await callAI(prompt);
    if (aiResult) {
      return res.json({ provider: aiResult.provider, text: aiResult.text });
    }
    return res.status(502).json({ error: 'No external AI provider responded' });
  } catch (error: any) {
    console.error('[AI Analysis/raw] Fatal error:', error.message || error);
    res.status(500).json({ error: 'Failed to call AI provider', details: error.message });
  }
});

export default router;
