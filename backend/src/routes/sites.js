const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// List Sites
router.get('/', async (req, res) => {
    const { projectId, engineerId } = req.query;
    try {
        const list = await db.sites.list({ projectId, engineerId });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Site
router.post('/', async (req, res) => {
    const { id, projectId, name, address, engineerId, status } = req.body;
    if (!projectId || !name) {
        return res.status(400).json({ error: 'Project ID and Site Name are required' });
    }

    try {
        const newSite = await db.sites.create({
            id: id || undefined,
            projectId,
            name,
            address: address || '',
            engineerId: engineerId || null,
            status: status || 'active'
        });
        res.status(201).json(newSite);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Site
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updated = await db.sites.update(id, req.body);
        if (!updated) {
            return res.status(404).json({ error: 'Site not found' });
        }
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Site
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const success = await db.sites.delete(id);
        if (!success) {
            return res.status(404).json({ error: 'Site not found' });
        }
        res.json({ message: 'Site deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
