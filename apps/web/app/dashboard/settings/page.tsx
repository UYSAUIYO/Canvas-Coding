"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";

const PRESET_MODELS = [
  { value: "gpt-5.5", label: "GPT-5.5" },
  { value: "gpt-5.5-instant", label: "GPT-5.5 Instant" },
  { value: "gpt-5.4", label: "GPT-5.4" },
  { value: "gpt-5.4-mini", label: "GPT-5.4 Mini" },
  { value: "o3", label: "o3 (Reasoning)" },
  { value: "o4-mini", label: "o4 Mini" },
  { value: "claude-fable-5", label: "Claude Fable 5" },
  { value: "claude-opus-4-8", label: "Claude Opus 4.8" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
  { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { value: "gemini-3.1-pro", label: "Gemini 3.1 Pro" },
  { value: "gemini-3-flash", label: "Gemini 3 Flash" },
  { value: "deepseek-chat", label: "DeepSeek V3" },
  { value: "deepseek-reasoner", label: "DeepSeek R1" },
];

const CUSTOM_VALUE = "__custom__";

type ApiFormat = "openai" | "anthropic" | "google";

interface CustomProvider {
  id: string;
  name: string;
  apiKey: string;
  baseUrl: string;
  format: ApiFormat;
}

const FORMAT_LABELS: Record<ApiFormat, string> = {
  openai: "OpenAI 兼容（/v1/chat/completions）",
  anthropic: "Anthropic 协议（/v1/messages）",
  google: "Google 协议（generateContent）",
};

function createId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export default function SettingsPage() {
  const router = useRouter();

  // 基础字段
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [model, setModel] = useState("gpt-5.5");
  const [customModel, setCustomModel] = useState("");
  const [saved, setSaved] = useState(false);

  // Provider 选择
  const [selectedProvider, setSelectedProvider] = useState<
    "openai" | "anthropic" | "google" | string
  >("openai");

  // 自定义平台
  const [customProviders, setCustomProviders] = useState<CustomProvider[]>([]);

  const isPreset = PRESET_MODELS.some((m) => m.value === model);
  const selectValue = isPreset ? model : CUSTOM_VALUE;
  const isCustomProvider = selectedProvider.startsWith("custom:");

  useEffect(() => {
    setApiKey(localStorage.getItem("llm_api_key") || "");
    setBaseUrl(
      localStorage.getItem("llm_base_url") || "https://api.openai.com/v1",
    );
    setAnthropicKey(localStorage.getItem("llm_anthropic_key") || "");
    setGoogleKey(localStorage.getItem("llm_google_key") || "");
    setModel(localStorage.getItem("llm_model") || "gpt-5.5");
    setSelectedProvider(
      localStorage.getItem("llm_selected_provider") || "openai",
    );

    const stored = localStorage.getItem("llm_model") || "";
    if (stored && !PRESET_MODELS.some((m) => m.value === stored)) {
      setCustomModel(stored);
    }

    try {
      const savedCustom = JSON.parse(
        localStorage.getItem("llm_custom_providers") || "[]",
      );
      setCustomProviders(savedCustom);
    } catch {
      setCustomProviders([]);
    }
  }, []);

  const handleSave = () => {
    const finalModel = isPreset ? model : customModel;
    localStorage.setItem("llm_api_key", apiKey);
    localStorage.setItem("llm_base_url", baseUrl);
    localStorage.setItem("llm_anthropic_key", anthropicKey);
    localStorage.setItem("llm_google_key", googleKey);
    localStorage.setItem("llm_model", finalModel);
    localStorage.setItem("llm_selected_provider", selectedProvider);
    localStorage.setItem(
      "llm_custom_providers",
      JSON.stringify(customProviders),
    );
    if (!isPreset) setModel(finalModel);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addCustomProvider = () => {
    setCustomProviders((prev) => [
      ...prev,
      {
        id: createId(),
        name: "",
        apiKey: "",
        baseUrl: "https://api.openai.com/v1",
        format: "openai",
      },
    ]);
  };

  const updateCustom = (
    id: string,
    patch: Partial<CustomProvider>,
  ) => {
    setCustomProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
  };

  const removeCustom = (id: string) => {
    setCustomProviders((prev) => prev.filter((p) => p.id !== id));
    if (selectedProvider === `custom:${id}`) {
      setSelectedProvider("openai");
    }
  };

  // ============================================================
  const providerTabs = [
    { key: "openai" as const, label: "OpenAI 兼容", icon: "🔵" },
    { key: "anthropic" as const, label: "Anthropic", icon: "🟠" },
    { key: "google" as const, label: "Google Gemini", icon: "🟢" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LLM 设置</h1>
          <p className="mt-1 text-sm text-gray-500">
            选择平台并配置 API 接口参数
          </p>
        </div>
      </div>

      <Separator className="mb-6" />

      <div className="flex flex-col gap-6">
        {/* ========== Provider 单选 ========== */}
        <div>
          <Label className="mb-2 block">选择平台</Label>
          <div className="flex flex-wrap gap-2">
            {providerTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedProvider(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  selectedProvider === tab.key
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}

            {/* 自定义平台按钮 */}
            {customProviders.map((cp) => (
              <button
                key={cp.id}
                type="button"
                onClick={() => setSelectedProvider(`custom:${cp.id}`)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  selectedProvider === `custom:${cp.id}`
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                ⚙️ {cp.name || "新平台"}
              </button>
            ))}
          </div>
        </div>

        {/* ========== OpenAI 配置 ========== */}
        {selectedProvider === "openai" && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-600">
              🔵 OpenAI / 兼容 API
            </h3>
            <div className="flex flex-col gap-4 rounded-lg border border-blue-200 bg-blue-50/30 p-4">
              <div>
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Base URL</Label>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-400">
                  中转 API 或 DeepSeek 填对应地址
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========== Anthropic 配置 ========== */}
        {selectedProvider === "anthropic" && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-600">
              🟠 Anthropic Claude
            </h3>
            <div className="flex flex-col gap-4 rounded-lg border border-orange-200 bg-orange-50/30 p-4">
              <div>
                <Label>Anthropic API Key</Label>
                <Input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-400">
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    获取 Anthropic API Key
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========== Google 配置 ========== */}
        {selectedProvider === "google" && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-600">
              🟢 Google Gemini
            </h3>
            <div className="flex flex-col gap-4 rounded-lg border border-green-200 bg-green-50/30 p-4">
              <div>
                <Label>Google API Key</Label>
                <Input
                  type="password"
                  value={googleKey}
                  onChange={(e) => setGoogleKey(e.target.value)}
                  placeholder="AIza..."
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-400">
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    获取 Google API Key
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========== 自定义平台配置 ========== */}
        {isCustomProvider && (() => {
          const cp = customProviders.find(
            (p) => `custom:${p.id}` === selectedProvider,
          );
          if (!cp) return null;
          return (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-600">
                ⚙️ 自定义平台
              </h3>
              <div className="flex flex-col gap-4 rounded-lg border border-purple-200 bg-purple-50/30 p-4">
                <div>
                  <Label>平台名称</Label>
                  <Input
                    value={cp.name}
                    onChange={(e) =>
                      updateCustom(cp.id, { name: e.target.value })
                    }
                    placeholder="如：阿里百炼"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>API 协议格式</Label>
                  <Select
                    value={cp.format}
                    onValueChange={(v) =>
                      updateCustom(cp.id, { format: v as ApiFormat })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">
                        {FORMAT_LABELS.openai}
                      </SelectItem>
                      <SelectItem value="anthropic">
                        {FORMAT_LABELS.anthropic}
                      </SelectItem>
                      <SelectItem value="google">
                        {FORMAT_LABELS.google}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={cp.apiKey}
                    onChange={(e) =>
                      updateCustom(cp.id, { apiKey: e.target.value })
                    }
                    placeholder="输入 API Key"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Base URL</Label>
                  <Input
                    value={cp.baseUrl}
                    onChange={(e) =>
                      updateCustom(cp.id, { baseUrl: e.target.value })
                    }
                    placeholder="https://api.example.com/v1"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========== 自定义平台管理 ========== */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>自定义平台</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addCustomProvider}
            >
              <Plus className="mr-1 h-3 w-3" />
              添加
            </Button>
          </div>

          {customProviders.length === 0 ? (
            <p className="text-xs text-gray-400">
              暂无自定义平台，点击「添加」创建（如阿里百炼、豆包等）
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {customProviders.map((cp) => (
                <div
                  key={cp.id}
                  className={`flex items-center justify-between rounded-md border p-2 text-sm ${
                    selectedProvider === `custom:${cp.id}`
                      ? "border-purple-300 bg-purple-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProvider(`custom:${cp.id}`)}
                      className="text-left hover:underline"
                    >
                      ⚙️ {cp.name || "未命名"}
                    </button>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                      {cp.format === "openai"
                        ? "OpenAI兼容"
                        : cp.format === "anthropic"
                          ? "Anthropic协议"
                          : "Google协议"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-400 hover:text-red-500"
                    onClick={() => removeCustom(cp.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========== 模型选择 ========== */}
        <div>
          <Label>默认模型</Label>
          <Select
            value={selectValue}
            onValueChange={(v) => {
              if (v) setModel(v);
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESET_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
              <SelectItem value={CUSTOM_VALUE}>📝 自定义...</SelectItem>
            </SelectContent>
          </Select>
          {!isPreset && (
            <Input
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder="输入模型 ID，如 qwen-plus"
              className="mt-2"
            />
          )}
          <p className="mt-1 text-xs text-gray-400">
            {isPreset
              ? "下拉选择或点击「自定义」输入任意模型 ID"
              : `当前使用自定义模型: ${customModel || "（请输入）"}`}
          </p>
        </div>

        {/* ========== 保存 ========== */}
        <Button onClick={handleSave} className="self-start">
          <Save className="mr-1 h-4 w-4" />
          {saved ? "已保存" : "保存设置"}
        </Button>
      </div>
    </div>
  );
}
