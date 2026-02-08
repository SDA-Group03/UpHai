import React, { useState, useEffect } from "react";
import { Play, Square, Trash2, Search, Filter, Loader2, AlertCircle } from "lucide-react";
import { getDeployedInstances, terminateInstances, stopInstances, startInstances } from "../services/dockerService";
import { fetchProfile } from "../services/authService";

// --- TYPES ---
type ModelStatus = "running" | "stopped" | "terminated";

export interface DeployedModel {
  id: string;
  name: string;
  series: string;
  size: string;
  status: ModelStatus;
  endpoint: string;
  uptime: string;
  lastActive: string;
  categories: string;
  icon?: string;
  startedAt?: string;
}

type ModelData = DeployedModel;

// ฟังก์ชันคำนวณ uptime แบบ real-time
function calculateUptime(startedAt: string | undefined, status: ModelStatus): string {
  if (!startedAt || status !== "running") {
    return "0s";
  }

  const ms = Date.now() - new Date(startedAt).getTime();
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

async function fetchModels(): Promise<ModelData[]> {
  try {
    // 1. Get User Profile
    const userProfile = await fetchProfile();

    // 2. Get Instances
    const response = await getDeployedInstances(userProfile.id.toString());

    console.log("API Response for Instances:", response);

    let instances: any[] = [];

    if (Array.isArray(response)) {
      instances = response;
    } else if (response && Array.isArray(response.data)) {
      instances = response.data;
    } else if (response && Array.isArray(response.instances)) {
      instances = response.instances;
    } else {
      console.warn("Unexpected API response structure. Expected array, got:", response);
      return [];
    }

    // 4. Map the data safely
    return instances.map((inst: any) => ({
      id: inst.id || inst._id || "unknown-id",
      name: inst.modelId || inst.name || "Unnamed Model",
      series: inst.engine || inst.series || "Custom",
      size: inst.size || "Standard",
      status: (inst.status as ModelStatus) || "stopped",
      endpoint: inst.endpoint || "Pending...",
      uptime: inst.uptime || "0s",
      lastActive: inst.lastActive || "Recently",
      categories: inst.categories || "AI Model",
      startedAt: inst.startedAt, // เก็บ timestamp
    }));
  } catch (error) {
    console.error("Failed to fetch models:", error);
    throw error;
  }
}

interface ModelCardProps {
  model: DeployedModel;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onTerminate: (id: string) => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, onStart, onStop, onTerminate }) => {
  // State สำหรับ real-time uptime
  const [currentUptime, setCurrentUptime] = useState(model.uptime);

  // Update uptime ทุกวินาที
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUptime(calculateUptime(model.startedAt, model.status));
    }, 60000);

    return () => clearInterval(interval);
  }, [model.startedAt, model.status]);

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
          <p className="text-sm font-semibold text-gray-900">{currentUptime}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Last Active</p>
          <p className="text-sm font-semibold text-gray-900">{model.lastActive}</p>
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
  const [models, setModels] = useState<DeployedModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ModelStatus | "all">("all");

  // ฟังก์ชันสำหรับ fetch ข้อมูล (แยกออกมาเพื่อใช้ซ้ำ)
  const loadModels = async () => {
    try {
      const data = await fetchModels();
      setModels(data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching models:", err);
      setError(err.message || "An unknown error occurred while fetching models.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminate = async (id: string) => {
    const confirmTerminate = window.confirm(
      "Are you sure you want to terminate this model? This action cannot be undone.",
    );

    if (!confirmTerminate) return;

    try {
      await terminateInstances(id);
      setModels((prevModels) => prevModels.filter((model) => model.id !== id));
    } catch (err: any) {
      console.error("Failed to terminate:", err);
      alert(err.message || "Failed to terminate the instance. Please try again.");
    }
  };

  // Fetch Data on Mount
  useEffect(() => {
    setIsLoading(true);
    loadModels();
  }, []);

  // Auto-refresh ทุก 1 นาที (60000ms)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing models data...");
      loadModels();
    }, 60000); // 60 วินาที

    return () => clearInterval(refreshInterval);
  }, []);

  // Action handlers
  const handleStart = async (id: string) => {
    try {
      await startInstances(id);
      // Refresh ข้อมูลหลังจาก start
      await loadModels();
    } catch (err) {
      console.error("Failed to start:", err);
      alert("Failed to start the instance. Please try again.");
    }
  };

  const handleStop = async (id: string) => {
    try {
      await stopInstances(id);
      // Refresh ข้อมูลหลังจาก stop
      await loadModels();
    } catch (err) {
      console.error("Failed to stop:", err);
      alert("Failed to stop the instance. Please try again.");
    }
  };

  // Filter logic
  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.series.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || model.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const runningCount = models.filter((m) => m.status === "running").length;

  return (
    <div className="min-h-screen bg-gray-50 p-6 overflow-auto">
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
            <p className="text-2xl font-bold text-gray-900">{isLoading ? "-" : models.length}</p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Running</p>
            <p className="text-2xl font-bold text-green-600">{isLoading ? "-" : runningCount}</p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
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
              </select>
            </div>
          </div>
        </div>

        {/* Content Area: Loading / Error / Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={40} className="text-purple-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading models...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-700 flex flex-col items-center">
            <AlertCircle size={40} className="mb-2" />
            <p className="font-semibold">Error Loading Data</p>
            <p>{error}</p>
            <button
              onClick={() => {
                setIsLoading(true);
                loadModels();
              }}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Retry
            </button>
          </div>
        ) : filteredModels.length > 0 ? (
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
