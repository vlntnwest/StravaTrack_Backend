const express = require("express");
const {
  getActivities,
  getLastActivities,
  getActivityLaps,
  getActivityStreams,
  getActivityZones,
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
router.get("/athlete/zones", refreshAccessToken, athleteZones);

// activities
router.get("/activities", refreshAccessToken, getActivities);
router.get("/lastActivities", refreshAccessToken, getLastActivities); //Add new activities to db and display all
router.get("/activities/:activityId/laps", refreshAccessToken, getActivityLaps);
router.get(
  "/activities/:activityId/zones",
  refreshAccessToken,
  getActivityZones
); // Only for premium members
router.get(
  "/activities/:activityId/streams",
  refreshAccessToken,
  getActivityStreams
);

module.exports = router;
