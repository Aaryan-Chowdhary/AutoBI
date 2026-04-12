import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Synchronize datasets from the uploads folder
router.get('/', (req, res) => {
    try {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            return res.status(200).json([]);
        }

        const files = fs.readdirSync(uploadDir);
        const datasets = [];

        files.forEach(file => {
            // Skip hidden files
            if (file.startsWith('.')) return;
            
            const filePath = path.join(uploadDir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.isFile()) {
                const ext = path.extname(file).toLowerCase();
                const allowedExtensions = ['.csv', '.xlsx', '.xls'];
                
                if (!allowedExtensions.includes(ext)) return;

                const isCleaned = file.startsWith('cleaned_');
                // Create a generic id safely
                const id = Buffer.from(file).toString('base64').substring(0, 10) + stats.mtimeMs;
                
                // Basic row count estimation for CSVs
                let rowCount = 0;
                if (ext === '.csv') {
                    try {
                        const content = fs.readFileSync(filePath, 'utf8');
                        rowCount = content.split('\n').filter(line => line.trim()).length - 1; // Subtract header
                        if (rowCount < 0) rowCount = 0;
                    } catch (e) {
                        console.warn(`Could not count rows for ${file}:`, e.message);
                    }
                }

                datasets.push({
                    id: `ds_${id}`,
                    name: file,
                    status: isCleaned ? 'cleaned' : 'needs_cleaning',
                    file_size_bytes: stats.size,
                    row_count: rowCount || null, // Could parse CSV lines here if performance isn't an issue
                    created_at: stats.birthtime.toISOString(), // Standardizing with frontend ISO date expectation
                    schema: null
                });
            }
        });

        // Sort newest first based on created_at
        datasets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        console.log(`[DATASET_GET] Found ${datasets.length} files in uploads.`);
        res.status(200).json(datasets);

    } catch (err) {
        console.error("Dataset Parsing Error:", err);
        res.status(500).json({ success: false, message: 'Failed to retrieve datasets' });
    }
});

export default router;
