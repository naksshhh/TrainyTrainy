import pool from '../config/db';

// User queries
export const createUser = async (username: string, email: string, password: string) => {
  const query = `
    INSERT INTO users (username, email, password)
    VALUES (?, ?, ?)
  `;
  const values = [username, email, password];
  const [result] = await pool.execute(query, values);
  const [newUser] = await pool.execute('SELECT id, username, email, created_at FROM users WHERE id = ?', [(result as any).insertId]);
  return (newUser as any[])[0];
};

export const getUserByEmail = async (email: string) => {
  const query = 'SELECT * FROM users WHERE email = ?';
  const [rows] = await pool.execute(query, [email]);
  return (rows as any[])[0];
};

// Train queries
export const searchTrains = async (source: string, destination: string, date: string) => {
  const query = `
    SELECT t.*, 
           s1.name as source_station,
           s2.name as destination_station,
           sa.available_seats
    FROM trains t
    JOIN stations s1 ON t.source_station = s1.id
    JOIN stations s2 ON t.destination_station = s2.id
    LEFT JOIN seat_availability sa ON t.id = sa.train_id
    WHERE s1.name LIKE ? AND s2.name LIKE ?
    AND sa.journey_date = ?
  `;
  const values = [`%${source}%`, `%${destination}%`, date];
  const [rows] = await pool.execute(query, values);
  return rows;
};

// Booking queries
export const createBooking = async (
  pnrNumber: string,
  userId: number,
  trainId: number,
  journeyDate: Date,
  classType: string,
  totalFare: number
) => {
  const query = `
    INSERT INTO bookings (pnr_number, user_id, train_id, journey_date, class, total_fare)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [pnrNumber, userId, trainId, journeyDate, classType, totalFare];
  const [result] = await pool.execute(query, values);
  const [newBooking] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [(result as any).insertId]);
  return (newBooking as any[])[0];
};

export const addPassenger = async (
  bookingId: number,
  name: string,
  age: number,
  gender: string,
  seatNumber: string,
  status: string
) => {
  const query = `
    INSERT INTO passengers (booking_id, name, age, gender, seat_number, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [bookingId, name, age, gender, seatNumber, status];
  const [result] = await pool.execute(query, values);
  const [newPassenger] = await pool.execute('SELECT * FROM passengers WHERE id = ?', [(result as any).insertId]);
  return (newPassenger as any[])[0];
};

export const getBookingByPNR = async (pnrNumber: string) => {
  const query = `
    SELECT b.*, t.train_number, t.train_name,
           s1.name as source_station,
           s2.name as destination_station,
           p.*
    FROM bookings b
    JOIN trains t ON b.train_id = t.id
    JOIN stations s1 ON t.source_station = s1.id
    JOIN stations s2 ON t.destination_station = s2.id
    JOIN passengers p ON b.id = p.booking_id
    WHERE b.pnr_number = ?
  `;
  const [rows] = await pool.execute(query, [pnrNumber]);
  return rows;
};

export const getUserBookings = async (userId: number) => {
  const query = `
    SELECT b.*, t.train_number, t.train_name,
           s1.name as source_station,
           s2.name as destination_station,
           p.*
    FROM bookings b
    JOIN trains t ON b.train_id = t.id
    JOIN stations s1 ON t.source_station = s1.id
    JOIN stations s2 ON t.destination_station = s2.id
    JOIN passengers p ON b.id = p.booking_id
    WHERE b.user_id = ?
    ORDER BY b.journey_date DESC
  `;
  const [rows] = await pool.execute(query, [userId]);
  return rows;
};

export const updateBookingStatus = async (pnrNumber: string, status: string) => {
  const query = `
    UPDATE bookings
    SET status = ?
    WHERE pnr_number = ?
  `;
  const values = [status, pnrNumber];
  await pool.execute(query, values);
  const [updatedBooking] = await pool.execute('SELECT * FROM bookings WHERE pnr_number = ?', [pnrNumber]);
  return (updatedBooking as any[])[0];
};

// Seat availability queries
export const updateSeatAvailability = async (
  trainId: number,
  journeyDate: Date,
  classType: string,
  availableSeats: number
) => {
  const query = `
    INSERT INTO seat_availability (train_id, journey_date, class, available_seats)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE available_seats = ?
  `;
  const values = [trainId, journeyDate, classType, availableSeats, availableSeats];
  const [result] = await pool.execute(query, values);
  const [updatedAvailability] = await pool.execute(
    'SELECT * FROM seat_availability WHERE train_id = ? AND journey_date = ? AND class = ?',
    [trainId, journeyDate, classType]
  );
  return (updatedAvailability as any[])[0];
};

export const getSeatAvailability = async (
  trainId: number,
  journeyDate: Date,
  classType: string
) => {
  const query = `
    SELECT available_seats
    FROM seat_availability
    WHERE train_id = ? AND journey_date = ? AND class = ?
  `;
  const values = [trainId, journeyDate, classType];
  const [rows] = await pool.execute(query, values);
  return (rows as any[])[0]?.available_seats || 0;
}; 