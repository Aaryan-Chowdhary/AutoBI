import { query } from './db.js';

const initDb = async () => {
    console.log('--- Database Initialization Started ---');
    try {
        // Create dashboards table
        await query(`
            CREATE TABLE IF NOT EXISTS dashboards (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                dataset_id VARCHAR(255),
                layout_json JSONB DEFAULT '[]',
                visuals_json JSONB DEFAULT '[]',
                owner_id INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Dashboards table verified/created.');

        // Optional: Create datasets table if you want to store dataset metadata in DB in the future
        // For now, the app is file-based, but we could add it here if needed.

        console.log('--- Database Initialization Successfully Completed ---');
    } catch (error) {
        console.error('❌ Database Initialization Failed:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
};

initDb();
