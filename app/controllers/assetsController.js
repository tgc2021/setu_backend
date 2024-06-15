const multer = require('multer');
const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const db = require('../models');
const { checkSuborgExists } = require('../midllewares/authMiddleware');
// Multer configuration for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const suborgId = req.query.suborgId;
        const uploadPath = `uploads/${suborgId}`;
       fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const filename = file.fieldname + path.extname(file.originalname);
        const formattedFilePath = filename.replace(/\\/g, '/');
        cb(null, formattedFilePath);

    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|svg/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// Create or update assets
router.post('/upload', checkSuborgExists, upload.any(), async (req, res) => {
    const { suborgId } = req.query;
    const files = req.files;
    const data = {};

    if (files && files.length > 0) {
        files.forEach(file => {
            const columnName = file.fieldname;
            data[columnName] = file.path;
        });
    }
   console.log(req.body,req.files);
    try {
        let asset = await db.Assets.findOne({ where: { SuborganisationId: suborgId } });
        if (asset) {
            // Update existing asset
            asset = await asset.update(data);
            res.json({ message: 'Assets updated successfully', asset });
        } else {
            // Create new asset
            asset = await db.Assets.create({ SuborganisationId:suborgId, ...data });
            res.json({ message: 'Assets created successfully', asset });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete asset
router.delete('/assets', async (req, res) => {
    const { SuborgnisationId, columnName } = req.query;

    try {
        const asset = await db.Assets.findOne({ where: { suborgnisationId: SuborgnisationId } });
        if (asset && asset[columnName]) {
            fs.unlinkSync(asset[columnName]);  // Delete the file from the server
            asset[columnName] = null;
            await asset.save();
            res.json({ message: 'Asset deleted successfully', asset });
        } else {
            res.status(404).json({ error: 'Asset or file not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

