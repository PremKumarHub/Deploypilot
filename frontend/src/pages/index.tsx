import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  RocketLaunchIcon, 
  CpuChipIcon, 
  CommandLineIcon, 
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface Deployment {
  id: number;
  deploymentId: string;
  status: string;
  duration: string | null;
  branch: string;
  commitHash: string;
  repo: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface Analysis {
  id: number;
  deploymentId: string;
  rootCause: string;
  severity: string;
  suggestion: string;
  analyzedAt: string;
}

interface LogStats {
  totalLogs: number;
  logsByType: Record<string, number>;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

export default function Dashboard() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [logStats, setLogStats] = useState<LogStats | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, Analysis>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [deploymentsRes, statsRes] = await Promise.all([
        axios.get('http://localhost:3001/api/deployments'),
        axios.get('http://localhost:3001/api/logs/stats')
      ]);
      
      setDeployments(deploymentsRes.data);
      setLogStats(statsRes.data);
      
      const analysisPromises = deploymentsRes.data.map((dep: Deployment) =>
        axios.get(`http://localhost:3001/api/analysis/deployment/${dep.deploymentId}`)
          .catch(() => null)
      );
      
      const analysisResults = await Promise.all(analysisPromises);
      const analysisMap: Record<string, Analysis> = {};
      analysisResults.forEach((res, index) => {
        if (res?.data) {
          analysisMap[deploymentsRes.data[index].deploymentId] = res.data;
        }
      });
      setAnalyses(analysisMap);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const executeDeployment = async () => {
    try {
      const repoUrl = prompt('Enter GitHub repository URL:');
      if (!repoUrl) return;
      
      const branch = prompt('Enter branch name:', 'main') || 'main';
      
      await axios.post('http://localhost:3001/api/deployments/execute', {
        deploymentId: `DEP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        repo: repoUrl,
        branch: branch,
        commitHash: 'latest',
        environment: 'production'
      });
      fetchData();
    } catch (error) {
      alert('Deployment trigger failed. Ensure backend is running.');
    }
  };

  const analyzeDeployment = async (deploymentId: string) => {
    setRefreshing(true);
    try {
      console.log('Requesting AI Analysis for:', deploymentId);
      await axios.post(`http://localhost:3001/api/analysis/analyze/${deploymentId}`);
      await fetchData();
    } catch (error) {
      console.error('Analysis Request Failed:', error);
      alert('Analysis failed. Verify the backend connection.');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-medium tracking-widest uppercase text-xs">Initializing Console</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 selection:bg-blue-500/30">
      {/* Background Glow */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse capitalize"></div>
      </div>

      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <RocketLaunchIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Deploy<span className="text-blue-500">Mind</span></span>
          </div>
          <div className="flex items-center space-x-6">
            <button 
              onClick={fetchData} 
              className={`p-2 rounded-lg hover:bg-white/5 transition ${refreshing ? 'animate-spin text-blue-400' : 'text-slate-400'}`}
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
            <div className="h-4 w-px bg-white/10"></div>
            <button
              onClick={executeDeployment}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-blue-600/20 active:scale-95"
            >
              New Deployment
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-10">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">Operations Center</h1>
          <p className="text-slate-500">Orchestration and intelligent analysis of your cloud-native deployments.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Pipelines', value: deployments.length, icon: CpuChipIcon, color: 'blue' },
            { label: 'Ingested Logs', value: logStats?.totalLogs || 0, icon: CommandLineIcon, color: 'slate' },
            { label: 'Critical Errors', value: logStats?.errorCount || 0, icon: ExclamationTriangleIcon, color: 'red' },
            { label: 'Active Builds', value: deployments.filter(d => d.status === 'PENDING').length, icon: BeakerIcon, color: 'indigo' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-500`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Main Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white">Deployment Pipeline</h2>
            <div className="flex items-center space-x-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>Live Monitor Active</span>
            </div>
          </div>

          {deployments.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-2xl p-20 text-center">
              <p className="text-slate-500">No pipelines have been orchestrated yet.</p>
            </div>
          ) : (
            deployments.map((dep) => (
              <div key={dep.id} className="group relative bg-[#0f0f12] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300">
                <div className="px-6 py-5 flex items-center justify-between">
                  {/* Pipeline Info */}
                  <div className="flex items-center space-x-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-slate-500 uppercase tracking-tight">{dep.deploymentId}</span>
                      <span className="font-semibold text-slate-200 mt-1 max-w-[200px] truncate">{dep.repo.split('/').pop()}</span>
                    </div>
                    
                    <div className="h-8 w-px bg-white/5"></div>
                    
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Status</span>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        {dep.status === 'SUCCESS' ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        ) : dep.status === 'FAILED' ? (
                          <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                        ) : (
                          <div className="w-3 h-3 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        )}
                        <span className={`text-xs font-bold ${
                          dep.status === 'SUCCESS' ? 'text-green-500' :
                          dep.status === 'FAILED' ? 'text-red-500' : 'text-blue-400'
                        }`}>
                          {dep.status}
                        </span>
                      </div>
                    </div>

                    <div className="hidden lg:flex flex-col">
                      <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Environment</span>
                      <span className="text-xs text-slate-400 mt-1">Production</span>
                    </div>

                    <div className="hidden lg:flex flex-col">
                      <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Duration</span>
                      <div className="flex items-center space-x-1 text-slate-400 mt-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        <span className="text-xs font-mono">{dep.duration || '--'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => analyzeDeployment(dep.deploymentId)}
                      disabled={refreshing}
                      className="bg-blue-600/10 hover:bg-blue-600/20 px-4 py-2 rounded-lg text-xs font-bold text-blue-400 border border-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {refreshing ? 'Analyzing...' : 'Retrieve AI Insights'}
                    </button>
                  </div>
                </div>

                {/* AI Insights Card (Conditional) */}
                {analyses[dep.deploymentId] && (() => {
                  const analysis = analyses[dep.deploymentId];
                  // Sanitize obvious false-positive root causes (e.g., initial log echoed as root cause)
                  let displayRoot = analysis.rootCause || 'No significant issues detected';
                  let displaySuggestion = analysis.suggestion || 'Monitor application health and logs.';
                  if (dep.status === 'SUCCESS' && /starting deployment process/i.test(displayRoot)) {
                    displayRoot = 'No significant issues detected';
                    displaySuggestion = 'Deployment succeeded; no remediation required.';
                  }

                  return (
                    <div className="mx-6 mb-6 p-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
                      <div className="bg-[#0f0f12] rounded-lg p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-white">AI Diagnostic Report</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
                              analysis.severity === 'HIGH' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                              analysis.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                              'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            }`}>
                              {analysis.severity} Impact
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">{new Date(analysis.analyzedAt).toLocaleString()}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Identified Root Cause</p>
                            <p className="text-sm text-slate-200 leading-relaxed">{displayRoot}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Remediation Suggestion</p>
                            <p className="text-sm text-slate-200 leading-relaxed">{displaySuggestion}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
