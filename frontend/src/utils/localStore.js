
// Helper to deduplicate chat messages by ID and time window signature
export const deduplicateChatMessages = (messages) => {
  if (!Array.isArray(messages)) return [];
  const clean = [];
  const seenIds = new Set();
  const seenSignatures = new Set();

  messages.forEach(m => {
    if (!m || !m.messageText) return;
    const msgId = String(m.id || '');
    if (msgId && seenIds.has(msgId)) return;

    const timeBucket = m.createdAt ? Math.floor(new Date(m.createdAt).getTime() / 10000) : 0;
    const sig = `${m.projectId}_${m.senderId}_${String(m.messageText).trim()}_${timeBucket}`;
    if (seenSignatures.has(sig)) return;

    if (msgId) seenIds.add(msgId);
    seenSignatures.add(sig);
    clean.push(m);
  });
  return clean;
};

// Unified Client-Side Storage & Offline Persistence Engine for Hylire
// Guarantees 100% data persistence on Vercel / GitHub Pages / Local deployments

const STORAGE_KEY = 'hylire_db_store';

export const DEFAULT_INITIAL_STATE = {
  users: [
    { id: "u-1", email: "admin@hylire.com", fullName: "John Builder", role: "builder" },
    { id: "u-2", email: "engineer@hylire.com", fullName: "Sarah Engineer", role: "engineer" },
    { id: "u-3", email: "client@hylire.com", fullName: "Robert Client", role: "client" },
    { id: "u-4", email: "contractor@hylire.com", fullName: "Mark Contractor", role: "contractor" },
    { id: "u-5", email: "worker@hylire.com", fullName: "David Worker", role: "worker" }
  ],
  projects: [
    {
      id: "p-1789872275380",
      name: "Alva's",
      description: "egee",
      budget: 12000000,
      spent: 8416800,
      startDate: "2026-09-20",
      endDate: "2027-09-22",
      clientId: "u-3",
      status: "planning",
      createdAt: "2026-09-20T02:44:35.380Z"
    },
    {
      id: "p-1793818569979",
      name: "nitte",
      description: "Nitte Campus Construction Project",
      budget: 3000000,
      spent: 0,
      startDate: "2026-11-05",
      endDate: "2027-11-05",
      clientId: "u-3",
      status: "planning",
      createdAt: "2026-11-04T18:56:09.979Z"
    },
    {
      id: "p-1793820952330",
      name: "pta",
      description: "PTA Residential Enclave Project",
      budget: 200000,
      spent: 10000,
      startDate: "2026-11-04",
      endDate: "2027-11-02",
      clientId: "u-3",
      status: "planning",
      createdAt: "2026-11-04T19:35:52.330Z"
    }
  ],
  sites: [
    {
      id: "s-1789872275394",
      projectId: "p-1789872275380",
      name: "Alva's - Main Site",
      address: "Primary Project Site",
      engineerId: "u-2",
      status: "active",
      createdAt: "2026-09-20T02:44:35.394Z"
    },
    {
      id: "s-1793818569983",
      projectId: "p-1793818569979",
      name: "nitte - Main Site",
      address: "Primary Project Site",
      engineerId: "u-2",
      status: "active",
      createdAt: "2026-11-04T18:56:09.983Z"
    },
    {
      id: "s-1793820952332",
      projectId: "p-1793820952330",
      name: "pta - Main Site",
      address: "Primary Project Site",
      engineerId: "u-2",
      status: "active",
      createdAt: "2026-11-04T19:35:52.332Z"
    }
  ],
  tasks: [
    {
      id: "t-201",
      siteId: "s-201",
      name: "Pour basement B2 slab concrete M25",
      description: "Ready-mix concrete pumping for B2 slab section A",
      stage: "in_progress",
      status: "in_progress",
      priority: "high",
      deadline: "2026-09-22",
      createdAt: "2026-09-15T09:00:00.000Z"
    },
    {
      id: "t-202",
      siteId: "s-201",
      name: "Assemble exterior scaffolding tower",
      description: "Scaffolding staging for 3rd floor column shuttering",
      stage: "todo",
      status: "todo",
      priority: "medium",
      deadline: "2026-09-25",
      createdAt: "2026-09-16T10:00:00.000Z"
    },
    {
      id: "t-203",
      siteId: "s-202",
      name: "Internal masonry brickwork Villa 1-5",
      description: "9-inch exterior wall and 4.5-inch partition brickwork",
      stage: "in_progress",
      status: "in_progress",
      priority: "high",
      deadline: "2026-09-24",
      createdAt: "2026-09-14T08:00:00.000Z"
    },
    {
      id: "t-204",
      siteId: "s-202",
      name: "Stormwater drain trenching & laying",
      description: "Precast RCC drain pipes for road sector B",
      stage: "completed",
      status: "completed",
      priority: "medium",
      deadline: "2026-09-18",
      createdAt: "2026-09-10T08:00:00.000Z"
    }
  ],
  materials: [
    {
      id: "mat-201",
      projectId: "p-201",
      siteId: "s-201",
      materialName: "UltraTech Cement 53 Grade",
      quantity: 1200,
      unit: "Bags",
      unitPrice: 395,
      totalCost: 474000,
      createdAt: "2026-09-02T11:00:00.000Z"
    },
    {
      id: "mat-202",
      projectId: "p-201",
      siteId: "s-201",
      materialName: "Fe550D TMT Rebar (12mm & 16mm)",
      quantity: 18,
      unit: "MT",
      unitPrice: 63500,
      totalCost: 1143000,
      createdAt: "2026-09-05T14:30:00.000Z"
    },
    {
      id: "mat-203",
      projectId: "p-202",
      siteId: "s-202",
      materialName: "Red Clay Bricks (Class 1)",
      quantity: 50000,
      unit: "Pcs",
      unitPrice: 9.5,
      totalCost: 475000,
      createdAt: "2026-09-04T09:15:00.000Z"
    },
    {
      id: "mat-204",
      projectId: "p-202",
      siteId: "s-202",
      materialName: "Coarse River Sand & Aggregate 20mm",
      quantity: 45,
      unit: "Tons",
      unitPrice: 1850,
      totalCost: 83250,
      createdAt: "2026-09-08T16:00:00.000Z"
    }
  ],
  brickEstimations: [
    {
      id: "be-201",
      projectId: "p-202",
      siteId: "s-202",
      wallType: "9-inch External Perimeter Wall",
      totalBricks: 24000,
      totalCost: 264000,
      createdAt: "2026-08-28T10:00:00.000Z"
    }
  ],
  costEstimations: [
    {
      id: "ce-201",
      projectId: "p-201",
      siteId: "s-201",
      category: "Foundation & Earthwork",
      description: "Earth excavation, basement shoring & dewatering",
      totalEstimatedCost: 1250000,
      totalCost: 1250000,
      createdAt: "2026-08-15T12:00:00.000Z"
    }
  ],
  expenses: [
    {
      id: "exp-201",
      projectId: "p-201",
      amount: 185000,
      category: "Equipment",
      description: "JCB Excavator & Tower Crane mobilization",
      vendor: "Apex Heavy Machinery Ltd",
      date: "2026-09-10T10:00:00.000Z",
      createdAt: "2026-09-10T10:00:00.000Z"
    },
    {
      id: "exp-202",
      projectId: "p-201",
      amount: 320000,
      category: "Labor",
      description: "Fortnightly bar benders & shuttering carpenters wages",
      vendor: "Rajesh Contractor Gang",
      date: "2026-09-14T17:30:00.000Z",
      createdAt: "2026-09-14T17:30:00.000Z"
    },
    {
      id: "exp-203",
      projectId: "p-202",
      amount: 115000,
      category: "Permits",
      description: "Town planning NOC & drainage sanction fees",
      vendor: "Municipal Authority",
      date: "2026-09-06T14:00:00.000Z",
      createdAt: "2026-09-06T14:00:00.000Z"
    }
  ],
  aiEstimations: [],
  documents: [],
    projectUpdates: [
    {
      id: "upd-1",
      senderName: "Sarah Engineer",
      role: "engineer",
      projectId: "p-1789872275380",
      projectName: "Alva's",
      message: "Soil compaction testing at Apex Site A passed. Concrete base pour is cleared to start.",
      category: "Site Milestone",
      accentColor: "var(--accent-color)",
      createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString()
    },
    {
      id: "upd-2",
      senderName: "System Logger",
      role: "system",
      projectId: "p-1789872275380",
      projectName: "Alva's",
      message: "Brick estimation for project generated and saved to project vault.",
      category: "Estimation",
      accentColor: "var(--primary-color)",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "upd-3",
      senderName: "Mark Contractor",
      role: "contractor",
      projectId: "p-1789872275380",
      projectName: "Alva's",
      message: "Tower Crane #2 safety check certified by chief inspector.",
      category: "Safety Check",
      accentColor: "var(--color-success)",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  chatMessages: [
    {
      id: "msg-init-1",
      projectId: "p-1789872275380",
      senderId: "u-2",
      senderName: "Sarah Engineer",
      role: "engineer",
      messageText: "Foundation footings for Block A have passed structural inspection and soil tests.",
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    },
    {
      id: "msg-init-2",
      projectId: "p-1789872275380",
      senderId: "u-4",
      senderName: "Mark Contractor",
      role: "contractor",
      messageText: "Ready-mix concrete delivery scheduled for tomorrow at 08:00 AM.",
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: "msg-init-3",
      projectId: "p-1789872275380",
      senderId: "u-1",
      senderName: "John Builder",
      role: "builder",
      messageText: "Approved. Ensure all safety vests and crane rigging certificates are logged before pouring.",
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    }
  ]
};

// Load full store from localStorage with fallback initialization
export const getLocalStore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveLocalStore(DEFAULT_INITIAL_STATE);
      return DEFAULT_INITIAL_STATE;
    }
    const parsed = JSON.parse(raw);
    const rawProjects = Array.isArray(parsed.projects) ? parsed.projects : DEFAULT_INITIAL_STATE.projects;
    
    // Clean and deduplicate projects by normalized name and remove nameless stubs
    const cleanProjects = [];
    const seenNames = new Map();
    rawProjects.forEach(p => {
      if (!p || !p.name || p.name === 'undefined' || String(p.name).trim() === '') return;
      const key = String(p.name).trim().toLowerCase();
      if (!seenNames.has(key)) {
        const copy = { ...p };
        seenNames.set(key, copy);
        cleanProjects.push(copy);
      } else {
        const existing = seenNames.get(key);
        existing.spent = Math.max(Number(existing.spent) || 0, Number(p.spent) || 0);
        if ((!existing.budget || existing.budget === 0) && p.budget) {
          existing.budget = p.budget;
        }
      }
    });

    return {
      users: Array.isArray(parsed.users) ? parsed.users : DEFAULT_INITIAL_STATE.users,
      projects: cleanProjects.length > 0 ? cleanProjects : DEFAULT_INITIAL_STATE.projects,
      sites: Array.isArray(parsed.sites) ? parsed.sites : DEFAULT_INITIAL_STATE.sites,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : DEFAULT_INITIAL_STATE.tasks,
      materials: Array.isArray(parsed.materials) ? parsed.materials : DEFAULT_INITIAL_STATE.materials,
      brickEstimations: Array.isArray(parsed.brickEstimations) ? parsed.brickEstimations : DEFAULT_INITIAL_STATE.brickEstimations,
      costEstimations: Array.isArray(parsed.costEstimations) ? parsed.costEstimations : DEFAULT_INITIAL_STATE.costEstimations,
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : (DEFAULT_INITIAL_STATE.expenses || []),
      aiEstimations: Array.isArray(parsed.aiEstimations) ? parsed.aiEstimations : [],
      documents: Array.isArray(parsed.documents) ? parsed.documents : [],
      chatMessages: deduplicateChatMessages(Array.isArray(parsed.chatMessages) && parsed.chatMessages.length > 0 ? parsed.chatMessages : DEFAULT_INITIAL_STATE.chatMessages),
      projectUpdates: Array.isArray(parsed.projectUpdates) && parsed.projectUpdates.length > 0 ? parsed.projectUpdates : DEFAULT_INITIAL_STATE.projectUpdates
    };
  } catch (err) {
    console.error('Error reading localStorage store:', err);
    return DEFAULT_INITIAL_STATE;
  }
};

// Save full store to localStorage
export const saveLocalStore = (store) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Error saving to localStorage:', err);
  }
};

// Real-Time Project Updates
export const localUpdates = {
  list(projectId) {
    const store = getLocalStore();
    let list = Array.isArray(store.projectUpdates) && store.projectUpdates.length > 0 ? store.projectUpdates : DEFAULT_INITIAL_STATE.projectUpdates;
    if (projectId) list = list.filter(u => u.projectId === projectId);
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  create(update) {
    const store = getLocalStore();
    if (!Array.isArray(store.projectUpdates) || store.projectUpdates.length === 0) {
      store.projectUpdates = [...DEFAULT_INITIAL_STATE.projectUpdates];
    }
    const newUpd = {
      id: update.id || `upd-${Date.now()}`,
      senderName: update.senderName || 'Anonymous',
      role: update.role || 'builder',
      projectId: update.projectId || null,
      projectName: update.projectName || 'General',
      message: update.message || update.messageText || '',
      category: update.category || 'Site Milestone',
      accentColor: update.accentColor || 'var(--accent-color)',
      createdAt: update.createdAt || new Date().toISOString()
    };
    store.projectUpdates = [newUpd, ...store.projectUpdates];
    saveLocalStore(store);
    return newUpd;
  },
  delete(id) {
    const store = getLocalStore();
    if (!store.projectUpdates) return true;
    store.projectUpdates = store.projectUpdates.filter(u => u.id !== id);
    saveLocalStore(store);
    return true;
  }
};

// Unified Bidirectional Sync Helper: merges API data into localStore so data is NEVER cleared on refresh
export const syncCollection = (collectionName, apiItems) => {
  if (!Array.isArray(apiItems) || apiItems.length === 0) {
    return getLocalStore()[collectionName] || [];
  }
  const store = getLocalStore();
  const currentItems = Array.isArray(store[collectionName]) ? store[collectionName] : [];

  const map = new Map();
  currentItems.forEach(item => {
    const key = String(item.id || item._id);
    if (key) map.set(key, item);
  });

  apiItems.forEach(apiItem => {
    const key = String(apiItem.id || apiItem._id);
    if (key) {
      const existing = map.get(key);
      map.set(key, existing ? { ...existing, ...apiItem } : apiItem);
    }
  });

  let merged = Array.from(map.values());

  // Deduplicate and sanitize projects: remove nameless stubs and merge duplicates by name
  if (collectionName === 'projects') {
    const clean = [];
    const nameMap = new Map();
    merged.forEach(p => {
      if (!p || !p.name || p.name === 'undefined' || String(p.name).trim() === '') return;
      const nameKey = String(p.name).trim().toLowerCase();
      if (!nameMap.has(nameKey)) {
        const copy = { ...p };
        nameMap.set(nameKey, copy);
        clean.push(copy);
      } else {
        const prev = nameMap.get(nameKey);
        prev.spent = Math.max(Number(prev.spent) || 0, Number(p.spent) || 0);
        if ((!prev.budget || prev.budget === 0) && p.budget) {
          prev.budget = p.budget;
        }
        if (!prev.startDate && p.startDate) prev.startDate = p.startDate;
        if (!prev.endDate && p.endDate) prev.endDate = p.endDate;
      }
    });
    merged = clean;
  }

  // Deduplicate chatMessages
  if (collectionName === 'chatMessages') {
    merged = deduplicateChatMessages(merged);
  }

  // Deduplicate sites by (projectId + name)
  if (collectionName === 'sites') {
    const cleanSites = [];
    const siteMap = new Map();
    merged.forEach(s => {
      if (!s || !s.name) return;
      const sKey = `${s.projectId || ''}_${String(s.name).trim().toLowerCase()}`;
      if (!siteMap.has(sKey)) {
        siteMap.set(sKey, s);
        cleanSites.push(s);
      }
    });
    merged = cleanSites;
  }

  // Deduplicate tasks by (siteId + name)
  if (collectionName === 'tasks') {
    const cleanTasks = [];
    const taskMap = new Map();
    merged.forEach(t => {
      if (!t || !t.name) return;
      const tKey = `${t.siteId || ''}_${String(t.name).trim().toLowerCase()}`;
      if (!taskMap.has(tKey)) {
        taskMap.set(tKey, t);
        cleanTasks.push(t);
      }
    });
    merged = cleanTasks;
  }

  store[collectionName] = merged;
  saveLocalStore(store);
  return merged;
};

// ==========================================
// Specific Collection Operations
// ==========================================

// Projects
export const localProjects = {
  list() {
    return getLocalStore().projects;
  },
  getSpentDetails(projectId) {
    const store = getLocalStore();
    const proj = (store.projects || []).find(p => p.id === projectId || p._id === projectId);
    const targetId = proj ? (proj.id || proj._id) : projectId;
    const allocated = Number(proj?.budget) || 0;

    const matchesProj = item => (
      item.projectId === targetId || 
      item.projectId === projectId || 
      (proj?._id && item.projectId === proj._id) ||
      (proj?.id && item.projectId === proj.id)
    );

    const materials = (store.materials || []).filter(matchesProj);
    const bricks = (store.brickEstimations || []).filter(matchesProj);
    const costs = (store.costEstimations || []).filter(matchesProj);
    const expenses = (store.expenses || []).filter(matchesProj);

    const matsTotal = materials.reduce((acc, m) => acc + (Number(m.totalCost) || 0), 0);
    const bricksTotal = bricks.reduce((acc, b) => acc + (Number(b.totalCost || b.totalEstimatedCost) || 0), 0);
    const costsTotal = costs.reduce((acc, c) => acc + (Number(c.totalEstimatedCost || c.totalCost) || 0), 0);
    const expensesTotal = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    
    // Explicit project spent or baseline
    const manualSpent = Number(proj?.spent) || 0;
    const directSpendRecorded = Math.max(expensesTotal, manualSpent);
    const computedTotal = matsTotal + bricksTotal + costsTotal + directSpendRecorded;
    const totalSpent = computedTotal;

    const remaining = Math.max(0, allocated - totalSpent);
    const percent = allocated > 0 ? Math.round((totalSpent / allocated) * 100) : 0;

    // Compile comprehensive itemized breakdown list
    const items = [];

    // 1. Direct Site Expenses
    expenses.forEach(e => {
      items.push({
        id: e.id || `exp-${Math.random()}`,
        type: 'Site Expense',
        category: e.category || 'General Expense',
        name: e.description || `${e.category} Payment`,
        desc: e.vendor ? `Vendor: ${e.vendor}` : 'Site expense voucher',
        amount: Number(e.amount) || 0,
        date: e.date || e.createdAt || new Date().toISOString()
      });
    });

    // 2. Materials & Concrete
    materials.forEach(m => {
      items.push({
        id: m.id || `mat-${Math.random()}`,
        type: 'Material',
        category: 'Materials & Concrete',
        name: m.materialName || m.name || 'Site Material',
        desc: m.quantity ? `${m.quantity} ${m.unit || 'units'} @ ₹${Number(m.unitPrice || 0).toLocaleString('en-IN')}` : (m.description || 'Materials requisition'),
        amount: Number(m.totalCost) || 0,
        date: m.createdAt || m.date || new Date().toISOString()
      });
    });

    // 3. Brickwork & Masonry
    bricks.forEach(b => {
      items.push({
        id: b.id || `brk-${Math.random()}`,
        type: 'Brickwork',
        category: 'Brickwork & Masonry',
        name: b.wallType || 'Brickwork Masonry',
        desc: b.totalBricks ? `${Number(b.totalBricks).toLocaleString('en-IN')} bricks calculated` : (b.description || 'Brickwork estimate'),
        amount: Number(b.totalCost || b.totalEstimatedCost) || 0,
        date: b.createdAt || new Date().toISOString()
      });
    });

    // 4. Labor & Cost Estimations
    costs.forEach(c => {
      items.push({
        id: c.id || `cst-${Math.random()}`,
        type: 'Labor & Operations',
        category: c.category || 'Operations',
        name: c.description || c.category || 'Cost Estimation',
        desc: c.source || 'Operational projection',
        amount: Number(c.totalEstimatedCost || c.totalCost) || 0,
        date: c.createdAt || new Date().toISOString()
      });
    });

    // Sort items by date descending (newest first)
    items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    return {
      allocated,
      spent: totalSpent,
      remaining,
      percent,
      materialsTotal: matsTotal,
      bricksTotal: bricksTotal,
      costsTotal: costsTotal,
      manualSpent: directSpendRecorded,
      items
    };
  },
  create(project) {
    const store = getLocalStore();
    const normName = String(project.name || '').trim().toLowerCase();
    
    // Check if project with same name already exists
    if (normName) {
      const existingIdx = (store.projects || []).findIndex(p => String(p.name || '').trim().toLowerCase() === normName);
      if (existingIdx !== -1) {
        store.projects[existingIdx] = {
          ...store.projects[existingIdx],
          ...project,
          budget: parseFloat(project.budget) || store.projects[existingIdx].budget,
          updatedAt: new Date().toISOString()
        };
        saveLocalStore(store);
        return store.projects[existingIdx];
      }
    }

    const newProj = {
      id: project.id || `p-${Date.now()}`,
      name: project.name || 'Untitled Project',
      description: project.description || '',
      budget: parseFloat(project.budget) || 0,
      spent: parseFloat(project.spent) || 0,
      startDate: project.startDate || new Date().toISOString().split('T')[0],
      endDate: project.endDate || '',
      clientId: project.clientId || null,
      status: project.status || 'planning',
      createdAt: new Date().toISOString()
    };
    store.projects = [newProj, ...(store.projects || [])];
    
    // Auto-create default site for this project if not already present
    const existingSite = (store.sites || []).find(s => s.projectId === newProj.id);
    if (!existingSite) {
      const defaultSite = {
        id: `s-${Date.now()}`,
        projectId: newProj.id,
        name: `${newProj.name} - Main Site`,
        address: 'Primary Project Site Location',
        engineerId: null,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      store.sites.push(defaultSite);
    }

    saveLocalStore(store);
    return newProj;
  },
  update(id, updates) {
    const store = getLocalStore();
    let updatedProj = null;
    store.projects = (store.projects || []).map(p => {
      if (p.id === id || p._id === id) {
        updatedProj = {
          ...p,
          ...updates,
          budget: updates.budget !== undefined ? (parseFloat(updates.budget) || 0) : p.budget,
          spent: updates.spent !== undefined ? (parseFloat(updates.spent) || 0) : p.spent,
          updatedAt: new Date().toISOString()
        };
        return updatedProj;
      }
      return p;
    });
    saveLocalStore(store);
    return updatedProj;
  },
  recordExpense(projectId, expense) {
    const store = getLocalStore();
    const amount = parseFloat(expense.amount) || 0;
    
    // Save to store.expenses
    if (!store.expenses) store.expenses = [];
    const newExpense = {
      id: `exp-${Date.now()}`,
      projectId,
      amount,
      category: expense.category || 'General Expense',
      description: expense.description || `${expense.category} payment`,
      vendor: expense.vendor || 'Site Field Voucher',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    store.expenses.unshift(newExpense);

    // Also update project.spent
    store.projects = (store.projects || []).map(p => {
      if (p.id === projectId || p._id === projectId) {
        const currentSpent = Number(p.spent) || 0;
        return { ...p, spent: currentSpent + amount };
      }
      return p;
    });

    saveLocalStore(store);
    return newExpense;
  },
  delete(id) {
    const store = getLocalStore();
    store.projects = store.projects.filter(p => p.id !== id);
    store.sites = store.sites.filter(s => s.projectId !== id);
    saveLocalStore(store);
    return true;
  }
};

// Sites
export const localSites = {
  list(projectId) {
    const store = getLocalStore();
    if (projectId) return store.sites.filter(s => s.projectId === projectId);
    return store.sites;
  },
  create(site) {
    const store = getLocalStore();
    const existingIdx = (store.sites || []).findIndex(s => s.id === site.id || (s.projectId === site.projectId && String(s.name).trim().toLowerCase() === String(site.name).trim().toLowerCase()));
    if (existingIdx !== -1) {
      store.sites[existingIdx] = { ...store.sites[existingIdx], ...site };
      saveLocalStore(store);
      return store.sites[existingIdx];
    }
    const newSite = {
      id: site.id || `s-${Date.now()}`,
      projectId: site.projectId,
      name: site.name,
      address: site.address || '',
      engineerId: site.engineerId || null,
      status: site.status || 'active',
      createdAt: new Date().toISOString()
    };
    store.sites.push(newSite);
    saveLocalStore(store);
    return newSite;
  },
  updateStatus(id, status) {
    const store = getLocalStore();
    store.sites = store.sites.map(s => s.id === id ? { ...s, status } : s);
    saveLocalStore(store);
    return true;
  },
  delete(id) {
    const store = getLocalStore();
    store.sites = store.sites.filter(s => s.id !== id);
    saveLocalStore(store);
    return true;
  }
};

// Tasks
export const localTasks = {
  list(siteId) {
    const store = getLocalStore();
    const tasks = store.tasks || [];
    const normalized = tasks.map(t => ({
      ...t,
      status: t.status || t.stage || 'todo',
      stage: t.stage || t.status || 'todo'
    }));
    if (siteId) return normalized.filter(t => t.siteId === siteId);
    return normalized;
  },
  create(task) {
    const store = getLocalStore();
    const st = task.status || task.stage || 'todo';
    const existingIdx = (store.tasks || []).findIndex(t => t.id === task.id || (t.siteId === task.siteId && String(t.name).trim().toLowerCase() === String(task.name).trim().toLowerCase()));
    if (existingIdx !== -1) {
      store.tasks[existingIdx] = { ...store.tasks[existingIdx], ...task, status: st, stage: st };
      saveLocalStore(store);
      return store.tasks[existingIdx];
    }
    const newTask = {
      id: task.id || `t-${Date.now()}`,
      siteId: task.siteId,
      name: task.name,
      description: task.description || '',
      stage: st,
      status: st,
      assignedTo: task.assignedTo || null,
      workerName: task.workerName || '',
      priority: task.priority || 'medium',
      deadline: task.deadline || null,
      createdAt: new Date().toISOString()
    };
    store.tasks.push(newTask);
    saveLocalStore(store);
    return newTask;
  },
  updateStage(id, stage) {
    const store = getLocalStore();
    store.tasks = store.tasks.map(t => t.id === id ? { ...t, stage, status: stage, updatedAt: new Date().toISOString() } : t);
    saveLocalStore(store);
    return true;
  },
  delete(id) {
    const store = getLocalStore();
    store.tasks = store.tasks.filter(t => t.id !== id);
    saveLocalStore(store);
    return true;
  }
};

// Estimations
export const localEstimations = {
  syncFromApi(apiData) {
    if (!apiData) return;
    const store = getLocalStore();
    const types = [
      { apiKey: 'bricks', storeKey: 'brickEstimations' },
      { apiKey: 'materials', storeKey: 'materials' },
      { apiKey: 'costs', storeKey: 'costEstimations' },
      { apiKey: 'aiEstimations', storeKey: 'aiEstimations' }
    ];
    types.forEach(({ apiKey, storeKey }) => {
      const incoming = apiData[apiKey];
      if (Array.isArray(incoming) && incoming.length > 0) {
        const map = new Map();
        (store[storeKey] || []).forEach(item => map.set(String(item.id || item._id), item));
        incoming.forEach(item => {
          const id = String(item.id || item._id);
          if (id) {
            const existing = map.get(id);
            map.set(id, existing ? { ...existing, ...item } : item);
          }
        });
        store[storeKey] = Array.from(map.values());
      }
    });
    saveLocalStore(store);
  },
  listByProject(projectId, siteId) {
    const store = getLocalStore();
    const matches = item => {
      if (item.projectId !== projectId) return false;
      if (siteId && item.siteId && item.siteId !== siteId) return false;
      return true;
    };
    return {
      bricks: (store.brickEstimations || []).filter(matches),
      materials: (store.materials || []).filter(matches),
      costs: (store.costEstimations || []).filter(matches),
      aiEstimations: (store.aiEstimations || []).filter(matches)
    };
  },
  saveBrick(item) {
    const store = getLocalStore();
    const newDoc = { id: `be-${Date.now()}`, siteId: item.siteId || null, ...item, createdAt: new Date().toISOString() };
    store.brickEstimations.push(newDoc);
    saveLocalStore(store);
    return newDoc;
  },
  saveMaterial(item) {
    const store = getLocalStore();
    const newDoc = { id: `mat-${Date.now()}`, siteId: item.siteId || null, ...item, createdAt: new Date().toISOString() };
    store.materials.push(newDoc);
    saveLocalStore(store);
    return newDoc;
  },
  saveCost(item) {
    const store = getLocalStore();
    const newDoc = { id: `ce-${Date.now()}`, siteId: item.siteId || null, ...item, createdAt: new Date().toISOString() };
    store.costEstimations.push(newDoc);
    saveLocalStore(store);
    return newDoc;
  },
  saveAiEstimate(item) {
    const store = getLocalStore();
    if (!store.aiEstimations) store.aiEstimations = [];
    const newDoc = { id: `ai-${Date.now()}`, siteId: item.siteId || null, ...item, createdAt: new Date().toISOString() };
    store.aiEstimations.push(newDoc);
    // Also record in costEstimations so dashboard financial telemetry tracks it
    store.costEstimations.push({
      id: `ce-${Date.now()}`,
      projectId: item.projectId,
      siteId: item.siteId || null,
      materialCost: Math.round(item.primary_cost * 0.60),
      laborCost: Math.round(item.primary_cost * 0.25),
      transportCost: Math.round(item.primary_cost * 0.08),
      miscCost: Math.round(item.primary_cost * 0.07),
      totalEstimatedCost: item.primary_cost,
      source: 'AI Multi-Model Estimator',
      createdAt: new Date().toISOString()
    });
    saveLocalStore(store);
    return newDoc;
  },
  delete(type, id) {
    const store = getLocalStore();
    if (type === 'brick' || type === 'bricks') {
      store.brickEstimations = store.brickEstimations.filter(b => b.id !== id);
    } else if (type === 'material' || type === 'materials') {
      store.materials = store.materials.filter(m => m.id !== id);
    } else if (type === 'cost' || type === 'costs') {
      store.costEstimations = store.costEstimations.filter(c => c.id !== id);
    } else if (type === 'ai' || type === 'aiEstimations') {
      store.aiEstimations = (store.aiEstimations || []).filter(a => a.id !== id);
    }
    saveLocalStore(store);
    return true;
  }
};

// Documents
export const localDocuments = {
  listByProject(projectId) {
    const store = getLocalStore();
    if (!projectId) return store.documents;
    return store.documents.filter(d => d.projectId === projectId);
  },
  create(doc) {
    const store = getLocalStore();
    const newDoc = {
      id: doc.id || `d-${Date.now()}`,
      projectId: doc.projectId,
      name: doc.name,
      fileUrl: doc.fileUrl || doc.fileData || '#',
      fileType: doc.fileType || 'application/pdf',
      fileSize: doc.fileSize || '250 KB',
      category: doc.category || 'General',
      uploadedBy: doc.uploadedBy || 'Admin',
      createdAt: new Date().toISOString()
    };
    store.documents.push(newDoc);
    saveLocalStore(store);
    return newDoc;
  },
  delete(id) {
    const store = getLocalStore();
    store.documents = store.documents.filter(d => d.id !== id);
    saveLocalStore(store);
    return true;
  }
};

// Team Chat
export const localChat = {
  listByProject(projectId) {
    const store = getLocalStore();
    const rawAll = Array.isArray(store.chatMessages) && store.chatMessages.length > 0 
      ? store.chatMessages 
      : DEFAULT_INITIAL_STATE.chatMessages;
    const all = deduplicateChatMessages(rawAll);
    if (!projectId) return all;
    return all.filter(m => m.projectId === projectId);
  },
  create(msg) {
    const store = getLocalStore();
    if (!Array.isArray(store.chatMessages)) {
      store.chatMessages = [...DEFAULT_INITIAL_STATE.chatMessages];
    }
    const cleanText = String(msg.messageText || '').trim();
    if (!cleanText) return null;

    const now = Date.now();
    const nowIso = msg.createdAt || new Date(now).toISOString();

    // Check if duplicate exists within 5 seconds
    const existing = store.chatMessages.find(m => 
      (msg.id && m.id === msg.id) ||
      (m.projectId === msg.projectId &&
       m.senderId === (msg.senderId || 'u-1') &&
       String(m.messageText).trim() === cleanText &&
       m.createdAt && Math.abs(now - new Date(m.createdAt).getTime()) < 5000)
    );
    if (existing) {
      return existing;
    }

    const newMsg = {
      id: msg.id || `msg-${now}-${Math.floor(Math.random() * 1000)}`,
      projectId: msg.projectId,
      senderId: msg.senderId || 'u-1',
      senderName: msg.senderName || 'John Builder',
      role: msg.role || 'builder',
      messageText: cleanText,
      createdAt: nowIso
    };

    store.chatMessages = deduplicateChatMessages([...store.chatMessages, newMsg]);
    saveLocalStore(store);
    return newMsg;
  }
};

// Compute Dynamic Dashboard Telemetry & Stats in Real Time
export const computeDashboardStats = () => {
  const store = getLocalStore();
  const projects = store.projects || [];
  const sites = store.sites || [];
  const tasks = store.tasks || [];
  const materials = store.materials || [];
  const costEstimations = store.costEstimations || [];
  const brickEstimations = store.brickEstimations || [];
  const expenses = store.expenses || [];

  const totalProjects = projects.length;
  const activeSites = sites.filter(s => s.status === 'active').length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.stage === 'completed' || t.status === 'done' || t.status === 'completed').length;
  const totalBudget = projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);

  // Project budget vs spend comparison
  let totalAllSpent = 0;
  const projectComparison = projects.map(p => {
    const rawAllocated = Number(p.budget) || 0;
    const allocatedLakhs = parseFloat((rawAllocated / 100000).toFixed(2));
    
    // Calculate materials + cost estimates + expenses for this project
    const projMatsCost = materials
      .filter(m => m.projectId === p.id || (p._id && m.projectId === p._id))
      .reduce((acc, m) => acc + (Number(m.totalCost) || 0), 0);
    const projEstCost = costEstimations
      .filter(c => c.projectId === p.id || (p._id && c.projectId === p._id))
      .reduce((acc, c) => acc + (Number(c.totalEstimatedCost || c.totalCost) || 0), 0);
    const projBricksCost = brickEstimations
      .filter(b => b.projectId === p.id || (p._id && b.projectId === p._id))
      .reduce((acc, b) => acc + (Number(b.totalCost || b.totalEstimatedCost) || 0), 0);
    const projExpensesCost = expenses
      .filter(e => e.projectId === p.id || (p._id && e.projectId === p._id))
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    
    const manualSpent = Number(p.spent) || 0;
    const directSpend = Math.max(projExpensesCost, manualSpent);
    const computedSpent = projMatsCost + projEstCost + projBricksCost + directSpend;
    const rawSpent = computedSpent;
    totalAllSpent += rawSpent;

    const spentLakhs = parseFloat((rawSpent / 100000).toFixed(2));
    const remainingLakhs = Math.max(0, parseFloat((allocatedLakhs - spentLakhs).toFixed(2)));
    const utilizationPercent = rawAllocated > 0 ? Math.round((rawSpent / rawAllocated) * 100) : 0;

    return {
      id: p.id || p._id,
      name: p.name,
      allocated: allocatedLakhs,
      spent: spentLakhs,
      remaining: remainingLakhs,
      utilizationPercent,
      rawAllocated,
      rawSpent,
      rawRemaining: Math.max(0, rawAllocated - rawSpent)
    };
  });

  const totalSpent = totalAllSpent;
  const remainingBudget = Math.max(0, totalBudget - totalSpent);
  const budgetUtilizationPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Monthly expenditure curve simulation based on project budgets
  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const monthlyExpenditure = totalBudget > 0
    ? months.map((m, idx) => {
        const baseFactor = (totalBudget / 100000) / 24;
        return {
          month: m,
          spent: parseFloat((baseFactor * (0.6 + idx * 0.28 + (idx % 2 === 0 ? 0.15 : -0.1))).toFixed(2))
        };
      })
    : [];

  const siteStats = sites.map(s => {
    const siteTasks = tasks.filter(t => t.siteId === s.id);
    const completed = siteTasks.filter(t => t.stage === 'completed' || t.status === 'done' || t.status === 'completed').length;
    const total = siteTasks.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const proj = projects.find(p => p.id === s.projectId);

    return {
      id: s.id,
      name: s.name,
      projectName: proj ? proj.name : 'Main Project',
      progress,
      status: s.status,
      totalTasks: total,
      completedTasks: completed
    };
  });

  return {
    totalProjects,
    activeSites,
    totalTasks,
    completedTasks,
    totalBudget,
    totalSpent,
    remainingBudget,
    budgetUtilizationPercent,
    projectComparison,
    monthlyExpenditure,
    siteStats
  };
};
