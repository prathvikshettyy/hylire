const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./src/utils/db');
const authRouter = require('./src/routes/auth');
const projectsRouter = require('./src/routes/projects');
const sitesRouter = require('./src/routes/sites');
const tasksRouter = require('./src/routes/tasks');
const estimationsRouter = require('./src/routes/estimations');
const documentsRouter = require('./src/routes/documents');
const chatRouter = require('./src/routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes Registration
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/sites', sitesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/estimation', estimationsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/chat', chatRouter);

// High-level Monitoring Stats Endpoint for Dashboard
app.get('/api/monitoring/stats', async (req, res) => {
    try {
        const allProjects = await db.projects.list();
        const allSites = await db.sites.list();
        const allTasks = await db.tasks.list();

        const activeSites = allSites.filter(s => s.status === 'active').length;
        const completedTasks = allTasks.filter(t => t.status === 'done').length;
        const totalBudget = allProjects.reduce((sum, p) => sum + (p.budget || 0), 0);

        // Site-by-site tasks completion rates
        const siteStats = allSites.map(site => {
            const siteTasks = allTasks.filter(t => t.siteId === site.id);
            const total = siteTasks.length;
            const completed = siteTasks.filter(t => t.status === 'done').length;
            return {
                siteId: site.id,
                name: site.name,
                status: site.status,
                totalTasks: total,
                completedTasks: completed,
                progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0
            };
        });

        res.json({
            totalProjects: allProjects.length,
            activeSites,
            totalTasks: allTasks.length,
            completedTasks,
            totalBudget,
            siteStats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Root check
app.get('/', (req, res) => {
    res.json({
        name: 'Hylire Construction Management API',
        version: '1.0.0',
        status: 'online'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong on the server!' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Hylire Backend Server is running on port ${PORT}`);
});
