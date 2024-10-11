const express = require("express");
const router = new express.Router();
const anggaranController = require("../controllers/AnggaranController");
const auth = require("../middleware/requireAuth");

router.use(auth);

router.get("/", anggaranController.getAllBudget);
router.get("/:id", anggaranController.getBudgetById);
router.get("/user/:id", anggaranController.getBudgetByUserId);
router.get("/user/:id/month", anggaranController.getBudgetByUserIdAndMonth);
router.get("/updateStatus", anggaranController.updateBudgetStatus);
router.get("/updateSisaBudget", anggaranController.updateSisaBudget);

router.post("/", anggaranController.addBudget);

router.put("/:id", anggaranController.updateBudget);

router.delete("/:id", anggaranController.deleteBudget);

module.exports = router;