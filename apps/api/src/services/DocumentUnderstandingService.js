const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');

class DocumentUnderstandingService {
  constructor() {
    this.model = new ChatOpenAI({
      modelName: process.env.LLM_MODEL || 'gemini-3.6-flash',
      temperature: 0.1,
      maxRetries: 3
    });
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

      const response = await this.model.invoke(formattedPrompt);
      let content = response.content.trim();
      
      if (content.startsWith('\`\`\`json')) {
        content = content.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      }

      const parsed = JSON.parse(content);
      return parsed;
    } catch (error) {
      console.error('LLM Extraction Error:', error);
      throw new Error(`Failed to extract structured data from document: ${error.message}`);
    }
  }
}

module.exports = new DocumentUnderstandingService();
