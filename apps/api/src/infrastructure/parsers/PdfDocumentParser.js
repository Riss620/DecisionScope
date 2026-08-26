const pdfParse = require('pdf-parse');
const crypto = require('crypto');
const DocumentParser = require('./DocumentParser');

class PdfDocumentParser extends DocumentParser {
  async parse(buffer, filename, mimeType) {
    try {
      const data = await pdfParse(buffer);
      
      const text = data.text.trim();
      
      let finalText = text;
      
      if (!text || text.length < 5) {
        console.warn('No selectable text found, falling back to Gemini API for OCR...');
        try {
          const base64Data = buffer.toString('base64');
          const apiKey = process.env.GEMINI_API_KEY || 'sk-mock';
          
          if (apiKey === 'sk-mock') throw new Error('Valid Gemini API key required for OCR');
          
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: "Extract all visible text from this document exactly as it appears. Return ONLY the extracted text, no additional commentary." },
                  { inlineData: { mimeType: "application/pdf", data: base64Data } }
                ]
              }]
            })
          });
          
          const result = await response.json();
          if (result.candidates && result.candidates[0].content.parts[0].text) {
            finalText = result.candidates[0].content.parts[0].text.trim();
          }
        } catch (ocrError) {
          console.error('OCR Fallback failed:', ocrError);
        }
      }
      
      if (!finalText || finalText.length < 5) {
        throw new Error('No machine-readable text detected. OCR fallback failed or document is empty.');
      }
      
      return {
        documentId: crypto.randomUUID(),
        filename,
        mimeType,
        pageCount: data.numpages,
        text: finalText,
        metadata: {
          title: data.info?.Title || filename,
          author: data.info?.Author || 'Unknown',
          createdAt: data.info?.CreationDate || new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }
}

module.exports = PdfDocumentParser;
