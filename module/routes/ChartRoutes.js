const express = require("express");
const router = new express.Router();
const chartController = require("../controllers/ChartController");
// const auth = require("../middleware/requireAuth");

// Weekly expense and income chart
router.get("/getWeeklyChart/:userId",  chartController.getWeeklyExpenseIncome);

// Get riwayat (transactions) by user ID and timeframe
router.get("/user/:id/riwayat",  chartController.getRiwayatByUserIdAndTimeframe);

// Get detailed breakdown (rincian) by user ID and timeframe
router.get('/user/:id/rincian',  chartController.getRincianByUserIdAndTimeframe);

module.exports = router;