const express = require("express");
const router = new express.Router();
const chartController = require("../controllers/ChartController");
// const auth = require("../middleware/requireAuth");



router.get("/getWeeklyChart/:userId", chartController.getWeeklyExpenseIncome);
router.get("/user/:id/riwayat", chartController.getRiwayatByUserIdAndTimeframe);
router.get('/user/:id/rincian', chartController.getRincianByUserIdAndTimeframe);
router.get('/weekly-income-expense/:userId', chartController.getWeeklyIncomeExpenseChart);

module.exports = router;