import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const initializeDatabase = async () => {
  try {
    // Create connection without database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .filter(statement => statement.trim());

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }

    console.log('Database initialized successfully');
    await connection.end();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initializeDatabase(); 