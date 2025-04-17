import express from 'express';
import { searchTrains, getSeatAvailability, searchStations } from '../db/queries';

const router = express.Router();

// Station autocomplete
router.get('/stations', async (req: express.Request, res: express.Response) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== 'string' || query.length < 1) {
      return res.status(400).json([]);
    }
    const stations = await searchStations(query);
    res.json(stations);
  } catch (error) {
    console.error('Station autocomplete error:', error);
    res.status(500).json({ error: 'Error fetching stations' });
  }
});

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

    // Map backend snake_case fields to camelCase for frontend compatibility
    const mappedTrains = trains.map((train: any) => ({
      train_id: train.train_id, // Always include train_id for frontend use
      trainNumber: train.train_number, // Display trainNumber to users
      trainName: train.train_name,
      sourceStation: train.source_station,
      destinationStation: train.destination_station,
      departureTime: train.departure_time || '',
      arrivalTime: train.arrival_time || '',
      duration: train.duration || '',
      availableSeats: Array.isArray(train.class_availability)
        ? Object.fromEntries(
            train.class_availability.map((c: any) => [
              c.class_type,
              c.available_seats,
            ])
          )
        : {},
    }));

    res.json(mappedTrains);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Error searching trains' });
  }
});

// Check seat availability
router.get('/:id/availability', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { date, classType } = req.query;

    if (!id || !date || !classType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const availableSeats = await getSeatAvailability(
      parseInt(id),
      new Date(date as string),
      classType as string
    );

    res.json({ availableSeats });
  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({ error: 'Error checking seat availability' });
  }
});

export default router; 