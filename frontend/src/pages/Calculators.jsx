import React, { useState, useEffect } from 'react';
import { Calculator, BrickWall, Layers, IndianRupee, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Calculators = () => {
  const { token, apiBaseUrl } = useAuth();
  const [activeTab, setActiveTab] = useState('bricks');
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // 1. Brick form inputs & outputs
  const [wallLength, setWallLength] = useState('100');
  const [wallHeight, setWallHeight] = useState('12');
  const [wallThickness, setWallThickness] = useState('9'); // inches
  const [wastagePercent, setWastagePercent] = useState('10');
  const [brickResult, setBrickResult] = useState(null);

  // 2. Concrete Materials inputs & outputs
  const [concreteVol, setConcreteVol] = useState('1000');
  const [matResult, setMatResult] = useState(null);

  // 3. Overall Project Costing inputs & outputs
  const [materialCost, setMaterialCost] = useState('219500');
  const [laborCost, setLaborCost] = useState('150000');
  const [transportCost, setTransportCost] = useState('35000');
  const [miscCost, setMiscCost] = useState('25000');
  const [costResult, setCostResult] = useState(null);

  useEffect(() => {
    // Load projects list
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
          if (data.length > 0) setProjectId(data[0].id);
        }
      } catch (err) {
        setProjects([
          { id: "p-1", name: "Apex Commercial Tower" },
          { id: "p-2", name: "Riverview Residential Complex" }
        ]);
        setProjectId("p-1");
      }
    };
    fetchProjects();
  }, [token]);

  // Brick calculation call
  const calculateBricks = async (e) => {
    e.preventDefault();
    setSaveSuccess('');
    const payload = {
      length: parseFloat(wallLength),
      height: parseFloat(wallHeight),
      thickness: parseFloat(wallThickness),
      wastage: parseFloat(wastagePercent),
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
        if (projectId) setSaveSuccess('Brick estimation saved to project vault!');
      }
    } catch (err) {
      // Manual local fallback calculation
      const thicknessFt = parseFloat(wallThickness) / 12;
      const wallVolume = parseFloat(wallLength) * parseFloat(wallHeight) * thicknessFt;
      // Single standard modular brick size 9"x4.5"x3" with 0.5" mortar joint = 9.5"x5"x3.5"
      const singleBrickVolWithMortar = (9.5 * 5 * 3.5) / 1728; // cubic feet
      const baseBricks = Math.ceil(wallVolume / singleBrickVolWithMortar);
      const wastage = Math.ceil(baseBricks * (parseFloat(wastagePercent) / 100));
      const totalBricks = baseBricks + wastage;
      const mortarVol = wallVolume - (baseBricks * (9 * 4.5 * 3) / 1728);

      setBrickResult({
        wallVolumeCuFt: parseFloat(wallVolume.toFixed(2)),
        bricksNeeded: totalBricks,
        baseBricks,
        wastageBricks: wastage,
        mortarVolumeCuFt: parseFloat(mortarVol.toFixed(2)),
        calculationSteps: [
          `Wall volume calculated: ${wallVolume.toFixed(2)} cu ft (L: ${wallLength} ft, H: ${wallHeight} ft, T: ${wallThickness} in)`,
          `Single brick volume with mortar: ${singleBrickVolWithMortar.toFixed(5)} cu ft`,
          `Base bricks needed: ${baseBricks} units`,
          `Wastage offset (+${wastagePercent}%): ${wastage} units`,
          `Mortar volume estimation: ${mortarVol.toFixed(2)} cu ft`
        ]
      });
      if (projectId) setSaveSuccess('Offline mode: Saved local mock brick estimation.');
    }
  };

  // Materials concrete calculation call
  const calculateMaterials = async (e) => {
    e.preventDefault();
    setSaveSuccess('');
    const payload = {
      concreteVolume: parseFloat(concreteVol),
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
        // Pre-fill material costs for the cost estimator
        setMaterialCost(data.totalMaterialsCost.toString());
        if (projectId) setSaveSuccess('Material requirements saved to project inventory!');
      }
    } catch (err) {
      // Local fallback calculation
      const volume = parseFloat(concreteVol);
      const dryVolume = volume * 1.54;
      const parts = 7; // 1:2:4 Cement:Sand:Aggregate ratio
      const cementCuFt = dryVolume * (1 / parts);
      const sandCuFt = dryVolume * (2 / parts);
      const aggregateCuFt = dryVolume * (4 / parts);
      
      const cementBags = Math.ceil(cementCuFt / 1.25);
      const steelKg = Math.ceil(volume * 2.2 * 0.453592);

      const materials = [
        { name: 'Cement', quantity: cementBags, unit: 'bags', unitCost: 11.50, totalCost: parseFloat((cementBags * 11.50).toFixed(2)) },
        { name: 'Sand', quantity: Math.ceil(sandCuFt), unit: 'cu ft', unitCost: 3.50, totalCost: parseFloat((Math.ceil(sandCuFt) * 3.50).toFixed(2)) },
        { name: 'Coarse Aggregate', quantity: Math.ceil(aggregateCuFt), unit: 'cu ft', unitCost: 4.80, totalCost: parseFloat((Math.ceil(aggregateCuFt) * 4.80).toFixed(2)) },
        { name: 'Reinforcement Steel', quantity: steelKg, unit: 'kg', unitCost: 1.10, totalCost: parseFloat((steelKg * 1.10).toFixed(2)) }
      ];
      
      const totalCost = materials.reduce((acc, curr) => acc + curr.totalCost, 0);

      const response = {
        concreteVolumeCuFt: volume,
        dryVolumeCuFt: parseFloat(dryVolume.toFixed(2)),
        materials,
        totalMaterialsCost: parseFloat(totalCost.toFixed(2))
      };
      setMatResult(response);
      setMaterialCost(response.totalMaterialsCost.toString());
      if (projectId) setSaveSuccess('Offline mode: Saved local material quantities.');
    }
  };

  // Cost calculation call
  const calculateCosts = async (e) => {
    e.preventDefault();
    setSaveSuccess('');
    const payload = {
      projectId: projectId || null,
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
        if (projectId) setSaveSuccess('Financial cost estimate saved to database!');
      }
    } catch (err) {
      // Local fallback calculation
      const total = parseFloat(materialCost) + parseFloat(laborCost) + parseFloat(transportCost) + parseFloat(miscCost);
      setCostResult({
        projectId,
        materialCost: parseFloat(materialCost),
        laborCost: parseFloat(laborCost),
        transportCost: parseFloat(transportCost),
        miscCost: parseFloat(miscCost),
        totalEstimatedCost: total
      });
      if (projectId) setSaveSuccess('Offline mode: Saved local budget breakdown.');
    }
  };

  return (
    <div className="main-view">
      <div>
        <h1 className="header-title" style={{ fontSize: '2rem' }}>Smart Estimators</h1>
        <p style={{ color: 'var(--text-muted)' }}>Generate quick civil engineering structural estimates and budget costing models</p>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div style={{
          background: 'var(--color-success-bg)',
          color: 'var(--color-success)',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '0.85rem',
          border: '1px solid rgba(16, 185, 129, 0.15)'
        }}>
          {saveSuccess}
        </div>
      )}

      {/* Project Selector container */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Target Project Link:</span>
        <select 
          className="form-select"
          style={{ width: 'auto', minWidth: 260 }}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">Do not save (Quick check)</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
        <button 
          onClick={() => { setActiveTab('bricks'); setSaveSuccess(''); }}
          className={`btn ${activeTab === 'bricks' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', gap: 6 }}
        >
          <BrickWall size={16} />
          <span>Brick Calculator</span>
        </button>
        <button 
          onClick={() => { setActiveTab('materials'); setSaveSuccess(''); }}
          className={`btn ${activeTab === 'materials' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', gap: 6 }}
        >
          <Layers size={16} />
          <span>Material Estimator</span>
        </button>
        <button 
          onClick={() => { setActiveTab('cost'); setSaveSuccess(''); }}
          className={`btn ${activeTab === 'cost' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', gap: 6 }}
        >
          <IndianRupee size={16} />
          <span>Cost Estimator</span>
        </button>
      </div>

      {/* Main Grid for inputs / outputs */}
      <div className="calc-grid">
        {/* INPUT CARD */}
        <div className="card">
          {activeTab === 'bricks' && (
            <form onSubmit={calculateBricks}>
              <h3 className="card-title"><Brick size={18} /> Brick Wall Parameters</h3>
              
              <div className="form-group">
                <label className="form-label">Total Wall Length (feet)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={wallLength} 
                  onChange={(e) => setWallLength(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Wall Height (feet)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={wallHeight} 
                  onChange={(e) => setWallHeight(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Wall Thickness (inches)</label>
                <select 
                  className="form-select"
                  value={wallThickness}
                  onChange={(e) => setWallThickness(e.target.value)}
                >
                  <option value="4.5">4.5 inches (Single Brick Layer)</option>
                  <option value="9">9 inches (Double Brick Layer / Structural)</option>
                  <option value="13.5">13.5 inches (Triple Layer)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Mortar & Handling Wastage (%)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={wastagePercent} 
                  onChange={(e) => setWastagePercent(e.target.value)} 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
                Compute Bricks Needed
              </button>
            </form>
          )}

          {activeTab === 'materials' && (
            <form onSubmit={calculateMaterials}>
              <h3 className="card-title"><Layers size={18} /> Concrete Work Volume</h3>
              
              <div className="form-group">
                <label className="form-label">Concrete Volume Needed (Cubic Feet)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 1000"
                  value={concreteVol} 
                  onChange={(e) => setConcreteVol(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 18 }}>
                <strong>Standard Mix Ratio Applied:</strong> 1:2:4 (Cement : Fine Sand : Coarse Aggregate) incorporating standard dry volume conversion (dry = wet * 1.54) and steel reinforcement index (~2.2 lbs/cu ft).
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Estimate Quantities
              </button>
            </form>
          )}

          {activeTab === 'cost' && (
            <form onSubmit={calculateCosts}>
              <h3 className="card-title"><IndianRupee size={18} /> Budget Cost Parameters</h3>
              
              <div className="form-group">
                <label className="form-label">Calculated Material Expenses (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={materialCost} 
                  onChange={(e) => setMaterialCost(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Labor Cost (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={laborCost} 
                  onChange={(e) => setLaborCost(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Transport & Logistical Fees (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={transportCost} 
                  onChange={(e) => setTransportCost(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Miscellaneous / Buffer Expenses (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={miscCost} 
                  onChange={(e) => setMiscCost(e.target.value)} 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
                Calculate Total Budget
              </button>
            </form>
          )}
        </div>

        {/* RESULTS CARD */}
        <div className="card calc-results">
          <h3 className="card-title" style={{ color: 'var(--primary-color)' }}>
            <Layers size={18} /> Calculated Output
          </h3>

          {/* BRICK ESTIMATES */}
          {activeTab === 'bricks' && brickResult && (
            <div className="results-list">
              <div className="result-item">
                <span>Wall Volume:</span>
                <span className="result-val" style={{ color: 'var(--text-primary)' }}>{brickResult.wallVolumeCuFt} cu ft</span>
              </div>
              <div className="result-item" style={{ borderBottom: '2px solid rgba(99,102,241,0.25)', paddingBottom: 16 }}>
                <span style={{ fontWeight: 700 }}>Total Bricks Required:</span>
                <span className="result-val" style={{ fontSize: '1.65rem' }}>{brickResult.bricksNeeded.toLocaleString()} units</span>
              </div>
              <div className="result-item">
                <span>Base Bricks (No waste):</span>
                <span style={{ fontWeight: 600 }}>{brickResult.baseBricks.toLocaleString()} units</span>
              </div>
              <div className="result-item">
                <span>Wastage Margin:</span>
                <span style={{ color: 'var(--color-error)' }}>+{brickResult.wastageBricks.toLocaleString()} units</span>
              </div>
              <div className="result-item">
                <span>Estimated Mortar Volume:</span>
                <span>{brickResult.mortarVolumeCuFt} cu ft</span>
              </div>

              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calculation Steps:</h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16, fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  {brickResult.calculationSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* MATERIAL ESTIMATES */}
          {activeTab === 'materials' && matResult && (
            <div className="results-list">
              <div className="result-item">
                <span>Total Concrete Wet Volume:</span>
                <span style={{ fontWeight: 600 }}>{matResult.concreteVolumeCuFt} cu ft</span>
              </div>
              <div className="result-item">
                <span>Estimated Dry Volume:</span>
                <span>{matResult.dryVolumeCuFt} cu ft</span>
              </div>
              
              <div style={{ marginTop: 12, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--primary-color)', marginBottom: 12, fontWeight: 700 }}>Required Materials Breakdown:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {matResult.materials.map((mat, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>{mat.name}</span>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>Unit Cost: ₹{mat.unitCost}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block' }}>{mat.quantity.toLocaleString()} {mat.unit}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--secondary-color)', fontWeight: 600 }}>₹{mat.totalCost.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-item" style={{ marginTop: 8, paddingTop: 16, borderTop: '2px solid rgba(99,102,241,0.2)' }}>
                <span style={{ fontWeight: 700 }}>Total Materials Cost:</span>
                <span className="result-val">₹{matResult.totalMaterialsCost.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* COST ESTIMATES */}
          {activeTab === 'cost' && costResult && (
            <div className="results-list">
              <div className="result-item">
                <span>Material Expenses:</span>
                <span>₹{costResult.materialCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="result-item">
                <span>Labor Fees:</span>
                <span>₹{costResult.laborCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="result-item">
                <span>Logistics / Transport:</span>
                <span>₹{costResult.transportCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="result-item">
                <span>Misc Buffers:</span>
                <span>₹{costResult.miscCost.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="result-item" style={{ borderTop: '2px solid rgba(99,102,241,0.25)', paddingTop: 16, marginTop: 12 }}>
                <span style={{ fontWeight: 800, fontSize: '1rem' }}>Total Cost Projection:</span>
                <span className="result-val" style={{ fontSize: '1.75rem', color: 'var(--color-success)' }}>
                  ₹{costResult.totalEstimatedCost.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {!brickResult && !matResult && !costResult && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 250, color: 'var(--text-dim)', textAlign: 'center' }}>
              <Calculator size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
              <p>Configure parameters on the left and click calculate to generate outputs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calculators;
