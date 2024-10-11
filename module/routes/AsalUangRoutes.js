const express = require("express");
const router = new express.Router();
const asalUangController = require("../controllers/AsalUangController");
const auth = require("../middleware/requireAuth");

router.use(auth);

router.get("/", asalUangController.getAllAsalUang);
router.get("/user/:id", asalUangController.getAsalUangByUserId);
router.get("/:id", asalUangController.getAsalUangById);

router.post("/", asalUangController.addAsalUang);

router.put("/:id", asalUangController.updateAsalUang);

router.delete("/:id", asalUangController.deleteAsalUang);

module.exports = router;