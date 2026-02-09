import { BaseProvider } from './BaseProvider';
import { AICompletionRequest, AICompletionResponse, AIProviderType } from '../../types';
import { AI_MODELS } from '../../constants';

export class GoogleProvider extends BaseProvider {
  get providerType(): AIProviderType {
    return 'google';
  }

  isConfigured(): boolean {
    return !!this.plugin.settings.googleKey;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    return this.withRetry(async () => {
      const model = this.plugin.settings.googleModel || AI_MODELS.google.model;
      const maxTokens = request.maxTokens || AI_MODELS.google.maxTokens;
      const url = `${AI_MODELS.google.endpoint}/${model}:generateContent?key=${this.plugin.settings.googleKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: request.systemPrompt }],
          },
          contents: [
            {
              parts: [{ text: request.userPrompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: maxTokens,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.handleApiError(response, data);
      }

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        content,
        model,
        usage: {
          inputTokens: data.usageMetadata?.promptTokenCount || 0,
          outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
        },
      };
    });
  }
}
