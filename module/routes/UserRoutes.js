const express = require("express");
const router = new express.Router();
const authController = require("../controllers/AuthController");
const auth = require("../middleware/requireAuth");

router.post("/register", authController.signUp);
router.post("/login", authController.logIn);
// router.post("/loginweb", authController.loginForWeb);
//router.use(auth);
// router.get("/users", authController.showAllUsers);
// router.get("/user/:userId/activities", authController.getUserActivities);
router.get("/profile", authController.authenticateToken, authController.getUserProfile);
router.put("/profile", authController.authenticateToken, authController.editProfile); 
router.post("/change-password", authController.authenticateToken, authController.changePassword);
router.post("/logout", authController.authenticateToken, authController.logout);
// router.post("/login", authController.logIn);

module.exports = router;