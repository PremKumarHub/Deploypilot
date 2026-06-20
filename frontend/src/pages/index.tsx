import { useState, useEffect } from 'react';
import axios from 'axios';

interface Deployment {
  id: number;
  deploymentId: string;
  status: string;
  duration: number | null;
  branch: string;
  commitHash: string;
  repo: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deploymentsRes, statsRes] = await Promise.all([
        axios.get('http://localhost:3001/api/deployments'),
        axios.get('http://localhost:3001/api/logs/stats')
      ]);
      
      setDeployments(deploymentsRes.data);
      setLogStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeDeployment = async () => {
    try {
      await axios.post('http://localhost:3001/api/deployments/execute', {
        deploymentId: `DEP${Date.now()}`,
        repo: 'test-repo',
        branch: 'main',
        commitHash: 'abc123',
        environment: 'production'
      });
      fetchData();
    } catch (error) {
      console.error('Failed to execute deployment:', error);
    }
  };

  const analyzeDeployment = async (deploymentId: string) => {
    try {
      await axios.post(`http://localhost:3001/api/analysis/analyze/${deploymentId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to analyze deployment:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">DeployAI Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Total Deployments</h3>
            <p className="text-3xl font-bold">{deployments.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Total Logs</h3>
            <p className="text-3xl font-bold">{logStats?.totalLogs || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Errors</h3>
            <p className="text-3xl font-bold text-red-600">{logStats?.errorCount || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Warnings</h3>
            <p className="text-3xl font-bold text-yellow-600">{logStats?.warningCount || 0}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <button
            onClick={executeDeployment}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Execute New Deployment
          </button>
        </div>

        {/* Deployments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Recent Deployments</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deployment ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deployments.map((deployment) => (
                <tr key={deployment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {deployment.deploymentId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      deployment.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                      deployment.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {deployment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deployment.branch}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deployment.duration ? `${deployment.duration}s` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(deployment.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => analyzeDeployment(deployment.deploymentId)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Analyze
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
