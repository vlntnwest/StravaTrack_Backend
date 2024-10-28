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

    // Récupère les données de l'athlète
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
      bikes = [], // Initialisation par défaut
      shoes = [], // Initialisation par défaut
    } = athleteResponse.data;

    // Vérifie si bikes et shoes ont des éléments avant d'y accéder
    const bikeId = bikes.length > 0 ? bikes[0].id : null;
    const bikeName = bikes.length > 0 ? bikes[0].name : null;
    const shoeId = shoes.length > 0 ? shoes[0].id : null;
    const shoeName = shoes.length > 0 ? shoes[0].name : null;

    // Insère les données dans la base de données
    await pool.query(
      `
  INSERT INTO athletes (
    id, username, firstname, lastname, city, state, country, sex, premium,
    created_at, updated_at, profile_medium, profile,
    follower_count, friend_count, mutual_friend_count, athlete_type,
    date_preference, measurement_preference, weight,
    bike_id, bike_name, shoe_id, shoe_name
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
    $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
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
    weight = EXCLUDED.weight,
    bike_id = $21,
    bike_name = $22,
    shoe_id = $23,
    shoe_name = $24
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
        bikeId,
        bikeName,
        shoeId,
        shoeName,
      ]
    );

    res.json(athleteResponse.data);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'athlete:", error);
    res.status(500).send("Erreur lors de la récupération de l'athlete");
  }
};
