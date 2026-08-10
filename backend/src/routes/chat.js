const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// Get chat history for project
router.get('/project/:projectId', async (req, res) => {
    const { projectId } = req.params;
    try {
        const history = await db.chat.listByProject(projectId);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send chat message
router.post('/send', async (req, res) => {
    const { projectId, senderId, senderName, messageText, fileUrl } = req.body;

    if (!projectId || !senderId || !messageText) {
        return res.status(400).json({ error: 'Project ID, Sender ID, and Message Text are required' });
    }

    try {
        // Look up sender details to store senderName
        let finalSenderName = senderName;
        if (!finalSenderName) {
            const user = await db.users.findById(senderId);
            finalSenderName = user ? user.fullName : 'Anonymous';
        }

        const newMsg = await db.chat.create({
            projectId,
            senderId,
            senderName: finalSenderName,
            messageText,
            fileUrl: fileUrl || null
        });

        res.status(201).json(newMsg);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
