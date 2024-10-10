const express = require("express");
const router = new express.Router();
const authController = require("../controllers/AuthController");
const auth = require("../middleware/requireAuth");

router.post("/register", authController.signUp);
router.post("/login", authController.logIn);

router.use(auth);
router.get("/profile", authController.getUserProfile);
router.put("/profile", authController.editProfile);
router.post("/change-password", authController.changePassword);
router.post("/logout", authController.logout);

module.exports = router;
