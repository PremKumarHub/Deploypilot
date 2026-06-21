import axios from 'axios';
import OpenAI from 'openai';

export type AIServiceResult = { text: string; provider: 'gemini' | 'openai' | 'local' } | null;

const localAnalyze = async (prompt: string): Promise<AIServiceResult> => {
	// Enhanced rule-based analyzer that returns structured JSON and step-by-step remediation.
	const lower = prompt.toLowerCase();
	const lines = prompt.split(/\n+/).map(l => l.trim()).filter(Boolean);
	const matched: string[] = [];
	for (const l of lines) {
		if (/error|failed|npm err|warning|permission denied|eacces|out of memory|oom|docker not available|address already in use|cannot find module/i.test(l)) {
			matched.push(l);
		}
	}

	let rootCause = 'No significant errors detected';
	let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
	let suggestion = 'Monitor deployment logs for anomalies';
	let remediationSteps: string[] = [];

	if (matched.length > 0) {
		// Prefer the most specific problematic line
		const firstError = matched[0];
		rootCause = firstError.length > 300 ? firstError.substring(0, 300) : firstError;
		const errorCount = (lower.match(/error/g) || []).length + (lower.match(/warning/g) || []).length;
		severity = errorCount > 3 ? 'HIGH' : 'MEDIUM';

		const err = firstError.toLowerCase();
		if (err.includes('git clone') || err.includes('failed to clone') || err.includes('repository not found')) {
			suggestion = 'Repository clone failed. Verify repository URL, access permissions, and network connectivity.';
			remediationSteps.push('Confirm repo URL: `git ls-remote <repo>`');
			remediationSteps.push('Check credentials/access token and repo visibility (public/private).');
			remediationSteps.push('Try cloning locally: `git clone <repo> --branch <branch>`');
		} else if (err.includes('npm err') || err.includes('npm error') || err.includes('missing script: "test"')) {
			suggestion = 'Node/npm issue during install or test phase.';
			remediationSteps.push('Run locally: `npm install` then `npm test` to reproduce the error.');
			remediationSteps.push('Ensure `package.json` contains required scripts and correct Node version.');
			remediationSteps.push('If CI uses different Node, add an `.nvmrc` or specify `engines` in `package.json`.');
		} else if (err.includes('eaddrinuse') || err.includes('address already in use')) {
			suggestion = 'Port already in use on the host.';
			remediationSteps.push('Identify process using port: `lsof -i:<port>` or `netstat -tulpn | grep <port>`');
			remediationSteps.push('Change service port or stop the conflicting process.');
		} else if (err.includes('docker not available') || (err.includes('docker') && err.includes('not'))) {
			suggestion = 'Docker operations unavailable on the runner.';
			remediationSteps.push('Ensure Docker daemon is installed and running on the host.');
			remediationSteps.push('Check permissions: user may need to be in the `docker` group.');
		} else if (err.includes('permission denied') || err.includes('eacces')) {
			suggestion = 'Permission denied during file or command execution.';
			remediationSteps.push('Check file and directory permissions and ownership.');
			remediationSteps.push('Avoid running as root where not necessary; update `chmod`/`chown` as appropriate.');
		} else if (err.includes('out of memory') || err.includes('oom')) {
			suggestion = 'Out of memory during build or tests.';
			remediationSteps.push('Increase available memory on the runner or reduce parallelism.');
			remediationSteps.push('Use swap space or smaller build artifacts.');
		} else if (/tests failed|test failed|failing tests/i.test(err)) {
			suggestion = 'Tests failed; inspect failing tests output.';
			remediationSteps.push('Run tests locally and inspect failure output.');
			remediationSteps.push('Isolate failing tests and add fixes or flakiness guards.');
		} else if (/cannot find module|module not found|import error/i.test(err)) {
			suggestion = 'Module import error; check dependency installations and relative import paths.';
			remediationSteps.push('Verify `node_modules` presence and run `npm ci`/`npm install`.');
			remediationSteps.push('Check import paths and TypeScript `baseUrl`/`paths` configuration.');
		} else {
			suggestion = 'Review full logs and follow error messages to resolve the issue.';
			remediationSteps.push('Inspect full deployment logs via the UI or `GET /api/logs/deployment/:deploymentId`.');
		}

		if (remediationSteps.length > 0) {
			suggestion += '\nSuggested actions:\n' + remediationSteps.map((s, i) => `${i+1}. ${s}`).join('\n');
		}
	}

	const json = { rootCause, severity, suggestion };
	return { text: JSON.stringify(json), provider: 'local' };
};

export const analyzeWithAI = async (prompt: string): Promise<AIServiceResult> => {
	const geminiKey = process.env.GEMINI_API_KEY || '';
	if (geminiKey) {
		try {
			const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${geminiKey}`;
			const response = await axios.post(url, { contents: [{ parts: [{ text: prompt }] }] }, { timeout: 20000 });
			const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
			if (text) return { text, provider: 'gemini' };
		} catch (e: any) {
			console.error('[aiAnalysisService] Gemini error', e.message || e);
		}
	}

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
			console.error('[aiAnalysisService] OpenAI error', e.message || e);
		}
	}

	// 3) Local structured fallback (improved over plain-text fallback)
	try {
		return await localAnalyze(prompt);
	} catch (e: any) {
		console.error('[aiAnalysisService] Local analyze error', e.message || e);
		return null;
	}
};