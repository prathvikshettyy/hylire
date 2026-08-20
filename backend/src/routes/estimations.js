const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// 1. Smart Brick & Mortar Calculator
router.post('/bricks', async (req, res) => {
    const { 
        length, 
        height, 
        thickness, 
        brickLength = 9, 
        brickWidth = 4.5, 
        brickHeight = 3, 
        mortarThickness = 0.5, 
        wastage = 10,
        brickUnitPrice = 8.50,
        cementBagPrice = 380,
        sandCftPrice = 45,
        projectId,
        siteId
    } = req.body;

    if (!length || !height || !thickness) {
        return res.status(400).json({ error: 'Wall length, height, and thickness are required' });
    }

    try {
        const l = parseFloat(length);
        const h = parseFloat(height);
        const t = parseFloat(thickness);
        const waste = parseFloat(wastage || 0);

        // Wall Volume in cubic feet
        const thicknessFt = t / 12;
        const wallVolume = l * h * thicknessFt;

        // Modular Brick Volume without mortar (in cubic inches -> cubic feet)
        const singleBrickVolInches = parseFloat(brickLength) * parseFloat(brickWidth) * parseFloat(brickHeight);
        const singleBrickVolFt = singleBrickVolInches / 1728;

        // Brick Volume with mortar joint
        const brickLengthWithMortar = parseFloat(brickLength) + parseFloat(mortarThickness);
        const brickWidthWithMortar = parseFloat(brickWidth) + parseFloat(mortarThickness);
        const brickHeightWithMortar = parseFloat(brickHeight) + parseFloat(mortarThickness);
        
        const singleBrickVolWithMortarInches = brickLengthWithMortar * brickWidthWithMortar * brickHeightWithMortar;
        const singleBrickVolWithMortarFt = singleBrickVolWithMortarInches / 1728;

        // Calculate brick counts
        const baseBricksNeeded = Math.ceil(wallVolume / singleBrickVolWithMortarFt);
        const wastageBricks = Math.ceil(baseBricksNeeded * (waste / 100));
        const totalBricksNeeded = baseBricksNeeded + wastageBricks;

        // Mortar volume calculation:
        // Wet mortar volume = Total Wall Volume - (baseBricksNeeded * single brick clean volume)
        const totalBricksCleanVolumeFt = baseBricksNeeded * singleBrickVolFt;
        const wetMortarVolumeFt = Math.max(0, wallVolume - totalBricksCleanVolumeFt);
        
        // Dry mortar compaction factor (1.33 for masonry mortar, standard 1:6 mix ratio = 7 parts)
        const dryMortarVolumeFt = wetMortarVolumeFt * 1.33;
        const mortarMixParts = 7; // 1:6 cement:sand
        const cementCuFt = dryMortarVolumeFt * (1 / mortarMixParts);
        const sandCuFt = dryMortarVolumeFt * (6 / mortarMixParts);
        const cementBags = Math.ceil(cementCuFt / 1.25); // 1.25 cu ft per bag

        // Estimated Cost Breakdown
        const brickCost = totalBricksNeeded * parseFloat(brickUnitPrice);
        const cementCost = cementBags * parseFloat(cementBagPrice);
        const sandCost = Math.ceil(sandCuFt) * parseFloat(sandCftPrice);
        const totalEstimatedCost = brickCost + cementCost + sandCost;

        const calculationSteps = [
            `Wall area: ${(l * h).toFixed(2)} sq ft | Wall volume: ${wallVolume.toFixed(2)} cu ft (L: ${l} ft, H: ${h} ft, T: ${t} in)`,
            `Standard single brick with ${mortarThickness}" joint: ${singleBrickVolWithMortarFt.toFixed(5)} cu ft`,
            `Base bricks required: ${baseBricksNeeded} units`,
            `Wastage allowance (+${waste}%): ${wastageBricks} units -> Total: ${totalBricksNeeded} bricks`,
            `Mortar mix requirement (1:6): ${cementBags} bags of Cement + ${Math.ceil(sandCuFt)} cu ft of Sand`
        ];

        const responseData = {
            wallVolumeCuFt: parseFloat(wallVolume.toFixed(2)),
            bricksNeeded: totalBricksNeeded,
            baseBricks: baseBricksNeeded,
            wastageBricks,
            wetMortarVolumeCuFt: parseFloat(wetMortarVolumeFt.toFixed(2)),
            dryMortarVolumeCuFt: parseFloat(dryMortarVolumeFt.toFixed(2)),
            cementBags,
            sandCuFt: Math.ceil(sandCuFt),
            brickCost: parseFloat(brickCost.toFixed(2)),
            cementCost: parseFloat(cementCost.toFixed(2)),
            sandCost: parseFloat(sandCost.toFixed(2)),
            totalEstimatedCost: parseFloat(totalEstimatedCost.toFixed(2)),
            calculationSteps
        };

        // If project ID is provided, save estimation to DB
        if (projectId) {
            await db.brickEstimations.create({
                projectId,
                siteId: siteId || null,
                length: l,
                width: t,
                height: h,
                thickness: t,
                bricksNeeded: totalBricksNeeded,
                cementBags,
                sandCuFt: Math.ceil(sandCuFt),
                totalCost: parseFloat(totalEstimatedCost.toFixed(2))
            });
        }

        res.json(responseData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Concrete, RCC & Structural Materials Calculator
router.post('/materials', async (req, res) => {
    const { 
        concreteVolume, 
        grade = 'M20', 
        steelPercent = 1.5,
        cementBagPrice = 380,
        sandCftPrice = 45,
        aggregateCftPrice = 55,
        steelKgPrice = 65,
        projectId 
    } = req.body;

    if (!concreteVolume) {
        return res.status(400).json({ error: 'Concrete Volume (in cubic feet) is required' });
    }

    try {
        const volume = parseFloat(concreteVolume);
        
        // 1.54 is the standard compaction factor for dry concrete volume
        const dryVolume = volume * 1.54;
        
        // Mix Ratios (Cement : Sand : Aggregate)
        const mixRatios = {
            'M10': { c: 1, s: 3, a: 6, total: 10 },
            'M15': { c: 1, s: 2, a: 4, total: 7 },
            'M20': { c: 1, s: 1.5, a: 3, total: 5.5 },
            'M25': { c: 1, s: 1, a: 2, total: 4 }
        };

        const selectedMix = mixRatios[grade] || mixRatios['M20'];
        const cementCuFt = dryVolume * (selectedMix.c / selectedMix.total);
        const sandCuFt = dryVolume * (selectedMix.s / selectedMix.total);
        const aggregateCuFt = dryVolume * (selectedMix.a / selectedMix.total);

        // Cement bags (1.25 cu ft per 50kg bag)
        const cementBags = Math.ceil(cementCuFt / 1.25);
        
        // Reinforcement Steel calculation: Density of steel = 7850 kg/m3 (~490 lbs/cu ft)
        // Standard structural percentage is ~1.2% - 2.0% of concrete volume
        const steelRatio = parseFloat(steelPercent || 1.5) / 100;
        const steelWeightKg = Math.ceil(volume * 0.0283168 * 7850 * steelRatio); // 1 cu ft = 0.0283168 m3

        // Water requirement: Water-Cement ratio ~0.45-0.5 (25 to 28 liters per bag of cement)
        const waterLiters = cementBags * 28;

        const cBagPrice = parseFloat(cementBagPrice || 380);
        const sPrice = parseFloat(sandCftPrice || 45);
        const aPrice = parseFloat(aggregateCftPrice || 55);
        const stPrice = parseFloat(steelKgPrice || 65);

        // Materials items array
        const materials = [
            { name: 'Cement (OPC/PPC 50kg)', quantity: cementBags, unit: 'bags', unitCost: cBagPrice, totalCost: parseFloat((cementBags * cBagPrice).toFixed(2)) },
            { name: 'River Sand / M-Sand', quantity: Math.ceil(sandCuFt), unit: 'cu ft', unitCost: sPrice, totalCost: parseFloat((Math.ceil(sandCuFt) * sPrice).toFixed(2)) },
            { name: 'Coarse Aggregate (20mm)', quantity: Math.ceil(aggregateCuFt), unit: 'cu ft', unitCost: aPrice, totalCost: parseFloat((Math.ceil(aggregateCuFt) * aPrice).toFixed(2)) },
            { name: 'TMT Steel Rebar (Fe500D)', quantity: steelWeightKg, unit: 'kg', unitCost: stPrice, totalCost: parseFloat((steelWeightKg * stPrice).toFixed(2)) }
        ];

        const totalMaterialsCost = materials.reduce((acc, curr) => acc + curr.totalCost, 0);

        const responseData = {
            grade,
            concreteVolumeCuFt: volume,
            dryVolumeCuFt: parseFloat(dryVolume.toFixed(2)),
            cementBags,
            sandCuFt: Math.ceil(sandCuFt),
            aggregateCuFt: Math.ceil(aggregateCuFt),
            steelKg: steelWeightKg,
            waterLiters,
            materials,
            totalMaterialsCost: parseFloat(totalMaterialsCost.toFixed(2))
        };

        // If project ID is provided, save materials to DB
        if (projectId) {
            for (const mat of materials) {
                await db.materials.create({
                    projectId,
                    name: mat.name,
                    quantity: mat.quantity,
                    unit: mat.unit,
                    unitCost: mat.unitCost,
                    totalCost: mat.totalCost
                });
            }
        }

        res.json(responseData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Plastering & Finishing Estimator
router.post('/plaster', async (req, res) => {
    const { 
        areaSqFt, 
        thicknessMm = 12, 
        mixRatio = '1:4', 
        coatType = 'single',
        projectId 
    } = req.body;

    if (!areaSqFt) {
        return res.status(400).json({ error: 'Plaster area in sq ft is required' });
    }

    try {
        const area = parseFloat(areaSqFt);
        const thicknessFt = (parseFloat(thicknessMm) / 25.4) / 12;
        const wetVolumeFt = area * thicknessFt;
        const dryVolumeFt = wetVolumeFt * 1.33; // 33% compaction factor

        const parts = mixRatio === '1:4' ? 5 : 7; // 1:4 or 1:6
        const sandMultiplier = mixRatio === '1:4' ? 4 : 6;
        
        const cementCuFt = dryVolumeFt * (1 / parts);
        const sandCuFt = dryVolumeFt * (sandMultiplier / parts);
        const cementBags = Math.ceil(cementCuFt / 1.25);

        const cementCost = cementBags * 380;
        const sandCost = Math.ceil(sandCuFt) * 45;
        const laborCost = Math.ceil(area * 18); // ₹18 per sq ft for plaster labor
        const totalEstimatedCost = cementCost + sandCost + laborCost;

        const responseData = {
            areaSqFt: area,
            thicknessMm,
            wetVolumeCuFt: parseFloat(wetVolumeFt.toFixed(2)),
            dryVolumeCuFt: parseFloat(dryVolumeFt.toFixed(2)),
            cementBags,
            sandCuFt: Math.ceil(sandCuFt),
            cementCost,
            sandCost,
            laborCost,
            totalEstimatedCost
        };

        res.json(responseData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Overall Building BOQ & Cost Estimator
router.post('/cost', async (req, res) => {
    const { projectId, materialCost, laborCost, transportCost = 0, miscCost = 0, builtUpAreaSqFt, qualityTier = 'standard' } = req.body;

    try {
        let mc = parseFloat(materialCost || 0);
        let lc = parseFloat(laborCost || 0);
        let tc = parseFloat(transportCost || 0);
        let miscc = parseFloat(miscCost || 0);

        // If builtUpAreaSqFt is provided, calculate automatic benchmark BOQ
        let boqBreakdown = null;
        if (builtUpAreaSqFt && parseFloat(builtUpAreaSqFt) > 0) {
            const area = parseFloat(builtUpAreaSqFt);
            const ratePerSqFt = qualityTier === 'luxury' ? 2600 : qualityTier === 'premium' ? 1950 : 1450;
            const totalBuildingEstimate = area * ratePerSqFt;

            boqBreakdown = {
                builtUpAreaSqFt: area,
                ratePerSqFt,
                totalEstimate: totalBuildingEstimate,
                stages: [
                    { stage: '1. Excavation & Foundation Work', percentage: 12, cost: totalBuildingEstimate * 0.12 },
                    { stage: '2. RCC Structure (Columns, Beams, Slabs)', percentage: 34, cost: totalBuildingEstimate * 0.34 },
                    { stage: '3. Brickwork & Masonry Walls', percentage: 17, cost: totalBuildingEstimate * 0.17 },
                    { stage: '4. Internal/External Plaster & Putty', percentage: 9, cost: totalBuildingEstimate * 0.09 },
                    { stage: '5. Flooring, Tiles & Granite', percentage: 10, cost: totalBuildingEstimate * 0.10 },
                    { stage: '6. Electrical & Plumbing (MEP)', percentage: 11, cost: totalBuildingEstimate * 0.11 },
                    { stage: '7. Doors, Windows, Paint & Handover', percentage: 7, cost: totalBuildingEstimate * 0.07 }
                ]
            };

            if (mc === 0 && lc === 0) {
                mc = totalBuildingEstimate * 0.65;
                lc = totalBuildingEstimate * 0.25;
                tc = totalBuildingEstimate * 0.05;
                miscc = totalBuildingEstimate * 0.05;
            }
        }

        const totalCost = mc + lc + tc + miscc;

        const estimation = {
            projectId: projectId || null,
            materialCost: mc,
            laborCost: lc,
            transportCost: tc,
            miscCost: miscc,
            totalEstimatedCost: totalCost,
            boqBreakdown
        };

        if (projectId) {
            await db.costEstimations.create(estimation);
        }

        res.json(estimation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Get saved project estimations
router.get('/project/:projectId', async (req, res) => {
    const { projectId } = req.params;
    try {
        const bricks = await db.brickEstimations.listByProject(projectId);
        const materials = await db.materials.listByProject(projectId);
        const costs = await db.costEstimations.listByProject(projectId);

        res.json({
            bricks: bricks || [],
            materials: materials || [],
            costs: costs || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. Delete a saved estimation item
router.delete('/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
        let success = false;
        if (type === 'brick' || type === 'bricks') {
            success = await db.brickEstimations.delete(id);
        } else if (type === 'material' || type === 'materials') {
            success = await db.materials.delete(id);
        } else if (type === 'cost' || type === 'costs') {
            success = await db.costEstimations.delete(id);
        }
        res.json({ success });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
