# Indian Railway Ticket Reservation System

This is a database management system project for a railway ticket reservation system that allows passengers to book, modify, and cancel tickets while managing train schedules, seat availability, and payments.

## Features
- Passenger ticket booking
- Multiple travel classes (Sleeper, AC 3-tier, AC 2-tier, First Class)
- Seat availability and PNR status tracking
- Waitlist and RAC management
- Online and counter booking support
- Train schedule management
- Cancellation and refund processing
- Concession categories support

## Setup Instructions

1. Install MySQL Server and MySQL Workbench
2. Run the schema creation script:
   ```sql
   mysql -u your_username -p < schema.sql
   ```
3. Import sample data:
   ```sql
   mysql -u your_username -p < sample_data.sql
   ```

## Project Structure
- `schema.sql`: Database schema creation script
- `sample_data.sql`: Sample data population script
- `queries/`: Contains all SQL queries, procedures, and functions
- `docs/`: Contains ER diagram and documentation
- `data/`: Contains CSV files for data import

## Documentation
Refer to the following files for detailed documentation:
- ER Diagram: `er_diagram_sql_final.pdf`
- Schema Documentation: `docs/schema_documentation.pdf`
- Query Documentation: `docs/query_documentation.pdf` 
