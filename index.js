const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const haversine = require('haversine-distance'); 

dotenv.config();
const app = express();
app.use(bodyParser.json());


const pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQLPORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('Database name is shevang--:', process.env.MYSQLDATABASE);
console.log(process.env.MYSQLHOST);
console.log(process.env.MYSQLUSER);
console.log(process.env.MYSQL_DATABASE);
console.log(process.env.MYSQLPORT);

pool.query('SELECT DATABASE()', (err, results) => {
    if (err) {
        console.error('Error verifying database selection:', err);
    } else {
        console.log('Currently selected database:', results[0]['DATABASE()']);
    }
});



pool.query(`
  CREATE TABLE IF NOT EXISTS schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL
  );
`, (err) => {
    if (err) {
        console.error('Error ensuring table:', err);
    } else {
        console.log('Table "schools" ensured to exist.');
    }
});

// POST endpoint to add a school
app.post('/addSchool', (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address || typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: 'Invalid input data' });
    }

    const sql = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    pool.query(sql, [name, address, latitude, longitude], (err, result) => {
        if (err) {
            console.error('Error inserting school:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'School added successfully', schoolId: result.insertId });
    });
});

// GET endpoint to list schools sorted by distance
app.get('/listSchools', (req, res) => {
    const userLat = parseFloat(req.query.latitude);
    const userLon = parseFloat(req.query.longitude);

    if (!userLat || !userLon) {
        return res.status(400).json({ error: 'Latitude and Longitude are required' });
    }

    const sql = 'SELECT * FROM schools';
    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching schools:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        const sortedSchools = results.map(school => ({
            ...school,
            distance: haversine({ lat: userLat, lon: userLon }, { lat: school.latitude, lon: school.longitude })
        })).sort((a, b) => a.distance - b.distance);

        res.json(sortedSchools);
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
