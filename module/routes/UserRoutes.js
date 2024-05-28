const express = require("express");
const router = new express.Router();
const authController = require("../controllers/AuthController");
const auth = require("../middleware/requireAuth");

router.post("/register", authController.signUp);
router.post("/login", authController.logIn);
//router.use(auth);
// router.get("/users", authController.showAllUsers);
// router.get("/user/:userId/activities", authController.getUserActivities);
router.get("/:userId", authController.getUserById);
// router.post("/login", authController.logIn);

module.exports = router;