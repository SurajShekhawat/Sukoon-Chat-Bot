"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Cpu,
  Server,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Activity,
  Layers,
  ArrowRight,
  Code,
  Brain,
  MessageSquare,
  Volume2,
  Eye,
  Video,
} from "lucide-react";

interface ProviderData {
  name: string;
  isConfigured: boolean;
  maskedKey: string;
  status: "healthy" | "degraded" | "unconfigured" | "error";
  lastLatencyMs?: number;
  defaultModel: string;
  reasoningModel?: string;
  codingModel?: string;
  ttsModel?: string;
  isPrimary: boolean;
  baseURL?: string;
  licensingTier?: string;
  isDevOnly?: boolean;
  licensingWarning?: string;
}

interface ModelData {
  id: string;
  displayName: string;
  provider: "gemini" | "openai" | "nvidia";
  family: string;
  description: string;
  capabilities: string[];
  contextWindow: number;
  enabled: boolean;
  status: string;
  recommendedTasks: string[];
  pricingEstimate: {
    freeTier: boolean;
    notes?: string;
  };
  licensingTier: string;
}

interface RoutingPolicy {
  task: string;
  preferredProvider?: "gemini" | "openai" | "nvidia";
  preferredModel?: string;
  allowNVIDIA: boolean;
  allowOpenAI: boolean;
  maxFallbacks: number;
}

export function AISettingsView() {
  const [loading, setLoading] = useState(true);
  const [activeProvider, setActiveProvider] = useState<string>("gemini");
  const [providers, setProviders] = useState<Record<string, ProviderData>>({});
  const [models, setModels] = useState<ModelData[]>([]);
  const [routingPolicies, setRoutingPolicies] = useState<RoutingPolicy[]>([]);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; latency?: number }>>({});
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/ai-settings");
      if (res.ok) {
        const data = await res.json();
        setActiveProvider(data.activeProvider);
        setProviders(data.providers);
        setModels(data.models);
        setRoutingPolicies(data.routingPolicies);
      }
    } catch (err) {
      console.error("Failed to load AI settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTestProvider = async (providerKey: string) => {
    setTestingProvider(providerKey);
    try {
      const res = await fetch("/api/admin/ai-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerKey }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setTestResults((prev) => ({
          ...prev,
          [providerKey]: {
            success: true,
            message: data.result.message || "Connection verified successfully.",
            latency: data.result.latencyMs,
          },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [providerKey]: {
            success: false,
            message: data.error || data.result?.message || "Probe failed.",
          },
        }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [providerKey]: {
          success: false,
          message: err.message || "Network error while probing provider.",
        },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleUpdatePolicy = async (task: string, updates: Partial<RoutingPolicy>) => {
    setSaveStatus(`Updating ${task}...`);
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, ...updates }),
      });
      const data = await res.json();

      if (res.ok) {
        setSaveStatus(`Saved ${task} routing policy.`);
        // Update local state
        setRoutingPolicies((prev) =>
          prev.map((p) => (p.task === task ? { ...p, ...updates } : p))
        );
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus(`Error: ${data.error || "Failed to update"}`);
      }
    } catch (err: any) {
      setSaveStatus(`Error: ${err.message}`);
    }
  };

  const getTaskIcon = (task: string) => {
    switch (task) {
      case "COMPANION_CHAT":
      case "EMOTIONAL_SUPPORT":
        return <MessageSquare className="w-4 h-4 text-sukoon-600" />;
      case "COMPLEX_REASONING":
        return <Brain className="w-4 h-4 text-purple-600" />;
      case "CODING":
        return <Code className="w-4 h-4 text-emerald-600" />;
      case "TEXT_TO_SPEECH":
        return <Volume2 className="w-4 h-4 text-amber-600" />;
      case "IMAGE_ANALYSIS":
        return <Eye className="w-4 h-4 text-blue-600" />;
      case "VIDEO_ANALYSIS":
        return <Video className="w-4 h-4 text-rose-600" />;
      default:
        return <Layers className="w-4 h-4 text-slate-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-sukoon-600 animate-spin" />
        <span className="ml-3 text-slate-600 font-medium">Loading AI provider configuration...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 px-4 sm:px-6">
      {/* Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-warm-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-sukoon-100 dark:bg-sukoon-900/50 text-sukoon-700">
              <Cpu className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              AI Infrastructure & Model Settings
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage multi-model routing across Google Gemini, OpenAI, and NVIDIA NIM hosted catalogs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="calm" className="text-sm py-1 px-3">
            Primary Companion: {activeProvider.toUpperCase()}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchSettings}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Licensing Notice */}
      <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <span className="font-semibold text-amber-900 dark:text-amber-200">
            NVIDIA Deployment Safeguard:
          </span>{" "}
          <span className="text-amber-800 dark:text-amber-300">
            NVIDIA Developer Program hosted free endpoints (build.nvidia.com) are licensed for{" "}
            <strong className="underline">DEVELOPMENT_ONLY</strong> (prototyping, testing, and evaluation).
            Commercial production workloads require an enterprise NVIDIA AI Enterprise entitlement or a self-hosted NIM container.
          </span>
        </div>
      </div>

      {saveStatus && (
        <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-sm font-medium animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          {saveStatus}
        </div>
      )}

      {/* Provider Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gemini Card */}
        <Card className="border-warm-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Google Gemini
              </CardTitle>
              {providers.gemini?.isPrimary && (
                <Badge variant="default" className="text-[10px]">Active Default</Badge>
              )}
            </div>
            <CardDescription className="text-xs">Primary streaming companion engine</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-warm-100 dark:border-slate-800">
              <span className="text-slate-500">API Key</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {providers.gemini?.maskedKey}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-warm-100 dark:border-slate-800">
              <span className="text-slate-500">Default Model</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {providers.gemini?.defaultModel}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Status</span>
              <Badge
                variant={
                  providers.gemini?.status === "healthy"
                    ? "calm"
                    : providers.gemini?.status === "unconfigured"
                    ? "secondary"
                    : "danger"
                }
              >
                {providers.gemini?.status?.toUpperCase()}
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              disabled={testingProvider === "gemini" || !providers.gemini?.isConfigured}
              onClick={() => handleTestProvider("gemini")}
            >
              {testingProvider === "gemini" ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 mr-1" />
                  Test Connectivity
                </>
              )}
            </Button>

            {testResults.gemini && (
              <div
                className={`p-2 rounded text-[11px] ${
                  testResults.gemini.success
                    ? "bg-teal-50 text-teal-800 border border-teal-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {testResults.gemini.message}{" "}
                {testResults.gemini.latency && `(${testResults.gemini.latency}ms)`}
              </div>
            )}
          </CardContent>
        </Card>

        {/* NVIDIA NIM Card */}
        <Card className="border-warm-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" />
                NVIDIA NIM
              </CardTitle>
              <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300">
                Accelerated
              </Badge>
            </div>
            <CardDescription className="text-xs">Hosted microservices & reasoning models</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-warm-100 dark:border-slate-800">
              <span className="text-slate-500">API Key</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {providers.nvidia?.maskedKey}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-warm-100 dark:border-slate-800">
              <span className="text-slate-500">Chat Model</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                {providers.nvidia?.defaultModel}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-warm-100 dark:border-slate-800">
              <span className="text-slate-500">Reasoning</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                {providers.nvidia?.reasoningModel}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Licensing</span>
              <Badge variant="secondary" className="text-[10px]">
                {providers.nvidia?.isDevOnly ? "DEV_ONLY" : "ENTERPRISE"}
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              disabled={testingProvider === "nvidia" || !providers.nvidia?.isConfigured}
              onClick={() => handleTestProvider("nvidia")}
            >
              {testingProvider === "nvidia" ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 mr-1" />
                  Test Connectivity
                </>
              )}
            </Button>

            {testResults.nvidia && (
              <div
                className={`p-2 rounded text-[11px] ${
                  testResults.nvidia.success
                    ? "bg-teal-50 text-teal-800 border border-teal-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {testResults.nvidia.message}{" "}
                {testResults.nvidia.latency && `(${testResults.nvidia.latency}ms)`}
              </div>
            )}
          </CardContent>
        </Card>

        {/* OpenAI Card */}
        <Card className="border-warm-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-500" />
                OpenAI
              </CardTitle>
              {providers.openai?.isPrimary && (
                <Badge variant="default" className="text-[10px]">Active Default</Badge>
              )}
            </div>
            <CardDescription className="text-xs">Secondary conversational fallback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-warm-100 dark:border-slate-800">
              <span className="text-slate-500">API Key</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {providers.openai?.maskedKey}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-warm-100 dark:border-slate-800">
              <span className="text-slate-500">Default Model</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {providers.openai?.defaultModel}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Status</span>
              <Badge
                variant={
                  providers.openai?.status === "healthy"
                    ? "calm"
                    : providers.openai?.status === "unconfigured"
                    ? "secondary"
                    : "danger"
                }
              >
                {providers.openai?.status?.toUpperCase()}
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              disabled={testingProvider === "openai" || !providers.openai?.isConfigured}
              onClick={() => handleTestProvider("openai")}
            >
              {testingProvider === "openai" ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 mr-1" />
                  Test Connectivity
                </>
              )}
            </Button>

            {testResults.openai && (
              <div
                className={`p-2 rounded text-[11px] ${
                  testResults.openai.success
                    ? "bg-teal-50 text-teal-800 border border-teal-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {testResults.openai.message}{" "}
                {testResults.openai.latency && `(${testResults.openai.latency}ms)`}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Routing Matrix */}
      <Card className="border-warm-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-sukoon-600" />
            Intelligent Task Routing Policies
          </CardTitle>
          <CardDescription className="text-sm">
            Configure model and provider selection per task category. Emotional support and companion chat remain locked to vetted companion models by default.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-warm-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Task Category</th>
                  <th className="py-3 px-4">Preferred Provider</th>
                  <th className="py-3 px-4">Assigned Model</th>
                  <th className="py-3 px-4 text-center">Allow NVIDIA</th>
                  <th className="py-3 px-4 text-center">Allow OpenAI</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 dark:divide-slate-800">
                {routingPolicies.map((p) => {
                  const eligibleModels = models.filter((m) =>
                    !p.preferredProvider || m.provider === p.preferredProvider
                  );

                  return (
                    <tr key={p.task} className="hover:bg-warm-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-medium flex items-center gap-2">
                        {getTaskIcon(p.task)}
                        <span>{p.task.replace(/_/g, " ")}</span>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          className="bg-white dark:bg-slate-900 border border-warm-300 dark:border-slate-700 rounded-md text-xs py-1.5 px-2.5 focus:ring-1 focus:ring-sukoon-500"
                          value={p.preferredProvider || "gemini"}
                          onChange={(e) => {
                            const newProv = e.target.value as "gemini" | "openai" | "nvidia";
                            handleUpdatePolicy(p.task, { preferredProvider: newProv });
                          }}
                        >
                          <option value="gemini">Google Gemini</option>
                          <option value="nvidia">NVIDIA NIM</option>
                          <option value="openai">OpenAI</option>
                        </select>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          className="bg-white dark:bg-slate-900 border border-warm-300 dark:border-slate-700 rounded-md text-xs py-1.5 px-2.5 max-w-[220px] truncate focus:ring-1 focus:ring-sukoon-500"
                          value={p.preferredModel || ""}
                          onChange={(e) => {
                            handleUpdatePolicy(p.task, { preferredModel: e.target.value });
                          }}
                        >
                          {eligibleModels.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.displayName} ({m.provider})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          className="rounded text-sukoon-600 focus:ring-sukoon-500"
                          checked={p.allowNVIDIA}
                          disabled={p.task === "EMOTIONAL_SUPPORT"} // Protected: never auto-route vulnerable crisis support
                          onChange={(e) => {
                            handleUpdatePolicy(p.task, { allowNVIDIA: e.target.checked });
                          }}
                        />
                      </td>

                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          className="rounded text-sukoon-600 focus:ring-sukoon-500"
                          checked={p.allowOpenAI}
                          onChange={(e) => {
                            handleUpdatePolicy(p.task, { allowOpenAI: e.target.checked });
                          }}
                        />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Badge variant="outline" className="text-[10px]">
                          Max FB: {p.maxFallbacks}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Model Catalog & Capabilities Table */}
      <Card className="border-warm-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-600" />
            Registered Model Catalog & Capability Matrix
          </CardTitle>
          <CardDescription className="text-sm">
            Exact model slugs, verified capabilities, context limits, and licensing tiers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl border border-warm-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {m.displayName}
                      <Badge variant={m.provider === "nvidia" ? "calm" : "secondary"} className="text-[10px]">
                        {m.provider.toUpperCase()}
                      </Badge>
                    </h3>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">{m.id}</p>
                  </div>
                  <Badge variant={m.status === "active" ? "default" : "outline"} className="text-[10px]">
                    {m.status}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {m.description}
                </p>

                <div className="flex flex-wrap gap-1 pt-1">
                  {m.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono"
                    >
                      {cap}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-warm-100 dark:border-slate-800 text-[11px] text-slate-500">
                  <span>Context: {(m.contextWindow / 1000).toFixed(0)}k</span>
                  <span className="font-medium text-amber-700 dark:text-amber-400">
                    {m.licensingTier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
