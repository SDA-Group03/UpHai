import React, { useState } from "react";
import { Play, Square, Trash2, Search, Filter } from "lucide-react";

type ModelStatus = "running" | "stopped" | "terminated";

interface DeployedModel {
  id: string;
  name: string;
  series: string;
  size: string;
  status: ModelStatus;
  endpoint: string;
  uptime: string;
  requests: number;
  lastActive: string;
  cost: number;
}

// MOCK DATA
const mockDeployedModels: DeployedModel[] = [
  {
    id: "1",
    name: "Qwen 2 (1.5B)",
    series: "Qwen",
    size: "934 MB",
    status: "running",
    endpoint: "https://api.uphai.com/v1/qwen-2-1.5b",
    uptime: "5d 12h",
    requests: 45230,
    lastActive: "2 min ago",
    cost: 12.45,
  },
  {
    id: "2",
    name: "Gemma (2B)",
    series: "Gemma",
    size: "1400 MB",
    status: "running",
    endpoint: "https://api.uphai.com/v1/gemma-2b",
    uptime: "3d 8h",
    requests: 28940,
    lastActive: "5 min ago",
    cost: 8.9,
  },
  {
    id: "3",
    name: "Llama 3.2 (3B)",
    series: "Llama",
    size: "2000 MB",
    status: "stopped",
    endpoint: "https://api.uphai.com/v1/llama-3.2-3b",
    uptime: "0h",
    requests: 12450,
    lastActive: "2 hours ago",
    cost: 0,
  },
  {
    id: "4",
    name: "Phi-3 (3.8B)",
    series: "Phi",
    size: "2300 MB",
    status: "running",
    endpoint: "https://api.uphai.com/v1/phi-3-3.8b",
    uptime: "1d 4h",
    requests: 8920,
    lastActive: "1 min ago",
    cost: 4.2,
  },
  {
    id: "5",
    name: "Mistral (7B)",
    series: "Mistral",
    size: "4100 MB",
    status: "stopped",
    endpoint: "https://api.uphai.com/v1/mistral-7b",
    uptime: "0h",
    requests: 34120,
    lastActive: "1 day ago",
    cost: 0,
  },
  {
    id: "6",
    name: "Llama 3.1 (8B)",
    series: "Llama",
    size: "4700 MB",
    status: "running",
    endpoint: "https://api.uphai.com/v1/llama-3.1-8b",
    uptime: "7d 2h",
    requests: 67890,
    lastActive: "Just now",
    cost: 18.75,
  },
];

// MODEL CARD COMPONENT
interface ModelCardProps {
  model: DeployedModel;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onTerminate: (id: string) => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, onStart, onStop, onTerminate }) => {
  // Status badge styling based on model status
  const getStatusBadge = () => {
    switch (model.status) {
      case "running":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Running
          </span>
        );
      case "stopped":
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full flex items-center gap-1">
            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
            Stopped
          </span>
        );
      case "terminated":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Terminated
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {model.series} • {model.size}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 mb-1">Uptime</p>
          <p className="text-sm font-semibold text-gray-900">{model.uptime}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Requests</p>
          <p className="text-sm font-semibold text-gray-900">{model.requests.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Last Active</p>
          <p className="text-sm font-semibold text-gray-900">{model.lastActive}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Cost (24h)</p>
          <p className="text-sm font-semibold text-gray-900">${model.cost.toFixed(2)}</p>
        </div>
      </div>

      {/* Endpoint */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Endpoint</p>
        <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded block truncate">{model.endpoint}</code>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onStart(model.id)}
          disabled={model.status === "running"}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          <Play size={16} />
          Start
        </button>

        <button
          onClick={() => onStop(model.id)}
          disabled={model.status === "stopped"}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          <Square size={16} />
          Stop
        </button>

        <button
          onClick={() => onTerminate(model.id)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          <Trash2 size={16} />
          Terminate
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function Dashboard() {
  // State management
  const [models, setModels] = useState<DeployedModel[]>(mockDeployedModels);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ModelStatus | "all">("all");

  // Action handlers
  const handleStart = (id: string) => {
    setModels((prev) =>
      prev.map((model) => (model.id === id ? { ...model, status: "running" as ModelStatus } : model)),
    );
    console.log("Starting model:", id);
  };

  const handleStop = (id: string) => {
    setModels((prev) =>
      prev.map((model) => (model.id === id ? { ...model, status: "stopped" as ModelStatus, uptime: "0h" } : model)),
    );
    console.log("Stopping model:", id);
  };

  const handleTerminate = (id: string) => {
    const confirmTerminate = window.confirm(
      "Are you sure you want to terminate this model? This action cannot be undone.",
    );
    if (confirmTerminate) {
      setModels((prev) =>
        prev.map((model) =>
          model.id === id ? { ...model, status: "terminated" as ModelStatus, uptime: "0h" } : model,
        ),
      );
      console.log("Terminating model:", id);
    }
  };

  // Filtered models based on search and status
  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.series.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || model.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const runningCount = models.filter((m) => m.status === "running").length;
  const totalRequests = models.reduce((sum, m) => sum + m.requests, 0);
  const totalCost = models.reduce((sum, m) => sum + m.cost, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Deployment Dashboard</h1>
          <p className="text-gray-600">Manage and monitor your deployed models</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total Models</p>
            <p className="text-2xl font-bold text-gray-900">{models.length}</p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Running</p>
            <p className="text-2xl font-bold text-green-600">{runningCount}</p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900">{totalRequests.toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Cost (24h)</p>
            <p className="text-2xl font-bold text-purple-600">${totalCost.toFixed(2)}</p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ModelStatus | "all")}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="running">Running</option>
                <option value="stopped">Stopped</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Model Cards Grid */}
        {filteredModels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                onStart={handleStart}
                onStop={handleStop}
                onTerminate={handleTerminate}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-500">No models found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
