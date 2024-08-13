const express = require("express");
const router = new express.Router();
const riwayatController = require("../controllers/RiwayatController");
const auth = require("../middleware/requireAuth");

// router.use(auth);
router.post("/uploadNota", riwayatController.upload ,riwayatController.uploadNotaTest);
router.post("/", riwayatController.upload, riwayatController.addRiwayat);
// router.post("/upload", riwayatController.upload ,riwayatController.uploadImage);
//router.get("/getAll", riwayatController.getAllRiwayat);
router.get("/bulan/:bulan/tahun/:tahun/userId/:userId", riwayatController.getBulanByBulanAndTahun);

// router.get("/user/:owner", riwayatController.getRiwayatByuser);
// router.get("/:id", riwayatController.getRiwayat);
router.get("/:id", riwayatController.getRiwayatById);
router.get("/bulan/:id", riwayatController.getRiwayatByBulanId);
router.get("/user/:id", riwayatController.getRiwayatByUserId);
router.put("/:id", riwayatController.upload, riwayatController.updateRiwayat);
router.delete("/:id", riwayatController.deleteRiwayat);

router.get("/getRiwayatbyBulan/:id", riwayatController.getRiwayatSummaryByBulanId);
router.get("/getRiwayatbyDetailBudget/:id", riwayatController.getRiwayatByDetailBudgetId);
router.get("/getRiwayatbyUserIdWeekly/:id", riwayatController.getRiwayatByUserIdWeekly);
router.get("/coba1/:id", riwayatController.getRiwayatByUserIdWeeklyByKategori);
router.get("/getLast10Riwayat/user/:id", riwayatController.getLast10RiwayatByUserId);

router.delete("/deleteNota/:id", riwayatController.deleteNota);



module.exports = router;