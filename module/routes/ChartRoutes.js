const express = require("express");
const router = new express.Router();
const chartController = require("../controllers/ChartController");
const auth = require("../middleware/requireAuth");

router.get("/getWeeklyChart/:userId", chartController.getWeeklyExpenseIncome);

module.exports = router;