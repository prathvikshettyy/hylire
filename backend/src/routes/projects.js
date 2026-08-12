const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// List Projects
router.get('/', async (req, res) => {
    const { clientId } = req.query;
    try {
        const list = await db.projects.list({ clientId });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Project
router.post('/', async (req, res) => {
    const { name, description, clientId, budget, startDate, endDate } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Project name is required' });
    }

    try {
        const newProj = await db.projects.create({
            name,
            description,
            clientId: clientId || null,
            budget: budget ? parseFloat(budget) : 0,
            startDate,
            endDate,
            status: 'planning'
        });

        // Auto-create a primary construction site for this project so tasks can be assigned immediately
        await db.sites.create({
            projectId: newProj.id,
            name: `${name} - Main Site`,
            address: 'Primary Project Site',
            status: 'active'
        });

        res.status(201).json(newProj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Project
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updated = await db.projects.update(id, req.body);
        if (!updated) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Project
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const success = await db.projects.delete(id);
        if (!success) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get sites under a specific project
router.get('/:id/sites', async (req, res) => {
    const { id } = req.params;
    try {
        const sitesList = await db.sites.list({ projectId: id });
        res.json(sitesList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
