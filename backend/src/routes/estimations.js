const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// 1. Smart Brick Calculator
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
        projectId,
        siteId
    } = req.body;

    if (!length || !height || !thickness) {
        return res.status(400).json({ error: 'Wall length, height, and thickness are required' });
    }

    try {
        // Wall Volume in cubic feet
        const thicknessFt = parseFloat(thickness) / 12;
        const wallVolume = parseFloat(length) * parseFloat(height) * thicknessFt;

        // Brick Volume without mortar (in cubic inches)
        const singleBrickVolInches = parseFloat(brickLength) * parseFloat(brickWidth) * parseFloat(brickHeight);
        const singleBrickVolFt = singleBrickVolInches / 1728; // 1728 cubic inches in 1 cubic foot

        // Brick Volume with mortar joint (in cubic inches)
        const brickLengthWithMortar = parseFloat(brickLength) + parseFloat(mortarThickness);
        const brickWidthWithMortar = parseFloat(brickWidth) + parseFloat(mortarThickness);
        const brickHeightWithMortar = parseFloat(brickHeight) + parseFloat(mortarThickness);
        
        const singleBrickVolWithMortarInches = brickLengthWithMortar * brickWidthWithMortar * brickHeightWithMortar;
        const singleBrickVolWithMortarFt = singleBrickVolWithMortarInches / 1728;

        // Calculate brick counts
        const baseBricksNeeded = Math.ceil(wallVolume / singleBrickVolWithMortarFt);
        const wastageBricks = Math.ceil(baseBricksNeeded * (parseFloat(wastage) / 100));
        const totalBricksNeeded = baseBricksNeeded + wastageBricks;

        // Calculate mortar requirements
        // Mortar volume = Wall Volume - Volume of clean bricks
        const totalBricksVolumeFt = baseBricksNeeded * singleBrickVolFt;
        const mortarVolumeFt = Math.max(0, wallVolume - totalBricksVolumeFt);

        const calculationSteps = [
            `Wall volume calculated: ${wallVolume.toFixed(2)} cu ft (L: ${length} ft, H: ${height} ft, T: ${thickness} in)`,
            `Single brick volume with mortar: ${singleBrickVolWithMortarFt.toFixed(5)} cu ft`,
            `Base bricks needed: ${baseBricksNeeded} units`,
            `Wastage offset (+${wastage}%): ${wastageBricks} units`,
            `Mortar volume estimation: ${mortarVolumeFt.toFixed(2)} cu ft`
        ];

        const responseData = {
            wallVolumeCuFt: parseFloat(wallVolume.toFixed(2)),
            bricksNeeded: totalBricksNeeded,
            baseBricks: baseBricksNeeded,
            wastageBricks,
            mortarVolumeCuFt: parseFloat(mortarVolumeFt.toFixed(2)),
            calculationSteps
        };

        // If project ID is provided, save estimation to DB
        if (projectId) {
            await db.brickEstimations.create({
                projectId,
                siteId: siteId || null,
                length: parseFloat(length),
                width: parseFloat(thickness), // Width is thickness in this context
                height: parseFloat(height),
                thickness: parseFloat(thickness),
                bricksNeeded: totalBricksNeeded
            });
        }

        res.json(responseData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Material Estimation (Cement, Sand, Steel, Aggregate, Bricks)
router.post('/materials', async (req, res) => {
    const { concreteVolume, projectId } = req.body;

    if (!concreteVolume) {
        return res.status(400).json({ error: 'Concrete Volume (in cubic feet) is required' });
    }

    try {
        const volume = parseFloat(concreteVolume);
        
        // 1.54 is the standard compaction factor for dry concrete volume
        const dryVolume = volume * 1.54;
        
        // Standard M15/M20 mix ratios (1:2:4 Cement:Sand:Aggregate = 7 parts)
        const totalParts = 7;
        const cementRatio = 1 / totalParts;
        const sandRatio = 2 / totalParts;
        const aggregateRatio = 4 / totalParts;

        // Volume requirements
        const cementCuFt = dryVolume * cementRatio;
        const sandCuFt = dryVolume * sandRatio;
        const aggregateCuFt = dryVolume * aggregateRatio;

        // Convert Cement to standard bags (1.25 cubic feet per bag)
        const cementBags = Math.ceil(cementCuFt / 1.25);
        
        // Reinforcement Steel: Standard index is ~2.2 lbs per cubic foot of concrete
        const steelWeightLbs = volume * 2.2;
        const steelWeightKg = Math.ceil(steelWeightLbs * 0.453592); // Convert to kgs

        // Materials items array (costs in INR / Rupees)
        const materials = [
            { name: 'Cement', quantity: cementBags, unit: 'bags', unitCost: 380, totalCost: parseFloat((cementBags * 380).toFixed(2)) },
            { name: 'Sand', quantity: Math.ceil(sandCuFt), unit: 'cu ft', unitCost: 45, totalCost: parseFloat((Math.ceil(sandCuFt) * 45).toFixed(2)) },
            { name: 'Coarse Aggregate', quantity: Math.ceil(aggregateCuFt), unit: 'cu ft', unitCost: 55, totalCost: parseFloat((Math.ceil(aggregateCuFt) * 55).toFixed(2)) },
            { name: 'Reinforcement Steel', quantity: steelWeightKg, unit: 'kg', unitCost: 65, totalCost: parseFloat((steelWeightKg * 65).toFixed(2)) }
        ];

        const totalMaterialsCost = materials.reduce((acc, curr) => acc + curr.totalCost, 0);

        const responseData = {
            concreteVolumeCuFt: volume,
            dryVolumeCuFt: parseFloat(dryVolume.toFixed(2)),
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

// 3. Cost Estimation
router.post('/cost', async (req, res) => {
    const { projectId, materialCost, laborCost, transportCost, miscCost } = req.body;

    if (materialCost === undefined || laborCost === undefined) {
        return res.status(400).json({ error: 'Material and Labor costs are required' });
    }

    try {
        const mc = parseFloat(materialCost);
        const lc = parseFloat(laborCost);
        const tc = parseFloat(transportCost || 0);
        const miscc = parseFloat(miscCost || 0);

        const totalCost = mc + lc + tc + miscc;

        const estimation = {
            projectId: projectId || null,
            materialCost: mc,
            laborCost: lc,
            transportCost: tc,
            miscCost: miscc,
            totalEstimatedCost: totalCost
        };

        if (projectId) {
            await db.costEstimations.create(estimation);
        }

        res.json(estimation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Get saved project estimations
router.get('/project/:projectId', async (req, res) => {
    const { projectId } = req.params;
    try {
        const bricks = await db.brickEstimations.listByProject(projectId);
        const materials = await db.materials.listByProject(projectId);
        const costs = await db.costEstimations.listByProject(projectId);

        res.json({
            bricks,
            materials,
            costs
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
