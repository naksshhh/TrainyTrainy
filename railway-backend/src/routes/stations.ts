import express from 'express';
import db from '../config/db';

const router = express.Router();

// GET /api/stations?query=abc
router.get('/', async (req, res) => {
  const query = (req.query.query as string || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    // Adjust the SQL query & table/column names as per your schema
    const [rows] = await db.query(
      'SELECT station_code, station_name FROM Station WHERE station_name LIKE ? OR station_code LIKE ? LIMIT 10',
      [`%${query}%`, `%${query}%`]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching stations:', err);
    res.status(500).json({ error: 'Failed to fetch station suggestions' });
  }
});

export default router;
