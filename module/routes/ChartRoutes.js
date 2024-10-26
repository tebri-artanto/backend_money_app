const express = require("express");
const router = new express.Router();
const chartController = require("../controllers/ChartController");
const auth = require("../middleware/requireAuth");


router.use(auth);

router.get("/user/:id/riwayat", chartController.getRiwayatByUserIdAndTimeframe);
router.get('/weekly-income-expense/:userId', chartController.getWeeklyIncomeExpenseChart);
router.get('/savings-total/:userId', chartController.totalTabungan);

router.get('/user/:userId/monthly-totals', chartController.getMonthlyTotals);
router.get('/user/:userId/next-month-prediction', chartController.getNextMonthPrediction);
router.get('/user/:userId/budget-analysis', chartController.getBudgetAnalysis);
router.get('/analyze-budget/:userId', chartController.analyzeBudgetUsage);
module.exports = router;