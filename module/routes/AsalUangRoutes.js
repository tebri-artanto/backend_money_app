const express = require("express");
const router = new express.Router();
const asalUangController = require("../controllers/AsalUangController");
const auth = require("../middleware/requireAuth");

// router.use(auth);
router.post("/", asalUangController.addAsalUang);
router.get("/", asalUangController.getAllAsalUang);
router.get("/:id", asalUangController.getAsalUangById);
router.get("/user/:id", asalUangController.getAsalUangByUserId);
router.put("/:id", asalUangController.updateAsalUang);
router.delete("/:id", asalUangController.deleteAsalUang);

module.exports = router;