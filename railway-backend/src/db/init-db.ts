import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'railway_reservation',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const initializeDatabase = async () => {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'railway_reservation',
      multipleStatements: true
    });

    // Drop existing procedures and triggers
    await connection.query(`
      DROP PROCEDURE IF EXISTS check_seat_availability;
      DROP PROCEDURE IF EXISTS book_ticket;
      DROP PROCEDURE IF EXISTS cancel_ticket;
      DROP TRIGGER IF EXISTS after_ticket_insert;
    `);

    // Create check_seat_availability procedure
    await connection.query(`
      CREATE PROCEDURE check_seat_availability(
        IN p_train_id INT,
        IN p_class_id INT,
        IN p_journey_date DATE
      )
      BEGIN
        SELECT 
          tc.total_seats - COUNT(t.ticket_id) as available_seats
        FROM TrainClass tc
        LEFT JOIN Ticket t ON t.train_id = tc.train_id 
          AND t.class_id = tc.class_id
          AND t.journey_date = p_journey_date
          AND t.status IN ('Confirmed', 'RAC')
        WHERE tc.train_id = p_train_id 
          AND tc.class_id = p_class_id
        GROUP BY tc.class_id;
      END
    `);

    // Create book_ticket procedure
    await connection.query(`
      CREATE PROCEDURE book_ticket(
        IN p_passenger_id INT,
        IN p_train_id INT,
        IN p_class_id INT,
        IN p_source_station_id INT,
        IN p_destination_station_id INT,
        IN p_journey_date DATE,
        IN p_pnr_number VARCHAR(10),
        IN p_fare DECIMAL(10,2),
        OUT p_ticket_id INT
      )
      BEGIN
        DECLARE v_available_seats INT;
        DECLARE v_status VARCHAR(10);
        DECLARE v_seat_number VARCHAR(10);

        -- Check seat availability
        SELECT 
          (tc.total_seats - COALESCE(COUNT(t.ticket_id), 0)) INTO v_available_seats
        FROM TrainClass tc
        LEFT JOIN Ticket t ON t.train_id = tc.train_id
          AND t.class_id = tc.class_id
          AND t.journey_date = p_journey_date
          AND t.status IN ('Confirmed', 'RAC')
        WHERE tc.train_id = p_train_id
          AND tc.class_id = p_class_id
        GROUP BY tc.class_id;

        -- Determine booking status
        IF v_available_seats > 0 THEN
          SET v_status = 'Confirmed';
          -- Get next seat number
          SELECT IFNULL(MAX(CAST(SUBSTRING_INDEX(seat_number, '-', -1) AS SIGNED)), 0) + 1 INTO v_seat_number
          FROM Ticket
          WHERE train_id = p_train_id
          AND class_id = p_class_id
          AND journey_date = p_journey_date
          AND status = 'Confirmed';
          
          SET v_seat_number = CONCAT(
            (SELECT class_type FROM TrainClass WHERE class_id = p_class_id),
            '-',
            LPAD(v_seat_number, 3, '0')
          );
        ELSE
          -- Check RAC availability
          SELECT 
            (FLOOR(tc.total_seats * 0.1) - COALESCE(COUNT(t.ticket_id), 0)) INTO v_available_seats
          FROM TrainClass tc
          LEFT JOIN Ticket t ON t.train_id = tc.train_id
            AND t.class_id = tc.class_id
            AND t.journey_date = p_journey_date
            AND t.status = 'RAC'
          WHERE tc.train_id = p_train_id
            AND tc.class_id = p_class_id
          GROUP BY tc.class_id;

          IF v_available_seats > 0 THEN
            SET v_status = 'RAC';
            -- Get next RAC number
            SELECT IFNULL(MAX(CAST(SUBSTRING(seat_number, 5) AS SIGNED)), 0) + 1 INTO v_seat_number
            FROM Ticket
            WHERE train_id = p_train_id
            AND class_id = p_class_id
            AND journey_date = p_journey_date
            AND status = 'RAC';
            SET v_seat_number = CONCAT('RAC/', LPAD(v_seat_number, 2, '0'));
          ELSE
            SET v_status = 'Waitlist';
            -- Get next waitlist number
            SELECT IFNULL(MAX(CAST(SUBSTRING(seat_number, 4) AS SIGNED)), 0) + 1 INTO v_seat_number
            FROM Ticket
            WHERE train_id = p_train_id
            AND class_id = p_class_id
            AND journey_date = p_journey_date
            AND status = 'Waitlist';
            SET v_seat_number = CONCAT('WL/', LPAD(v_seat_number, 3, '0'));
          END IF;
        END IF;

        -- Insert ticket
        INSERT INTO Ticket (
          pnr_number, passenger_id, train_id, class_id,
          source_station_id, destination_station_id,
          journey_date, status, seat_number, fare
        ) VALUES (
          p_pnr_number, p_passenger_id, p_train_id, p_class_id,
          p_source_station_id, p_destination_station_id,
          p_journey_date, v_status, v_seat_number, p_fare
        );

        SET p_ticket_id = LAST_INSERT_ID();
      END
    `);

    // Create cancel_ticket procedure
    await connection.query(`
      CREATE PROCEDURE cancel_ticket(
        IN p_ticket_id INT,
        OUT p_refund_amount DECIMAL(10,2)
      )
      BEGIN
        DECLARE v_journey_date DATE;
        DECLARE v_fare DECIMAL(10,2);
        
        -- Get ticket details
        SELECT journey_date, fare 
        INTO v_journey_date, v_fare
        FROM Ticket 
        WHERE ticket_id = p_ticket_id;
        
        -- Calculate refund amount based on cancellation policy
        IF DATEDIFF(v_journey_date, CURDATE()) > 7 THEN
          SET p_refund_amount = v_fare * 0.75; -- 75% refund if cancelled more than 7 days before
        ELSEIF DATEDIFF(v_journey_date, CURDATE()) > 3 THEN
          SET p_refund_amount = v_fare * 0.50; -- 50% refund if cancelled between 3-7 days
        ELSE
          SET p_refund_amount = v_fare * 0.25; -- 25% refund if cancelled less than 3 days before
        END IF;
        
        -- Update ticket status
        UPDATE Ticket 
        SET status = 'Cancelled'
        WHERE ticket_id = p_ticket_id;
        
        -- Insert cancellation record
        INSERT INTO Cancellation (
          ticket_id, refund_amount, refund_status
        ) VALUES (
          p_ticket_id, p_refund_amount, 'Processed'
        );
      END
    `);

    // Create after_ticket_insert trigger
    await connection.query(`
      CREATE TRIGGER after_ticket_insert
      AFTER INSERT ON Ticket
      FOR EACH ROW
      BEGIN
        -- Update seat number if status is Confirmed
        IF NEW.status = 'Confirmed' THEN
          UPDATE Ticket 
          SET seat_number = CONCAT(
            (SELECT class_type FROM TrainClass WHERE class_id = NEW.class_id),
            '-',
            LPAD((SELECT COUNT(*) FROM Ticket 
                  WHERE train_id = NEW.train_id 
                  AND class_id = NEW.class_id 
                  AND journey_date = NEW.journey_date
                  AND status = 'Confirmed'), 3, '0')
          )
          WHERE ticket_id = NEW.ticket_id;
        END IF;
      END
    `);

    console.log('Stored procedures updated successfully');
  } catch (error) {
    console.error('Error updating stored procedures:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

initializeDatabase();