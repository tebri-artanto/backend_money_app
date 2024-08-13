// routes/analisisKeuanganRoutes.js
const express = require("express");
const router = new express.Router();
const analisisController = require("../controllers/AnalisisKeuanganController");
const auth = require("../middleware/requireAuth");

// router.use(auth);
router.get("/predict/:id", analisisController.predictNextMonthFinances);
router.get("/bulan/:bulan/tahun/:tahun/userId/:userId", analisisController.predictNextMonthFinances);

module.exports = router;