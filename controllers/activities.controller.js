const { default: axios } = require("axios");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports.getActivities = async (req, res) => {
  const { access_token } = req.session;

  if (!access_token) {
    return res.status(401).send("Utilisateur non authentifié");
  }

  try {
    let allActivities = [];
    let page = 1;
    const per_page = 100;

    // Boucle pour récupérer toutes les pages d'activités
    while (true) {
      const activitiesResponse = await axios.get(
        "https://www.strava.com/api/v3/athlete/activities",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
          params: {
            per_page,
            page,
          },
        }
      );

      const activities = activitiesResponse.data;

      if (activities.length === 0) {
        break; // Arrête la boucle si aucune activité supplémentaire
      }

      // Filtrer les activités de type "Run"
      const runningActivities = activities.filter(
        (activity) => activity.type === "Run"
      );

      allActivities = allActivities.concat(runningActivities);
      page++;
    }

    // Insérer chaque activité de course dans la base de données
    for (const activity of allActivities) {
      const {
        id,
        athlete: { id: athlete_id },
        name,
        distance,
        moving_time,
        elapsed_time,
        total_elevation_gain,
        type,
        sport_type,
        start_date,
        start_date_local,
        timezone,
        utc_offset,
        location_country,
        kudos_count,
        trainer,
        commute,
        manual,
        gear_id,
        average_speed,
        max_speed,
        has_heartrate,
        average_heartrate,
        max_heartrate,
        elev_high,
        elev_low,
        upload_id,
        external_id,
        map: { summary_polyline },
        start_latlng: [start_lat = null, start_lng = null] = [],
        end_latlng: [end_lat = null, end_lng = null] = [],
      } = activity;

      await pool.query(
        `
        INSERT INTO activities (
          id, athlete_id, name, distance, moving_time, elapsed_time, total_elevation_gain, type,
          sport_type, start_date, start_date_local, timezone, utc_offset, location_country,
          kudos_count, trainer, commute, manual, gear_id, average_speed, max_speed,
          has_heartrate, average_heartrate, max_heartrate, elev_high, elev_low, upload_id,
          external_id, summary_polyline, start_lat, start_lng, end_lat, end_lng
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33
        )
        ON CONFLICT (id) DO UPDATE SET
          athlete_id = EXCLUDED.athlete_id,
          name = EXCLUDED.name,
          distance = EXCLUDED.distance,
          moving_time = EXCLUDED.moving_time,
          elapsed_time = EXCLUDED.elapsed_time,
          total_elevation_gain = EXCLUDED.total_elevation_gain,
          type = EXCLUDED.type,
          sport_type = EXCLUDED.sport_type,
          start_date = EXCLUDED.start_date,
          start_date_local = EXCLUDED.start_date_local,
          timezone = EXCLUDED.timezone,
          utc_offset = EXCLUDED.utc_offset,
          location_country = EXCLUDED.location_country,
          kudos_count = EXCLUDED.kudos_count,
          trainer = EXCLUDED.trainer,
          commute = EXCLUDED.commute,
          manual = EXCLUDED.manual,
          gear_id = EXCLUDED.gear_id,
          average_speed = EXCLUDED.average_speed,
          max_speed = EXCLUDED.max_speed,
          has_heartrate = EXCLUDED.has_heartrate,
          average_heartrate = EXCLUDED.average_heartrate,
          max_heartrate = EXCLUDED.max_heartrate,
          elev_high = EXCLUDED.elev_high,
          elev_low = EXCLUDED.elev_low,
          upload_id = EXCLUDED.upload_id,
          external_id = EXCLUDED.external_id,
          summary_polyline = EXCLUDED.summary_polyline,
          start_lat = EXCLUDED.start_lat,
          start_lng = EXCLUDED.start_lng,
          end_lat = EXCLUDED.end_lat,
          end_lng = EXCLUDED.end_lng;
        `,
        [
          id,
          athlete_id,
          name,
          distance,
          moving_time,
          elapsed_time,
          total_elevation_gain,
          type,
          sport_type,
          start_date,
          start_date_local,
          timezone,
          utc_offset,
          location_country,
          kudos_count,
          trainer,
          commute,
          manual,
          gear_id,
          average_speed,
          max_speed,
          has_heartrate,
          average_heartrate,
          max_heartrate,
          elev_high,
          elev_low,
          upload_id,
          external_id,
          summary_polyline,
          start_lat,
          start_lng,
          end_lat,
          end_lng,
        ]
      );
    }

    res.json(allActivities); // Retourne toutes les activités de type "Run"
  } catch (error) {
    console.error("Erreur lors de la récupération des activités:", error);
    res.status(500).send("Erreur lors de la récupération des activités");
  }
};
