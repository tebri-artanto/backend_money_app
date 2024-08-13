const express = require("express");
const router = new express.Router();
const kategoriController = require("../controllers/BulanController");
const auth = require("../middleware/requireAuth");

// router.use(auth);
router.get("/", kategoriController.getAllBulan);
router.get("/today", kategoriController.getBulanByTodayBulan);

module.exports = router;