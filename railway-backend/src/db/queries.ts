import pool from '../config/db';

// Station autocomplete
export const searchStations = async (query: string) => {
  const sql = `
    SELECT station_id, station_name, station_code
    FROM Station
    WHERE station_name LIKE ? OR station_code LIKE ?
    ORDER BY station_name ASC
    LIMIT 10
  `;
  const values = [`%${query}%`, `%${query}%`];
  const [rows] = await pool.execute(sql, values);
  return rows;
};

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
import { RowDataPacket } from 'mysql2';

export interface TrainRow extends RowDataPacket {
  train_id: number;
  train_number: string;
  train_name: string;
  route_id: number;
  total_seats: number;
  source_station: string;
  destination_station: string;
  class_availability?: { class_type: string; available_seats: number }[];
  departure_time?: string;
  arrival_time?: string;
  duration?: string;
}

export const searchTrains = async (
  source: string,
  destination: string,
  date: string
): Promise<TrainRow[]> => {
  const query = `
    SELECT DISTINCT
           t.train_id,
           t.train_number,
           t.train_name,
           t.route_id,
           t.total_seats,
           s1.station_name as source_station,
           s2.station_name as destination_station,
           JSON_ARRAYAGG(
             JSON_OBJECT(
               'class_type', tc.class_type,
               'class_id', tc.class_id,
               'total_seats', tc.total_seats,
               'fare_per_km', tc.fare_per_km,
               'available_seats', tc.total_seats - COALESCE(
                 (SELECT COUNT(*)
                  FROM Ticket tt
                  WHERE tt.train_id = t.train_id
                  AND tt.class_id = tc.class_id
                  AND tt.journey_date = ?
                  AND tt.status IN ('Confirmed', 'RAC')
                 ), 0
               )
             )
           ) as class_availability
    FROM Train t
    JOIN Route r ON t.route_id = r.route_id
    JOIN Station s1 ON r.source_station_id = s1.station_id
    JOIN Station s2 ON r.destination_station_id = s2.station_id
    JOIN TrainClass tc ON t.train_id = tc.train_id
    WHERE s1.station_name LIKE ? AND s2.station_name LIKE ?
    GROUP BY t.train_id
  `;
  const values = [date, `%${source}%`, `%${destination}%`];
  const [rows] = await pool.execute<TrainRow[]>(query, values);
  return rows;
};

// Booking queries
// Valid class types as defined in the database schema
const VALID_CLASS_TYPES = ['Sleeper', 'AC 3-tier', 'AC 2-tier', 'First Class'] as const;
type ClassType = typeof VALID_CLASS_TYPES[number];

// Helper function to format seat number to fit within VARCHAR(10)
const formatSeatNumber = (classType: string, number: number, status: 'Confirmed' | 'RAC' | 'Waitlist'): string => {
  let seatNum = '';
  switch (status) {
    case 'Confirmed':
      // Use abbreviations and hyphen: S-001, A2-001, A3-001, F-001
      let abbr = '';
      switch (classType) {
        case 'Sleeper': abbr = 'S'; break;
        case 'AC 2-tier': abbr = 'A2'; break;
        case 'AC 3-tier': abbr = 'A3'; break;
        case 'First Class': abbr = 'F'; break;
        default: abbr = 'X'; break;
      }
      seatNum = `${abbr}-${number.toString().padStart(3, '0')}`;
      break;
    case 'RAC':
      // Format: R-01, R-02, etc.
      seatNum = `R-${number.toString().padStart(2, '0')}`;
      break;
    case 'Waitlist':
      // Format: W-001, W-002, etc.
      seatNum = `W-${number.toString().padStart(3, '0')}`;
      break;
    default:
      seatNum = number.toString();
  }
  // Ensure seatNum is at most 10 characters
  return seatNum.slice(0, 10);
};

export const createBooking = async (
  pnrNumber: string,
  passengerId: number,
  trainId: number,
  sourceStation: string,
  destinationStation: string,
  journeyDate: Date,
  classType: string,
  totalFare: number
) => {
  // Validate class type
  if (!VALID_CLASS_TYPES.includes(classType as ClassType)) {
    throw new Error(`Invalid class type. Must be one of: ${VALID_CLASS_TYPES.join(', ')}`);
  }

  // Get class_id and check available classes
  const availableClasses = await getTrainClasses(trainId);
  if (availableClasses.length === 0) {
    throw new Error(`No classes found for train ID ${trainId}`);
  }

  const selectedClass = availableClasses.find((c: TrainClass) => c.class_type === classType);
  if (!selectedClass) {
    const availableTypes = availableClasses.map((c: TrainClass) => c.class_type).join(', ');
    throw new Error(`No ${classType} class available for this train. Available classes are: ${availableTypes}`);
  }

  // Get station IDs
  const [sourceStationRow] = await pool.execute(
    'SELECT station_id FROM Station WHERE station_name = ?',
    [sourceStation]
  );
  const sourceStationId = (sourceStationRow as any[])[0]?.station_id;

  const [destStationRow] = await pool.execute(
    'SELECT station_id FROM Station WHERE station_name = ?',
    [destinationStation]
  );
  const destStationId = (destStationRow as any[])[0]?.station_id;

  if (!sourceStationId || !destStationId) {
    throw new Error('Invalid station names');
  }

  // Get current seat number for the class
  const [seatCountResult] = await pool.execute(
    `SELECT COUNT(*) as count
     FROM Ticket
     WHERE train_id = ? AND class_id = ? AND journey_date = ? AND status = ?`,
    [trainId, selectedClass.class_id, journeyDate, 'Confirmed']
  );
  const confirmedCount = (seatCountResult as any[])[0]?.count || 0;

  // Check if seats are available
  const [racCountResult] = await pool.execute(
    `SELECT COUNT(*) as count
     FROM Ticket
     WHERE train_id = ? AND class_id = ? AND journey_date = ? AND status = ?`,
    [trainId, selectedClass.class_id, journeyDate, 'RAC']
  );
  const racCount = (racCountResult as any[])[0]?.count || 0;

  // Calculate booking status and seat number
  let status: 'Confirmed' | 'RAC' | 'Waitlist';
  let seatNumber: string;

  if (confirmedCount < selectedClass.total_seats) {
    status = 'Confirmed';
    seatNumber = formatSeatNumber(classType, confirmedCount + 1, status);
  } else if (racCount < Math.floor(selectedClass.total_seats * 0.1)) { // 10% RAC quota
    status = 'RAC';
    seatNumber = formatSeatNumber(classType, racCount + 1, status);
  } else {
    // Get waitlist number
    const [waitlistCountResult] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM Ticket
       WHERE train_id = ? AND class_id = ? AND journey_date = ? AND status = ?`,
      [trainId, selectedClass.class_id, journeyDate, 'Waitlist']
    );
    const waitlistCount = (waitlistCountResult as any[])[0]?.count || 0;
    status = 'Waitlist';
    seatNumber = formatSeatNumber(classType, waitlistCount + 1, status);
  }

  // Call stored procedure to book ticket
  const [result] = await pool.execute(
    'CALL book_ticket(?, ?, ?, ?, ?, ?, ?, ?, @ticket_id)',
    [passengerId, trainId, selectedClass.class_id, sourceStationId, destStationId, journeyDate, pnrNumber, totalFare]
  );

  // Get the generated ticket ID
  const [ticketRow] = await pool.execute('SELECT @ticket_id as ticket_id');
  const ticketId = (ticketRow as any[])[0]?.ticket_id;

  // Get ticket details
  const [ticketDetails] = await pool.execute(
    'SELECT pnr_number, status, seat_number FROM Ticket WHERE ticket_id = ?',
    [ticketId]
  );

  const ticket = (ticketDetails as any[])[0];
  // SAFEGUARD: Ensure seat_number is not too long
  if (ticket && ticket.seat_number && ticket.seat_number.length > 30) {
    throw new Error(`Booking failed: Generated seat number '${ticket.seat_number}' exceeds maximum allowed length (30 characters). Please contact support.`);
  }

  return ticket;
};

export const addPassenger = async (
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  dateOfBirth: Date,
  concessionCategory: string = 'None'
) => {
  const query = `
    INSERT INTO Passenger (
      first_name, last_name, email, phone,
      date_of_birth, concession_category
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [firstName, lastName, email, phone, dateOfBirth, concessionCategory];
  const [result] = await pool.execute(query, values);
  const [newPassenger] = await pool.execute('SELECT * FROM Passenger WHERE passenger_id = ?', [(result as any).insertId]);
  return (newPassenger as any[])[0];
};

export const getBookingByPNR = async (pnrNumber: string) => {
  const query = `
    SELECT t.ticket_id, t.pnr_number, t.journey_date, t.status, t.seat_number, t.fare,
           tr.train_number, tr.train_name,
           s1.station_name as source_station,
           s2.station_name as destination_station,
           p.*
    FROM Ticket t
    JOIN Train tr ON t.train_id = tr.train_id
    JOIN Route r ON tr.route_id = r.route_id
    JOIN Station s1 ON r.source_station_id = s1.station_id
    JOIN Station s2 ON r.destination_station_id = s2.station_id
    JOIN Passenger p ON t.passenger_id = p.passenger_id
    WHERE t.pnr_number = ?
  `;
  const [rows] = await pool.execute(query, [pnrNumber]);
  return rows;
};

export const getUserBookings = async (userId: number) => {
  const query = `
    SELECT t.ticket_id, t.pnr_number, t.journey_date, t.status, t.seat_number, t.fare,
           tr.train_number, tr.train_name,
           s1.station_name as source_station,
           s2.station_name as destination_station,
           p.*
    FROM Ticket t
    JOIN Train tr ON t.train_id = tr.train_id
    JOIN Route r ON tr.route_id = r.route_id
    JOIN Station s1 ON r.source_station_id = s1.station_id
    JOIN Station s2 ON r.destination_station_id = s2.station_id
    JOIN Passenger p ON t.passenger_id = p.passenger_id
    JOIN users u ON p.email = u.email
    WHERE u.id = ?
    ORDER BY t.journey_date DESC
  `;
  const [rows] = await pool.execute(query, [userId]);
  return rows;
};

export const updateBookingStatus = async (pnrNumber: string, status: string) => {
  const query = `
    UPDATE Ticket
    SET status = ?
    WHERE pnr_number = ?
  `;
  const values = [status, pnrNumber];
  await pool.execute(query, values);
  const [updatedBooking] = await pool.execute('SELECT * FROM Ticket WHERE pnr_number = ?', [pnrNumber]);
  return (updatedBooking as any[])[0];
};

interface TrainClass {
  class_id: number;
  class_type: string;
  total_seats: number;
  fare_per_km: number;
}

// Get available classes for a train
export const getTrainClasses = async (trainId: number): Promise<TrainClass[]> => {
  const query = `
    SELECT 
      tc.class_id,
      tc.class_type,
      tc.total_seats,
      tc.fare_per_km
    FROM TrainClass tc
    WHERE tc.train_id = ?
    ORDER BY tc.class_id
  `;
  const [rows] = await pool.execute(query, [trainId]);
  return rows as TrainClass[];
};

// Seat availability queries
export const updateSeatAvailability = async (
  trainId: number,
  journeyDate: Date,
  classType: string,
  availableSeats: number
) => {
  // In our schema, seat availability is calculated dynamically from the Ticket table
  // No need to store it separately
  const query = `
    SELECT tc.total_seats - COUNT(t.ticket_id) as available_seats
    FROM TrainClass tc
    LEFT JOIN Ticket t ON t.train_id = tc.train_id 
      AND t.class_id = tc.class_id
      AND t.journey_date = ?
      AND t.status IN ('Confirmed', 'RAC')
    WHERE tc.train_id = ? 
      AND tc.class_type = ?
    GROUP BY tc.class_id
  `;
  const values = [journeyDate, trainId, classType];
  const [rows] = await pool.execute(query, values);
  return (rows as any[])[0];
};

export const getSeatAvailability = async (
  trainId: number,
  journeyDate: Date,
  classType: string
) => {
  const query = `
    SELECT tc.total_seats - COUNT(t.ticket_id) as available_seats
    FROM TrainClass tc
    LEFT JOIN Ticket t ON t.train_id = tc.train_id 
      AND t.class_id = tc.class_id
      AND t.journey_date = ?
      AND t.status IN ('Confirmed', 'RAC')
    WHERE tc.train_id = ? 
      AND tc.class_type = ?
    GROUP BY tc.class_id
  `;
  const values = [journeyDate, trainId, classType];
  const [rows] = await pool.execute(query, values);
  return (rows as any[])[0]?.available_seats || 0;
}; 