const express = require("express");
const router = new express.Router();
const kategoriController = require("../controllers/KategoriController");
const auth = require("../middleware/requireAuth");

router.use(auth);
router.post("/", kategoriController.addKategori);
router.get("/", kategoriController.getAllKategori);
router.get("/:id", kategoriController.getKategoriById);
router.get("/user/:id", kategoriController.getKategoriByUserId);
router.put("/:id", kategoriController.updateKategori);
router.delete("/:id", kategoriController.deleteKategori);

module.exports = router;