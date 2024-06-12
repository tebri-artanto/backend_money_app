const express = require("express");
const router = new express.Router();
const grupController = require("../controllers/GrupController");
const auth = require("../middleware/requireAuth");

// router.use(auth);
router.post("/", grupController.addGrup);
router.post("/addUser", grupController.addUserToGrup);
router.get("/", grupController.getAllGrup);
router.get("/:id", grupController.getGrupById);
router.put("/:id", grupController.updateGrup);
router.delete("/:id", grupController.deleteGrup);

module.exports = router;