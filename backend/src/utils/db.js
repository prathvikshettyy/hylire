const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const useFallback = process.env.USE_FALLBACK_DB === 'true' || !supabaseUrl || supabaseUrl.includes('your-supabase');

let supabase = null;
if (!useFallback) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('Connected to Supabase client successfully.');
    } catch (e) {
        console.warn('Supabase configuration error, using local fallback DB:', e.message);
    }
} else {
    console.log('Using persistent local JSON database (database/hylire_db.json).');
}

// Database JSON File Path for 100% Persistent Local Storage
const DB_FILE_PATH = path.join(__dirname, '../../database/hylire_db.json');

// Default initial state
const defaultStore = {
    users: [
        { id: "u-1", email: "admin@hylire.com", password: "password123", fullName: "John Builder", role: "builder", createdAt: new Date().toISOString() },
        { id: "u-2", email: "engineer@hylire.com", password: "password123", fullName: "Sarah Engineer", role: "engineer", createdAt: new Date().toISOString() },
        { id: "u-3", email: "client@hylire.com", password: "password123", fullName: "Robert Client", role: "client", createdAt: new Date().toISOString() },
        { id: "u-4", email: "contractor@hylire.com", password: "password123", fullName: "Mark Contractor", role: "contractor", createdAt: new Date().toISOString() },
        { id: "u-5", email: "worker@hylire.com", password: "password123", fullName: "David Worker", role: "worker", createdAt: new Date().toISOString() }
    ],
    projects: [],
    sites: [],
    tasks: [],
    materials: [],
    brickEstimations: [],
    costEstimations: [],
    documents: [],
    chatMessages: []
};

// Load store from persistent JSON file on disk
function loadStore() {
    try {
        if (fs.existsSync(DB_FILE_PATH)) {
            const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
            const data = JSON.parse(raw);
            return {
                users: Array.isArray(data.users) && data.users.length > 0 ? data.users : defaultStore.users,
                projects: Array.isArray(data.projects) ? data.projects : [],
                sites: Array.isArray(data.sites) ? data.sites : [],
                tasks: Array.isArray(data.tasks) ? data.tasks : [],
                materials: Array.isArray(data.materials) ? data.materials : [],
                brickEstimations: Array.isArray(data.brickEstimations) ? data.brickEstimations : [],
                costEstimations: Array.isArray(data.costEstimations) ? data.costEstimations : [],
                documents: Array.isArray(data.documents) ? data.documents : [],
                chatMessages: Array.isArray(data.chatMessages) ? data.chatMessages : []
            };
        }
    } catch (err) {
        console.error('Error reading database file, using default store:', err.message);
    }
    // If file doesn't exist, create it with defaultStore
    saveStore(defaultStore);
    return defaultStore;
}

// Save store to disk synchronously to prevent race conditions & data loss
function saveStore(store) {
    try {
        const dir = path.dirname(DB_FILE_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
    } catch (err) {
        console.error('Failed to persist database changes to disk:', err.message);
    }
}

const localStore = loadStore();

// Generic Database Helper to support persistent disk storage or Supabase PostgreSQL
const db = {
    // Auth & Users
    users: {
        async findByEmail(email) {
            if (supabase) {
                const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
                if (error && error.code !== 'PGRST116') throw error;
                if (data) return data;
            }
            return localStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        },
        async findById(id) {
            if (supabase) {
                const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
                if (error) throw error;
                if (data) return data;
            }
            return localStore.users.find(u => u.id === id);
        },
        async create(user) {
            const newUser = { id: `u-${Date.now()}`, ...user, createdAt: new Date().toISOString() };
            if (supabase) {
                const { data, error } = await supabase.from('users').insert([{
                    email: user.email,
                    full_name: user.fullName,
                    role: user.role
                }]).select().single();
                if (error) throw error;
                newUser.id = data.id;
            }
            localStore.users.push(newUser);
            saveStore(localStore);
            return newUser;
        },
        async listAll() {
            if (supabase) {
                const { data, error } = await supabase.from('users').select('*');
                if (error) throw error;
                if (data && data.length > 0) return data;
            }
            return localStore.users;
        }
    },

    // Projects
    projects: {
        async list(filters = {}) {
            if (supabase) {
                let query = supabase.from('projects').select('*');
                if (filters.clientId) query = query.eq('client_id', filters.clientId);
                const { data, error } = await query;
                if (error) throw error;
                if (data) return data;
            }
            let res = localStore.projects;
            if (filters.clientId) {
                res = res.filter(p => p.clientId === filters.clientId);
            }
            return res;
        },
        async findById(id) {
            if (supabase) {
                const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
                if (error) throw error;
                if (data) return data;
            }
            return localStore.projects.find(p => p.id === id);
        },
        async create(project) {
            const newProject = { 
                id: `p-${Date.now()}`, 
                ...project, 
                createdAt: new Date().toISOString() 
            };
            if (supabase) {
                const { data, error } = await supabase.from('projects').insert([{
                    name: project.name,
                    description: project.description,
                    client_id: project.clientId,
                    status: project.status || 'planning',
                    start_date: project.startDate,
                    end_date: project.endDate,
                    budget: project.budget
                }]).select().single();
                if (error) throw error;
                newProject.id = data.id;
            }
            localStore.projects.push(newProject);
            saveStore(localStore);
            return newProject;
        },
        async update(id, updates) {
            if (supabase) {
                const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
                if (error) throw error;
            }
            const idx = localStore.projects.findIndex(p => p.id === id);
            if (idx === -1) return null;
            localStore.projects[idx] = { ...localStore.projects[idx], ...updates, updatedAt: new Date().toISOString() };
            saveStore(localStore);
            return localStore.projects[idx];
        },
        async delete(id) {
            if (supabase) {
                const { error } = await supabase.from('projects').delete().eq('id', id);
                if (error) throw error;
            }
            const idx = localStore.projects.findIndex(p => p.id === id);
            if (idx === -1) return false;
            localStore.projects.splice(idx, 1);
            // Cascade delete sub-sites, tasks, materials, estimations
            localStore.sites = localStore.sites.filter(s => s.projectId !== id);
            localStore.materials = localStore.materials.filter(m => m.projectId !== id);
            localStore.brickEstimations = localStore.brickEstimations.filter(b => b.projectId !== id);
            localStore.costEstimations = localStore.costEstimations.filter(c => c.projectId !== id);
            localStore.documents = localStore.documents.filter(d => d.projectId !== id);
            localStore.chatMessages = localStore.chatMessages.filter(msg => msg.projectId !== id);
            saveStore(localStore);
            return true;
        }
    },

    // Sites
    sites: {
        async list(filters = {}) {
            if (supabase) {
                let query = supabase.from('sites').select('*');
                if (filters.projectId) query = query.eq('project_id', filters.projectId);
                if (filters.engineerId) query = query.eq('engineer_id', filters.engineerId);
                const { data, error } = await query;
                if (error) throw error;
                if (data) return data;
            }
            let res = localStore.sites;
            if (filters.projectId) res = res.filter(s => s.projectId === filters.projectId);
            if (filters.engineerId) res = res.filter(s => s.engineerId === filters.engineerId);
            return res;
        },
        async create(site) {
            const newSite = { id: `s-${Date.now()}`, ...site, createdAt: new Date().toISOString() };
            if (supabase) {
                const { data, error } = await supabase.from('sites').insert([{
                    project_id: site.projectId,
                    name: site.name,
                    address: site.address,
                    engineer_id: site.engineerId,
                    status: site.status || 'active'
                }]).select().single();
                if (error) throw error;
                newSite.id = data.id;
            }
            localStore.sites.push(newSite);
            saveStore(localStore);
            return newSite;
        },
        async update(id, updates) {
            if (supabase) {
                const { data, error } = await supabase.from('sites').update(updates).eq('id', id).select().single();
                if (error) throw error;
            }
            const idx = localStore.sites.findIndex(s => s.id === id);
            if (idx === -1) return null;
            localStore.sites[idx] = { ...localStore.sites[idx], ...updates, updatedAt: new Date().toISOString() };
            saveStore(localStore);
            return localStore.sites[idx];
        }
    },

    // Tasks
    tasks: {
        async list(filters = {}) {
            if (supabase) {
                let query = supabase.from('tasks').select('*');
                if (filters.siteId) query = query.eq('site_id', filters.siteId);
                if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
                const { data, error } = await query;
                if (error) throw error;
                if (data) return data;
            }
            let res = localStore.tasks;
            if (filters.siteId) res = res.filter(t => t.siteId === filters.siteId);
            if (filters.assignedTo) res = res.filter(t => t.assignedTo === filters.assignedTo);
            return res;
        },
        async create(task) {
            const newTask = { id: `t-${Date.now()}`, ...task, createdAt: new Date().toISOString() };
            if (supabase) {
                const { data, error } = await supabase.from('tasks').insert([{
                    site_id: task.siteId,
                    name: task.name,
                    description: task.description,
                    assigned_to: task.assignedTo,
                    status: task.status || 'todo',
                    priority: task.priority || 'medium',
                    deadline: task.deadline
                }]).select().single();
                if (error) throw error;
                newTask.id = data.id;
            }
            localStore.tasks.push(newTask);
            saveStore(localStore);
            return newTask;
        },
        async update(id, updates) {
            if (supabase) {
                const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
                if (error) throw error;
            }
            const idx = localStore.tasks.findIndex(t => t.id === id);
            if (idx === -1) return null;
            localStore.tasks[idx] = { ...localStore.tasks[idx], ...updates, updatedAt: new Date().toISOString() };
            saveStore(localStore);
            return localStore.tasks[idx];
        }
    },

    // Materials
    materials: {
        async listByProject(projectId) {
            if (supabase) {
                const { data, error } = await supabase.from('materials').select('*').eq('project_id', projectId);
                if (error) throw error;
                if (data) return data;
            }
            return localStore.materials.filter(m => m.projectId === projectId);
        },
        async create(material) {
            const newMat = { id: `m-${Date.now()}`, ...material, createdAt: new Date().toISOString() };
            if (supabase) {
                const { data, error } = await supabase.from('materials').insert([{
                    project_id: material.projectId,
                    name: material.name,
                    quantity: material.quantity,
                    unit: material.unit,
                    unit_cost: material.unitCost,
                    total_cost: material.totalCost
                }]).select().single();
                if (error) throw error;
                newMat.id = data.id;
            }
            localStore.materials.push(newMat);
            saveStore(localStore);
            return newMat;
        }
    },

    // Brick Estimations
    brickEstimations: {
        async listByProject(projectId) {
            if (supabase) {
                const { data, error } = await supabase.from('brick_estimations').select('*').eq('project_id', projectId);
                if (error) throw error;
                if (data) return data;
            }
            return localStore.brickEstimations.filter(be => be.projectId === projectId);
        },
        async create(estimation) {
            const newBe = { id: `be-${Date.now()}`, ...estimation, createdAt: new Date().toISOString() };
            if (supabase) {
                const { data, error } = await supabase.from('brick_estimations').insert([{
                    project_id: estimation.projectId,
                    site_id: estimation.siteId,
                    length: estimation.length,
                    width: estimation.width,
                    height: estimation.height,
                    thickness: estimation.thickness,
                    bricks_needed: estimation.bricksNeeded
                }]).select().single();
                if (error) throw error;
                newBe.id = data.id;
            }
            localStore.brickEstimations.push(newBe);
            saveStore(localStore);
            return newBe;
        }
    },

    // Cost Estimations
    costEstimations: {
        async listByProject(projectId) {
            if (supabase) {
                const { data, error } = await supabase.from('cost_estimations').select('*').eq('project_id', projectId);
                if (error) throw error;
                if (data) return data;
            }
            return localStore.costEstimations.filter(ce => ce.projectId === projectId);
        },
        async create(estimation) {
            const newCe = { id: `ce-${Date.now()}`, ...estimation, createdAt: new Date().toISOString() };
            if (supabase) {
                const { data, error } = await supabase.from('cost_estimations').insert([{
                    project_id: estimation.projectId,
                    material_cost: estimation.materialCost,
                    labor_cost: estimation.laborCost,
                    transport_cost: estimation.transportCost,
                    misc_cost: estimation.miscCost,
                    total_estimated_cost: estimation.totalEstimatedCost
                }]).select().single();
                if (error) throw error;
                newCe.id = data.id;
            }
            localStore.costEstimations.push(newCe);
            saveStore(localStore);
            return newCe;
        }
    },

    // Documents
    documents: {
        async listByProject(projectId) {
            if (supabase) {
                const { data, error } = await supabase.from('documents').select('*').eq('project_id', projectId);
                if (error) throw error;
                if (data) return data;
            }
            return localStore.documents.filter(d => d.projectId === projectId);
        },
        async create(document) {
            const newDoc = { id: `d-${Date.now()}`, ...document, createdAt: new Date().toISOString() };
            if (supabase) {
                const { data, error } = await supabase.from('documents').insert([{
                    project_id: document.projectId,
                    name: document.name,
                    file_url: document.fileUrl,
                    file_type: document.fileType,
                    uploaded_by: document.uploadedBy
                }]).select().single();
                if (error) throw error;
                newDoc.id = data.id;
            }
            localStore.documents.push(newDoc);
            saveStore(localStore);
            return newDoc;
        }
    },

    // Team Chat
    chat: {
        async listByProject(projectId) {
            if (supabase) {
                const { data, error } = await supabase.from('chat_messages').select('*').eq('project_id', projectId).order('created_at', { ascending: true });
                if (error) throw error;
                if (data) return data;
            }
            return localStore.chatMessages.filter(msg => msg.projectId === projectId);
        },
        async create(message) {
            const newMsg = { id: `msg-${Date.now()}`, ...message, createdAt: new Date().toISOString() };
            if (supabase) {
                const { data, error } = await supabase.from('chat_messages').insert([{
                    project_id: message.projectId,
                    sender_id: message.senderId,
                    message_text: message.messageText,
                    file_url: message.fileUrl
                }]).select().single();
                if (error) throw error;
                newMsg.id = data.id;
            }
            localStore.chatMessages.push(newMsg);
            saveStore(localStore);
            return newMsg;
        }
    }
};

module.exports = db;
