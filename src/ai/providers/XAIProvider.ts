import { BaseProvider } from './BaseProvider';
import { AICompletionRequest, AICompletionResponse, AIProviderType } from '../../types';
import { AI_MODELS } from '../../constants';

export class XAIProvider extends BaseProvider {
  get providerType(): AIProviderType {
    return 'xai';
  }

  isConfigured(): boolean {
    return !!this.plugin.settings.xaiKey;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    return this.withRetry(async () => {
      const model = this.plugin.settings.xaiModel || AI_MODELS.xai.model;
      const maxTokens = request.maxTokens || AI_MODELS.xai.maxTokens;

      const response = await fetch(AI_MODELS.xai.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.plugin.settings.xaiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: request.systemPrompt },
            { role: 'user', content: request.userPrompt },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.handleApiError(response, data);
      }

      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: {
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
        },
      };
    });
  }
}
