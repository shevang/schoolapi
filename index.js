const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const dotenv = require('dotenv');
const haversine = require('haversine-distance'); 

dotenv.config();
const app = express();
app.use(bodyParser.json());


const db = mysql.createConnection({
    host: process.env.MYSQLHOST,        
    user: process.env.MYSQLUSER,        
    password: process.env.MYSQLPASSWORD, 
    database: process.env.MYSQLDATABASE, 
    port: process.env.MYSQLPORT          
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1);
      } else {
        console.log('Connected to MySQL Database');
      }
});


app.post('/addSchool', (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address || typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: 'Invalid input data' });
    }

    const sql = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, address, latitude, longitude], (err, result) => {
        if (err) throw err;
        res.status(201).json({ message: 'School added successfully', schoolId: result.insertId });
    });
});


app.get('/listSchools', (req, res) => {

    const userLat = parseFloat(req.query.latitude);
    const userLon = parseFloat(req.query.longitude);

    if (!userLat || !userLon) {
        return res.status(400).json({ error: 'Latitude and Longitude are required' });
    }

    const sql = 'SELECT * FROM schools';
    db.query(sql, (err, results) => {
        if (err) throw err;

        const sortedSchools = results.map(school => ({
            ...school,
            distance: haversine({ lat: userLat, lon: userLon }, { lat: school.latitude, lon: school.longitude })
        })).sort((a, b) => a.distance - b.distance);

        res.json(sortedSchools);
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
