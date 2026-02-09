import type VMemoPlugin from '../main';
import { TemplateVariables } from '../types';
import { BUILT_IN_TEMPLATES } from '../constants';

export class TemplateEngine {
  private plugin: VMemoPlugin;

  constructor(plugin: VMemoPlugin) {
    this.plugin = plugin;
  }

  render(variables: TemplateVariables): string {
    const templateId = this.plugin.settings.defaultTemplate;
    const templateContent = this.getTemplateContent(templateId);
    return this.substituteVariables(templateContent, variables);
  }

  renderWithTemplate(templateId: string, variables: TemplateVariables): string {
    const templateContent = this.getTemplateContent(templateId);
    return this.substituteVariables(templateContent, variables);
  }

  private getTemplateContent(templateId: string): string {
    const builtIn = BUILT_IN_TEMPLATES[templateId];
    if (builtIn) {
      return builtIn.content;
    }

    const custom = this.plugin.settings.customTemplates[templateId];
    if (custom) {
      return custom.content;
    }

    return BUILT_IN_TEMPLATES['meeting-notes'].content;
  }

  private substituteVariables(template: string, variables: TemplateVariables): string {
    let result = template;

    result = result.replace(/\{\{date\}\}/g, variables.date);
    result = result.replace(/\{\{time\}\}/g, variables.time);
    result = result.replace(/\{\{datetime\}\}/g, variables.datetime);
    result = result.replace(/\{\{title\}\}/g, variables.title);
    result = result.replace(/\{\{duration\}\}/g, variables.duration);
    result = result.replace(/\{\{audioPath\}\}/g, variables.audioPath);
    result = result.replace(/\{\{transcriptPath\}\}/g, variables.transcriptPath);
    result = result.replace(/\{\{speakerCount\}\}/g, String(variables.speakerCount));
    result = result.replace(/\{\{language\}\}/g, variables.language);
    result = result.replace(/\{\{content\}\}/g, variables.content);

    if (variables.summary) {
      result = result.replace(/\{\{summary\}\}/g, variables.summary);
    }

    for (const [key, value] of Object.entries(variables.customFields)) {
      const regex = new RegExp(`\\{\\{customFields\\.${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }

    result = result.replace(/\{\{[^}]+\}\}/g, '');

    return result;
  }

  getAvailableTemplates(): Array<{ id: string; name: string; description: string }> {
    const templates: Array<{ id: string; name: string; description: string }> = [];

    for (const [id, template] of Object.entries(BUILT_IN_TEMPLATES)) {
      templates.push({
        id,
        name: template.name,
        description: template.description,
      });
    }

    for (const [id, template] of Object.entries(this.plugin.settings.customTemplates)) {
      templates.push({
        id,
        name: template.name,
        description: template.description,
      });
    }

    return templates;
  }
}
