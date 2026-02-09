import { BaseProvider } from './BaseProvider';
import { AICompletionRequest, AICompletionResponse, AIProviderType } from '../../types';
import { AI_MODELS } from '../../constants';

export class AnthropicProvider extends BaseProvider {
  get providerType(): AIProviderType {
    return 'anthropic';
  }

  isConfigured(): boolean {
    return !!this.plugin.settings.anthropicKey;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    return this.withRetry(async () => {
      const model = this.plugin.settings.anthropicModel || AI_MODELS.anthropic.model;
      const maxTokens = request.maxTokens || AI_MODELS.anthropic.maxTokens;

      const response = await fetch(AI_MODELS.anthropic.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.plugin.settings.anthropicKey,
          'anthropic-version': '2024-01-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          system: request.systemPrompt,
          messages: [
            { role: 'user', content: request.userPrompt },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.handleApiError(response, data);
      }

      return {
        content: data.content[0].text,
        model: data.model,
        usage: {
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0,
        },
      };
    });
  }
}
