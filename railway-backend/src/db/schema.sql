-- Create database
CREATE DATABASE IF NOT EXISTS railway_reservation;
USE railway_reservation;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Passenger (
    passenger_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    date_of_birth DATE NOT NULL,
    concession_category ENUM('Senior Citizen', 'Student', 'Disabled', 'None') DEFAULT 'None',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Station (
    station_id INT PRIMARY KEY AUTO_INCREMENT,
    station_code CHAR(5) UNIQUE NOT NULL,
    station_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL
);

CREATE TABLE Route (
    route_id INT PRIMARY KEY AUTO_INCREMENT,
    route_name VARCHAR(100) NOT NULL,
    source_station_id INT NOT NULL,
    destination_station_id INT NOT NULL,
    distance INT NOT NULL,
    FOREIGN KEY (source_station_id) REFERENCES Station(station_id),
    FOREIGN KEY (destination_station_id) REFERENCES Station(station_id)
);

CREATE TABLE Train (
    train_id INT PRIMARY KEY AUTO_INCREMENT,
    train_number VARCHAR(10) UNIQUE NOT NULL,
    train_name VARCHAR(100) NOT NULL,
    route_id INT NOT NULL,
    total_seats INT NOT NULL,
    FOREIGN KEY (route_id) REFERENCES Route(route_id)
);

CREATE TABLE TrainClass (
    class_id INT PRIMARY KEY AUTO_INCREMENT,
    train_id INT NOT NULL,
    class_type ENUM('Sleeper', 'AC 3-tier', 'AC 2-tier', 'First Class') NOT NULL,
    total_seats INT NOT NULL,
    fare_per_km DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (train_id) REFERENCES Train(train_id)
);

CREATE TABLE Schedule (
    schedule_id INT PRIMARY KEY AUTO_INCREMENT,
    train_id INT NOT NULL,
    station_id INT NOT NULL,
    arrival_time TIME,
    departure_time TIME,
    day_number INT NOT NULL,
    FOREIGN KEY (train_id) REFERENCES Train(train_id),
    FOREIGN KEY (station_id) REFERENCES Station(station_id)
);

CREATE TABLE Ticket (
    ticket_id INT PRIMARY KEY AUTO_INCREMENT,
    pnr_number VARCHAR(10) UNIQUE NOT NULL,
    passenger_id INT NOT NULL,
    train_id INT NOT NULL,
    class_id INT NOT NULL,
    source_station_id INT NOT NULL,
    destination_station_id INT NOT NULL,
    journey_date DATE NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Confirmed', 'Waitlist', 'RAC', 'Cancelled') NOT NULL,
    seat_number VARCHAR(10),
    fare DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (passenger_id) REFERENCES Passenger(passenger_id),
    FOREIGN KEY (train_id) REFERENCES Train(train_id),
    FOREIGN KEY (class_id) REFERENCES TrainClass(class_id),
    FOREIGN KEY (source_station_id) REFERENCES Station(station_id),
    FOREIGN KEY (destination_station_id) REFERENCES Station(station_id)
);

CREATE TABLE Payment (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_mode ENUM('Online', 'Counter') NOT NULL,
    payment_status ENUM('Success', 'Failed', 'Pending', 'Refunded') NOT NULL,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES Ticket(ticket_id)
);

CREATE TABLE Cancellation (
    cancellation_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    cancellation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refund_amount DECIMAL(10,2) NOT NULL,
    refund_status ENUM('Processed', 'Pending', 'Completed') NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES Ticket(ticket_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_pnr ON Ticket(pnr_number);
CREATE INDEX idx_journey_date ON Ticket(journey_date);
CREATE INDEX idx_train_date ON Ticket(train_id, journey_date);
CREATE INDEX idx_passenger_tickets ON Ticket(passenger_id);
CREATE INDEX idx_station_code ON Station(station_code);

-- Create stored procedures

-- Procedure to check seat availability
DELIMITER //
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
END //
DELIMITER ;

-- Procedure to book ticket
DROP PROCEDURE IF EXISTS book_ticket;
DELIMITER //

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
    DECLARE v_class_type VARCHAR(20);
    DECLARE v_next_number INT;

    -- Get class type
    SELECT class_type INTO v_class_type FROM TrainClass WHERE class_id = p_class_id;

    -- Check seat availability (Confirmed)
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

    IF v_available_seats > 0 THEN
        SET v_status = 'Confirmed';
        -- Get next seat number for Confirmed
        SELECT IFNULL(MAX(CAST(SUBSTRING_INDEX(seat_number, '-', -1) AS UNSIGNED)), 0) + 1 INTO v_next_number
        FROM Ticket
        WHERE train_id = p_train_id
          AND class_id = p_class_id
          AND journey_date = p_journey_date
          AND status = 'Confirmed';

        SET v_seat_number = CONCAT(
            CASE v_class_type
                WHEN 'Sleeper' THEN 'S'
                WHEN 'AC 2-tier' THEN 'A2'
                WHEN 'AC 3-tier' THEN 'A3'
                WHEN 'First Class' THEN 'F'
                ELSE 'X'
            END,
            '-',
            LPAD(v_next_number, 3, '0')
        );
    ELSE
        -- Check RAC availability
        SELECT (FLOOR(tc.total_seats * 0.1) - COALESCE(COUNT(t.ticket_id), 0)) INTO v_available_seats
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
            -- Get next seat number for RAC
            SELECT IFNULL(MAX(CAST(SUBSTRING(seat_number, 3) AS UNSIGNED)), 0) + 1 INTO v_next_number
            FROM Ticket
            WHERE train_id = p_train_id
              AND class_id = p_class_id
              AND journey_date = p_journey_date
              AND status = 'RAC';

            SET v_seat_number = CONCAT('R-', LPAD(v_next_number, 2, '0'));
        ELSE
            SET v_status = 'Waitlist';
            -- Get next seat number for Waitlist
            SELECT IFNULL(MAX(CAST(SUBSTRING(seat_number, 3) AS UNSIGNED)), 0) + 1 INTO v_next_number
            FROM Ticket
            WHERE train_id = p_train_id
              AND class_id = p_class_id
              AND journey_date = p_journey_date
              AND status = 'Waitlist';

            SET v_seat_number = CONCAT('W-', LPAD(v_next_number, 3, '0'));
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
END //

DELIMITER ;