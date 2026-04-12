import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Keep original filename as per user request
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
});

router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const inputFilePath = req.file.path;
    const pythonScriptPath = path.join(__dirname, '../scripts/cleaner.py');

    // Spawn Python process
    const pythonProcess = spawn('python', [pythonScriptPath, inputFilePath, req.file.originalname]);

    let dataString = '';
    let errorString = '';

    // Collect stdout from Python script
    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    // Collect stderr
    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
        try {
            if (code !== 0 || !dataString.trim()) {
                console.error("Python Error:", errorString);
                return res.status(500).json({ success: false, message: 'Data cleaning failed', error: errorString });
            }

            const result = JSON.parse(dataString);
            
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    rows: result.original_rows,
                    stats: result.stats,
                    downloadUrl: `/uploads/${result.output_file}`
                });
            } else {
                res.status(500).json({ success: false, message: result.error });
            }
        } catch (err) {
            console.error("Parse Error:", err);
            res.status(500).json({ success: false, message: 'Process output parsing failed' });
        }
    });
});

export default router;
