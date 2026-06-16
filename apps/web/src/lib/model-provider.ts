import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

export type Provider = "openai" | "anthropic" | "google";

export interface CustomProviderInfo {
  id: string;
  name: string;
  apiKey: string;
  baseUrl: string;
  format: Provider;
}

/**
 * 根据模型名称自动检测对应的 AI 厂商（fallback）
 */
export function detectProvider(model: string): Provider {
  const lower = model.toLowerCase();
  if (lower.startsWith("claude-")) return "anthropic";
  if (lower.startsWith("gemini-")) return "google";
  return "openai";
}

/**
 * 根据模型和 API Key 创建对应的 LanguageModel
 */
export function createModel(options: {
  model: string;
  openaiKey?: string;
  openaiBaseUrl?: string;
  anthropicKey?: string;
  googleKey?: string;
}): LanguageModel {
  const provider = detectProvider(options.model);

  switch (provider) {
    case "anthropic": {
      if (!options.anthropicKey) {
        throw new Error("使用 Claude 模型需要配置 Anthropic API Key");
      }
      return createAnthropic({ apiKey: options.anthropicKey })(
        options.model,
      );
    }

    case "google": {
      if (!options.googleKey) {
        throw new Error("使用 Gemini 模型需要配置 Google API Key");
      }
      return createGoogleGenerativeAI({ apiKey: options.googleKey })(
        options.model,
      );
    }

    default: {
      if (!options.openaiKey) {
        throw new Error("请配置 API Key");
      }
      const baseURL = options.openaiBaseUrl || "https://api.openai.com/v1";
      return createOpenAI({ apiKey: options.openaiKey, baseURL }).chat(options.model);
    }
  }
}

/**
 * 根据用户选择的平台和格式，创建对应的 LanguageModel
 */
export function resolveModel(options: {
  model: string;
  /** 用户选中的平台标识: "openai" | "anthropic" | "google" | "custom:xxx" */
  selectedProvider?: string;
  openaiKey?: string;
  openaiBaseUrl?: string;
  anthropicKey?: string;
  googleKey?: string;
  customProvider?: CustomProviderInfo;
}): LanguageModel {
  // 1. 自定义平台：用其 format 决定 SDK 类型
  if (options.selectedProvider?.startsWith("custom:") && options.customProvider) {
    const cp = options.customProvider;
    if (!cp.apiKey) throw new Error(`自定义平台 "${cp.name}" 未配置 API Key`);

    switch (cp.format) {
      case "anthropic":
        return createAnthropic({ apiKey: cp.apiKey, baseURL: cp.baseUrl })(
          options.model,
        );
      case "google":
        return createGoogleGenerativeAI({ apiKey: cp.apiKey, baseURL: cp.baseUrl })(
          options.model,
        );
      default:
        return createOpenAI({ apiKey: cp.apiKey, baseURL: cp.baseUrl }).chat(
          options.model,
        );
    }
  }

  // 2. 内置平台
  if (options.selectedProvider === "anthropic") {
    if (!options.anthropicKey) {
      throw new Error("使用 Claude 模型需要配置 Anthropic API Key");
    }
    return createAnthropic({ apiKey: options.anthropicKey })(options.model);
  }

  if (options.selectedProvider === "google") {
    if (!options.googleKey) {
      throw new Error("使用 Gemini 模型需要配置 Google API Key");
    }
    return createGoogleGenerativeAI({ apiKey: options.googleKey })(options.model);
  }

  // 3. OpenAI 或未选择 → 都用 OpenAI SDK
  if (!options.openaiKey) {
    throw new Error("请配置 OpenAI API Key");
  }
  const baseURL = options.openaiBaseUrl || "https://api.openai.com/v1";
  return createOpenAI({ apiKey: options.openaiKey, baseURL }).chat(options.model);
}
