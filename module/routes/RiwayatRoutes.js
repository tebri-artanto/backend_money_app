const express = require("express");
const router = new express.Router();
const riwayatController = require("../controllers/RiwayatController");
const auth = require("../middleware/requireAuth");

// router.use(auth);
router.post("/", riwayatController.addRiwayat);
router.post("/upload", riwayatController.upload ,riwayatController.uploadImage);
// router.get("/getAll", riwayatController.getAllRiwayat);
router.get("/bulan/:bulan/tahun/:tahun", riwayatController.getBulan);
router.get("/user/:owner", riwayatController.getRiwayatByuser);
// router.get("/:id", riwayatController.getRiwayat);
router.put("/:id", riwayatController.updateRiwayat);
router.delete("/:id", riwayatController.deleteRiwayat);

module.exports = router;