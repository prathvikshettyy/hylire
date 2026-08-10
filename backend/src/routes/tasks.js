const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// List Tasks
router.get('/', async (req, res) => {
    const { siteId, assignedTo } = req.query;
    try {
        const list = await db.tasks.list({ siteId, assignedTo });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Task
router.post('/', async (req, res) => {
    const { siteId, name, description, assignedTo, priority, deadline } = req.body;
    if (!siteId || !name) {
        return res.status(400).json({ error: 'Site ID and Task Name are required' });
    }

    try {
        const newTask = await db.tasks.create({
            siteId,
            name,
            description: description || '',
            assignedTo: assignedTo || null,
            status: 'todo',
            priority: priority || 'medium',
            deadline: deadline || null
        });
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Task
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updated = await db.tasks.update(id, req.body);
        if (!updated) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
