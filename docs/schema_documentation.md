# Railway Reservation System - Schema Documentation

## Database Tables

### 1. Passenger
- **Description**: Stores information about registered passengers
- **Fields**:
  - `passenger_id` (INT, PK): Unique identifier for each passenger
  - `first_name` (VARCHAR(50)): Passenger's first name
  - `last_name` (VARCHAR(50)): Passenger's last name
  - `email` (VARCHAR(100)): Unique email address
  - `phone` (VARCHAR(15)): Contact number
  - `date_of_birth` (DATE): Date of birth
  - `concession_category` (ENUM): Category for fare concession
  - `created_at` (TIMESTAMP): Account creation timestamp

### 2. Station
- **Description**: Contains information about railway stations
- **Fields**:
  - `station_id` (INT, PK): Unique identifier for each station
  - `station_code` (CHAR(5)): Unique station code
  - `station_name` (VARCHAR(100)): Full name of the station
  - `city` (VARCHAR(50)): City where station is located
  - `state` (VARCHAR(50)): State where station is located

### 3. Route
- **Description**: Defines train routes between stations
- **Fields**:
  - `route_id` (INT, PK): Unique identifier for each route
  - `route_name` (VARCHAR(100)): Name of the route
  - `source_station_id` (INT, FK): Starting station
  - `destination_station_id` (INT, FK): End station
  - `distance` (INT): Total distance in kilometers

### 4. Train
- **Description**: Contains information about trains
- **Fields**:
  - `train_id` (INT, PK): Unique identifier for each train
  - `train_number` (VARCHAR(10)): Unique train number
  - `train_name` (VARCHAR(100)): Name of the train
  - `route_id` (INT, FK): Associated route
  - `total_seats` (INT): Total capacity of the train

### 5. TrainClass
- **Description**: Defines different classes available in trains
- **Fields**:
  - `class_id` (INT, PK): Unique identifier for each class
  - `train_id` (INT, FK): Associated train
  - `class_type` (ENUM): Type of class (Sleeper, AC 3-tier, etc.)
  - `total_seats` (INT): Number of seats in this class
  - `fare_per_km` (DECIMAL): Base fare per kilometer

### 6. Schedule
- **Description**: Stores train schedules
- **Fields**:
  - `schedule_id` (INT, PK): Unique identifier for each schedule entry
  - `train_id` (INT, FK): Associated train
  - `station_id` (INT, FK): Station in the route
  - `arrival_time` (TIME): Arrival time at the station
  - `departure_time` (TIME): Departure time from the station
  - `day_number` (INT): Day of journey (1 for first day, etc.)

### 7. Ticket
- **Description**: Records ticket bookings
- **Fields**:
  - `ticket_id` (INT, PK): Unique identifier for each ticket
  - `pnr_number` (VARCHAR(10)): Unique PNR number
  - `passenger_id` (INT, FK): Associated passenger
  - `train_id` (INT, FK): Associated train
  - `class_id` (INT, FK): Selected class
  - `source_station_id` (INT, FK): Boarding station
  - `destination_station_id` (INT, FK): Destination station
  - `journey_date` (DATE): Date of travel
  - `booking_date` (TIMESTAMP): Ticket booking timestamp
  - `status` (ENUM): Ticket status
  - `seat_number` (VARCHAR(10)): Allocated seat number
  - `fare` (DECIMAL): Total fare amount

### 8. Payment
- **Description**: Stores payment information
- **Fields**:
  - `payment_id` (INT, PK): Unique identifier for each payment
  - `ticket_id` (INT, FK): Associated ticket
  - `amount` (DECIMAL): Payment amount
  - `payment_mode` (ENUM): Mode of payment
  - `payment_status` (ENUM): Status of payment
  - `transaction_id` (VARCHAR(50)): Unique transaction reference
  - `payment_date` (TIMESTAMP): Payment timestamp

### 9. Cancellation
- **Description**: Records ticket cancellations
- **Fields**:
  - `cancellation_id` (INT, PK): Unique identifier for cancellation
  - `ticket_id` (INT, FK): Associated ticket
  - `cancellation_date` (TIMESTAMP): Cancellation timestamp
  - `refund_amount` (DECIMAL): Amount to be refunded
  - `refund_status` (ENUM): Status of refund

## Indexes
1. `idx_pnr`: Index on Ticket(pnr_number) for fast PNR lookups
2. `idx_journey_date`: Index on Ticket(journey_date) for date-based queries
3. `idx_train_date`: Composite index on Ticket(train_id, journey_date)
4. `idx_passenger_tickets`: Index on Ticket(passenger_id)
5. `idx_station_code`: Index on Station(station_code)

## Stored Procedures
1. `check_seat_availability`: Check available seats for a train class
2. `book_ticket`: Book a new ticket
3. `cancel_ticket`: Cancel a ticket and process refund

## Triggers
1. `after_ticket_insert`: Automatically assigns seat numbers after ticket confirmation

## Relationships
1. Route → Station (source and destination)
2. Train → Route
3. TrainClass → Train
4. Schedule → Train, Station
5. Ticket → Passenger, Train, TrainClass, Station (source and destination)
6. Payment → Ticket
7. Cancellation → Ticket 