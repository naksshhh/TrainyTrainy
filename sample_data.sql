USE railway_reservation;

-- First, clear any existing data (if needed)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Cancellation;
TRUNCATE TABLE Payment;
TRUNCATE TABLE Ticket;
TRUNCATE TABLE Schedule;
TRUNCATE TABLE TrainClass;
TRUNCATE TABLE Train;
TRUNCATE TABLE Route;
TRUNCATE TABLE Station;
TRUNCATE TABLE Passenger;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert sample stations
INSERT INTO Station (station_code, station_name, city, state) VALUES
('NDLS', 'New Delhi', 'New Delhi', 'Delhi'),
('MMCT', 'Mumbai Central', 'Mumbai', 'Maharashtra'),
('HWH', 'Howrah', 'Kolkata', 'West Bengal'),
('MAS', 'Chennai Central', 'Chennai', 'Tamil Nadu'),
('SBC', 'Bengaluru City', 'Bengaluru', 'Karnataka'),
('CSMT', 'Chhatrapati Shivaji Terminus', 'Mumbai', 'Maharashtra'),
('JP', 'Jaipur', 'Jaipur', 'Rajasthan'),
('ADI', 'Ahmedabad', 'Ahmedabad', 'Gujarat');

-- Insert sample routes
INSERT INTO Route (route_name, source_station_id, destination_station_id, distance) VALUES
('Delhi-Mumbai', 1, 2, 1384),
('Kolkata-Chennai', 3, 4, 1659),
('Bengaluru-Mumbai', 5, 6, 981),
('Delhi-Jaipur', 1, 7, 309),
('Mumbai-Ahmedabad', 2, 8, 491);

-- Insert sample trains
INSERT INTO Train (train_number, train_name, route_id, total_seats) VALUES
('12951', 'Rajdhani Express', 1, 800),
('12839', 'Chennai Mail', 2, 750),
('16527', 'Udyan Express', 3, 700),
('12015', 'Ajmer Shatabdi', 4, 600),
('19011', 'Gujarat Express', 5, 650);

-- Get the actual train IDs after insertion
SET @rajdhani_id = (SELECT train_id FROM Train WHERE train_number = '12951');
SET @chennai_mail_id = (SELECT train_id FROM Train WHERE train_number = '12839');
SET @udyan_id = (SELECT train_id FROM Train WHERE train_number = '16527');
SET @shatabdi_id = (SELECT train_id FROM Train WHERE train_number = '12015');
SET @gujarat_id = (SELECT train_id FROM Train WHERE train_number = '19011');

-- Insert train classes
INSERT INTO TrainClass (train_id, class_type, total_seats, fare_per_km) VALUES
(@rajdhani_id, 'First Class', 100, 3.50),
(@rajdhani_id, 'AC 2-tier', 200, 2.50),
(@rajdhani_id, 'AC 3-tier', 300, 2.00),
(@rajdhani_id, 'Sleeper', 200, 1.00),
(@chennai_mail_id, 'AC 2-tier', 150, 2.50),
(@chennai_mail_id, 'AC 3-tier', 300, 2.00),
(@chennai_mail_id, 'Sleeper', 300, 1.00),
(@udyan_id, 'AC 3-tier', 350, 2.00),
(@udyan_id, 'Sleeper', 350, 1.00),
(@shatabdi_id, 'AC 2-tier', 300, 2.50),
(@shatabdi_id, 'AC 3-tier', 300, 2.00),
(@gujarat_id, 'AC 3-tier', 325, 2.00),
(@gujarat_id, 'Sleeper', 325, 1.00);

-- Store class IDs for later use
SET @rajdhani_fc = (SELECT class_id FROM TrainClass WHERE train_id = @rajdhani_id AND class_type = 'First Class');
SET @rajdhani_2ac = (SELECT class_id FROM TrainClass WHERE train_id = @rajdhani_id AND class_type = 'AC 2-tier');
SET @chennai_2ac = (SELECT class_id FROM TrainClass WHERE train_id = @chennai_mail_id AND class_type = 'AC 2-tier');
SET @udyan_3ac = (SELECT class_id FROM TrainClass WHERE train_id = @udyan_id AND class_type = 'AC 3-tier');
SET @shatabdi_2ac = (SELECT class_id FROM TrainClass WHERE train_id = @shatabdi_id AND class_type = 'AC 2-tier');

-- Insert sample schedules
INSERT INTO Schedule (train_id, station_id, arrival_time, departure_time, day_number) VALUES
-- Rajdhani Express (Delhi to Mumbai)
(@rajdhani_id, 1, NULL, '16:00:00', 1),
(@rajdhani_id, 7, '19:30:00', '19:35:00', 1),
(@rajdhani_id, 8, '01:30:00', '01:35:00', 2),
(@rajdhani_id, 2, '08:00:00', NULL, 2),

-- Chennai Mail (Kolkata to Chennai)
(@chennai_mail_id, 3, NULL, '22:00:00', 1),
(@chennai_mail_id, 5, '12:00:00', '12:10:00', 2),
(@chennai_mail_id, 4, '23:00:00', NULL, 2);

-- Insert sample passengers
INSERT INTO Passenger (first_name, last_name, email, phone, date_of_birth, concession_category) VALUES
('Rahul', 'Kumar', 'rahul.kumar@email.com', '9876543210', '1990-05-15', 'None'),
('Priya', 'Singh', 'priya.singh@email.com', '9876543211', '1985-08-22', 'None'),
('Amit', 'Sharma', 'amit.sharma@email.com', '9876543212', '1955-03-10', 'Senior Citizen'),
('Sneha', 'Patel', 'sneha.patel@email.com', '9876543213', '2000-12-05', 'Student'),
('Raj', 'Malhotra', 'raj.malhotra@email.com', '9876543214', '1988-07-18', 'None');

-- Create temporary table to store ticket mappings
CREATE TEMPORARY TABLE IF NOT EXISTS temp_tickets (
    pnr_number VARCHAR(10),
    ticket_id INT
);

-- Insert sample tickets and store their IDs
INSERT INTO Ticket (pnr_number, passenger_id, train_id, class_id, source_station_id, destination_station_id, journey_date, status, fare)
SELECT 'PNR123456', 1, train_id, class_id, 1, 2, '2024-04-01', 'Confirmed', 3460.00
FROM Train t
JOIN TrainClass tc ON t.train_id = tc.train_id
WHERE t.train_number = '12951' AND tc.class_type = 'First Class';

INSERT INTO temp_tickets SELECT 'PNR123456', LAST_INSERT_ID();

INSERT INTO Ticket (pnr_number, passenger_id, train_id, class_id, source_station_id, destination_station_id, journey_date, status, fare)
SELECT 'PNR123457', 2, train_id, class_id, 3, 4, '2024-04-02', 'Confirmed', 4147.50
FROM Train t
JOIN TrainClass tc ON t.train_id = tc.train_id
WHERE t.train_number = '12839' AND tc.class_type = 'AC 2-tier';

INSERT INTO temp_tickets SELECT 'PNR123457', LAST_INSERT_ID();

INSERT INTO Ticket (pnr_number, passenger_id, train_id, class_id, source_station_id, destination_station_id, journey_date, status, fare)
SELECT 'PNR123458', 3, train_id, class_id, 5, 6, '2024-04-03', 'Confirmed', 1962.00
FROM Train t
JOIN TrainClass tc ON t.train_id = tc.train_id
WHERE t.train_number = '16527' AND tc.class_type = 'AC 3-tier';

INSERT INTO temp_tickets SELECT 'PNR123458', LAST_INSERT_ID();

INSERT INTO Ticket (pnr_number, passenger_id, train_id, class_id, source_station_id, destination_station_id, journey_date, status, fare)
SELECT 'PNR123459', 4, train_id, class_id, 1, 7, '2024-04-04', 'Waitlist', 772.50
FROM Train t
JOIN TrainClass tc ON t.train_id = tc.train_id
WHERE t.train_number = '12015' AND tc.class_type = 'AC 2-tier';

INSERT INTO temp_tickets SELECT 'PNR123459', LAST_INSERT_ID();

-- Insert sample payments using the ticket IDs from temp table
INSERT INTO Payment (ticket_id, amount, payment_mode, payment_status, transaction_id)
SELECT ticket_id, 3460.00, 'Online', 'Success', 'TXN123456'
FROM temp_tickets WHERE pnr_number = 'PNR123456';

INSERT INTO Payment (ticket_id, amount, payment_mode, payment_status, transaction_id)
SELECT ticket_id, 4147.50, 'Online', 'Success', 'TXN123457'
FROM temp_tickets WHERE pnr_number = 'PNR123457';

INSERT INTO Payment (ticket_id, amount, payment_mode, payment_status, transaction_id)
SELECT ticket_id, 1962.00, 'Counter', 'Success', 'TXN123458'
FROM temp_tickets WHERE pnr_number = 'PNR123458';

INSERT INTO Payment (ticket_id, amount, payment_mode, payment_status, transaction_id)
SELECT ticket_id, 772.50, 'Online', 'Success', 'TXN123459'
FROM temp_tickets WHERE pnr_number = 'PNR123459';

-- Insert sample cancellations
INSERT INTO Cancellation (ticket_id, refund_amount, refund_status)
SELECT ticket_id, 1471.50, 'Completed'
FROM temp_tickets WHERE pnr_number = 'PNR123458';

-- Clean up
DROP TEMPORARY TABLE IF EXISTS temp_tickets;