-- 1. Find all trains between two stations on a given date
SELECT 
    t.train_number,
    t.train_name,
    s1.station_name as source_station,
    s2.station_name as destination_station,
    sch1.departure_time,
    sch2.arrival_time,
    DATEDIFF(sch2.arrival_time, sch1.departure_time) as journey_duration,
    tc.class_type,
    tc.fare_per_km * r.distance as fare
FROM Train t
JOIN Route r ON t.route_id = r.route_id
JOIN Station s1 ON r.source_station_id = s1.station_id
JOIN Station s2 ON r.destination_station_id = s2.station_id
JOIN Schedule sch1 ON t.train_id = sch1.train_id AND s1.station_id = sch1.station_id
JOIN Schedule sch2 ON t.train_id = sch2.train_id AND s2.station_id = sch2.station_id
JOIN TrainClass tc ON t.train_id = tc.train_id
WHERE s1.station_code = 'DEL' 
    AND s2.station_code = 'BOM'
    AND sch1.day_number = DAYOFWEEK('2024-03-20')
ORDER BY sch1.departure_time;

-- 2. Get seat availability for a specific train and class
SELECT 
    tc.class_type,
    tc.total_seats - COUNT(t.ticket_id) as available_seats,
    COUNT(t.ticket_id) as booked_seats
FROM TrainClass tc
LEFT JOIN Ticket t ON t.train_id = tc.train_id 
    AND t.class_id = tc.class_id
    AND t.journey_date = '2024-03-20'
    AND t.status IN ('Confirmed', 'RAC')
WHERE tc.train_id = 1
GROUP BY tc.class_id;

-- 3. Get booking history for a passenger
SELECT 
    t.pnr_number,
    t.journey_date,
    tr.train_number,
    tr.train_name,
    s1.station_name as source_station,
    s2.station_name as destination_station,
    tc.class_type,
    t.status,
    t.fare
FROM Ticket t
JOIN Train tr ON t.train_id = tr.train_id
JOIN Station s1 ON t.source_station_id = s1.station_id
JOIN Station s2 ON t.destination_station_id = s2.station_id
JOIN TrainClass tc ON t.class_id = tc.class_id
WHERE t.passenger_id = 1
ORDER BY t.journey_date DESC;

-- 4. Get PNR status
SELECT 
    t.pnr_number,
    t.journey_date,
    tr.train_number,
    tr.train_name,
    s1.station_name as source_station,
    s2.station_name as destination_station,
    tc.class_type,
    t.status,
    t.seat_number,
    t.fare
FROM Ticket t
JOIN Train tr ON t.train_id = tr.train_id
JOIN Station s1 ON t.source_station_id = s1.station_id
JOIN Station s2 ON t.destination_station_id = s2.station_id
JOIN TrainClass tc ON t.class_id = tc.class_id
WHERE t.pnr_number = 'PNR123456';

-- 5. Get cancellation history
SELECT 
    t.pnr_number,
    t.journey_date,
    tr.train_number,
    tr.train_name,
    c.cancellation_date,
    c.refund_amount,
    c.refund_status
FROM Cancellation c
JOIN Ticket t ON c.ticket_id = t.ticket_id
JOIN Train tr ON t.train_id = tr.train_id
WHERE t.passenger_id = 1
ORDER BY c.cancellation_date DESC;

-- 6. Get revenue report for a specific period
SELECT 
    DATE(t.booking_date) as booking_date,
    COUNT(t.ticket_id) as total_bookings,
    SUM(t.fare) as total_revenue,
    SUM(CASE WHEN t.status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
    SUM(CASE WHEN t.status = 'Cancelled' THEN c.refund_amount ELSE 0 END) as total_refunds
FROM Ticket t
LEFT JOIN Cancellation c ON t.ticket_id = c.ticket_id
WHERE t.booking_date BETWEEN '2024-03-01' AND '2024-03-31'
GROUP BY DATE(t.booking_date)
ORDER BY booking_date;

-- 7. Get popular routes
SELECT 
    s1.station_name as source_station,
    s2.station_name as destination_station,
    COUNT(t.ticket_id) as total_bookings,
    SUM(t.fare) as total_revenue
FROM Ticket t
JOIN Station s1 ON t.source_station_id = s1.station_id
JOIN Station s2 ON t.destination_station_id = s2.station_id
WHERE t.booking_date BETWEEN '2024-03-01' AND '2024-03-31'
GROUP BY t.source_station_id, t.destination_station_id
ORDER BY total_bookings DESC
LIMIT 5;

-- 8. Get passenger demographics
SELECT 
    CASE 
        WHEN TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) < 18 THEN 'Under 18'
        WHEN TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) BETWEEN 18 AND 30 THEN '18-30'
        WHEN TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) BETWEEN 31 AND 45 THEN '31-45'
        WHEN TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) BETWEEN 46 AND 60 THEN '46-60'
        ELSE 'Above 60'
    END as age_group,
    p.concession_category,
    COUNT(t.ticket_id) as total_bookings
FROM Passenger p
JOIN Ticket t ON p.passenger_id = t.passenger_id
WHERE t.booking_date BETWEEN '2024-03-01' AND '2024-03-31'
GROUP BY age_group, p.concession_category
ORDER BY age_group, p.concession_category;

-- 9. Get train occupancy rate
SELECT 
    tr.train_number,
    tr.train_name,
    tc.class_type,
    COUNT(t.ticket_id) as booked_seats,
    tc.total_seats,
    ROUND((COUNT(t.ticket_id) / tc.total_seats) * 100, 2) as occupancy_rate
FROM Train tr
JOIN TrainClass tc ON tr.train_id = tc.train_id
LEFT JOIN Ticket t ON t.train_id = tr.train_id 
    AND t.class_id = tc.class_id
    AND t.journey_date = '2024-03-20'
    AND t.status IN ('Confirmed', 'RAC')
GROUP BY tr.train_id, tc.class_id
ORDER BY tr.train_number, tc.class_type;

-- 10. Get station-wise passenger count
SELECT 
    s.station_name,
    s.city,
    s.state,
    COUNT(DISTINCT CASE WHEN t.source_station_id = s.station_id THEN t.passenger_id END) as departing_passengers,
    COUNT(DISTINCT CASE WHEN t.destination_station_id = s.station_id THEN t.passenger_id END) as arriving_passengers
FROM Station s
LEFT JOIN Ticket t ON s.station_id IN (t.source_station_id, t.destination_station_id)
    AND t.journey_date BETWEEN '2024-03-01' AND '2024-03-31'
GROUP BY s.station_id
ORDER BY (departing_passengers + arriving_passengers) DESC; 