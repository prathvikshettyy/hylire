const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../utils/db');

const UPLOADS_DIR = path.join(__dirname, '../../uploads/documents');

// Ensure uploads folder exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// 1. Get project documents
router.get('/project/:projectId', async (req, res) => {
    const { projectId } = req.params;
    try {
        const docList = await db.documents.listByProject(projectId);
        res.json(docList || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Real File Upload (Supports Data URL Base64 or standard file metadata)
router.post('/upload', async (req, res) => {
    const { projectId, name, fileType, fileData, fileSize, category, uploadedBy } = req.body;

    if (!projectId || !name) {
        return res.status(400).json({ error: 'Project ID and document name are required' });
    }

    try {
        let savedFileUrl = '';
        const sanitizedName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFileName = `${Date.now()}_${sanitizedName}`;
        const filePath = path.join(UPLOADS_DIR, uniqueFileName);

        // If base64 file data is sent from frontend FileReader
        if (fileData && fileData.includes('base64,')) {
            const base64Content = fileData.split('base64,')[1];
            fs.writeFileSync(filePath, Buffer.from(base64Content, 'base64'));
            savedFileUrl = `http://localhost:5000/uploads/documents/${uniqueFileName}`;
        } else if (fileData) {
            // Text or raw content
            fs.writeFileSync(filePath, fileData, 'utf-8');
            savedFileUrl = `http://localhost:5000/uploads/documents/${uniqueFileName}`;
        } else {
            // Fallback placeholder file
            fs.writeFileSync(filePath, `Hylire Document Vault: ${name}\nUploaded on: ${new Date().toISOString()}\nProject: ${projectId}`);
            savedFileUrl = `http://localhost:5000/uploads/documents/${uniqueFileName}`;
        }

        const newDoc = await db.documents.create({
            projectId,
            name,
            fileUrl: savedFileUrl,
            fileType: fileType || 'application/pdf',
            fileSize: fileSize || '150 KB',
            category: category || 'General',
            uploadedBy: uploadedBy || 'Admin'
        });

        res.status(201).json({
            message: 'Real document uploaded and stored in vault successfully',
            document: newDoc
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Delete Document
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const doc = await db.documents.findById(id);
        if (doc && doc.fileUrl) {
            try {
                const fileName = path.basename(doc.fileUrl);
                const fullPath = path.join(UPLOADS_DIR, fileName);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            } catch (err) {
                console.warn('File removal from disk failed:', err.message);
            }
        }
        const success = await db.documents.delete(id);
        res.json({ success, message: 'Document deleted from vault' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
