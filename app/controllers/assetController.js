const express = require('express');
const router = express.Router();
const db = require('../models');
// Create an asset for a suborganization
router.post('/configure', async (req, res) => {
    try {
        const { suborgId, valueBuddies, tokens, gatePositions } = req.body;

        // Check if all fields are provided
        if (!suborgId || !valueBuddies || !tokens || !gatePositions) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Validate valueBuddies
        if (!Array.isArray(valueBuddies) || valueBuddies.length === 0 ) {
            return res.status(400).json({ message: 'valueBuddies must be a non-empty array of numbers.' });
        }

        const uniqueValueBuddies = new Set(valueBuddies);
        if (uniqueValueBuddies.size !== valueBuddies.length) {
            return res.status(400).json({ message: 'valueBuddies must contain unique numbers.' });
        }

        // Validate tokens
        if (!Array.isArray(tokens) || tokens.length !== 4 || !tokens.every(str => typeof str === 'string')) {
            return res.status(400).json({ message: 'tokens must be an array of 4 strings.' });
        }

        // Validate gatePositions
        if (!Array.isArray(gatePositions) || gatePositions.length !== 16 || !gatePositions.every(num => Number.isInteger(num) && num >= 1 && num <= 100)) {
            return res.status(400).json({ message: 'gatePositions must be an array of 16 numbers between 1 and 100.' });
        }

        // Create the asset
        const newAsset = await db.Assets.create({ SuborganisationId:suborgId, valueBuddies, tokens, gatePositions });

        res.status(201).json(newAsset);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update an asset for a suborganization by ID
router.patch('/updateConfiguration', async (req, res) => {
    try {
        const { suborgId, valueBuddies, tokens, gatePositions } = req.body;

        // Validate suborganisationId
        if (!suborgId) {
            return res.status(400).json({ message: 'suborganisation id is required.' });
        }

        // Check if the asset exists
        const asset = await db.Assets.findOne({where:{SuborganisationId:suborgId}});
        if (!asset) {
            return res.status(404).json({ message: 'Asset configuration not found for given suborganisation.' });
        }


        // Validate valueBuddies
        if (valueBuddies && (!Array.isArray(valueBuddies) || valueBuddies.length === 0 )) {
            return res.status(400).json({ message: 'valueBuddies must be a non-empty array of unique numbers.' });
        }

        if (valueBuddies) {
            const uniqueValueBuddies = new Set(valueBuddies);
            if (uniqueValueBuddies.size !== valueBuddies.length) {
                return res.status(400).json({ message: 'valueBuddies must contain unique numbers.' });
            }
        }

        // Validate tokens
        if (tokens && (!Array.isArray(tokens) || tokens.length !== 4 || !tokens.every(str => typeof str === 'string'))) {
            return res.status(400).json({ message: 'tokens must be an array of 4 strings.' });
        }

        // Validate gatePositions
        if (gatePositions && (!Array.isArray(gatePositions) || gatePositions.length !== 16 || !gatePositions.every(num => Number.isInteger(num) && num >= 1 && num <= 100))) {
            return res.status(400).json({ message: 'gatePositions must be an array of 16 numbers between 1 and 100.' });
        }

        // Update the asset
        await asset.update({ SuborganisationId:suborgId, valueBuddies, tokens, gatePositions });

        res.json(asset);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// Delete assets for a suborganization by ID
router.delete('/delete', async (req, res) => {
    try {
        const { suborgId } = req.query;

        // Check if there are assets associated with the given suborganization
        const assetToDelete = await db.Assets.findOne({ where: { SuborganisationId: suborgId } });
        if (!assetToDelete) {
            return res.status(404).json({ message: 'No asset configuration found for the given suborganization.' });
        }

        // Delete all assets associated with the given suborganization
        await db.Assets.destroy({ where: { SuborganisationId: suborgId } });

        res.json({ message: 'Asset configuration deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
