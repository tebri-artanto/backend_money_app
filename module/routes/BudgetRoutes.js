const express = require("express");
const router = new express.Router();
const budgetController = require("../controllers/BudgetController");
const auth = require("../middleware/requireAuth");

// router.use(auth);
router.get("/updateStatus", budgetController.updateBudgetStatus);
router.get("/updateSisaBudget", budgetController.updateSisaBudget);
router.post("/", budgetController.addBudget);
router.get("/", budgetController.getAllBudget);
router.get("/:id", budgetController.getBudgetById);
router.get("/user/:id", budgetController.getBudgetByUserId);
router.get("/user/:id/month", budgetController.getBudgetByUserIdAndMonth);
router.put("/:id", budgetController.updateBudget);
router.delete("/:id", budgetController.deleteBudget);

module.exports = router; 