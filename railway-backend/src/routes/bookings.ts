import express from 'express';
import { Request } from 'express';
import { createBooking, addPassenger, getUserBookings, updateBookingStatus } from '../db/queries';
import { pool } from '../db/init-db';

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
    const { trainId, journeyDate, classType, sourceStation, destinationStation, passenger, totalFare } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!trainId || !journeyDate || !classType || !sourceStation || !destinationStation || !passenger || !totalFare) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Generate 10-character PNR number
    const prefix = 'PNR';
    const randomNum = Math.floor(Math.random() * 9999999).toString().padStart(7, '0');
    const pnrNumber = prefix + randomNum;

    // Create passenger if not exists
    const { firstName, lastName, email, phone, dateOfBirth, concessionCategory = 'None' } = passenger;
    
    // First check if passenger exists
    const [existingPassenger] = await pool.execute(
      'SELECT passenger_id FROM Passenger WHERE email = ?',
      [email]
    );

    let passengerId;
    if ((existingPassenger as any[]).length === 0) {
      // Create new passenger
      const newPassenger = await addPassenger(
        firstName,
        lastName,
        email,
        phone,
        new Date(dateOfBirth),
        concessionCategory
      );
      passengerId = newPassenger.passenger_id;
    } else {
      passengerId = (existingPassenger as any[])[0].passenger_id;
    }

    // Create booking
    const booking = await createBooking(
      pnrNumber,
      passengerId, // Use passenger ID instead of user ID
      trainId,
      sourceStation,
      destinationStation,
      new Date(journeyDate),
      classType,
      totalFare
    );

    res.status(201).json({
      message: 'Booking created successfully',
      pnrNumber: booking.pnr_number,
      status: booking.status,
      seatNumber: booking.seat_number
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