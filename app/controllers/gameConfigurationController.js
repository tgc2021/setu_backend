const express = require('express');
const router = express.Router();
const db = require('../models');
// Create an GameConfiguration for a suborganization

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
    const existingGameConfiguration=await db.GameConfiguration.findOne({where:{SuborganisationId:suborgId}})
    
    if(existingGameConfiguration){
        return res.status(400).json({ message: 'Game configuration is already exists for the given Suborgnisation!' });
    }
        // Create the Game Configuration
        const newGameConfiguration = await db.GameConfiguration.create({ SuborganisationId:suborgId, valueBuddies, tokens, gatePositions,karmaPositions,choosenValueBuddies });
  
        return res.status(201).json(newGameConfiguration);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
  });
// Update an GameConfiguration for a suborganization by ID
router.patch('/updateConfiguration', async (req, res) => {
    try {
        const { suborgId, valueBuddies, tokens, gatePositions,karmaPositions,choosenValueBuddies } = req.body;

        // Validate suborganisationId
        if (!suborgId) {
            return res.status(400).json({ message: 'suborganisation id is required.' });
        }

        // Check if the Game Configuration exists
        const gameConfiguration = await db.GameConfiguration.findOne({where:{SuborganisationId:suborgId}});
        if (!gameConfiguration) {
            return res.status(404).json({ message: 'Game configuration not found for given suborganisation.' });
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

        // Update the Game Configuration
        await gameConfiguration.update({ SuborganisationId:suborgId, valueBuddies, tokens, gatePositions ,karmaPositions});

        res.json(gameConfiguration);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// Delete GameConfiguration for a suborganization by ID
router.delete('/delete', async (req, res) => {
    try {
        const { suborgId } = req.query;

        // Check if there are Game Configuration associated with the given suborganization
        const gameConfigurationToDelete = await db.GameConfiguration.findOne({ where: { SuborganisationId: suborgId } });
        if (!gameConfigurationToDelete) {
            return res.status(404).json({ message: 'No GameConfiguration configuration found for the given suborganization.' });
        }

        // Delete all Game Configuration associated with the given suborganization
        await db.GameConfiguration.destroy({ where: { SuborganisationId: suborgId } });

        res.json({ message: 'GameConfiguration configuration deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

