"use client";

import { useState, useEffect, useCallback } from "react";

interface Alert {
  id: string;
  level: string;
  category: string;
  message: string;
  metadata: Record<string, unknown>;
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  database: boolean;
  activeAlerts: number;
  uptime: number;
  timestamp: string;
}

interface MonitoringSummary {
  total: number;
  critical: number;
  errors: number;
  warnings: number;
}

export default function MonitoringClient() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [summary, setSummary] = useState<MonitoringSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"active" | "all">("active");
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/monitoring?view=${view}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
        setHealth(data.health);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Error fetching monitoring data:", error);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const resolveAlert = async (alertId: string) => {
    setResolving(alertId);
    try {
      const response = await fetch("/api/admin/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, action: "resolve" }),
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error resolving alert:", error);
    } finally {
      setResolving(null);
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getLevelStyles = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800";
      case "error":
        return "bg-coral-100 dark:bg-coral-900/30 text-coral-800 dark:text-coral-200 border-coral-200 dark:border-coral-800";
      case "warn":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800";
      default:
        return "bg-sage-100 dark:bg-sage-800 text-sage-800 dark:text-sage-200 border-sage-200 dark:border-sage-700";
    }
  };

  const getHealthStatusColor = (status?: string) => {
    switch (status) {
      case "healthy":
        return "bg-primary-500";
      case "degraded":
        return "bg-amber-500";
      case "unhealthy":
        return "bg-red-500";
      default:
        return "bg-sage-400";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-sage-200 dark:bg-sage-700 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-sage-200 dark:bg-sage-700 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-sage-200 dark:bg-sage-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-sage-900 dark:text-white">
          System Monitoring
        </h1>
        <button
          onClick={() => fetchData()}
          className="btn-secondary inline-flex items-center"
        >
          <span className="material-symbols-rounded mr-2">refresh</span>
          Refresh
        </button>
      </div>

      {/* Health Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* System Status */}
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-3 h-3 rounded-full ${getHealthStatusColor(
                health?.status
              )}`}
            />
            <span className="text-sm text-sage-600 dark:text-sage-400">
              System Status
            </span>
          </div>
          <p className="text-xl font-bold text-sage-900 dark:text-white capitalize">
            {health?.status || "Unknown"}
          </p>
        </div>

        {/* Database Status */}
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-rounded text-sage-500 dark:text-sage-400">
              database
            </span>
            <span className="text-sm text-sage-600 dark:text-sage-400">
              Database
            </span>
          </div>
          <p className="text-xl font-bold text-sage-900 dark:text-white">
            {health?.database ? (
              <span className="text-primary-600 dark:text-primary-400">Connected</span>
            ) : (
              <span className="text-red-600 dark:text-red-400">Disconnected</span>
            )}
          </p>
        </div>

        {/* Active Alerts */}
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-rounded text-sage-500 dark:text-sage-400">
              warning
            </span>
            <span className="text-sm text-sage-600 dark:text-sage-400">
              Active Alerts
            </span>
          </div>
          <p className="text-xl font-bold text-sage-900 dark:text-white">
            {health?.activeAlerts || 0}
          </p>
        </div>

        {/* Uptime */}
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-rounded text-sage-500 dark:text-sage-400">
              schedule
            </span>
            <span className="text-sm text-sage-600 dark:text-sage-400">
              Uptime
            </span>
          </div>
          <p className="text-xl font-bold text-sage-900 dark:text-white">
            {health?.uptime ? formatUptime(health.uptime) : "N/A"}
          </p>
        </div>
      </div>

      {/* Alert Summary */}
      {summary && summary.total > 0 && (
        <div className="card p-4">
          <h2 className="font-semibold text-sage-900 dark:text-white mb-3">
            Alert Summary
          </h2>
          <div className="flex gap-4">
            {summary.critical > 0 && (
              <span className="badge bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                {summary.critical} Critical
              </span>
            )}
            {summary.errors > 0 && (
              <span className="badge bg-coral-100 dark:bg-coral-900/30 text-coral-800 dark:text-coral-200">
                {summary.errors} Errors
              </span>
            )}
            {summary.warnings > 0 && (
              <span className="badge bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">
                {summary.warnings} Warnings
              </span>
            )}
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView("active")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            view === "active"
              ? "bg-primary-500 text-white"
              : "bg-sage-100 dark:bg-sage-800 text-sage-700 dark:text-sage-300 hover:bg-sage-200 dark:hover:bg-sage-700"
          }`}
        >
          Active Alerts
        </button>
        <button
          onClick={() => setView("all")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            view === "all"
              ? "bg-primary-500 text-white"
              : "bg-sage-100 dark:bg-sage-800 text-sage-700 dark:text-sage-300 hover:bg-sage-200 dark:hover:bg-sage-700"
          }`}
        >
          All Alerts
        </button>
      </div>

      {/* Alerts List */}
      <div className="card overflow-hidden">
        {alerts.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-rounded text-4xl text-primary-500 mb-2">
              check_circle
            </span>
            <h3 className="text-lg font-medium text-sage-900 dark:text-white mb-1">
              No {view === "active" ? "Active " : ""}Alerts
            </h3>
            <p className="text-sage-600 dark:text-sage-400">
              {view === "active"
                ? "All systems operating normally"
                : "No alerts have been recorded"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-sage-100 dark:divide-sage-800">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 ${
                  alert.resolved ? "opacity-60" : ""
                } ${getLevelStyles(alert.level)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge text-xs uppercase">
                        {alert.level}
                      </span>
                      <span className="badge bg-sage-200 dark:bg-sage-700 text-sage-700 dark:text-sage-300 text-xs">
                        {alert.category}
                      </span>
                      {alert.resolved && (
                        <span className="badge bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs">
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="font-medium mb-1">{alert.message}</p>
                    <p className="text-sm opacity-75">
                      {new Date(alert.createdAt).toLocaleString()}
                      {alert.resolvedAt && (
                        <> • Resolved: {new Date(alert.resolvedAt).toLocaleString()}</>
                      )}
                    </p>
                    {Object.keys(alert.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm cursor-pointer hover:opacity-75">
                          View Details
                        </summary>
                        <pre className="mt-2 p-2 bg-black/10 dark:bg-white/10 rounded text-xs overflow-auto">
                          {JSON.stringify(alert.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  {!alert.resolved && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      disabled={resolving === alert.id}
                      className="btn-secondary shrink-0"
                    >
                      {resolving === alert.id ? (
                        <span className="material-symbols-rounded animate-spin">
                          progress_activity
                        </span>
                      ) : (
                        "Resolve"
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last Updated */}
      <p className="text-sm text-sage-500 dark:text-sage-400 text-center">
        Last updated: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : "N/A"}
        {" • "}Auto-refreshes every 30 seconds
      </p>
    </div>
  );
}
