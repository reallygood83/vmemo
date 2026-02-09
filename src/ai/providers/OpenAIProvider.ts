import { BaseProvider } from './BaseProvider';
import { AICompletionRequest, AICompletionResponse, AIProviderType } from '../../types';
import { AI_MODELS } from '../../constants';

export class OpenAIProvider extends BaseProvider {
  get providerType(): AIProviderType {
    return 'openai';
  }

  isConfigured(): boolean {
    return !!this.plugin.settings.openaiKey;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    return this.withRetry(async () => {
      const model = this.plugin.settings.openaiModel || AI_MODELS.openai.model;
      const maxTokens = request.maxTokens || AI_MODELS.openai.maxTokens;

      const response = await fetch(AI_MODELS.openai.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.plugin.settings.openaiKey}`,
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
