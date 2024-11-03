const axios = require("axios");

module.exports.refreshAccessToken = async (req, res, next) => {
  const { refresh_token, expires_at } = req.session;
  const date = Date.now();

  if (date < expires_at) {
    return res.status(200).send("Access token is fresh");
  }

  if (!refresh_token) {
    return res.status(401).send("No refresh token found. Please log in again.");
  }

  try {
    const response = await axios.post(
      "https://www.strava.com/api/v3/oauth/token",
      {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token,
      }
    );
    req.session.access_token = response.data.access_token;
    req.session.refresh_token = response.data.refresh_token;
    req.session.expires_at = response.data.expires_at;

    next();
  } catch (error) {
    console.error("Error refreshing access token:", error.message);
    res.status(500).send("Failed to refresh access token. Please try again.");
  }
};
