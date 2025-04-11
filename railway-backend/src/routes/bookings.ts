import express from 'express';
import { Request } from 'express';
import { createBooking, addPassenger, getUserBookings, updateBookingStatus } from '../db/queries';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

const router = express.Router();

// Create booking
router.post('/', async (req: AuthRequest, res: express.Response) => {
  try {
    const { trainId, journeyDate, classType, passengers, totalFare } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!trainId || !journeyDate || !classType || !passengers || !totalFare) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Generate PNR number (you might want to implement a more sophisticated method)
    const pnrNumber = Math.random().toString(36).substring(2, 12).toUpperCase();

    // Create booking
    const booking = await createBooking(
      pnrNumber,
      userId,
      trainId,
      new Date(journeyDate),
      classType,
      totalFare
    );

    // Add passengers
    for (const passenger of passengers) {
      await addPassenger(
        booking.id,
        passenger.name,
        passenger.age,
        passenger.gender,
        passenger.seatNumber,
        passenger.status
      );
    }

    res.status(201).json({
      message: 'Booking created successfully',
      pnrNumber: booking.pnr_number
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Error creating booking' });
  }
});

// Get user's bookings
router.get('/my-bookings', async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const bookings = await getUserBookings(userId);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Error fetching bookings' });
  }
});

// Cancel booking
router.post('/cancel/:pnrNumber', async (req: AuthRequest, res: express.Response) => {
  try {
    const { pnrNumber } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updatedBooking = await updateBookingStatus(pnrNumber, 'Cancelled');
    res.json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Cancellation error:', error);
    res.status(500).json({ error: 'Error cancelling booking' });
  }
});

export default router; 