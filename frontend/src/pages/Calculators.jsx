import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  BookmarkPlus,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Ruler,
  Grid,
  Shield,
  Download,
  Building,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { localProjects, localEstimations } from '../utils/localStore';

const Calculators = () => {
  const { token, apiBaseUrl } = useAuth();
  const [activeTab, setActiveTab] = useState('bricks');
  const [projects, setProjects] = useState(() => localProjects.list());
  const [projectId, setProjectId] = useState(() => {
    const list = localProjects.list();
    return list.length > 0 ? list[0].id : '';
  });
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // 1. Brickwork & Masonry Inputs
  const [masonryType, setMasonryType] = useState('clay');
  const [wallLength, setWallLength] = useState('50');
  const [wallHeight, setWallHeight] = useState('10');
  const [wallThickness, setWallThickness] = useState('9'); // inches
  const [doorDeductions, setDoorDeductions] = useState('42'); // sq ft
  const [windowDeductions, setWindowDeductions] = useState('48'); // sq ft
  const [mortarRatio, setMortarRatio] = useState('1:6');
  const [wastagePercent, setWastagePercent] = useState('10');
  const [brickUnitPrice, setBrickUnitPrice] = useState('8.50');

  // 2. Concrete & RCC Structure Inputs
  const [concreteStructureType, setConcreteStructureType] = useState('slab');
  const [concreteLength, setConcreteLength] = useState('40');
  const [concreteWidth, setConcreteWidth] = useState('30');
  const [concreteDepth, setConcreteDepth] = useState('5'); // inches
  const [concreteVol, setConcreteVol] = useState('500');
  const [concreteGrade, setConcreteGrade] = useState('M20');
  const [steelPercent, setSteelPercent] = useState('1.2');
  const [cementPrice, setCementPrice] = useState('380');
  const [sandPrice, setSandPrice] = useState('45');
  const [aggregatePrice, setAggregatePrice] = useState('55');
  const [steelPrice, setSteelPrice] = useState('65');

  // 3. Plastering & Tiling Inputs
  const [plasterArea, setPlasterArea] = useState('1200');
  const [plasterThickness, setPlasterThickness] = useState('12'); // mm
  const [plasterMix, setPlasterMix] = useState('1:4');

  const [tileFloorArea, setTileFloorArea] = useState('850');
  const [tileSize, setTileSize] = useState('2x2'); // '2x2', '2x4', '1x1'
  const [tileBoxPrice, setTileBoxPrice] = useState('850');

  // 4. Steel BBS & Rebar Weight Inputs
  const [steelBarDia, setSteelBarDia] = useState('12');
  const [steelLengthMeters, setSteelLengthMeters] = useState('120');
  const [steelNumBars, setSteelNumBars] = useState('24');
  const [steelRatePerKg, setSteelRatePerKg] = useState('65');

  // 5. Building BOQ & Overall Cost Inputs
  const [builtUpArea, setBuiltUpArea] = useState('1800');
  const [floorsCount, setFloorsCount] = useState('2');
  const [qualityTier, setQualityTier] = useState('standard');

  // 6. Saved Estimations State
  const [savedEstimates, setSavedEstimates] = useState(() => {
    const list = localProjects.list();
    return list.length > 0 ? localEstimations.listByProject(list[0].id) : { bricks: [], materials: [], costs: [] };
  });

  // Auto-clear success message after 4 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  // Sync projects list
  const fetchProjects = useCallback(async () => {
    const localP = localProjects.list();
    setProjects(localP);
    if (localP.length > 0 && !projectId) {
      setProjectId(localP[0].id);
    }
    try {
      const res = await fetch(`${apiBaseUrl}/projects`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data);
          if (!projectId) setProjectId(data[0].id);
        }
      }
    } catch (e) {}
  }, [apiBaseUrl, token, projectId]);

  // Sync saved project estimates from API & localStore
  const fetchSavedEstimates = useCallback(async (pId) => {
    if (!pId) return;
    const localE = localEstimations.listByProject(pId);
    setSavedEstimates(localE);
    try {
      const res = await fetch(`${apiBaseUrl}/estimation/project/${pId}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.bricks || data.materials || data.costs)) {
          setSavedEstimates(data);
        }
      }
    } catch (e) {}
  }, [apiBaseUrl, token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (projectId) {
      fetchSavedEstimates(projectId);
    }
  }, [projectId, fetchSavedEstimates]);

  // Dimension Helper for concrete volume
  const handleDimensionChange = (l, w, d) => {
    const len = parseFloat(l) || 0;
    const wid = parseFloat(w) || 0;
    const dep = parseFloat(d) || 0;
    if (len > 0 && wid > 0 && dep > 0) {
      const vol = len * wid * (dep / 12);
      setConcreteVol(vol.toFixed(1));
    }
  };

  // --------------------------------------------------------------------------
  // LIVE COMPUTATIONS (Instant, pure calculation without DB writes)
  // --------------------------------------------------------------------------

  // 1. Brickwork & Masonry Live Computation
  const brickResult = useMemo(() => {
    const l = parseFloat(wallLength) || 0;
    const h = parseFloat(wallHeight) || 0;
    const t = parseFloat(wallThickness) || 9;
    const waste = parseFloat(wastagePercent) || 0;
    const grossArea = l * h;
    const deductions = (parseFloat(doorDeductions) || 0) + (parseFloat(windowDeductions) || 0);
    const netArea = Math.max(0.1, grossArea - deductions);
    const wallVol = netArea * (t / 12);

    let bL = 9, bW = 4.5, bH = 3;
    if (masonryType === 'flyash') { bL = 9; bW = 4; bH = 3; }
    else if (masonryType === 'aac') { bL = 23.6; bW = 8; bH = 8; }
    else if (masonryType === 'solidblock') { bL = 16; bW = 8; bH = 8; }

    const singleBrickVolFt = (bL * bW * bH) / 1728;
    const singleBrickWithMortarFt = ((bL + 0.5) * (bW + 0.5) * (bH + 0.5)) / 1728;
    const baseBricks = Math.ceil(wallVol / singleBrickWithMortarFt);
    const wasteUnits = Math.ceil(baseBricks * (waste / 100));
    const totalUnits = baseBricks + wasteUnits;

    const wetMortar = Math.max(0, wallVol - (baseBricks * singleBrickVolFt));
    const dryMortar = wetMortar * 1.33;
    const parts = mortarRatio === '1:4' ? 5 : (mortarRatio === '1:5' ? 6 : 7);
    const cementCuFt = dryMortar * (1 / parts);
    const sandCuFt = dryMortar * ((parts - 1) / parts);
    const cementBags = Math.ceil(cementCuFt / 1.25);
    const sandTons = parseFloat(((sandCuFt * 45) / 1000).toFixed(2));

    const brickCost = Math.round(totalUnits * parseFloat(brickUnitPrice || 8.5));
    const cementCost = cementBags * 380;
    const sandCost = Math.ceil(sandCuFt) * 45;
    const totalCost = brickCost + cementCost + sandCost;

    return {
      masonryType,
      grossArea: parseFloat(grossArea.toFixed(1)),
      deductions: parseFloat(deductions.toFixed(1)),
      netAreaSqFt: parseFloat(netArea.toFixed(1)),
      wallVolumeCuFt: parseFloat(wallVol.toFixed(1)),
      bricksNeeded: totalUnits,
      baseBricks,
      wastageBricks: wasteUnits,
      cementBags,
      sandCuFt: Math.ceil(sandCuFt),
      sandTons,
      brickCost,
      cementCost,
      sandCost,
      totalEstimatedCost: totalCost
    };
  }, [wallLength, wallHeight, wallThickness, masonryType, wastagePercent, doorDeductions, windowDeductions, mortarRatio, brickUnitPrice]);

  // 2. Concrete Live Computation
  const matResult = useMemo(() => {
    const volume = parseFloat(concreteVol) || 100;
    const dryVolume = volume * 1.54;

    const mixRatios = {
      'M7.5': { c: 1, s: 4, a: 8, total: 13 },
      'M10': { c: 1, s: 3, a: 6, total: 10 },
      'M15': { c: 1, s: 2, a: 4, total: 7 },
      'M20': { c: 1, s: 1.5, a: 3, total: 5.5 },
      'M25': { c: 1, s: 1, a: 2, total: 4 },
      'M30': { c: 1, s: 0.75, a: 1.5, total: 3.25 }
    };

    const selectedMix = mixRatios[concreteGrade] || mixRatios['M20'];
    const cementCuFt = dryVolume * (selectedMix.c / selectedMix.total);
    const sandCuFt = dryVolume * (selectedMix.s / selectedMix.total);
    const aggregateCuFt = dryVolume * (selectedMix.a / selectedMix.total);
    const cementBags = Math.ceil(cementCuFt / 1.25);

    const steelRatio = parseFloat(steelPercent || 1.2) / 100;
    const steelWeightKg = Math.ceil(volume * 0.0283168 * 7850 * steelRatio);
    const waterLiters = cementBags * 28;

    const cBagPrice = parseFloat(cementPrice || 380);
    const sPrice = parseFloat(sandPrice || 45);
    const aPrice = parseFloat(aggregatePrice || 55);
    const stPrice = parseFloat(steelPrice || 65);

    const materials = [
      { name: `Cement (${concreteGrade} OPC/PPC 50kg)`, quantity: cementBags, unit: 'bags', unitCost: cBagPrice, totalCost: cementBags * cBagPrice },
      { name: 'River Sand / M-Sand (Zone II)', quantity: Math.ceil(sandCuFt), unit: 'cu ft', unitCost: sPrice, totalCost: Math.ceil(sandCuFt) * sPrice },
      { name: 'Coarse Aggregate (20mm Crushed Metal)', quantity: Math.ceil(aggregateCuFt), unit: 'cu ft', unitCost: aPrice, totalCost: Math.ceil(aggregateCuFt) * aPrice },
      { name: `TMT Rebar Fe500D (${steelPercent}%)`, quantity: steelWeightKg, unit: 'kg', unitCost: stPrice, totalCost: steelWeightKg * stPrice }
    ];

    const totalCost = materials.reduce((acc, m) => acc + m.totalCost, 0);

    return {
      structureType: concreteStructureType,
      grade: concreteGrade,
      concreteVolumeCuFt: volume,
      concreteVolumeM3: parseFloat((volume * 0.0283168).toFixed(2)),
      dryVolumeCuFt: parseFloat(dryVolume.toFixed(2)),
      cementBags,
      sandCuFt: Math.ceil(sandCuFt),
      aggregateCuFt: Math.ceil(aggregateCuFt),
      steelKg: steelWeightKg,
      effectiveSteelPct: steelPercent,
      waterLiters,
      materials,
      totalMaterialsCost: totalCost
    };
  }, [concreteVol, concreteGrade, concreteStructureType, steelPercent, cementPrice, sandPrice, aggregatePrice, steelPrice]);

  // 3. Plaster Live Computation
  const plasterResult = useMemo(() => {
    const area = parseFloat(plasterArea) || 1000;
    const thicknessFt = (parseFloat(plasterThickness) / 25.4) / 12;
    const wetVol = area * thicknessFt;
    const dryVol = wetVol * 1.33;

    const parts = plasterMix === '1:3' ? 4 : (plasterMix === '1:4' ? 5 : 7);
    const cementCuFt = dryVol * (1 / parts);
    const sandCuFt = dryVol * ((parts - 1) / parts);
    const cementBags = Math.ceil(cementCuFt / 1.25);
    const cementCost = cementBags * 380;
    const sandCost = Math.ceil(sandCuFt) * 45;
    const laborCost = Math.ceil(area * 18);

    return {
      areaSqFt: area,
      thicknessMm: plasterThickness,
      mixRatio: plasterMix,
      cementBags,
      sandCuFt: Math.ceil(sandCuFt),
      cementCost,
      sandCost,
      laborCost,
      totalEstimatedCost: cementCost + sandCost + laborCost
    };
  }, [plasterArea, plasterThickness, plasterMix]);

  // 4. Flooring & Tiling Live Computation
  const tileResult = useMemo(() => {
    const area = parseFloat(tileFloorArea) || 500;
    let tArea = 4; // 2x2
    if (tileSize === '2x4') tArea = 8;
    if (tileSize === '1x1') tArea = 1;

    const baseTiles = Math.ceil(area / tArea);
    const wasteTiles = Math.ceil(baseTiles * 0.08); // 8% waste
    const totalTiles = baseTiles + wasteTiles;
    const tilesPerBox = tileSize === '2x4' ? 2 : 4;
    const boxes = Math.ceil(totalTiles / tilesPerBox);
    const tileCost = boxes * parseFloat(tileBoxPrice || 850);
    const adhesiveBags = Math.ceil(area / 40);
    const adhesiveCost = adhesiveBags * 350;
    const groutKg = Math.ceil(area / 60);
    const groutCost = groutKg * 80;
    const laborCost = Math.ceil(area * 24);

    return {
      areaSqFt: area,
      tileSize,
      boxes,
      totalTiles,
      adhesiveBags,
      groutKg,
      tileCost,
      adhesiveCost,
      groutCost,
      laborCost,
      totalEstimatedCost: tileCost + adhesiveCost + groutCost + laborCost
    };
  }, [tileFloorArea, tileSize, tileBoxPrice]);

  // 5. Steel BBS Live Computation
  const steelBBSResult = useMemo(() => {
    const d = parseFloat(steelBarDia) || 12;
    const len = parseFloat(steelLengthMeters) || 100;
    const count = parseInt(steelNumBars) || 1;
    const unitWeight = (d * d) / 162.2;
    const totalKg = parseFloat((unitWeight * len * count).toFixed(2));
    const totalTons = parseFloat((totalKg / 1000).toFixed(3));
    const bindingWireKg = Math.max(1, Math.ceil(totalTons * 10));
    const steelCost = Math.round(totalKg * parseFloat(steelRatePerKg || 65));
    const bindingWireCost = bindingWireKg * 90;

    return {
      barDiameterMm: d,
      totalLengthMeters: len,
      numberOfBars: count,
      unitWeightKgPerM: parseFloat(unitWeight.toFixed(3)),
      totalWeightKg: totalKg,
      totalWeightTons: totalTons,
      bindingWireKg,
      steelCost,
      bindingWireCost,
      totalCost: steelCost + bindingWireCost
    };
  }, [steelBarDia, steelLengthMeters, steelNumBars, steelRatePerKg]);

  // 6. Building BOQ Live Computation
  const costResult = useMemo(() => {
    const area = parseFloat(builtUpArea) || 1500;
    const floors = parseInt(floorsCount) || 1;
    const totalArea = area * floors;

    const rateCards = {
      'economy': 1600,
      'standard': 2100,
      'premium': 2850,
      'luxury': 3800
    };

    const baseRate = rateCards[qualityTier] || 2100;
    const totalBudget = totalArea * baseRate;

    const phases = [
      { phase: '1. Site Clearance & Earthwork', percent: 4, cost: totalBudget * 0.04 },
      { phase: '2. Substructure & Foundation (RCC)', percent: 14, cost: totalBudget * 0.14 },
      { phase: '3. Superstructure Columns & Slabs', percent: 22, cost: totalBudget * 0.22 },
      { phase: '4. Brickwork & Masonry Partitions', percent: 13, cost: totalBudget * 0.13 },
      { phase: '5. Doors, Windows & Glazing', percent: 7, cost: totalBudget * 0.07 },
      { phase: '6. Internal/External Plaster & Putty', percent: 8, cost: totalBudget * 0.08 },
      { phase: '7. Vitrified Flooring & Wall Tiles', percent: 9, cost: totalBudget * 0.09 },
      { phase: '8. Plumbing, Sanitation & Electrical MEP', percent: 11, cost: totalBudget * 0.11 },
      { phase: '9. Exterior Facade & Interior Painting', percent: 7, cost: totalBudget * 0.07 },
      { phase: '10. Final Handover, Fixtures & Misc', percent: 5, cost: totalBudget * 0.05 }
    ];

    return {
      builtUpAreaPerFloor: area,
      floorsCount: floors,
      totalBuiltUpArea: totalArea,
      qualityTier,
      ratePerSqFt: baseRate,
      totalEstimatedBudget: totalBudget,
      phases
    };
  }, [builtUpArea, floorsCount, qualityTier]);

  // --------------------------------------------------------------------------
  // EXPLICIT SAVE ACTIONS
  // --------------------------------------------------------------------------

  const saveBrickEstimate = async () => {
    if (!projectId) {
      alert('Please select a project first to save this estimate.');
      return;
    }
    setSaveLoading(true);
    localEstimations.saveBrick({ projectId, ...brickResult });
    try {
      await fetch(`${apiBaseUrl}/estimation/bricks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          projectId,
          length: wallLength,
          height: wallHeight,
          thickness: wallThickness,
          masonryType,
          doorDeductionArea: doorDeductions,
          windowDeductionArea: windowDeductions,
          mortarRatio,
          wastage: wastagePercent,
          brickUnitPrice
        })
      });
    } catch (e) {}
    setSaveSuccess(`Brickwork estimation (${brickResult.bricksNeeded} units) saved to project vault!`);
    fetchSavedEstimates(projectId);
    setSaveLoading(false);
  };

  const saveConcreteEstimate = async () => {
    if (!projectId) {
      alert('Please select a project first to save this estimate.');
      return;
    }
    setSaveLoading(true);
    localEstimations.saveMaterial({ projectId, ...matResult });
    try {
      await fetch(`${apiBaseUrl}/estimation/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          projectId,
          concreteVolume: concreteVol,
          structureType: concreteStructureType,
          grade: concreteGrade,
          steelPercent,
          cementBagPrice: cementPrice,
          sandCftPrice: sandPrice,
          aggregateCftPrice: aggregatePrice,
          steelKgPrice: steelPrice
        })
      });
    } catch (e) {}
    setSaveSuccess(`Concrete & RCC Bill of Materials saved to project vault!`);
    fetchSavedEstimates(projectId);
    setSaveLoading(false);
  };

  const saveFinishingEstimate = async () => {
    if (!projectId) {
      alert('Please select a project first to save this estimate.');
      return;
    }
    setSaveLoading(true);
    localEstimations.saveMaterial({
      projectId,
      name: `Plaster & Tiling Finishing Package (${plasterArea} sq ft plaster, ${tileFloorArea} sq ft tile)`,
      quantity: 1,
      unit: 'pkg',
      unitCost: plasterResult.totalEstimatedCost + tileResult.totalEstimatedCost,
      totalCost: plasterResult.totalEstimatedCost + tileResult.totalEstimatedCost
    });
    setSaveSuccess(`Plastering & Flooring estimates saved to project vault!`);
    fetchSavedEstimates(projectId);
    setSaveLoading(false);
  };

  const saveSteelBBSEstimate = async () => {
    if (!projectId) {
      alert('Please select a project first to save this estimate.');
      return;
    }
    setSaveLoading(true);
    localEstimations.saveMaterial({
      projectId,
      name: `TMT Rebar BBS (${steelBBSResult.barDiameterMm}mm Dia - ${steelBBSResult.numberOfBars} bars × ${steelBBSResult.totalLengthMeters}m)`,
      quantity: steelBBSResult.totalWeightKg,
      unit: 'kg',
      unitCost: parseFloat(steelRatePerKg || 65),
      totalCost: steelBBSResult.totalCost
    });
    setSaveSuccess(`Steel Bar Bending Schedule (${steelBBSResult.totalWeightKg} kg) saved to project vault!`);
    fetchSavedEstimates(projectId);
    setSaveLoading(false);
  };

  const saveBOQEstimate = async () => {
    if (!projectId) {
      alert('Please select a project first to save this estimate.');
      return;
    }
    setSaveLoading(true);
    localEstimations.saveCost({
      projectId,
      totalEstimatedCost: costResult.totalEstimatedBudget,
      ...costResult
    });
    try {
      await fetch(`${apiBaseUrl}/estimation/cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          projectId,
          builtUpArea,
          qualityTier,
          floorsCount
        })
      });
    } catch (e) {}
    setSaveSuccess(`10-Phase Project BOQ (₹${(costResult.totalEstimatedBudget / 100000).toFixed(2)} Lakhs) saved to project!`);
    fetchSavedEstimates(projectId);
    setSaveLoading(false);
  };

  // Delete estimate from history
  const handleDeleteEstimate = async (type, id) => {
    if (!window.confirm('Delete this saved calculation from project vault?')) return;
    localEstimations.delete(type, id);
    try {
      await fetch(`${apiBaseUrl}/estimation/${type}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {}
    if (projectId) fetchSavedEstimates(projectId);
    setSaveSuccess('Estimation removed from project records.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="main-view" style={{ maxWidth: 1400 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="header-title" style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calculator size={30} color="var(--primary-color)" /> Civil Engineering Estimator Suite
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Real structural volume calculations, IS standard mix grades, steel bar schedules, and project BOQs
          </p>
        </div>

        {/* Project Selector & Print Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Project:</span>
            <select 
              className="form-select"
              style={{ width: 'auto', minWidth: 220 }}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Printer size={16} /> Print / Export
          </button>
        </div>
      </div>

      {/* Success Alert Banner */}
      {saveSuccess && (
        <div style={{
          background: 'var(--color-success-bg)',
          color: 'var(--color-success)',
          padding: '12px 18px',
          borderRadius: 12,
          fontSize: '0.88rem',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'slide-up-card 0.2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
            <CheckCircle2 size={18} /> {saveSuccess}
          </div>
          <button 
            onClick={() => setSaveSuccess('')}
            style={{ background: 'none', border: 'none', color: 'var(--color-success)', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tool Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, borderBottom: '1px solid var(--border-color)' }}>
        {[
          { id: 'bricks', label: '1. Brickwork & Masonry', icon: BrickWall },
          { id: 'concrete', label: '2. Concrete & RCC Structure', icon: Layers },
          { id: 'finishing', label: '3. Plaster & Tiles', icon: Paintbrush },
          { id: 'steel', label: '4. Steel Bar Bending (BBS)', icon: Ruler },
          { id: 'boq', label: '5. Building BOQ & Budget', icon: Building },
          { id: 'vault', label: '6. Saved Vault History', icon: FolderClock, badge: (savedEstimates.bricks?.length || 0) + (savedEstimates.materials?.length || 0) + (savedEstimates.costs?.length || 0) }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 18px',
                borderRadius: '12px 12px 0 0',
                border: 'none',
                cursor: 'pointer',
                background: isActive ? 'var(--primary-glow)' : 'transparent',
                color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                borderBottom: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
                whiteSpace: 'nowrap',
                transition: 'var(--transition-smooth)'
              }}
            >
              <Icon size={17} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: BRICKWORK & MASONRY */}
      {/* ==================================================================== */}
      {activeTab === 'bricks' && (
        <div className="calc-grid">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="card-title" style={{ margin: 0 }}>
                <BrickWall size={18} color="var(--primary-color)" /> Wall & Masonry Parameters
              </h3>
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Live Auto-Compute</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Masonry Material Type</label>
                <select className="form-select" value={masonryType} onChange={e => setMasonryType(e.target.value)}>
                  <option value="clay">Standard Red Clay Bricks (9" × 4.5" × 3")</option>
                  <option value="flyash">Fly Ash Modular Bricks (9" × 4" × 3")</option>
                  <option value="aac">AAC Lightweight Blocks (600 × 200 × 200 mm)</option>
                  <option value="solidblock">Solid Concrete Blocks (400 × 200 × 200 mm)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Wall Length (Ft)</label>
                  <input type="number" className="form-input" value={wallLength} onChange={e => setWallLength(e.target.value)} min="1" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Wall Height (Ft)</label>
                  <input type="number" className="form-input" value={wallHeight} onChange={e => setWallHeight(e.target.value)} min="1" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Thickness</label>
                  <select className="form-select" value={wallThickness} onChange={e => setWallThickness(e.target.value)}>
                    <option value="4.5">4.5" (Partition)</option>
                    <option value="9">9" (Main Wall)</option>
                    <option value="13.5">13.5" (Retaining)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Door Deductions (Sq Ft)</label>
                  <input type="number" className="form-input" placeholder="e.g. 42 (2 doors 3x7)" value={doorDeductions} onChange={e => setDoorDeductions(e.target.value)} min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Window Deductions (Sq Ft)</label>
                  <input type="number" className="form-input" placeholder="e.g. 48 (3 windows 4x4)" value={windowDeductions} onChange={e => setWindowDeductions(e.target.value)} min="0" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Mortar Ratio</label>
                  <select className="form-select" value={mortarRatio} onChange={e => setMortarRatio(e.target.value)}>
                    <option value="1:4">1:4 (Heavy)</option>
                    <option value="1:5">1:5 (Medium)</option>
                    <option value="1:6">1:6 (Standard)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Breakage Margin (%)</label>
                  <input type="number" className="form-input" value={wastagePercent} onChange={e => setWastagePercent(e.target.value)} min="0" max="30" />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Rate (₹/unit)</label>
                  <input type="number" step="0.5" className="form-input" value={brickUnitPrice} onChange={e => setBrickUnitPrice(e.target.value)} min="1" />
                </div>
              </div>

              <button 
                type="button" 
                onClick={saveBrickEstimate} 
                className="btn btn-primary" 
                style={{ marginTop: 8 }} 
                disabled={saveLoading}
              >
                <BookmarkPlus size={17} /> Save this Estimation to Project Vault
              </button>
            </div>
          </div>

          {/* Results Card */}
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="card-title" style={{ color: 'var(--primary-color)' }}>
              <CheckCircle2 size={18} /> Brickwork & Mortar Bill of Quantities
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Units Needed</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-color)', marginTop: 4 }}>
                  {brickResult.bricksNeeded?.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>units</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                  Base: {brickResult.baseBricks} + {wastagePercent}% wastage ({brickResult.wastageBricks})
                </div>
              </div>

              <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Estimated Cost</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-success)', marginTop: 4 }}>
                  ₹{brickResult.totalEstimatedCost?.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                  Bricks: ₹{brickResult.brickCost.toLocaleString()} • Mortar: ₹{(brickResult.cementCost + brickResult.sandCost).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Material Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
                <span>Net Wall Surface Area:</span>
                <strong>{brickResult.netAreaSqFt} sq ft</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
                <span>Net Wall Volume:</span>
                <strong>{brickResult.wallVolumeCuFt} cu ft</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
                <span>Cement Required (OPC 50kg bags):</span>
                <strong style={{ color: 'var(--primary-color)' }}>{brickResult.cementBags} Bags (₹{brickResult.cementCost.toLocaleString()})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
                <span>Sand Required (Cu Ft / Tons):</span>
                <strong style={{ color: 'var(--accent-color)' }}>{brickResult.sandCuFt} cft ({brickResult.sandTons} Ton)</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: CONCRETE & RCC STRUCTURE */}
      {/* ==================================================================== */}
      {activeTab === 'concrete' && (
        <div className="calc-grid">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="card-title" style={{ margin: 0 }}>
                <Layers size={18} color="var(--primary-color)" /> Concrete RCC Structural Member
              </h3>
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Live Auto-Compute</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Structural Element</label>
                  <select className="form-select" value={concreteStructureType} onChange={e => {
                    setConcreteStructureType(e.target.value);
                    if (e.target.value === 'slab') setSteelPercent('0.9');
                    else if (e.target.value === 'beam') setSteelPercent('1.8');
                    else if (e.target.value === 'column') setSteelPercent('2.5');
                    else if (e.target.value === 'footing') setSteelPercent('0.8');
                  }}>
                    <option value="slab">Roof / Floor Slab (0.8 - 1.0% Steel)</option>
                    <option value="beam">RCC Beams (1.5 - 2.0% Steel)</option>
                    <option value="column">RCC Columns (2.0 - 3.0% Steel)</option>
                    <option value="footing">Isolated Foundation Footing (0.8% Steel)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Concrete Mix Grade (IS 456)</label>
                  <select className="form-select" value={concreteGrade} onChange={e => setConcreteGrade(e.target.value)}>
                    <option value="M7.5">M7.5 (1:4:8 - PCC Sub-base)</option>
                    <option value="M10">M10 (1:3:6 - Plain Foundation)</option>
                    <option value="M15">M15 (1:2:4 - Light Structural)</option>
                    <option value="M20">M20 (1:1.5:3 - Standard Slabs & Beams)</option>
                    <option value="M25">M25 (1:1:2 - Heavy Columns & Footings)</option>
                    <option value="M30">M30 (1:0.75:1.5 - High Strength RCC)</option>
                  </select>
                </div>
              </div>

              {/* Dimensions Helper */}
              <div style={{ padding: 14, background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Member Dimensions (to auto-calculate volume):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Length (Ft)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={concreteLength} 
                      onChange={e => {
                        setConcreteLength(e.target.value);
                        handleDimensionChange(e.target.value, concreteWidth, concreteDepth);
                      }} 
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Width (Ft)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={concreteWidth} 
                      onChange={e => {
                        setConcreteWidth(e.target.value);
                        handleDimensionChange(concreteLength, e.target.value, concreteDepth);
                      }} 
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Depth/Thick (In)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={concreteDepth} 
                      onChange={e => {
                        setConcreteDepth(e.target.value);
                        handleDimensionChange(concreteLength, concreteWidth, e.target.value);
                      }} 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Total Concrete Volume (Cu Ft)</label>
                  <input type="number" className="form-input" value={concreteVol} onChange={e => setConcreteVol(e.target.value)} min="1" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Reinforcement Steel (% of Vol)</label>
                  <input type="number" step="0.1" className="form-input" value={steelPercent} onChange={e => setSteelPercent(e.target.value)} min="0" max="10" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Cement (₹/bag)</label>
                  <input type="number" className="form-input" value={cementPrice} onChange={e => setCementPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Sand (₹/cft)</label>
                  <input type="number" className="form-input" value={sandPrice} onChange={e => setSandPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Agg (₹/cft)</label>
                  <input type="number" className="form-input" value={aggregatePrice} onChange={e => setAggregatePrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Steel (₹/kg)</label>
                  <input type="number" className="form-input" value={steelPrice} onChange={e => setSteelPrice(e.target.value)} />
                </div>
              </div>

              <button 
                type="button" 
                onClick={saveConcreteEstimate} 
                className="btn btn-primary" 
                style={{ marginTop: 8 }} 
                disabled={saveLoading}
              >
                <BookmarkPlus size={17} /> Save this Concrete BOM to Project Vault
              </button>
            </div>
          </div>

          {/* Results Card */}
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="card-title" style={{ color: 'var(--accent-color)' }}>
              <Layers size={18} /> Concrete Bill of Materials (BOM)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Wet vs Dry Volume</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                  {matResult.concreteVolumeCuFt} <span style={{ fontSize: '0.85rem' }}>cft ({matResult.concreteVolumeM3} m³)</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                  Dry Mix Compaction Volume: {matResult.dryVolumeCuFt} cu ft (1.54×)
                </div>
              </div>

              <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Material Value</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success)', marginTop: 4 }}>
                  ₹{matResult.totalMaterialsCost?.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                  Water requirement: ~{matResult.waterLiters} Liters
                </div>
              </div>
            </div>

            {/* Itemized Materials Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px 6px' }}>Material</th>
                    <th style={{ padding: '8px 6px' }}>Quantity</th>
                    <th style={{ padding: '8px 6px' }}>Unit Rate</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {matResult.materials.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 6px', fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</td>
                      <td style={{ padding: '10px 6px', color: 'var(--text-secondary)' }}>{m.quantity.toLocaleString()} {m.unit}</td>
                      <td style={{ padding: '10px 6px', color: 'var(--text-muted)' }}>₹{m.unitCost}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 700, color: 'var(--color-success)' }}>₹{m.totalCost?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: PLASTERING & TILING */}
      {/* ==================================================================== */}
      {activeTab === 'finishing' && (
        <div className="calc-grid">
          {/* Plastering */}
          <div className="card">
            <h3 className="card-title"><Paintbrush size={18} color="var(--primary-color)" /> Plastering Estimator</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Plaster Surface Area (Sq Ft)</label>
                <input type="number" className="form-input" value={plasterArea} onChange={e => setPlasterArea(e.target.value)} min="1" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Thickness</label>
                  <select className="form-select" value={plasterThickness} onChange={e => setPlasterThickness(e.target.value)}>
                    <option value="6">6mm (Ceiling)</option>
                    <option value="12">12mm (Internal Wall)</option>
                    <option value="15">15mm (Rough Internal)</option>
                    <option value="20">20mm (External Weather)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Mix Ratio</label>
                  <select className="form-select" value={plasterMix} onChange={e => setPlasterMix(e.target.value)}>
                    <option value="1:3">1:3 (Waterproofing/Ceiling)</option>
                    <option value="1:4">1:4 (Standard Internal)</option>
                    <option value="1:6">1:6 (External Rendering)</option>
                  </select>
                </div>
              </div>

              {/* Plaster Result breakdown */}
              <div style={{ padding: 14, background: 'var(--bg-subtle)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Cement Required:</span>
                  <strong style={{ color: 'var(--primary-color)' }}>{plasterResult.cementBags} Bags (₹{plasterResult.cementCost.toLocaleString()})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Sand Required:</span>
                  <strong>{plasterResult.sandCuFt} cu ft (₹{plasterResult.sandCost.toLocaleString()})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Labor Cost (₹18/sqft):</span>
                  <strong>₹{plasterResult.laborCost?.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: 6 }}>
                  <span style={{ fontWeight: 700 }}>Total Plaster Cost:</span>
                  <strong style={{ color: 'var(--color-success)', fontSize: '1rem' }}>₹{plasterResult.totalEstimatedCost?.toLocaleString()}</strong>
                </div>
              </div>

              <button 
                type="button" 
                onClick={saveFinishingEstimate} 
                className="btn btn-primary" 
                disabled={saveLoading}
              >
                <BookmarkPlus size={16} /> Save Finishing to Project Vault
              </button>
            </div>
          </div>

          {/* Flooring & Tiling */}
          <div className="card">
            <h3 className="card-title"><Grid size={18} color="var(--accent-color)" /> Flooring & Tiling Estimator</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Floor Area (Sq Ft)</label>
                <input type="number" className="form-input" value={tileFloorArea} onChange={e => setTileFloorArea(e.target.value)} min="1" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Tile Dimensions</label>
                  <select className="form-select" value={tileSize} onChange={e => setTileSize(e.target.value)}>
                    <option value="2x2">2 × 2 Ft (Vitrified Living/Bed)</option>
                    <option value="2x4">2 × 4 Ft (Large GVT Slab)</option>
                    <option value="1x1">1 × 1 Ft (Anti-skid Bathroom)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Box Price (₹/box)</label>
                  <input type="number" className="form-input" value={tileBoxPrice} onChange={e => setTileBoxPrice(e.target.value)} min="1" />
                </div>
              </div>

              {/* Tiling Result breakdown */}
              <div style={{ padding: 14, background: 'var(--bg-subtle)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tile Boxes Required:</span>
                  <strong style={{ color: 'var(--accent-color)' }}>{tileResult.boxes} Boxes ({tileResult.totalTiles} tiles)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tile Adhesive Bags (20kg):</span>
                  <strong>{tileResult.adhesiveBags} Bags (₹{tileResult.adhesiveCost.toLocaleString()})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Epoxy Grout:</span>
                  <strong>{tileResult.groutKg} kg (₹{tileResult.groutCost.toLocaleString()})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: 6 }}>
                  <span style={{ fontWeight: 700 }}>Total Flooring Cost:</span>
                  <strong style={{ color: 'var(--color-success)', fontSize: '1rem' }}>₹{tileResult.totalEstimatedCost?.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: STEEL BAR BENDING SCHEDULE (BBS) */}
      {/* ==================================================================== */}
      {activeTab === 'steel' && (
        <div className="calc-grid">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="card-title" style={{ margin: 0 }}>
                <Ruler size={18} color="var(--primary-color)" /> Steel Rebar & Weight Parameters
              </h3>
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>IS Rebar Formula: d²/162</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Bar Diameter (mm)</label>
                  <select className="form-select" value={steelBarDia} onChange={e => setSteelBarDia(e.target.value)}>
                    <option value="8">8 mm (Stirrups / Ties - 0.395 kg/m)</option>
                    <option value="10">10 mm (Slab Distribution - 0.617 kg/m)</option>
                    <option value="12">12 mm (Main Slab / Light Beam - 0.888 kg/m)</option>
                    <option value="16">16 mm (Beam Main Rebar - 1.578 kg/m)</option>
                    <option value="20">20 mm (Heavy Column Main - 2.466 kg/m)</option>
                    <option value="25">25 mm (Footing / Transfer Beam - 3.853 kg/m)</option>
                    <option value="32">32 mm (Heavy Civil Retaining - 6.313 kg/m)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cut Length per Bar (Meters)</label>
                  <input type="number" step="0.1" className="form-input" value={steelLengthMeters} onChange={e => setSteelLengthMeters(e.target.value)} min="1" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Number of Bars</label>
                  <input type="number" className="form-input" value={steelNumBars} onChange={e => setSteelNumBars(e.target.value)} min="1" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Steel Rate (₹/kg)</label>
                  <input type="number" className="form-input" value={steelRatePerKg} onChange={e => setSteelRatePerKg(e.target.value)} min="1" />
                </div>
              </div>

              <button 
                type="button" 
                onClick={saveSteelBBSEstimate} 
                className="btn btn-primary" 
                style={{ marginTop: 8 }} 
                disabled={saveLoading}
              >
                <BookmarkPlus size={17} /> Save BBS Schedule to Project Vault
              </button>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="card-title" style={{ color: 'var(--primary-color)' }}>
              <CheckCircle2 size={18} /> Bar Bending Weight & Valuation
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Steel Weight</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-color)', marginTop: 4 }}>
                  {steelBBSResult.totalWeightKg?.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>kg</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                  Equivalent: {steelBBSResult.totalWeightTons} Metric Tons
                </div>
              </div>

              <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Rebar Value</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)', marginTop: 4 }}>
                  ₹{steelBBSResult.totalCost?.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                  Binding wire needed: {steelBBSResult.bindingWireKg} kg
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
                <span>Theoretical Unit Weight (d²/162):</span>
                <strong>{steelBBSResult.unitWeightKgPerM} kg / meter</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
                <span>Total Running Rebar Length:</span>
                <strong>{(steelBBSResult.totalLengthMeters * steelBBSResult.numberOfBars).toFixed(1)} meters</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
                <span>Binding Wire Cost (18-gauge GI):</span>
                <strong>{steelBBSResult.bindingWireKg} kg (₹{steelBBSResult.bindingWireCost})</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: BUILDING BOQ & BUDGET */}
      {/* ==================================================================== */}
      {activeTab === 'boq' && (
        <div className="calc-grid">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="card-title" style={{ margin: 0 }}>
                <Building size={18} color="var(--primary-color)" /> Project BOQ & Specifications
              </h3>
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Benchmark 2026</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Built-up Area per Floor (Sq Ft)</label>
                  <input type="number" className="form-input" value={builtUpArea} onChange={e => setBuiltUpArea(e.target.value)} min="100" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Number of Floors</label>
                  <select className="form-select" value={floorsCount} onChange={e => setFloorsCount(e.target.value)}>
                    <option value="1">Ground Floor Only (G)</option>
                    <option value="2">G + 1 Floor (Duplex / Villa)</option>
                    <option value="3">G + 2 Floors (Apartments)</option>
                    <option value="4">G + 3 Floors (Commercial)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Construction Quality Specification Tier</label>
                <select className="form-select" value={qualityTier} onChange={e => setQualityTier(e.target.value)}>
                  <option value="economy">Economy Tier (₹1,600 / sqft - Basic materials & standard fixtures)</option>
                  <option value="standard">Standard Tier (₹2,100 / sqft - Teak wood frame, premium vitrified, branded CP)</option>
                  <option value="premium">Premium Tier (₹2,850 / sqft - Italian marble, UPVC German windows, home automation)</option>
                  <option value="luxury">Luxury Tier (₹3,800 / sqft - Designer architectural custom build & luxury facade)</option>
                </select>
              </div>

              <button 
                type="button" 
                onClick={saveBOQEstimate} 
                className="btn btn-primary" 
                style={{ marginTop: 8 }} 
                disabled={saveLoading}
              >
                <BookmarkPlus size={17} /> Save 10-Phase BOQ to Project Records
              </button>
            </div>
          </div>

          {/* BOQ Results Card */}
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="card-title" style={{ color: 'var(--color-success)' }}>
              <IndianRupee size={18} /> Phase-wise Bill of Quantities (BOQ)
            </h3>

            <div style={{ padding: 16, background: 'var(--color-success-bg)', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Built-up Area: {costResult.totalBuiltUpArea?.toLocaleString()} sq ft</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)', marginTop: 2 }}>
                  ₹{(costResult.totalEstimatedBudget / 100000).toFixed(2)} Lakhs
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>Rate per Sq Ft</div>
                <strong style={{ color: 'var(--primary-color)' }}>₹{costResult.ratePerSqFt} / sqft</strong>
              </div>
            </div>

            {/* 10 Phases List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
              {costResult.phases.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8, fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.phase}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: 8 }}>({p.percent}%)</span>
                  </div>
                  <strong style={{ color: 'var(--text-primary)' }}>₹{Math.round(p.cost).toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: SAVED ESTIMATES VAULT */}
      {/* ==================================================================== */}
      {activeTab === 'vault' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              <FolderClock size={18} color="var(--primary-color)" /> Project Saved Estimations Vault
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Project: <strong style={{ color: 'var(--text-primary)' }}>{projects.find(p => p.id === projectId)?.name || 'Selected Project'}</strong>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
            {/* Bricks Vault */}
            <div style={{ padding: 18, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 14 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary-color)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BrickWall size={16} /> Saved Brickwork Estimates ({savedEstimates.bricks?.length || 0})
              </h4>
              {savedEstimates.bricks?.length === 0 ? (
                <div style={{ fontSize: '0.825rem', color: 'var(--text-dim)', padding: 18, textAlign: 'center' }}>No saved brick calculations for this project yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {savedEstimates.bricks.map((b) => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: '0.85rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.bricksNeeded?.toLocaleString()} bricks ({b.wallVolumeCuFt || b.thickness || 0} cft)</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600, marginTop: 2 }}>₹{b.totalEstimatedCost?.toLocaleString() || b.totalCost?.toLocaleString()}</div>
                      </div>
                      <button 
                        onClick={() => handleDeleteEstimate('brick', b.id)} 
                        className="btn-secondary" 
                        style={{ padding: 7, borderRadius: 8, color: 'var(--color-error)' }}
                        title="Delete calculation"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Materials Vault */}
            <div style={{ padding: 18, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 14 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-color)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={16} /> Saved Concrete & Steel Items ({savedEstimates.materials?.length || 0})
              </h4>
              {savedEstimates.materials?.length === 0 ? (
                <div style={{ fontSize: '0.825rem', color: 'var(--text-dim)', padding: 18, textAlign: 'center' }}>No saved concrete records for this project yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {savedEstimates.materials.map((m) => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: '0.85rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>{m.quantity} {m.unit} • <strong style={{ color: 'var(--color-success)' }}>₹{m.totalCost?.toLocaleString()}</strong></div>
                      </div>
                      <button 
                        onClick={() => handleDeleteEstimate('material', m.id)} 
                        className="btn-secondary" 
                        style={{ padding: 7, borderRadius: 8, color: 'var(--color-error)' }}
                        title="Delete material"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Costs Vault */}
            <div style={{ padding: 18, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 14 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-success)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IndianRupee size={16} /> Saved BOQ Budgets ({savedEstimates.costs?.length || 0})
              </h4>
              {savedEstimates.costs?.length === 0 ? (
                <div style={{ fontSize: '0.825rem', color: 'var(--text-dim)', padding: 18, textAlign: 'center' }}>No saved BOQ records for this project yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {savedEstimates.costs.map((c) => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: '0.85rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>₹{(Number(c.totalEstimatedCost || 0) / 100000).toFixed(2)} Lakhs</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>{c.totalBuiltUpArea || 1800} sq ft • {c.qualityTier || 'Standard'}</div>
                      </div>
                      <button 
                        onClick={() => handleDeleteEstimate('cost', c.id)} 
                        className="btn-secondary" 
                        style={{ padding: 7, borderRadius: 8, color: 'var(--color-error)' }}
                        title="Delete BOQ"
                      >
                        <Trash2 size={14} />
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
