import express from 'express';
import { getBookingByPNR } from '../db/queries';

const router = express.Router();

// Check PNR status
// Define a type for booking detail (adjust fields as per your DB schema)
type BookingDetail = {
  name: string;
  age: number;
  gender: string;
  seat_number: string;
  status: string;
  // Add other fields as needed
  [key: string]: any;
};

router.get('/:pnrNumber', async (req: express.Request, res: express.Response) => {
  try {
    const { pnrNumber } = req.params;

    if (!pnrNumber) {
      return res.status(400).json({ error: 'PNR number is required' });
    }

    const bookingDetails = await getBookingByPNR(pnrNumber);

    if (!Array.isArray(bookingDetails) || bookingDetails.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Group passengers by booking
    const details = bookingDetails as BookingDetail[];
// Exclude passenger-specific fields from booking-level info
const { name, age, gender, seat_number, status, ...bookingInfo } = details[0];

const booking = {
  ...bookingInfo,
  passengers: details.map((detail) => ({
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