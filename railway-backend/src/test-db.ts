// railway-backend/src/test-db.ts
import pool from './config/db';

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database!');
    connection.release();
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}

testConnection();