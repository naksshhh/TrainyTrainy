USE railway_reservation;

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

-- Insert train classes
INSERT INTO TrainClass (train_id, class_type, total_seats, fare_per_km) VALUES
(1, 'First Class', 100, 3.50),
(1, 'AC 2-tier', 200, 2.50),
(1, 'AC 3-tier', 300, 2.00),
(1, 'Sleeper', 200, 1.00),
(2, 'AC 2-tier', 150, 2.50),
(2, 'AC 3-tier', 300, 2.00),
(2, 'Sleeper', 300, 1.00),
(3, 'AC 3-tier', 350, 2.00),
(3, 'Sleeper', 350, 1.00),
(4, 'AC 2-tier', 300, 2.50),
(4, 'AC 3-tier', 300, 2.00),
(5, 'AC 3-tier', 325, 2.00),
(5, 'Sleeper', 325, 1.00);

-- Insert sample schedules
INSERT INTO Schedule (train_id, station_id, arrival_time, departure_time, day_number) VALUES
-- Rajdhani Express (Delhi to Mumbai)
(1, 1, NULL, '16:00:00', 1),
(1, 7, '19:30:00', '19:35:00', 1),
(1, 8, '01:30:00', '01:35:00', 2),
(1, 2, '08:00:00', NULL, 2),

-- Chennai Mail (Kolkata to Chennai)
(2, 3, NULL, '22:00:00', 1),
(2, 5, '12:00:00', '12:10:00', 2),
(2, 4, '23:00:00', NULL, 2);

-- Insert sample passengers
INSERT INTO Passenger (first_name, last_name, email, phone, date_of_birth, concession_category) VALUES
('Rahul', 'Kumar', 'rahul.kumar@email.com', '9876543210', '1990-05-15', 'None'),
('Priya', 'Singh', 'priya.singh@email.com', '9876543211', '1985-08-22', 'None'),
('Amit', 'Sharma', 'amit.sharma@email.com', '9876543212', '1955-03-10', 'Senior Citizen'),
('Sneha', 'Patel', 'sneha.patel@email.com', '9876543213', '2000-12-05', 'Student'),
('Raj', 'Malhotra', 'raj.malhotra@email.com', '9876543214', '1988-07-18', 'None');

-- Insert sample tickets
INSERT INTO Ticket (pnr_number, passenger_id, train_id, class_id, source_station_id, destination_station_id, journey_date, status, fare) VALUES
('PNR123456', 1, 1, 2, 1, 2, '2024-04-01', 'Confirmed', 3460.00),
('PNR123457', 2, 2, 5, 3, 4, '2024-04-02', 'Confirmed', 4147.50),
('PNR123458', 3, 3, 8, 5, 6, '2024-04-03', 'Confirmed', 1962.00),
('PNR123459', 4, 4, 10, 1, 7, '2024-04-04', 'Waitlist', 772.50),
('PNR123460', 5, 5, 12, 2, 8, '2024-04-05', 'Confirmed', 982.00);

-- Insert sample payments
INSERT INTO Payment (ticket_id, amount, payment_mode, payment_status, transaction_id) VALUES
(1, 3460.00, 'Online', 'Success', 'TXN123456'),
(2, 4147.50, 'Online', 'Success', 'TXN123457'),
(3, 1962.00, 'Counter', 'Success', 'TXN123458'),
(4, 772.50, 'Online', 'Success', 'TXN123459'),
(5, 982.00, 'Counter', 'Success', 'TXN123460');

-- Insert sample cancellations
INSERT INTO Cancellation (ticket_id, refund_amount, refund_status) VALUES
(3, 1471.50, 'Completed'); 