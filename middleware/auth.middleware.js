const axios = require("axios");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports.refreshAccessToken = async (req, res, next) => {
  const { refresh_token, expires_at, athleteId } = req.session;
  const date = Date.now();

  if (date < expires_at) {
    next();
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

    // Assure-toi que la session est initialisée et stocke les tokens
    req.session.access_token = response.data.access_token;
    req.session.refresh_token = response.data.refresh_token;
    req.session.expires_at = response.data.expires_at;
    req.session.athleteId = athleteId;

    // Stocke l'ID de l'athlète dans la table `users` avec les tokens
    await pool.query(
      `
      INSERT INTO users (id, access_token, refresh_token, expires_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at;
      `,
      [athleteId, response.data.access_token, refresh_token, expires_at]
    );

    next();
  } catch (error) {
    console.error("Error refreshing access token:", error.message);
    res.status(500).send("Failed to refresh access token. Please try again.");
  }
};
