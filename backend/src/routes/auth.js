const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// Register API
router.post('/register', async (req, res) => {
    const { email, password, fullName, role } = req.body;
    
    if (!email || !password || !fullName || !role) {
        return res.status(400).json({ error: 'All fields (email, password, fullName, role) are required' });
    }

    try {
        const existingUser = await db.users.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const newUser = await db.users.create({
            email,
            password, // In production, hash this.
            fullName,
            role
        });

        // Omit password in response
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ message: 'Registration successful', user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login API
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await db.users.findByEmail(email);
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Simulate session token
        const token = `mock-jwt-token-for-${user.id}-${Date.now()}`;
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Forgot Password API
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const user = await db.users.findByEmail(email);
        if (!user) {
            // Standard security practice: respond with success even if email not found to avoid enumeration
            return res.json({ message: 'If an account exists with that email, a password reset link has been dispatched.' });
        }

        res.json({
            message: `Password reset instruction link sent to ${email}`,
            resetToken: `reset-${user.id}-${Date.now()}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get profile from headers token
router.get('/profile', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized, token required' });
    }

    const token = authHeader.split(' ')[1];
    // Extract userId from token (mock-jwt-token-for-u-1-TIMESTAMP)
    const match = token.match(/mock-jwt-token-for-([^-]+)/);
    if (!match) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = match[1];
    try {
        const user = await db.users.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List users for project assignment dropdowns
router.get('/list', async (req, res) => {
    try {
        const usersList = await db.users.listAll();
        const responseList = usersList.map(({ password, ...u }) => u);
        res.json(responseList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
