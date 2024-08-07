const multer = require('multer');
const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const db = require('../models');

// Multer configuration for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const suborgId = req.query.suborgId;
        const url=req.protocol + "://" + req.get('host') + req.originalUrl;
        const urlObject = new URL(url);
        const pathSegments = urlObject.pathname.split('/');
        const lastEndpoint = pathSegments[pathSegments.length - 1];
        const uploadPath = `uploads/${suborgId}/${lastEndpoint}`;
        
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
        let filetypes = /jpeg|jpg|png|gif|svg/;
        let mimetypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml',
          ];
        const folders=["intro","tokens","valueBuddy","dice","game","util","audio","chro"];
        const url=req.protocol + "://" + req.get('host') + req.originalUrl;
        const urlObject = new URL(url);
        const pathSegments = urlObject.pathname.split('/');
        const lastEndpoint = pathSegments[pathSegments.length - 1];
        let folderCheck=folders?.includes(lastEndpoint);
      
        if(lastEndpoint=='audio'){
          filetypes=/mp3|wav|ogg/;
          mimetypes=['audio/mpeg', 'audio/wav', 'audio/ogg']
        }
        let mimetype = mimetypes.includes(file.mimetype);
        let extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if(lastEndpoint=='chro' && (file.fieldname=='chro'||file.fieldname=="orgValueAsset") ){
            mimetype=true;
            extname=true;
        }
        console.log(mimetype,extname,folderCheck,filetypes)
        if (mimetype && extname && folderCheck) {
            return cb(null, true); 
        } else {
            if(!folderCheck){
                cb(new Error('please input correct folder destination!'));
            }else{
                if(lastEndpoint=='audio'){
                    cb(new Error('Only audio files are allowed'));
                }else  if(lastEndpoint=='video'){
                    cb(new Error('Only video files are allowed'));
                }
                else{
            cb(new Error('Only images are allowed'));
                }
            }
        }
    }
});


const uploadRouteHandler=async (req,res)=>{
    const { suborgId } = req.query;
    const files = req?.files;
    const data = {};

    if (files && files.length > 0) {
        files.forEach(file => {
            const columnName = file.fieldname;
            data[columnName] = file.path;
        });
    }
    const textFields=["certificateText","congratulationText","isEnabled","orgFieldName"];
    if (req.body) {
        Object.keys(req.body).forEach((key) => {
            if (textFields.includes(key)) {
                    data[key] = req.body[key];
               
            }
        });
    }
    try {
     
        let asset = await db[req.query.table].findOne({ where: { SuborganisationId: suborgId } });
        if (asset) {
            // Update existing asset
            asset = await asset.update(data);
       
         return res.json({ message: `${req.query.table} updated successfully`, [req.query.table]: asset });

        } else {
            // Create new asset
            asset = await db[req.query.table].create({ SuborganisationId:suborgId, ...data });
        
            return res.json({ message: `${req.query.table}  created successfully`, [req.query.table]: asset });
        }
 
    } catch (error) {
       return  res.status(500).json({ error: error.message });
    }
}

// Create or update assets
router.post('/intro', upload.any(), async (req, res) => {
       req.query.table="IntroAssets";
       return await uploadRouteHandler(req,res);
});
router.post('/valueBuddy', upload.any(), async (req, res) => {
    req.query.table="ValueBuddyAssets";
    return await uploadRouteHandler(req,res);
});
router.post('/tokens', upload.any(), async (req, res) => {
    req.query.table="TokenAssets";
    return await uploadRouteHandler(req,res);
});
router.post('/dice', upload.any(), async (req, res) => {
    req.query.table="DiceAssets";
    return await uploadRouteHandler(req,res);
});
router.post('/game', upload.any(), async (req, res) => {
    req.query.table="GameAssets";
    return await uploadRouteHandler(req,res);
});
router.post('/util', upload.any(), async (req, res) => {
    req.query.table="UtilAssets";
    return await uploadRouteHandler(req,res);
});


router.post('/audio', upload.any(), async (req, res) => {
    req.query.table="AudioAssets";
    return await uploadRouteHandler(req,res);
});

router.post('/chro', upload.any(), async (req, res) => {
    req.query.table="ChroAssets";
    return await uploadRouteHandler(req,res);
});
// Delete asset
router.delete('/delete', async (req, res) => {
    const { suborgId,files,table} = req.query;
    const tables=['IntroAssets',"TokenAssets","ValueBuddyAssets","DiceAssets","GameAssets","UtilAssets","AudioAssets","ChroAssets"]
 
    if(!table){
        return res.status(400).send({ error: 'table cantbe empty!' });
    }
    if(!files){
        return res.status(400).send({ error: 'files cantbe empty!' });
    }
    if(!tables.includes(table)){
        return res.status(400).send({ error: 'table not found!' });
    }
    const columnNames=files.split(",");

    try {
        const asset = await db[table].findOne({ where: { SuborganisationId: suborgId } });
        for(const columnName of columnNames){
        if (asset && asset[columnName]) {
            fs.unlinkSync(asset[columnName]);  // Delete the file from the server
            asset[columnName] = null;
        } else {
           return res.status(404).json({ error: 'Asset or file not found' });
        }
    }
    await asset.save();
    res.json({ message: 'Assets deleted successfully', asset });
 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


//add value buddy description
router.post('/valueBuddyDesc', async (req, res) => {
    const { suborgId } = req.query;
    const data = {};

    if (req.body) {
        Object.keys(req.body).forEach((key) => {
                    data[key] = req.body[key];
        });
    }
    console.log("body",req.body,data)
    try {
     
        let vbDesc = await db.ValueBuddyDesc.findOne({ where: { SuborganisationId: suborgId } });
        if (vbDesc) {
            // Update existing vbDesc
            vbDesc = await vbDesc.update(data);
       
         return res.json({ message: `Value Buddy Description updated successfully`,data: vbDesc });

        } else {
            // Create new asset
            vbDesc = await db.ValueBuddyDesc.create({ SuborganisationId:suborgId, ...data });
        
            return res.json({ message: `Value Buddy Description created successfully`,data: vbDesc });
        }
 
    } catch (error) {
       return  res.status(500).json({ error: error.message });
    }
});
module.exports = router;

