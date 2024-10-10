const express = require("express");
const router = new express.Router();
const bulanController = require("../controllers/BulanController");
const auth = require("../middleware/requireAuth");

router.use(auth);
router.get("/", bulanController.getAllBulan);
router.get("/today/user", bulanController.getBulanByTodayBulan);

module.exports = router;