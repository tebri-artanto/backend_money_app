const express = require("express");
const router = new express.Router();
const chartController = require("../controllers/ChartController");
const auth = require("../middleware/requireAuth");

router.get("/getWeeklyChart/:userId", chartController.getWeeklyExpenseIncome);
router.get("/user/:id/kategori", chartController.getRiwayatByUserIdAndTimeframe);
router.get('/user/:id/rincian-pengeluaran', chartController.getRincianPengeluaranByUserIdAndTimeframe);


module.exports = router;