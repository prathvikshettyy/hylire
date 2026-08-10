const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// Get project documents
router.get('/project/:projectId', async (req, res) => {
    const { projectId } = req.params;
    try {
        const docList = await db.documents.listByProject(projectId);
        res.json(docList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mock Upload Document
router.post('/upload', async (req, res) => {
    const { projectId, name, fileType, uploadedBy } = req.body;

    if (!projectId || !name || !fileType) {
        return res.status(400).json({ error: 'Project ID, document name, and file type are required' });
    }

    try {
        // Mock a file URL
        const mockFileUrl = `https://hylire-portal.s3.amazonaws.com/documents/${Date.now()}_${name}`;

        const newDoc = await db.documents.create({
            projectId,
            name,
            fileUrl: mockFileUrl,
            fileType,
            uploadedBy: uploadedBy || 'u-1'
        });

        res.status(201).json({
            message: 'Document uploaded successfully',
            document: newDoc
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
