const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const LocalFileStorageProvider = require('../../infrastructure/storage/LocalFileStorageProvider');
const PdfDocumentParser = require('../../infrastructure/parsers/PdfDocumentParser');
const DocxDocumentParser = require('../../infrastructure/parsers/DocxDocumentParser');
const DocumentUnderstandingService = require('../../services/DocumentUnderstandingService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const storageProvider = new LocalFileStorageProvider();
const pdfParser = new PdfDocumentParser();
const docxParser = new DocxDocumentParser();

router.post('/upload', requireAuth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document provided' });
    }

    const { originalname, mimetype, buffer } = req.file;
    const extension = path.extname(originalname).toLowerCase();

    // 1. Store temporarily
    const storageKey = await storageProvider.saveFile(req.file);

    try {
      // 2. Parse based on extension
      let normalizedDocument;
      if (extension === '.pdf') {
        normalizedDocument = await pdfParser.parse(buffer, originalname, mimetype);
      } else if (extension === '.docx' || extension === '.doc') {
        normalizedDocument = await docxParser.parse(buffer, originalname, mimetype);
      } else {
        throw new Error(`Unsupported file type: ${extension}`);
      }

      // 3. Extract structured decision
      const decisionInput = await DocumentUnderstandingService.extractDecisionInput(normalizedDocument);

      res.status(200).json({
        success: true,
        document: normalizedDocument,
        decisionInput
      });

    } finally {
      // Clean up temporary file
      await storageProvider.deleteFile(storageKey);
    }
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
