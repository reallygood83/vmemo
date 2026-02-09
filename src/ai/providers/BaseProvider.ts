import type VMemoPlugin from '../../main';
import { AICompletionRequest, AICompletionResponse, AIProviderType } from '../../types';

export abstract class BaseProvider {
  protected plugin: VMemoPlugin;
  protected maxRetries = 3;
  protected retryDelayMs = 1000;

  constructor(plugin: VMemoPlugin) {
    this.plugin = plugin;
  }

  abstract get providerType(): AIProviderType;
  abstract isConfigured(): boolean;
  abstract complete(request: AICompletionRequest): Promise<AICompletionResponse>;

  protected async withRetry<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.maxRetries) {
        throw error;
      }

      const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
      await this.sleep(delay);
      return this.withRetry(fn, attempt + 1);
    }
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected handleApiError(response: Response, data: unknown): never {
    const errorData = data as { error?: { message?: string }; message?: string };
    const message = errorData.error?.message || errorData.message || 'Unknown API error';

    if (response.status === 401) {
      throw new Error('Invalid API key');
    } else if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (response.status >= 500) {
      throw new Error('Provider server error. Please try again.');
    }

    throw new Error(`API Error: ${message}`);
  }
}
