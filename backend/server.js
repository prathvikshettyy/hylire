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

// Alias Routes matching exact spec requirements
app.use('/api/users/profile', (req, res) => authRouter.handle(req, res));
app.get('/api/sites/:siteId/tasks', async (req, res) => {
    try {
        const list = await db.tasks.list({ siteId: req.params.siteId });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/projects/:projectId/estimations', async (req, res) => {
    try {
        const bricks = await db.brickEstimations.listByProject(req.params.projectId);
        const materials = await db.materials.listByProject(req.params.projectId);
        const costs = await db.costEstimations.listByProject(req.params.projectId);
        res.json({ bricks, materials, costs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/projects/:projectId/documents', async (req, res) => {
    try {
        const docList = await db.documents.listByProject(req.params.projectId);
        res.json(docList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/projects/:projectId/chat', async (req, res) => {
    try {
        const history = await db.chat.listByProject(req.params.projectId);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/projects/:projectId/chat', async (req, res) => {
    try {
        const { senderId, senderName, messageText, fileUrl } = req.body;
        const newMsg = await db.chat.create({
            projectId: req.params.projectId,
            senderId,
            senderName,
            messageText,
            fileUrl: fileUrl || null
        });
        res.status(201).json(newMsg);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/projects/:projectId/monitoring', async (req, res) => {
    try {
        const { projectId } = req.params;
        const projectSites = await db.sites.list({ projectId });
        const allTasks = await db.tasks.list();
        
        const projectSiteIds = projectSites.map(s => s.id);
        const projectTasks = allTasks.filter(t => projectSiteIds.includes(t.siteId));
        
        const total = projectTasks.length;
        const completed = projectTasks.filter(t => t.status === 'done').length;
        const inProgress = projectTasks.filter(t => t.status === 'in-progress').length;
        const todo = projectTasks.filter(t => t.status === 'todo').length;

        res.json({
            projectId,
            totalSites: projectSites.length,
            totalTasks: total,
            completedTasks: completed,
            inProgressTasks: inProgress,
            todoTasks: todo,
            completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// High-level Monitoring Stats Endpoint for Dashboard
app.get('/api/monitoring/stats', async (req, res) => {
    try {
        const allProjects = await db.projects.list();
        const allSites = await db.sites.list();
        const allTasks = await db.tasks.list();

        const activeSites = allSites.filter(s => s.status === 'active').length;
        const completedTasks = allTasks.filter(t => t.status === 'done').length;
        const totalBudget = allProjects.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0);

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

        // 1. Compute dynamic projectComparison (Budget vs Spent per project)
        const projectComparison = await Promise.all(allProjects.map(async (p) => {
            const mats = await db.materials.listByProject(p.id);
            const costs = await db.costEstimations.listByProject(p.id);
            
            const matSum = mats.reduce((s, m) => s + (parseFloat(m.totalCost) || 0), 0);
            const costSum = costs.reduce((s, c) => s + (parseFloat(c.totalEstimatedCost) || 0), 0);
            const totalSpent = matSum + costSum;
            
            const allocatedLakhs = parseFloat(((parseFloat(p.budget) || 0) / 100000).toFixed(2));
            const spentLakhs = parseFloat((totalSpent / 100000).toFixed(2));

            return {
                id: p.id,
                name: p.name,
                allocated: allocatedLakhs,
                spent: spentLakhs,
                rawAllocated: parseFloat(p.budget) || 0,
                rawSpent: totalSpent,
                unit: 'Lakhs'
            };
        }));

        // 2. Compute dynamic monthlyExpenditure (Monthly spent trends)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonthIdx = new Date().getMonth();
        const displayMonths = [];
        for (let i = 7; i >= 0; i--) {
            const mIdx = (currentMonthIdx - i + 12) % 12;
            displayMonths.push(monthNames[mIdx]);
        }

        const monthlyMap = {};
        displayMonths.forEach(m => monthlyMap[m] = 0);

        for (const p of allProjects) {
            const mats = await db.materials.listByProject(p.id);
            const costs = await db.costEstimations.listByProject(p.id);

            mats.forEach(m => {
                const d = new Date(m.createdAt || Date.now());
                const mName = monthNames[d.getMonth()];
                if (monthlyMap[mName] !== undefined) {
                    monthlyMap[mName] += (parseFloat(m.totalCost) || 0) / 100000;
                }
            });

            costs.forEach(c => {
                const d = new Date(c.createdAt || Date.now());
                const mName = monthNames[d.getMonth()];
                if (monthlyMap[mName] !== undefined) {
                    monthlyMap[mName] += (parseFloat(c.totalEstimatedCost) || 0) / 100000;
                }
            });
        }

        const totalAllocatedLakhs = parseFloat((totalBudget / 100000).toFixed(2));
        const avgMonthlyBudget = displayMonths.length > 0 ? parseFloat((totalAllocatedLakhs / displayMonths.length).toFixed(2)) : 0;

        const monthlyExpenditure = displayMonths.map(month => ({
            month,
            spent: parseFloat((monthlyMap[month] || 0).toFixed(2)),
            budget: avgMonthlyBudget
        }));

        res.json({
            totalProjects: allProjects.length,
            activeSites,
            totalTasks: allTasks.length,
            completedTasks,
            totalBudget,
            siteStats,
            projectComparison,
            monthlyExpenditure
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
