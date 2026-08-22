const mammoth = require('mammoth');
const { v4: uuidv4 } = require('uuid');
const DocumentParser = require('./DocumentParser');

class DocxDocumentParser extends DocumentParser {
  async parse(buffer, filename, mimeType) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      
      if (!text || text.length < 10) {
        throw new Error('No extractable text found in DOCX file.');
      }
      
      return {
        documentId: uuidv4(),
        filename,
        mimeType,
        pageCount: 1, // Mammoth doesn't provide page counts
        text,
        metadata: {
          title: filename,
          author: 'Unknown',
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }
}

module.exports = DocxDocumentParser;
