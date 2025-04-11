-- Create database
CREATE DATABASE IF NOT EXISTS railway_reservation;
USE railway_reservation;

-- Create tables
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
DELIMITER //
CREATE PROCEDURE book_ticket(
    IN p_passenger_id INT,
    IN p_train_id INT,
    IN p_class_id INT,
    IN p_source_station_id INT,
    IN p_destination_station_id INT,
    IN p_journey_date DATE,
    OUT p_ticket_id INT
)
BEGIN
    DECLARE v_fare DECIMAL(10,2);
    DECLARE v_pnr VARCHAR(10);
    DECLARE v_available_seats INT;
    
    -- Calculate fare
    SELECT (r.distance * tc.fare_per_km) INTO v_fare
    FROM Train t
    JOIN Route r ON t.route_id = r.route_id
    JOIN TrainClass tc ON t.train_id = tc.train_id
    WHERE t.train_id = p_train_id AND tc.class_id = p_class_id;
    
    -- Generate PNR
    SET v_pnr = CONCAT('PNR', LPAD(FLOOR(RAND() * 1000000), 6, '0'));
    
    -- Check seat availability
    CALL check_seat_availability(p_train_id, p_class_id, p_journey_date);
    
    -- Insert ticket
    INSERT INTO Ticket (
        pnr_number, passenger_id, train_id, class_id,
        source_station_id, destination_station_id,
        journey_date, status, fare
    ) VALUES (
        v_pnr, p_passenger_id, p_train_id, p_class_id,
        p_source_station_id, p_destination_station_id,
        p_journey_date, 'Confirmed', v_fare
    );
    
    SET p_ticket_id = LAST_INSERT_ID();
END //
DELIMITER ;

-- Procedure to cancel ticket
DELIMITER //
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
END //
DELIMITER ;

-- Create triggers

-- Trigger to update seat availability after ticket booking
DELIMITER //
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
END //
DELIMITER ; 