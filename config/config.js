const dotenv = require('dotenv');
const mysql = require('mysql2');

// Load environment variables from .env file
dotenv.config();

// Create a MySQL pool for better connection management
const conn = mysql.createPool({
  host: process.env.DB_HOST ,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_NAME ,
  waitForConnections: true, // Enable waiting for connections if all are in use
  connectionLimit: 10, // Adjust the maximum number of connections
  queueLimit: 0, // No limit on the number of queued connections
});

// Test the connection pool
conn.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Database connected successfully!');
  connection.release(); // Release the connection back to the pool
});

module.exports = conn;
