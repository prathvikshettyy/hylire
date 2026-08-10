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
    console.log('Using local fallback database (In-Memory).');
}

// Seed In-Memory Database for local testing
const localStore = {
    users: [
        { id: "u-1", email: "admin@hylire.com", password: "password123", fullName: "John Builder", role: "builder" },
        { id: "u-2", email: "engineer@hylire.com", password: "password123", fullName: "Sarah Engineer", role: "engineer" },
        { id: "u-3", email: "client@hylire.com", password: "password123", fullName: "Robert Client", role: "client" },
        { id: "u-4", email: "contractor@hylire.com", password: "password123", fullName: "Mark Contractor", role: "contractor" },
        { id: "u-5", email: "worker@hylire.com", password: "password123", fullName: "David Worker", role: "worker" }
    ],
    projects: [
        { id: "p-1", name: "Apex Commercial Tower", description: "Modern 15-story office building in downtown district.", clientId: "u-3", status: "in-progress", startDate: "2026-03-01", endDate: "2027-06-30", budget: 15000000, createdAt: new Date() },
        { id: "p-2", name: "Riverview Residential Complex", description: "Multi-family premium housing estate overlooking the river.", clientId: "u-3", status: "planning", startDate: "2026-09-15", endDate: "2028-03-20", budget: 8500000, createdAt: new Date() }
    ],
    sites: [
        { id: "s-1", projectId: "p-1", name: "Apex Site A - Foundation", address: "102 Main St, Sector 4", engineerId: "u-2", status: "active", createdAt: new Date() },
        { id: "s-2", projectId: "p-1", name: "Apex Site B - Structural Core", address: "104 Main St, Sector 4", engineerId: "u-2", status: "active", createdAt: new Date() },
        { id: "s-3", projectId: "p-2", name: "Riverview Block A", address: "40 Riverdale Rd", engineerId: "u-4", status: "active", createdAt: new Date() }
    ],
    tasks: [
        { id: "t-1", siteId: "s-1", name: "Soil Excavation & Grading", description: "Grade the foundation area and clear soil for baseline reinforcement.", assignedTo: "u-5", status: "done", priority: "high", deadline: "2026-08-10", createdAt: new Date() },
        { id: "t-2", siteId: "s-1", name: "Concrete Pouring - Level 1", description: "Pour concrete slab for the main tower base. Review rebar structural integrity first.", assignedTo: "u-2", status: "in-progress", priority: "high", deadline: "2026-08-20", createdAt: new Date() },
        { id: "t-3", siteId: "s-2", name: "Rebar Installation & Welding", description: "Assemble steel support framework for internal core lift column.", assignedTo: "u-4", status: "todo", priority: "medium", deadline: "2026-08-30", createdAt: new Date() },
        { id: "t-4", siteId: "s-3", name: "Site Clearance & Boundary Setup", description: "Erect safety barricades and deploy onsite office cabin.", assignedTo: "u-5", status: "todo", priority: "low", deadline: "2026-09-01", createdAt: new Date() }
    ],
    materials: [
        { id: "m-1", projectId: "p-1", name: "Cement", quantity: 500, unit: "bags", unitCost: 380, totalCost: 190000, createdAt: new Date() },
        { id: "m-2", projectId: "p-1", name: "Sand", quantity: 1200, unit: "cu ft", unitCost: 45, totalCost: 54000, createdAt: new Date() },
        { id: "m-3", projectId: "p-1", name: "Steel Rebars", quantity: 1500, unit: "kg", unitCost: 65, totalCost: 97500, createdAt: new Date() }
    ],
    brickEstimations: [
        { id: "be-1", projectId: "p-1", siteId: "s-1", length: 100, width: 10, height: 12, thickness: 9, bricksNeeded: 55000, createdAt: new Date() }
    ],
    costEstimations: [
        { id: "ce-1", projectId: "p-1", materialCost: 219500, laborCost: 150000, transportCost: 35000, miscCost: 25000, totalEstimatedCost: 429500, createdAt: new Date() }
    ],
    documents: [
        { id: "d-1", projectId: "p-1", name: "Apex_Structural_Blueprints.pdf", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", fileType: "application/pdf", uploadedBy: "u-2", createdAt: new Date() },
        { id: "d-2", projectId: "p-1", name: "Soil_Testing_Report_Final.pdf", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", fileType: "application/pdf", uploadedBy: "u-2", createdAt: new Date() }
    ],
    chatMessages: [
        { id: "msg-1", projectId: "p-1", senderId: "u-2", senderName: "Sarah Engineer", messageText: "Excavation for Site A is completed. We are starting steel rebar assembly tomorrow.", fileUrl: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
        { id: "msg-2", projectId: "p-1", senderId: "u-3", senderName: "Robert Client", messageText: "Excellent progress. Keep me posted on the concrete pour metrics.", fileUrl: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1) }
    ]
};

// Generic Database Helper to support local or Supabase
const db = {
    // Auth & Users
    users: {
        async findByEmail(email) {
            if (supabase) {
                const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
                if (error && error.code !== 'PGRST116') throw error;
                return data;
            }
            return localStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        },
        async findById(id) {
            if (supabase) {
                const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
                if (error) throw error;
                return data;
            }
            return localStore.users.find(u => u.id === id);
        },
        async create(user) {
            const newUser = { id: `u-${Date.now()}`, ...user, createdAt: new Date() };
            if (supabase) {
                const { data, error } = await supabase.from('users').insert([{
                    email: user.email,
                    full_name: user.fullName,
                    role: user.role
                }]).select().single();
                if (error) throw error;
                return data;
            }
            localStore.users.push(newUser);
            return newUser;
        },
        async listAll() {
            if (supabase) {
                const { data, error } = await supabase.from('users').select('*');
                if (error) throw error;
                return data;
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
                return data;
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
                return data;
            }
            return localStore.projects.find(p => p.id === id);
        },
        async create(project) {
            const newProject = { id: `p-${Date.now()}`, ...project, createdAt: new Date() };
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
                return data;
            }
            localStore.projects.push(newProject);
            return newProject;
        },
        async update(id, updates) {
            if (supabase) {
                const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
                if (error) throw error;
                return data;
            }
            const idx = localStore.projects.findIndex(p => p.id === id);
            if (idx === -1) return null;
            localStore.projects[idx] = { ...localStore.projects[idx], ...updates, updatedAt: new Date() };
            return localStore.projects[idx];
        },
        async delete(id) {
            if (supabase) {
                const { error } = await supabase.from('projects').delete().eq('id', id);
                if (error) throw error;
                return true;
            }
            const idx = localStore.projects.findIndex(p => p.id === id);
            if (idx === -1) return false;
            localStore.projects.splice(idx, 1);
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
                return data;
            }
            let res = localStore.sites;
            if (filters.projectId) res = res.filter(s => s.projectId === filters.projectId);
            if (filters.engineerId) res = res.filter(s => s.engineerId === filters.engineerId);
            return res;
        },
        async create(site) {
            const newSite = { id: `s-${Date.now()}`, ...site, createdAt: new Date() };
            if (supabase) {
                const { data, error } = await supabase.from('sites').insert([{
                    project_id: site.projectId,
                    name: site.name,
                    address: site.address,
                    engineer_id: site.engineerId,
                    status: site.status || 'active'
                }]).select().single();
                if (error) throw error;
                return data;
            }
            localStore.sites.push(newSite);
            return newSite;
        },
        async update(id, updates) {
            if (supabase) {
                const { data, error } = await supabase.from('sites').update(updates).eq('id', id).select().single();
                if (error) throw error;
                return data;
            }
            const idx = localStore.sites.findIndex(s => s.id === id);
            if (idx === -1) return null;
            localStore.sites[idx] = { ...localStore.sites[idx], ...updates, updatedAt: new Date() };
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
                return data;
            }
            let res = localStore.tasks;
            if (filters.siteId) res = res.filter(t => t.siteId === filters.siteId);
            if (filters.assignedTo) res = res.filter(t => t.assignedTo === filters.assignedTo);
            return res;
        },
        async create(task) {
            const newTask = { id: `t-${Date.now()}`, ...task, createdAt: new Date() };
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
                return data;
            }
            localStore.tasks.push(newTask);
            return newTask;
        },
        async update(id, updates) {
            if (supabase) {
                const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
                if (error) throw error;
                return data;
            }
            const idx = localStore.tasks.findIndex(t => t.id === id);
            if (idx === -1) return null;
            localStore.tasks[idx] = { ...localStore.tasks[idx], ...updates, updatedAt: new Date() };
            return localStore.tasks[idx];
        }
    },

    // Materials
    materials: {
        async listByProject(projectId) {
            if (supabase) {
                const { data, error } = await supabase.from('materials').select('*').eq('project_id', projectId);
                if (error) throw error;
                return data;
            }
            return localStore.materials.filter(m => m.projectId === projectId);
        },
        async create(material) {
            const newMat = { id: `m-${Date.now()}`, ...material, createdAt: new Date() };
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
                return data;
            }
            localStore.materials.push(newMat);
            return newMat;
        }
    },

    // Brick Estimations
    brickEstimations: {
        async listByProject(projectId) {
            if (supabase) {
                const { data, error } = await supabase.from('brick_estimations').select('*').eq('project_id', projectId);
                if (error) throw error;
                return data;
            }
            return localStore.brickEstimations.filter(be => be.projectId === projectId);
        },
        async create(estimation) {
            const newBe = { id: `be-${Date.now()}`, ...estimation, createdAt: new Date() };
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
                return data;
            }
            localStore.brickEstimations.push(newBe);
            return newBe;
        }
    },

    // Cost Estimations
    costEstimations: {
        async listByProject(projectId) {
            if (supabase) {
                const { data, error } = await supabase.from('cost_estimations').select('*').eq('project_id', projectId);
                if (error) throw error;
                return data;
            }
            return localStore.costEstimations.filter(ce => ce.projectId === projectId);
        },
        async create(estimation) {
            const newCe = { id: `ce-${Date.now()}`, ...estimation, createdAt: new Date() };
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
                return data;
            }
            localStore.costEstimations.push(newCe);
            return newCe;
        }
    },

    // Documents
    documents: {
        async listByProject(projectId) {
            if (supabase) {
                const { data, error } = await supabase.from('documents').select('*').eq('project_id', projectId);
                if (error) throw error;
                return data;
            }
            return localStore.documents.filter(d => d.projectId === projectId);
        },
        async create(document) {
            const newDoc = { id: `d-${Date.now()}`, ...document, createdAt: new Date() };
            if (supabase) {
                const { data, error } = await supabase.from('documents').insert([{
                    project_id: document.projectId,
                    name: document.name,
                    file_url: document.fileUrl,
                    file_type: document.fileType,
                    uploaded_by: document.uploadedBy
                }]).select().single();
                if (error) throw error;
                return data;
            }
            localStore.documents.push(newDoc);
            return newDoc;
        }
    },

    // Team Chat
    chat: {
        async listByProject(projectId) {
            if (supabase) {
                const { data, error } = await supabase.from('chat_messages').select('*').eq('project_id', projectId).order('created_at', { ascending: true });
                if (error) throw error;
                return data;
            }
            return localStore.chatMessages.filter(msg => msg.projectId === projectId);
        },
        async create(message) {
            const newMsg = { id: `msg-${Date.now()}`, ...message, createdAt: new Date() };
            if (supabase) {
                const { data, error } = await supabase.from('chat_messages').insert([{
                    project_id: message.projectId,
                    sender_id: message.senderId,
                    message_text: message.messageText,
                    file_url: message.fileUrl
                }]).select().single();
                if (error) throw error;
                return data;
            }
            localStore.chatMessages.push(newMsg);
            return newMsg;
        }
    }
};

module.exports = db;
