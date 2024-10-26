const express = require("express");
const router = new express.Router();
const riwayatController = require("../controllers/RiwayatController");
const auth = require("../middleware/requireAuth");

router.delete("/deleteNota/:id", riwayatController.deleteNota);
router.use(auth);
router.get("/bulan/:bulan/tahun/:tahun/userId/:userId", riwayatController.getBulanByBulanAndTahun);
router.get("/:id", riwayatController.getRiwayatById);
router.get("/user/:id", riwayatController.getRiwayatByUserId);
router.get("/getRiwayatbyDetailBudget/:id", riwayatController.getRiwayatByDetailBudgetId);
router.get("/getRiwayatbyUserIdWeekly/:id", riwayatController.getRiwayatByUserIdWeekly);
router.get("/getLast10Riwayat/user", riwayatController.getLast10RiwayatByUserId);

router.post("/", riwayatController.upload, riwayatController.addRiwayat);

router.put("/:id", riwayatController.upload, riwayatController.updateRiwayat);

router.delete("/:id", riwayatController.deleteRiwayat);
router.delete("/deleteNota/:id", riwayatController.deleteNota);

module.exports = router;