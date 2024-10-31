const { default: axios } = require("axios");
const { Pool } = require("pg");

// Configure la connexion à PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports.stravaAthlete = async (req, res) => {
  const { access_token } = req.session;

  if (!access_token) {
    return res.status(401).send("Utilisateur non authentifié");
  }

  try {
    const athleteResponse = await axios.get(
      "https://www.strava.com/api/v3/athlete",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const {
      id,
      username,
      firstname,
      lastname,
      city,
      state,
      country,
      sex,
      premium,
      created_at,
      updated_at,
      profile_medium,
      profile,
      follower_count,
      friend_count,
      mutual_friend_count,
      athlete_type,
      date_preference,
      measurement_preference,
      weight,
    } = athleteResponse.data;

    // Insère les informations dans la table `athletes`
    await pool.query(
      `
      INSERT INTO athletes (
        id, username, firstname, lastname, city, state, country, sex, premium,
        created_at, updated_at, profile_medium, profile,
        follower_count, friend_count, mutual_friend_count, athlete_type,
        date_preference, measurement_preference, weight
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19, $20
      )
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        firstname = EXCLUDED.firstname,
        lastname = EXCLUDED.lastname,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        country = EXCLUDED.country,
        sex = EXCLUDED.sex,
        premium = EXCLUDED.premium,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at,
        profile_medium = EXCLUDED.profile_medium,
        profile = EXCLUDED.profile,
        follower_count = EXCLUDED.follower_count,
        friend_count = EXCLUDED.friend_count,
        mutual_friend_count = EXCLUDED.mutual_friend_count,
        athlete_type = EXCLUDED.athlete_type,
        date_preference = EXCLUDED.date_preference,
        measurement_preference = EXCLUDED.measurement_preference,
        weight = EXCLUDED.weight;
      `,
      [
        id,
        username,
        firstname,
        lastname,
        city,
        state,
        country,
        sex,
        premium,
        created_at,
        updated_at,
        profile_medium,
        profile,
        follower_count,
        friend_count,
        mutual_friend_count,
        athlete_type,
        date_preference,
        measurement_preference,
        weight,
      ]
    );

    res.json(athleteResponse.data);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'athlete:", error);
    res.status(500).send("Erreur lors de la récupération de l'athlete");
  }
};

module.exports.athleteZones = async (req, res) => {
  const { access_token } = req.session;
  const athleteId = req.params.id;

  if (!access_token || !athleteId) {
    return res
      .status(401)
      .send("Utilisateur non authentifié ou ID de l'athlète manquant");
  }

  try {
    const zonesResponse = await axios.get(
      "https://www.strava.com/api/v3/athlete/zones",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const zones = zonesResponse.data.heart_rate.zones;

    const query = `
      UPDATE athletes
      SET heart_rate_zones = $1
      WHERE id = $2
    `;

    await pool.query(query, [JSON.stringify(zones), athleteId]);

    res.json(zonesResponse.data);
  } catch (error) {
    console.log("Erreur lors de la récupération des zones de l'athlète", error);
    res.status(500).send("Erreur lors de la récupération des zones d'athlète");
  }
};
