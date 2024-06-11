const express = require('express');
const router = express.Router();
const db = require('../models');
// Create an asset for a suborganization

router.post('/configure', async (req, res) => {
    try {
        const { suborgId,choosenValueBuddies, valueBuddies, tokens, gatePositions ,karmaPositions} = req.body;
  
        // Check if all fields are provided
        if (!suborgId || !valueBuddies || !tokens || !gatePositions || !karmaPositions || !choosenValueBuddies) {
            return res.status(400).json({ message: 'All fields are required:(suborgId, valueBuddies, choosenValueBuddies, tokens, gatePositions ,karmaPositions)' });
        }
  
        // Validate valueBuddies
        if (!Array.isArray(choosenValueBuddies) ||choosenValueBuddies.length >6 || choosenValueBuddies<=0 ) {
            return res.status(400).json({ message: 'choose atleast 1 and atmost 6 valueBudidies.' });
        }
  
        const uniqueChoosenValueBuddies = new Set(choosenValueBuddies);
        if ( uniqueChoosenValueBuddies.size !== choosenValueBuddies.length) {
            return res.status(400).json({ message: 'choosenValueBuddies must contain unique numbers.' });
        }
  
        // Validate tokens
        if (!Array.isArray(tokens) || tokens.length !== 4 || !tokens.every(str => typeof str === 'string')) {
            return res.status(400).json({ message: 'tokens must be an array of 4 strings.' });
        }

           // Validate valueBuddies
           const uniqueValueBuddies = new Set(valueBuddies);
        if (uniqueValueBuddies.size !== valueBuddies.length) {
            return res.status(400).json({ message: 'valueBuddies must be unique .' });
        }
           if (!Array.isArray(valueBuddies) || valueBuddies.length !== 16 || !valueBuddies.every(str => typeof str === 'string')) {
            return res.status(400).json({ message: 'tokens must be an array of 4 strings.' });
        }
     
        // Validate gatePositions
        if (!Array.isArray(gatePositions) || gatePositions.length !== 16 || !gatePositions.every(num => Number.isInteger(num) && num >= 1 && num <= 100)) {
            return res.status(400).json({ message: 'gatePositions must be an array of 16 numbers between 1 and 100.' });
        }
        
        const uniqueGatePositions = new Set(gatePositions);
        if (uniqueGatePositions.size !== gatePositions.length) {
            return res.status(400).json({ message: 'gatePositions must contain unique numbers.' });
        }
  
  
      
     // Validate karmaPositions
     if (!Array.isArray(karmaPositions) || karmaPositions.length !== 5 || !karmaPositions.every(num => Number.isInteger(num) && num >= 1 && num <= 100)) {
        return res.status(400).json({ message: 'karmaPositions must be an array of 5 numbers between 1 and 100.' });
    }
  
    const uniqueKarmaPositions= new Set(karmaPositions);
    if (uniqueKarmaPositions.size !== karmaPositions.length) {
        return res.status(400).json({ message: 'karmaPositions must contain unique numbers.' });
    }
    const existingAssets=await db.Assets.findOne({where:{SuborganisationId:suborgId}})
    
    if(existingAssets){
        return res.status(400).json({ message: 'Assets configuration is already exists for the given Suborgnisation!' });
    }
        // Create the asset
        const newAsset = await db.Assets.create({ SuborganisationId:suborgId, valueBuddies, tokens, gatePositions,karmaPositions,choosenValueBuddies });
  
        return res.status(201).json(newAsset);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
  });
// Update an asset for a suborganization by ID
router.patch('/updateConfiguration', async (req, res) => {
    try {
        const { suborgId, valueBuddies, tokens, gatePositions,karmaPositions,choosenValueBuddies } = req.body;

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
       

        if (valueBuddies) {
            
            if( (!Array.isArray(valueBuddies) || valueBuddies.length === 0 )) {
                return res.status(400).json({ message: 'valueBuddies must be a non-empty array of unique numbers.' });
            }
            const uniqueValueBuddies = new Set(valueBuddies);
            if (uniqueValueBuddies.size !== valueBuddies.length) {
                return res.status(400).json({ message: 'valueBuddies must contain unique numbers.' });
            }
        }

     
        //validate choosen value buddies
     if(choosenValueBuddies){
        if (!Array.isArray(choosenValueBuddies) ||choosenValueBuddies.length >6 || choosenValueBuddies<=0 ) {
            return res.status(400).json({ message: 'choose atleast 1 and atmost 6 valueBudidies.' });
        }
  
        const uniqueChoosenValueBuddies = new Set(choosenValueBuddies);
        if ( uniqueChoosenValueBuddies.size !== choosenValueBuddies.length) {
            return res.status(400).json({ message: 'choosenValueBuddies must contain unique numbers.' });
        }
    }
  
        // Validate tokens
        if (tokens && (!Array.isArray(tokens) || tokens.length !== 4 || !tokens.every(str => typeof str === 'string'))) {
            return res.status(400).json({ message: 'tokens must be an array of 4 strings.' });
        }


       

        if(gatePositions){
        // Validate gatePositions
        if (gatePositions && (!Array.isArray(gatePositions) || gatePositions.length !== 16 || !gatePositions.every(num => Number.isInteger(num) && num >= 1 && num <= 100))) {
            return res.status(400).json({ message: 'gatePositions must be an array of 16 numbers between 1 and 100.' });
        }
              
        const uniqueGatePositions = new Set(gatePositions);
        if (uniqueGatePositions.size !== gatePositions.length) {
            return res.status(400).json({ message: 'gatePositions must contain unique numbers.' });
        }

       }
        if(karmaPositions){
      
     // Validate karmaPositions
     if (!Array.isArray(karmaPositions) || karmaPositions.length !== 5 || !karmaPositions.every(num => Number.isInteger(num) && num >= 1 && num <= 100)) {
        return res.status(400).json({ message: 'gatePositions must be an array of 5 numbers between 1 and 100.' });
    }

    const uniqueKarmaPositions= new Set(karmaPositions);
    if (uniqueKarmaPositions.size !== karmaPositions.length) {
        return res.status(400).json({ message: 'karmaPositions must contain unique numbers.' });
    }
}

        // Update the asset
        await asset.update({ SuborganisationId:suborgId, valueBuddies, tokens, gatePositions ,karmaPositions});

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

