const express = require("express");
const authController = require("../controllers/auth.controller");
const activitiesController = require("../controllers/activities.controller");
const userController = require("../controllers/user.controller");

const router = express.Router();

// auth
router.get("/auth", authController.authorizeApp);
router.get("/auth/callback", authController.stravaAuthCallback);
router.get("/logout", authController.logout);

// user
router.get("/athlete", userController.stravaAthlete);

// activities
router.get("/activities", activitiesController.getActivities);

module.exports = router;
