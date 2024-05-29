const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');


const userRoutes = require('./module/routes/UserRoutes');
const riwayatRoutes = require('./module/routes/RiwayatRoutes');
const kategoriRoutes = require('./module/routes/KategoriRoutes');
const asalUangRoutes = require('./module/routes/AsalUangRoutes');
const app = express();

// dotenv.config();
// require("./module/database/mongodb");

// Enable CORS
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.use('/auth', userRoutes);
app.use('/riwayat', riwayatRoutes);
app.use('/kategori', kategoriRoutes);
app.use('/asalUang', asalUangRoutes);

// Define routes
app.get("/", (req, res) => {
    console.log("Response success")
    res.send("Response Success!!!")
    res.status(200)
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log("Server is up and listening on " + PORT);
});
