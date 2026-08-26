const { PromptTemplate } = require('@langchain/core/prompts');
const { createLLMProvider } = require('../infrastructure/llm/createLLMProvider');

class DocumentUnderstandingService {
  constructor() {
    this.llmProvider = createLLMProvider();
  }

  async extractDecisionInput(document) {
    const prompt = PromptTemplate.fromTemplate(`
      You are an expert policy analysis AI. Your job is to extract structured decision information from the provided document text.

      DOCUMENT TITLE: {title}
      DOCUMENT TEXT:
      {text}

      Extract the following information and return ONLY a valid JSON object matching this structure exactly (no markdown formatting, just raw JSON).
      If a value is not found, leave it as null. Do not guess.

      {{
        "sourceType": "document",
        "documentId": "{documentId}",
        "policy": {{
          "name": "Name of the policy or decision being made"
        }},
        "change": {{
          "parameter": "The specific rule, metric, or status being changed (e.g. minimum_attendance, placement_participation)",
          "currentValue": "The current state or value (e.g. 75%, Optional, None, Allowed)",
          "proposedValue": "The proposed state or value (e.g. 70%, Mandatory, Required, Banned)",
          "unit": "The unit of measurement if applicable, otherwise N/A or descriptive status (e.g. percentage, boolean, status)"
        }},
        "effectiveDate": "The proposed effective date if found, or 'Immediate'",
        "stakeholders": ["list", "of", "affected", "stakeholders"],
        "affectedProcesses": ["list", "of", "affected", "processes"],
        "confidence": 0.95,
        "evidence": [
          "Exact quote proving the change"
        ]
      }}
    `);

    try {
      const formattedPrompt = await prompt.format({
        title: document.metadata.title,
        text: document.text.substring(0, 15000), // Limit to avoid token limits for now
        documentId: document.documentId
      });

      const responseContent = await this.llmProvider.generateText([{ role: 'user', content: formattedPrompt }]);
      let content = responseContent.trim();
      
      // Extract JSON block in case the LLM wrapped it in markdown or conversational text
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        content = content.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(content);
      return parsed;
    } catch (error) {
      console.error('LLM Extraction Error:', error.message);
      throw new Error(`Failed to extract structured decision from document: ${error.message}`);
    }
  }
}

module.exports = new DocumentUnderstandingService();
