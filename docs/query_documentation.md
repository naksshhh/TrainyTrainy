# Railway Reservation System - Query Documentation

## Core Procedures

### 1. PNR Status Tracking
```sql
CALL get_pnr_status('PNR123456');
```
- **Purpose**: Retrieves complete ticket and journey details using PNR number
- **Parameters**: 
  - `p_pnr_number`: PNR number of the ticket
- **Returns**: Passenger details, train information, journey details, and current status

### 2. Train Schedule Lookup
```sql
CALL get_train_schedule('12951');
```
- **Purpose**: Gets the complete schedule of a train
- **Parameters**:
  - `p_train_number`: Train number
- **Returns**: List of stations with arrival/departure times and day numbers

### 3. Seat Availability Check
```sql
CALL check_available_seats('12951', '2024-04-01', 'AC 2-tier');
```
- **Purpose**: Checks seat availability for a specific train, date, and class
- **Parameters**:
  - `p_train_number`: Train number
  - `p_journey_date`: Date of journey
  - `p_class_type`: Class of travel
- **Returns**: Total seats, booked seats, and available seats

### 4. Train Passenger List
```sql
CALL list_train_passengers('12951', '2024-04-01');
```
- **Purpose**: Lists all passengers traveling on a specific train on a given date
- **Parameters**:
  - `p_train_number`: Train number
  - `p_journey_date`: Date of journey
- **Returns**: List of passengers with their details and seat numbers

### 5. Waitlist Management
```sql
CALL get_waitlisted_passengers('12951');
```
- **Purpose**: Retrieves all waitlisted passengers for a train
- **Parameters**:
  - `p_train_number`: Train number
- **Returns**: List of waitlisted passengers with their booking details

## Financial Procedures

### 6. Refund Calculation
```sql
CALL get_total_refund_amount('12951');
```
- **Purpose**: Calculates total refund amount for cancelled tickets
- **Parameters**:
  - `p_train_number`: Train number
- **Returns**: Total cancellations and refund amount

### 7. Revenue Analysis
```sql
CALL get_revenue_by_period('2024-01-01', '2024-12-31');
```
- **Purpose**: Analyzes revenue generated from ticket bookings
- **Parameters**:
  - `p_start_date`: Start date of the period
  - `p_end_date`: End date of the period
- **Returns**: Revenue breakdown by train and class

### 8. Cancellation Records
```sql
CALL get_cancellation_records('2024-01-01', '2024-12-31');
```
- **Purpose**: Retrieves detailed cancellation records
- **Parameters**:
  - `p_start_date`: Start date of the period
  - `p_end_date`: End date of the period
- **Returns**: List of cancelled tickets with refund details

## Analytics Procedures

### 9. Route Analysis
```sql
CALL get_busiest_routes();
```
- **Purpose**: Identifies the busiest routes based on passenger count
- **Parameters**: None
- **Returns**: Routes ranked by passenger count and revenue

### 10. Ticket Billing
```sql
CALL generate_itemized_bill('PNR123456');
```
- **Purpose**: Generates detailed bill for a ticket
- **Parameters**:
  - `p_pnr_number`: PNR number of the ticket
- **Returns**: Detailed fare breakdown including base fare, concessions, and taxes

## Booking Management

### 11. Ticket Booking
```sql
CALL book_ticket(1, 1, 2, 1, 2, '2024-04-01', @ticket_id);
```
- **Purpose**: Books a new ticket
- **Parameters**:
  - `p_passenger_id`: Passenger ID
  - `p_train_id`: Train ID
  - `p_class_id`: Class ID
  - `p_source_station_id`: Source station ID
  - `p_destination_station_id`: Destination station ID
  - `p_journey_date`: Journey date
- **Returns**: Generated ticket ID

### 12. Ticket Cancellation
```sql
CALL cancel_ticket(1, @refund_amount);
```
- **Purpose**: Cancels a ticket and calculates refund
- **Parameters**:
  - `p_ticket_id`: Ticket ID
- **Returns**: Calculated refund amount

## Usage Examples

### Checking Train Availability
```sql
-- Check seats in AC 2-tier for tomorrow
CALL check_available_seats('12951', CURDATE() + INTERVAL 1 DAY, 'AC 2-tier');
```

### Booking a Ticket
```sql
-- Book a ticket and get the ticket ID
SET @ticket_id = 0;
CALL book_ticket(1, 1, 2, 1, 2, '2024-04-01', @ticket_id);
SELECT @ticket_id as new_ticket_id;
```

### Cancelling a Ticket
```sql
-- Cancel a ticket and get refund amount
SET @refund = 0;
CALL cancel_ticket(1, @refund);
SELECT @refund as refund_amount;
```

### Revenue Report
```sql
-- Get monthly revenue report
CALL get_revenue_by_period(
    DATE_FORMAT(CURDATE(), '%Y-%m-01'),
    LAST_DAY(CURDATE())
); 