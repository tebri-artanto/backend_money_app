const express = require("express");
const router = new express.Router();
const budgetController = require("../controllers/BudgetController");
const auth = require("../middleware/requireAuth");

// router.use(auth);
router.post("/", budgetController.addBudget);
router.get("/", budgetController.getAllBudget);
router.get("/:id", budgetController.getBudgetById);
router.get("/user/:id", budgetController.getBudgetByUserId);
router.put("/:id", budgetController.updateBudget);
router.delete("/:id", budgetController.deleteBudget);

module.exports = router;