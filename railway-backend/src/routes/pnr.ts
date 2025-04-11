import express from 'express';
import { getBookingByPNR } from '../db/queries';

const router = express.Router();

// Check PNR status
router.get('/:pnrNumber', async (req: express.Request, res: express.Response) => {
  try {
    const { pnrNumber } = req.params;

    if (!pnrNumber) {
      return res.status(400).json({ error: 'PNR number is required' });
    }

    const bookingDetails = await getBookingByPNR(pnrNumber);

    if (!bookingDetails || bookingDetails.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Group passengers by booking
    const booking = {
      ...bookingDetails[0],
      passengers: bookingDetails.map(detail => ({
        name: detail.name,
        age: detail.age,
        gender: detail.gender,
        seatNumber: detail.seat_number,
        status: detail.status
      }))
    };

    res.json(booking);
  } catch (error) {
    console.error('PNR status error:', error);
    res.status(500).json({ error: 'Error checking PNR status' });
  }
});

export default router; 