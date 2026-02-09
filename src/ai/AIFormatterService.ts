import type VMemoPlugin from '../main';
import { BaseProvider } from './providers/BaseProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { GoogleProvider } from './providers/GoogleProvider';
import { XAIProvider } from './providers/XAIProvider';
import { FormattedDocument, AIProviderType } from '../types';
import { BUILT_IN_TEMPLATES, ERROR_MESSAGES } from '../constants';

export class AIFormatterService {
  private plugin: VMemoPlugin;
  private providers: Map<AIProviderType, BaseProvider>;

  constructor(plugin: VMemoPlugin) {
    this.plugin = plugin;
    this.providers = new Map([
      ['anthropic', new AnthropicProvider(plugin)],
      ['openai', new OpenAIProvider(plugin)],
      ['google', new GoogleProvider(plugin)],
      ['xai', new XAIProvider(plugin)],
    ]);
  }

  async format(transcriptText: string, templateId: string): Promise<FormattedDocument> {
    const provider = this.getActiveProvider();
    const template = this.getTemplate(templateId);
    const startTime = Date.now();

    const response = await provider.complete({
      systemPrompt: template.systemPrompt,
      userPrompt: this.buildUserPrompt(transcriptText, templateId),
    });

    const summary = this.extractSummary(response.content);
    const actionItems = this.extractActionItems(response.content);
    const decisions = this.extractDecisions(response.content);

    return {
      content: response.content,
      title: this.generateTitle(response.content),
      summary,
      actionItems,
      decisions,
      metadata: {
        provider: provider.providerType,
        model: response.model,
        template: templateId,
        tokensUsed: (response.usage?.inputTokens || 0) + (response.usage?.outputTokens || 0),
        processingTime: Date.now() - startTime,
      },
    };
  }

  private getActiveProvider(): BaseProvider {
    const providerType = this.plugin.settings.aiProvider;
    const provider = this.providers.get(providerType);

    if (!provider) {
      throw new Error(`Unknown provider: ${providerType}`);
    }

    if (!provider.isConfigured()) {
      throw new Error(ERROR_MESSAGES.apiKeyMissing(providerType));
    }

    return provider;
  }

  private getTemplate(templateId: string): { systemPrompt: string; content: string } {
    const builtIn = BUILT_IN_TEMPLATES[templateId];
    if (builtIn) {
      return {
        systemPrompt: builtIn.systemPrompt,
        content: builtIn.content,
      };
    }

    const custom = this.plugin.settings.customTemplates[templateId];
    if (custom) {
      return {
        systemPrompt: custom.systemPrompt || BUILT_IN_TEMPLATES['meeting-notes'].systemPrompt,
        content: custom.content,
      };
    }

    return {
      systemPrompt: BUILT_IN_TEMPLATES['meeting-notes'].systemPrompt,
      content: BUILT_IN_TEMPLATES['meeting-notes'].content,
    };
  }

  private buildUserPrompt(transcriptText: string, templateId: string): string {
    const template = BUILT_IN_TEMPLATES[templateId];
    const templateName = template?.name || 'document';

    return `Please format the following voice transcript into a well-structured ${templateName}:

---
TRANSCRIPT:
${transcriptText}
---

Remember to:
- Clean up filler words (um, uh, like, you know)
- Fix grammar and punctuation
- Add logical section headers
- Extract action items and decisions if applicable
- Maintain the original meaning and important details`;
  }

  private generateTitle(content: string): string {
    const firstLine = content.split('\n').find(line => line.trim().startsWith('#'));
    if (firstLine) {
      return firstLine.replace(/^#+\s*/, '').slice(0, 100);
    }

    const firstSentence = content.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length <= 100) {
      return firstSentence.trim();
    }

    return 'Untitled Document';
  }

  private extractSummary(content: string): string | undefined {
    const summaryMatch = content.match(/##\s*(?:Summary|Overview|요약)\s*\n([\s\S]*?)(?=\n##|$)/i);
    return summaryMatch?.[1]?.trim();
  }

  private extractActionItems(content: string): string[] | undefined {
    const actionMatch = content.match(/##\s*(?:Action Items|액션 아이템|할 일)\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (!actionMatch) return undefined;

    const items = actionMatch[1]
      .split('\n')
      .filter(line => line.match(/^[-*]\s*\[[ x]\]|^[-*]\s+/))
      .map(line => line.replace(/^[-*]\s*\[[ x]\]\s*|^[-*]\s+/, '').trim())
      .filter(item => item.length > 0);

    return items.length > 0 ? items : undefined;
  }

  private extractDecisions(content: string): string[] | undefined {
    const decisionMatch = content.match(/##\s*(?:Decisions|결정 사항|결정)\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (!decisionMatch) return undefined;

    const items = decisionMatch[1]
      .split('\n')
      .filter(line => line.match(/^[-*]\s+/))
      .map(line => line.replace(/^[-*]\s+/, '').trim())
      .filter(item => item.length > 0);

    return items.length > 0 ? items : undefined;
  }
}
