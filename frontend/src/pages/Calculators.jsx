import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  BrickWall, 
  Layers, 
  IndianRupee, 
  Paintbrush, 
  FolderClock, 
  CheckCircle2, 
  Trash2, 
  Printer, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Calculators = () => {
  const { token, apiBaseUrl } = useAuth();
  const [activeTab, setActiveTab] = useState('bricks');
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Brick form inputs & outputs
  const [wallLength, setWallLength] = useState('50');
  const [wallHeight, setWallHeight] = useState('10');
  const [wallThickness, setWallThickness] = useState('9'); // inches
  const [wastagePercent, setWastagePercent] = useState('10');
  const [brickUnitPrice, setBrickUnitPrice] = useState('8.50');
  const [brickResult, setBrickResult] = useState(null);

  // 2. Concrete Materials inputs & outputs
  const [concreteStructureType, setConcreteStructureType] = useState('slab');
  const [concreteLength, setConcreteLength] = useState('40');
  const [concreteWidth, setConcreteWidth] = useState('30');
  const [concreteDepth, setConcreteDepth] = useState('5'); // inches
  const [concreteVol, setConcreteVol] = useState('500');
  const [concreteGrade, setConcreteGrade] = useState('M20');
  const [steelPercent, setSteelPercent] = useState('1.5');
  const [cementPrice, setCementPrice] = useState('380');
  const [sandPrice, setSandPrice] = useState('45');
  const [aggregatePrice, setAggregatePrice] = useState('55');
  const [steelPrice, setSteelPrice] = useState('65');
  const [matResult, setMatResult] = useState(null);

  // 3. Plastering inputs & outputs
  const [plasterArea, setPlasterArea] = useState('1200');
  const [plasterThickness, setPlasterThickness] = useState('12'); // mm
  const [plasterMix, setPlasterMix] = useState('1:4');
  const [plasterResult, setPlasterResult] = useState(null);

  // 4. Overall BOQ & Cost inputs & outputs
  const [builtUpArea, setBuiltUpArea] = useState('1800');
  const [qualityTier, setQualityTier] = useState('standard');
  const [materialCost, setMaterialCost] = useState('1500000');
  const [laborCost, setLaborCost] = useState('600000');
  const [transportCost, setTransportCost] = useState('120000');
  const [miscCost, setMiscCost] = useState('100000');
  const [costResult, setCostResult] = useState(null);

  // 5. Saved Estimations History
  const [savedEstimates, setSavedEstimates] = useState({ bricks: [], materials: [], costs: [] });

  // Load projects list
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !projectId) {
          setProjectId(data[0].id);
        }
      }
    } catch (err) {
      console.warn('Projects fetch failed:', err.message);
    }
  };

  // Fetch saved project estimates
  const fetchSavedEstimates = async (pId) => {
    if (!pId) return;
    try {
      const res = await fetch(`${apiBaseUrl}/estimation/project/${pId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedEstimates(data);
      }
    } catch (err) {
      console.warn('Saved estimates fetch failed:', err.message);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  useEffect(() => {
    if (projectId) {
      fetchSavedEstimates(projectId);
    }
  }, [projectId, token]);

  // Handle Concrete dimensions helper calculation
  useEffect(() => {
    if (concreteStructureType === 'slab' && concreteLength && concreteWidth && concreteDepth) {
      const vol = parseFloat(concreteLength) * parseFloat(concreteWidth) * (parseFloat(concreteDepth) / 12);
      setConcreteVol(vol.toFixed(1));
    }
  }, [concreteStructureType, concreteLength, concreteWidth, concreteDepth]);

  // 1. Brick calculation call
  const calculateBricks = async (e) => {
    if (e) e.preventDefault();
    setSaveSuccess('');
    setLoading(true);

    const payload = {
      length: parseFloat(wallLength),
      height: parseFloat(wallHeight),
      thickness: parseFloat(wallThickness),
      wastage: parseFloat(wastagePercent),
      brickUnitPrice: parseFloat(brickUnitPrice),
      projectId: projectId || null
    };

    try {
      const res = await fetch(`${apiBaseUrl}/estimation/bricks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setBrickResult(data);
        if (projectId) {
          setSaveSuccess('Brick & mortar estimation saved permanently to project database!');
          fetchSavedEstimates(projectId);
        }
      }
    } catch (err) {
      // Local fallback calculation
      const l = parseFloat(wallLength);
      const h = parseFloat(wallHeight);
      const t = parseFloat(wallThickness);
      const wallVol = l * h * (t / 12);
      const singleBrickVolFt = (9.5 * 5 * 3.5) / 1728;
      const baseBricks = Math.ceil(wallVol / singleBrickVolFt);
      const waste = Math.ceil(baseBricks * (parseFloat(wastagePercent) / 100));
      const total = baseBricks + waste;
      const wetMortar = wallVol - (baseBricks * (9 * 4.5 * 3) / 1728);
      const dryMortar = wetMortar * 1.33;
      const cementBags = Math.ceil((dryMortar * (1/7)) / 1.25);
      const sandCft = Math.ceil(dryMortar * (6/7));
      const cost = (total * parseFloat(brickUnitPrice)) + (cementBags * 380) + (sandCft * 45);

      setBrickResult({
        wallVolumeCuFt: parseFloat(wallVol.toFixed(2)),
        bricksNeeded: total,
        baseBricks,
        wastageBricks: waste,
        wetMortarVolumeCuFt: parseFloat(wetMortar.toFixed(2)),
        dryMortarVolumeCuFt: parseFloat(dryMortar.toFixed(2)),
        cementBags,
        sandCuFt: sandCft,
        brickCost: total * parseFloat(brickUnitPrice),
        cementCost: cementBags * 380,
        sandCost: sandCft * 45,
        totalEstimatedCost: cost,
        calculationSteps: [
          `Wall volume calculated: ${wallVol.toFixed(2)} cu ft (L: ${l} ft, H: ${h} ft, T: ${t} in)`,
          `Base bricks needed: ${baseBricks} units`,
          `Wastage offset (+${wastagePercent}%): ${waste} units`,
          `Mortar mix required (1:6): ${cementBags} Cement bags + ${sandCft} cu ft Sand`
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Concrete Materials calculation call
  const calculateMaterials = async (e) => {
    if (e) e.preventDefault();
    setSaveSuccess('');
    setLoading(true);

    const payload = {
      concreteVolume: parseFloat(concreteVol),
      grade: concreteGrade,
      steelPercent: parseFloat(steelPercent),
      cementBagPrice: parseFloat(cementPrice),
      sandCftPrice: parseFloat(sandPrice),
      aggregateCftPrice: parseFloat(aggregatePrice),
      steelKgPrice: parseFloat(steelPrice),
      projectId: projectId || null
    };

    try {
      const res = await fetch(`${apiBaseUrl}/estimation/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setMatResult(data);
        if (projectId) {
          setSaveSuccess('RCC material quantities and costs saved to project inventory!');
          fetchSavedEstimates(projectId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Plastering calculation call
  const calculatePlaster = async (e) => {
    if (e) e.preventDefault();
    setSaveSuccess('');
    setLoading(true);

    const payload = {
      areaSqFt: parseFloat(plasterArea),
      thicknessMm: parseFloat(plasterThickness),
      mixRatio: plasterMix,
      projectId: projectId || null
    };

    try {
      const res = await fetch(`${apiBaseUrl}/estimation/plaster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setPlasterResult(data);
        if (projectId) {
          setSaveSuccess('Plastering estimate saved to database!');
          fetchSavedEstimates(projectId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Cost BOQ calculation call
  const calculateCosts = async (e) => {
    if (e) e.preventDefault();
    setSaveSuccess('');
    setLoading(true);

    const payload = {
      projectId: projectId || null,
      builtUpAreaSqFt: parseFloat(builtUpArea),
      qualityTier,
      materialCost: parseFloat(materialCost),
      laborCost: parseFloat(laborCost),
      transportCost: parseFloat(transportCost),
      miscCost: parseFloat(miscCost)
    };

    try {
      const res = await fetch(`${apiBaseUrl}/estimation/cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setCostResult(data);
        if (projectId) {
          setSaveSuccess('Building BOQ financial model saved to project database!');
          fetchSavedEstimates(projectId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete saved estimation item
  const handleDeleteSaved = async (type, id) => {
    if (!window.confirm('Delete this estimation from project history?')) return;
    try {
      const res = await fetch(`${apiBaseUrl}/estimation/${type}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSavedEstimates(projectId);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="main-view" style={{ maxWidth: 1280 }}>
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="header-title" style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calculator size={28} color="var(--primary-color)" /> Smart Construction Estimator
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Civil engineering material computations, structural concrete schedules, and budget cost models
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={handlePrint} className="btn btn-secondary" style={{ display: 'flex', gap: 6, fontSize: '0.85rem' }}>
            <Printer size={16} /> Print / Export
          </button>
        </div>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          padding: '12px 18px',
          borderRadius: '10px',
          fontSize: '0.88rem',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <CheckCircle2 size={18} />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Target Project Link Bar */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Project Link:</span>
          <select 
            className="form-select"
            style={{ width: 'auto', minWidth: 280, padding: '8px 12px' }}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Standalone Calculation (Do not link to project)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.status || 'Active'})</option>
            ))}
          </select>
        </div>

        {projectId && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
            Auto-saving all computations to project vault
          </span>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: 10, overflowX: 'auto' }}>
        <button 
          onClick={() => { setActiveTab('bricks'); setSaveSuccess(''); }}
          className={`btn ${activeTab === 'bricks' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <BrickWall size={16} />
          <span>1. Brickwork & Mortar</span>
        </button>

        <button 
          onClick={() => { setActiveTab('materials'); setSaveSuccess(''); }}
          className={`btn ${activeTab === 'materials' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <Layers size={16} />
          <span>2. Concrete & RCC Structure</span>
        </button>

        <button 
          onClick={() => { setActiveTab('plaster'); setSaveSuccess(''); }}
          className={`btn ${activeTab === 'plaster' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <Paintbrush size={16} />
          <span>3. Plastering & Finishing</span>
        </button>

        <button 
          onClick={() => { setActiveTab('cost'); setSaveSuccess(''); }}
          className={`btn ${activeTab === 'cost' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <IndianRupee size={16} />
          <span>4. Building BOQ & Costing</span>
        </button>

        {projectId && (
          <button 
            onClick={() => { setActiveTab('history'); setSaveSuccess(''); }}
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}
          >
            <FolderClock size={16} />
            <span>Saved Estimates Vault ({savedEstimates.bricks.length + savedEstimates.materials.length + savedEstimates.costs.length})</span>
          </button>
        )}
      </div>

      {/* TAB 1: BRICKWORK CALCULATOR */}
      {activeTab === 'bricks' && (
        <div className="calc-grid">
          {/* Input Parameters */}
          <div className="card">
            <form onSubmit={calculateBricks}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
                <BrickWall size={20} color="var(--primary-color)" /> Brick Masonry Dimensions
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Wall Length (Feet)</label>
                  <input 
                    type="number" 
                    step="any"
                    className="form-input" 
                    value={wallLength} 
                    onChange={(e) => setWallLength(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Wall Height (Feet)</label>
                  <input 
                    type="number" 
                    step="any"
                    className="form-input" 
                    value={wallHeight} 
                    onChange={(e) => setWallHeight(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Wall Thickness</label>
                  <select 
                    className="form-select"
                    value={wallThickness}
                    onChange={(e) => setWallThickness(e.target.value)}
                  >
                    <option value="4.5">4.5" (Single Leaf / Partition)</option>
                    <option value="9">9" (Standard Load-Bearing)</option>
                    <option value="13.5">13.5" (Heavy 1.5 Brick Wall)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Wastage Buffer (%)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={wastagePercent} 
                    onChange={(e) => setWastagePercent(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Brick Unit Price (₹ / brick)</label>
                <input 
                  type="number" 
                  step="0.10"
                  className="form-input" 
                  value={brickUnitPrice} 
                  onChange={(e) => setBrickUnitPrice(e.target.value)} 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: 10 }} disabled={loading}>
                {loading ? 'Computing...' : 'Calculate Brick & Mortar Requirements'}
              </button>
            </form>
          </div>

          {/* Results Display */}
          <div className="card">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
              <FileSpreadsheet size={20} color="var(--primary-color)" /> Material Bill of Quantities
            </h3>

            {brickResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Highlight Metric */}
                <div style={{ background: 'rgba(234, 88, 12, 0.1)', border: '1px solid rgba(234, 88, 12, 0.3)', padding: 18, borderRadius: 12, textAlign: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Total Bricks Required</span>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-color)', marginTop: 4 }}>
                    {brickResult.bricksNeeded.toLocaleString()} <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>units</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Base: {brickResult.baseBricks} + {brickResult.wastageBricks} breakage buffer ({wastagePercent}%)
                  </span>
                </div>

                {/* Grid Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cement (1:6 Mortar)</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{brickResult.cementBags} <span style={{ fontSize: '0.8rem' }}>bags</span></div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>₹{brickResult.cementCost?.toLocaleString()}</div>
                  </div>

                  <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>River Sand</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{brickResult.sandCuFt} <span style={{ fontSize: '0.8rem' }}>cft</span></div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>₹{brickResult.sandCost?.toLocaleString()}</div>
                  </div>

                  <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Wall Net Volume</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{brickResult.wallVolumeCuFt} <span style={{ fontSize: '0.8rem' }}>cu ft</span></div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Dry Mortar: {brickResult.dryMortarVolumeCuFt} cft</div>
                  </div>
                </div>

                {/* Total Cost Banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 10 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Estimated Material Cost:</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                    ₹{brickResult.totalEstimatedCost?.toLocaleString()}
                  </span>
                </div>

                {/* Calculation Trace */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8 }}>
                  <strong>Engineering Calculation Trace:</strong>
                  <ul style={{ paddingLeft: 16, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {brickResult.calculationSteps?.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <BrickWall size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>Enter wall parameters on the left and click <strong>Calculate</strong> to generate full brickwork and mortar estimates.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CONCRETE & RCC CALCULATOR */}
      {activeTab === 'materials' && (
        <div className="calc-grid">
          {/* Input Parameters */}
          <div className="card">
            <form onSubmit={calculateMaterials}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
                <Layers size={20} color="var(--primary-color)" /> Concrete & RCC Specifications
              </h3>

              <div className="form-group">
                <label className="form-label">Structural Member Type</label>
                <select 
                  className="form-select"
                  value={concreteStructureType}
                  onChange={(e) => setConcreteStructureType(e.target.value)}
                >
                  <option value="slab">Roof / Floor Slab (L × W × Thickness)</option>
                  <option value="custom">Direct Concrete Volume (Cubic Feet)</option>
                </select>
              </div>

              {concreteStructureType === 'slab' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Length (ft)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={concreteLength} 
                      onChange={(e) => setConcreteLength(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Width (ft)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={concreteWidth} 
                      onChange={(e) => setConcreteWidth(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Depth (inches)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={concreteDepth} 
                      onChange={(e) => setConcreteDepth(e.target.value)} 
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Total Volume (Cu Ft)</label>
                  <input 
                    type="number" 
                    step="any"
                    className="form-input" 
                    value={concreteVol} 
                    onChange={(e) => setConcreteVol(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Concrete Mix Grade</label>
                  <select 
                    className="form-select"
                    value={concreteGrade}
                    onChange={(e) => setConcreteGrade(e.target.value)}
                  >
                    <option value="M15">M15 (1:2:4) - Standard PCC</option>
                    <option value="M20">M20 (1:1.5:3) - Standard RCC Slabs & Beams</option>
                    <option value="M25">M25 (1:1:2) - Heavy Structural Columns</option>
                    <option value="M10">M10 (1:3:6) - Foundation Bedding</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Steel Reinforcement Ratio (% of concrete volume)</label>
                <select 
                  className="form-select"
                  value={steelPercent}
                  onChange={(e) => setSteelPercent(e.target.value)}
                >
                  <option value="1.0">1.0% (Light Slabs & Lintels)</option>
                  <option value="1.5">1.5% (Standard RCC Slabs & Beams)</option>
                  <option value="2.0">2.0% (Heavy Columns & Footings)</option>
                  <option value="2.5">2.5% (Heavy Retaining Walls)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Cement Price (₹/bag)</label>
                  <input type="number" className="form-input" value={cementPrice} onChange={(e) => setCementPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">TMT Steel Price (₹/kg)</label>
                  <input type="number" className="form-input" value={steelPrice} onChange={(e) => setSteelPrice(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: 10 }} disabled={loading}>
                {loading ? 'Estimating...' : 'Compute Concrete & RCC Quantities'}
              </button>
            </form>
          </div>

          {/* Results Display */}
          <div className="card">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
              <Layers size={20} color="var(--primary-color)" /> Material Bill of Materials (BOM)
            </h3>

            {matResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Cost Highlight */}
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: 18, borderRadius: 12, textAlign: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Total Material Valuation ({matResult.grade})</span>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>
                    ₹{matResult.totalMaterialsCost?.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Dry Mix Volume: {matResult.dryVolumeCuFt} cu ft (Compaction Factor: 1.54) | Water: {matResult.waterLiters} Liters
                  </span>
                </div>

                {/* Itemized Table */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 14px' }}>Material</th>
                        <th style={{ padding: '10px 14px' }}>Quantity</th>
                        <th style={{ padding: '10px 14px' }}>Rate</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matResult.materials?.map((mat, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600 }}>{mat.name}</td>
                          <td style={{ padding: '10px 14px' }}>{mat.quantity.toLocaleString()} {mat.unit}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>₹{mat.unitCost}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>₹{mat.totalCost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8 }}>
                  <strong>Engineering Standard Applied:</strong> Dry concrete mix volume = Wet Volume × 1.54. Steel weight calculated using 7850 kg/m³ density formula based on structural member volume.
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Layers size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>Enter concrete volume and mix ratio to calculate exact bags of cement, sand, coarse aggregate, and steel rebar.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PLASTERING & FINISHING */}
      {activeTab === 'plaster' && (
        <div className="calc-grid">
          <div className="card">
            <form onSubmit={calculatePlaster}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
                <Paintbrush size={20} color="var(--primary-color)" /> Plastering Area & Mix
              </h3>

              <div className="form-group">
                <label className="form-label">Total Plaster Surface Area (Sq Ft)</label>
                <input 
                  type="number" 
                  step="any"
                  className="form-input" 
                  value={plasterArea} 
                  onChange={(e) => setPlasterArea(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Plaster Thickness (mm)</label>
                  <select 
                    className="form-select"
                    value={plasterThickness}
                    onChange={(e) => setPlasterThickness(e.target.value)}
                  >
                    <option value="12">12 mm (Standard Internal Walls)</option>
                    <option value="15">15 mm (Ceiling / Rough Finish)</option>
                    <option value="20">20 mm (External 2-Coat Weather Plaster)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Mortar Mix Ratio</label>
                  <select 
                    className="form-select"
                    value={plasterMix}
                    onChange={(e) => setPlasterMix(e.target.value)}
                  >
                    <option value="1:4">1:4 (Rich Plaster / Ceilings)</option>
                    <option value="1:6">1:6 (Standard Wall Plaster)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: 10 }} disabled={loading}>
                {loading ? 'Calculating...' : 'Compute Plastering Quantities'}
              </button>
            </form>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
              <CheckCircle2 size={20} color="var(--primary-color)" /> Plaster Material Breakdown
            </h3>

            {plasterResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: 18, borderRadius: 12, textAlign: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Total Plastering & Labor Cost</span>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                    ₹{plasterResult.totalEstimatedCost?.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Surface Area: {plasterResult.areaSqFt} sq ft | Thickness: {plasterResult.thicknessMm} mm
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cement Needed</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{plasterResult.cementBags} <span style={{ fontSize: '0.8rem' }}>bags</span></div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>₹{plasterResult.cementCost?.toLocaleString()}</div>
                  </div>

                  <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fine Sand</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{plasterResult.sandCuFt} <span style={{ fontSize: '0.8rem' }}>cft</span></div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>₹{plasterResult.sandCost?.toLocaleString()}</div>
                  </div>

                  <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Plastering Labor</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>₹{plasterResult.laborCost?.toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>₹18 / sq ft benchmark</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Paintbrush size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>Enter surface square footage and mortar thickness to calculate cement, sand, and plastering labor.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: BUILDING BOQ & OVERALL BUDGETING */}
      {activeTab === 'cost' && (
        <div className="calc-grid">
          <div className="card">
            <form onSubmit={calculateCosts}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
                <IndianRupee size={20} color="var(--primary-color)" /> Building BOQ & Budget Modeler
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Total Built-Up Area (Sq Ft)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={builtUpArea} 
                    onChange={(e) => setBuiltUpArea(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Construction Quality Specification</label>
                  <select 
                    className="form-select"
                    value={qualityTier}
                    onChange={(e) => setQualityTier(e.target.value)}
                  >
                    <option value="standard">Standard Quality (₹1,450 / sq ft)</option>
                    <option value="premium">Premium Quality (₹1,950 / sq ft)</option>
                    <option value="luxury">Luxury Architect Grade (₹2,600 / sq ft)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Material Expenses (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={materialCost} 
                    onChange={(e) => setMaterialCost(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Labor & Contractor Fees (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={laborCost} 
                    onChange={(e) => setLaborCost(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Logistics & Equipment (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={transportCost} 
                    onChange={(e) => setTransportCost(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contingency / Misc Buffer (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={miscCost} 
                    onChange={(e) => setMiscCost(e.target.value)} 
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: 10 }} disabled={loading}>
                {loading ? 'Generating BOQ...' : 'Generate Comprehensive BOQ & Budget'}
              </button>
            </form>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
              <TrendingUp size={20} color="var(--primary-color)" /> Project Cost & Stage Breakdown
            </h3>

            {costResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: 18, borderRadius: 12, textAlign: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Total Project Estimate</span>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#c084fc', marginTop: 4 }}>
                    ₹{costResult.totalEstimatedCost?.toLocaleString()}
                  </div>
                </div>

                {/* Stage by stage BOQ */}
                {costResult.boqBreakdown && (
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', fontWeight: 600, fontSize: '0.85rem' }}>
                      Standard Phase-Wise Cost Allocation
                    </div>
                    {costResult.boqBreakdown.stages?.map((stg, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                        <span>{stg.stage} ({stg.percentage}%)</span>
                        <span style={{ fontWeight: 700 }}>₹{Math.round(stg.cost).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <IndianRupee size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>Input project square footage or customized costs to generate a full construction BOQ and financial schedule.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SAVED PROJECT ESTIMATES HISTORY */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.2rem' }}>
              <FolderClock size={22} color="var(--primary-color)" /> Project Estimation History Vault
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              All estimates saved to the persistent database for project <strong>{projects.find(p => p.id === projectId)?.name || projectId}</strong>
            </p>

            {/* Brick Estimations History */}
            <div style={{ marginTop: 20 }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BrickWall size={16} /> Saved Brickwork Estimates ({savedEstimates.bricks.length})
              </h4>
              {savedEstimates.bricks.length === 0 ? (
                <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  No brick estimations saved for this project yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {savedEstimates.bricks.map(item => (
                    <div key={item.id} style={{ padding: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                          {item.bricksNeeded?.toLocaleString()} Bricks
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Wall: {item.length}' × {item.height}' ({item.thickness}" thick)
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          Cement: {item.cementBags || 0} bags | Cost: ₹{item.totalCost?.toLocaleString() || 0}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteSaved('brick', item.id)} 
                        className="btn-secondary" 
                        style={{ padding: 6, color: 'var(--color-error)' }}
                        title="Delete estimate"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Materials History */}
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={16} /> Saved Inventory Materials ({savedEstimates.materials.length})
              </h4>
              {savedEstimates.materials.length === 0 ? (
                <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  No material inventory saved for this project yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {savedEstimates.materials.map(item => (
                    <div key={item.id} style={{ padding: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 700, marginTop: 2 }}>
                          {item.quantity?.toLocaleString()} {item.unit} (₹{item.totalCost?.toLocaleString()})
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteSaved('material', item.id)} 
                        className="btn-secondary" 
                        style={{ padding: 6, color: 'var(--color-error)' }}
                        title="Delete item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cost Budget History */}
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IndianRupee size={16} /> Saved Budget Estimates ({savedEstimates.costs.length})
              </h4>
              {savedEstimates.costs.length === 0 ? (
                <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  No budget estimations saved for this project yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {savedEstimates.costs.map(item => (
                    <div key={item.id} style={{ padding: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c084fc' }}>
                          ₹{item.totalEstimatedCost?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Mat: ₹{item.materialCost?.toLocaleString()} | Labor: ₹{item.laborCost?.toLocaleString()}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteSaved('cost', item.id)} 
                        className="btn-secondary" 
                        style={{ padding: 6, color: 'var(--color-error)' }}
                        title="Delete estimate"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calculators;
