import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all dashboards for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, dataset_id, updated_at FROM dashboards WHERE owner_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch dashboards error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboards' });
  }
});

// Get specific dashboard
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM dashboards WHERE id = $1 AND owner_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Dashboard not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// Create new dashboard
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, dataset_id, layout_json = [], visuals_json = [] } = req.body;
    const result = await query(
      `INSERT INTO dashboards (name, dataset_id, layout_json, visuals_json, owner_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, dataset_id, JSON.stringify(layout_json), JSON.stringify(visuals_json), req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create dashboard error:', error);
    res.status(500).json({ error: 'Failed to create dashboard' });
  }
});

// Update dashboard
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, layout_json, visuals_json } = req.body;
    const result = await query(
      `UPDATE dashboards 
       SET name = COALESCE($1, name), 
           layout_json = COALESCE($2, layout_json), 
           visuals_json = COALESCE($3, visuals_json),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND owner_id = $5 RETURNING *`,
      [name, layout_json ? JSON.stringify(layout_json) : null, visuals_json ? JSON.stringify(visuals_json) : null, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Dashboard not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update dashboard' });
  }
});

// Delete dashboard
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM dashboards WHERE id = $1 AND owner_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Dashboard not found' });
    res.json({ message: 'Dashboard deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete dashboard' });
  }
});

export default router;
