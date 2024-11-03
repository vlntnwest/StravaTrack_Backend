const express = require("express");
const {
  getActivities,
  getLastActivities,
  activityLaps,
} = require("../controllers/activities.controller");
const {
  stravaAthlete,
  athleteZones,
} = require("../controllers/user.controller");
const {
  authorizeApp,
  stravaAuthCallback,
  logout,
} = require("../controllers/auth.controller");
const { refreshAccessToken } = require("../middleware/auth.middleware");

const router = express.Router();

// auth
router.get("/auth", authorizeApp);
router.get("/auth/callback", stravaAuthCallback);
router.get("/logout", logout);

// user
router.get("/athlete", refreshAccessToken, stravaAthlete);
router.get("/athlete/:id/heartzones", refreshAccessToken, athleteZones);

// activities
router.get("/activities", refreshAccessToken, getActivities);
router.get("/:athleteId/activities", refreshAccessToken, getLastActivities);
router.get("/activities/:activityId/laps", refreshAccessToken, activityLaps);

module.exports = router;
