-- 1. PNR status tracking for a given ticket
DELIMITER //
CREATE PROCEDURE get_pnr_status(IN p_pnr_number VARCHAR(10))
BEGIN
    SELECT 
        t.pnr_number,
        CONCAT(p.first_name, ' ', p.last_name) as passenger_name,
        tr.train_number,
        tr.train_name,
        s1.station_name as source_station,
        s2.station_name as destination_station,
        t.journey_date,
        tc.class_type,
        t.seat_number,
        t.status
    FROM Ticket t
    JOIN Passenger p ON t.passenger_id = p.passenger_id
    JOIN Train tr ON t.train_id = tr.train_id
    JOIN TrainClass tc ON t.class_id = tc.class_id
    JOIN Station s1 ON t.source_station_id = s1.station_id
    JOIN Station s2 ON t.destination_station_id = s2.station_id
    WHERE t.pnr_number = p_pnr_number;
END //
DELIMITER ;

-- 2. Train schedule lookup for a given train
DELIMITER //
CREATE PROCEDURE get_train_schedule(IN p_train_number VARCHAR(10))
BEGIN
    SELECT 
        t.train_number,
        t.train_name,
        s.station_name,
        sc.arrival_time,
        sc.departure_time,
        sc.day_number
    FROM Train t
    JOIN Schedule sc ON t.train_id = sc.train_id
    JOIN Station s ON sc.station_id = s.station_id
    WHERE t.train_number = p_train_number
    ORDER BY sc.day_number, COALESCE(sc.arrival_time, sc.departure_time);
END //
DELIMITER ;

-- 3. Available seats query for a specific train, date and class
DELIMITER //
CREATE PROCEDURE check_available_seats(
    IN p_train_number VARCHAR(10),
    IN p_journey_date DATE,
    IN p_class_type VARCHAR(20)
)
BEGIN
    SELECT 
        t.train_number,
        t.train_name,
        tc.class_type,
        tc.total_seats,
        COUNT(tk.ticket_id) as booked_seats,
        tc.total_seats - COUNT(tk.ticket_id) as available_seats
    FROM Train t
    JOIN TrainClass tc ON t.train_id = tc.train_id
    LEFT JOIN Ticket tk ON t.train_id = tk.train_id 
        AND tc.class_id = tk.class_id
        AND tk.journey_date = p_journey_date
        AND tk.status IN ('Confirmed', 'RAC')
    WHERE t.train_number = p_train_number
        AND tc.class_type = p_class_type
    GROUP BY t.train_id, tc.class_id;
END //
DELIMITER ;

-- 4. List all passengers traveling on a specific train on a given date
DELIMITER //
CREATE PROCEDURE list_train_passengers(
    IN p_train_number VARCHAR(10),
    IN p_journey_date DATE
)
BEGIN
    SELECT 
        t.pnr_number,
        CONCAT(p.first_name, ' ', p.last_name) as passenger_name,
        p.concession_category,
        tc.class_type,
        t.seat_number,
        s1.station_name as boarding_point,
        s2.station_name as destination_point,
        t.status
    FROM Ticket t
    JOIN Passenger p ON t.passenger_id = p.passenger_id
    JOIN Train tr ON t.train_id = tr.train_id
    JOIN TrainClass tc ON t.class_id = tc.class_id
    JOIN Station s1 ON t.source_station_id = s1.station_id
    JOIN Station s2 ON t.destination_station_id = s2.station_id
    WHERE tr.train_number = p_train_number
        AND t.journey_date = p_journey_date
    ORDER BY tc.class_type, t.seat_number;
END //
DELIMITER ;

-- 5. Retrieve all waitlisted passengers for a particular train
DELIMITER //
CREATE PROCEDURE get_waitlisted_passengers(IN p_train_number VARCHAR(10))
BEGIN
    SELECT 
        t.pnr_number,
        CONCAT(p.first_name, ' ', p.last_name) as passenger_name,
        tc.class_type,
        t.journey_date,
        s1.station_name as source_station,
        s2.station_name as destination_station
    FROM Ticket t
    JOIN Passenger p ON t.passenger_id = p.passenger_id
    JOIN Train tr ON t.train_id = tr.train_id
    JOIN TrainClass tc ON t.class_id = tc.class_id
    JOIN Station s1 ON t.source_station_id = s1.station_id
    JOIN Station s2 ON t.destination_station_id = s2.station_id
    WHERE tr.train_number = p_train_number
        AND t.status = 'Waitlist'
    ORDER BY t.booking_date;
END //
DELIMITER ;

-- 6. Find total refund amount for cancelled tickets
DELIMITER //
CREATE PROCEDURE get_total_refund_amount(IN p_train_number VARCHAR(10))
BEGIN
    SELECT 
        tr.train_number,
        tr.train_name,
        COUNT(c.cancellation_id) as total_cancellations,
        SUM(c.refund_amount) as total_refund_amount
    FROM Train tr
    JOIN Ticket t ON tr.train_id = t.train_id
    JOIN Cancellation c ON t.ticket_id = c.ticket_id
    WHERE tr.train_number = p_train_number
    GROUP BY tr.train_id;
END //
DELIMITER ;

-- 7. Total revenue generated from ticket bookings over a specified period
DELIMITER //
CREATE PROCEDURE get_revenue_by_period(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        tr.train_number,
        tr.train_name,
        tc.class_type,
        COUNT(t.ticket_id) as tickets_sold,
        SUM(t.fare) as total_revenue
    FROM Train tr
    JOIN Ticket t ON tr.train_id = t.train_id
    JOIN TrainClass tc ON t.class_id = tc.class_id
    WHERE t.booking_date BETWEEN p_start_date AND p_end_date
        AND t.status != 'Cancelled'
    GROUP BY tr.train_id, tc.class_id
    ORDER BY total_revenue DESC;
END //
DELIMITER ;

-- 8. Cancellation records with refund status
DELIMITER //
CREATE PROCEDURE get_cancellation_records(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        t.pnr_number,
        CONCAT(p.first_name, ' ', p.last_name) as passenger_name,
        tr.train_number,
        tr.train_name,
        t.journey_date,
        c.cancellation_date,
        t.fare as original_fare,
        c.refund_amount,
        c.refund_status
    FROM Cancellation c
    JOIN Ticket t ON c.ticket_id = t.ticket_id
    JOIN Passenger p ON t.passenger_id = p.passenger_id
    JOIN Train tr ON t.train_id = tr.train_id
    WHERE c.cancellation_date BETWEEN p_start_date AND p_end_date
    ORDER BY c.cancellation_date DESC;
END //
DELIMITER ;

-- 9. Find the busiest route based on passenger count
DELIMITER //
CREATE PROCEDURE get_busiest_routes()
BEGIN
    SELECT 
        r.route_name,
        s1.station_name as source_station,
        s2.station_name as destination_station,
        COUNT(t.ticket_id) as total_passengers,
        SUM(t.fare) as total_revenue
    FROM Route r
    JOIN Station s1 ON r.source_station_id = s1.station_id
    JOIN Station s2 ON r.destination_station_id = s2.station_id
    JOIN Train tr ON r.route_id = tr.route_id
    JOIN Ticket t ON tr.train_id = t.train_id
    WHERE t.status = 'Confirmed'
    GROUP BY r.route_id
    ORDER BY total_passengers DESC;
END //
DELIMITER ;

-- 10. Generate itemized bill for a ticket
DELIMITER //
CREATE PROCEDURE generate_itemized_bill(IN p_pnr_number VARCHAR(10))
BEGIN
    SELECT 
        t.pnr_number,
        CONCAT(p.first_name, ' ', p.last_name) as passenger_name,
        tr.train_number,
        tr.train_name,
        tc.class_type,
        s1.station_name as source_station,
        s2.station_name as destination_station,
        t.journey_date,
        r.distance as total_distance,
        tc.fare_per_km as base_fare_per_km,
        (r.distance * tc.fare_per_km) as base_fare,
        CASE 
            WHEN p.concession_category = 'Senior Citizen' THEN (r.distance * tc.fare_per_km) * 0.4
            WHEN p.concession_category = 'Student' THEN (r.distance * tc.fare_per_km) * 0.5
            WHEN p.concession_category = 'Disabled' THEN (r.distance * tc.fare_per_km) * 0.75
            ELSE 0
        END as concession_amount,
        t.fare as final_fare,
        py.payment_mode,
        py.transaction_id
    FROM Ticket t
    JOIN Passenger p ON t.passenger_id = p.passenger_id
    JOIN Train tr ON t.train_id = tr.train_id
    JOIN TrainClass tc ON t.class_id = tc.class_id
    JOIN Route r ON tr.route_id = r.route_id
    JOIN Station s1 ON t.source_station_id = s1.station_id
    JOIN Station s2 ON t.destination_station_id = s2.station_id
    JOIN Payment py ON t.ticket_id = py.ticket_id
    WHERE t.pnr_number = p_pnr_number;
END // 
DELIMITER ;
