import express from 'express';
import { searchTrains, getSeatAvailability } from '../db/queries';

const router = express.Router();

// Search trains
router.get('/search', async (req: express.Request, res: express.Response) => {
  try {
    const { source, destination, date } = req.query;

    if (!source || !destination || !date) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const trains = await searchTrains(
      source as string,
      destination as string,
      date as string
    );

    res.json(trains);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Error searching trains' });
  }
});

// Check seat availability
router.get('/availability', async (req: express.Request, res: express.Response) => {
  try {
    const { trainId, journeyDate, classType } = req.query;

    if (!trainId || !journeyDate || !classType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const availableSeats = await getSeatAvailability(
      parseInt(trainId as string),
      new Date(journeyDate as string),
      classType as string
    );

    res.json({ availableSeats });
  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({ error: 'Error checking seat availability' });
  }
});

export default router; 