const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');


const userRoutes = require('./module/routes/UserRoutes');
const riwayatRoutes = require('./module/routes/RiwayatRoutes');
const kategoriRoutes = require('./module/routes/KategoriRoutes');
const asalUangRoutes = require('./module/routes/AsalUangRoutes');
const analisisKeuanganRoutes = require('./module/routes/AnalisisKeuanganRoutes');
const anggaranRoutes = require('./module/routes/AnggaranRoutes');
const chartRoutes = require('./module/routes/ChartRoutes');
const bulanRoutes = require('./module/routes/BulanRoutes');

const app = express();

require('dotenv').config();
// Enable CORS
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.use('/auth', userRoutes);
app.use('/riwayat', riwayatRoutes);
app.use('/kategori', kategoriRoutes);
app.use('/asalUang', asalUangRoutes);
app.use('/analisis', analisisKeuanganRoutes);
app.use('/anggaran', anggaranRoutes);
app.use('/chart', chartRoutes);
app.use('/bulan', bulanRoutes);

// Define routes
app.get("/", (req, res) => {
    console.log("Response success")
    res.send("Response Success!!!")
    res.status(200)
});
//
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log("Server is up and listening on " + PORT);
});
