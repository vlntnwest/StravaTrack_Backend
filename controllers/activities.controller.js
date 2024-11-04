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
  } catch (error) {}
};

module.exports.getLastActivities = async (req, res) => {
  const { access_token, athleteId } = req.session;

  if (!athleteId) {
    return res.status(400).json({
      error: "L'ID de l'athlète est requis pour récupérer les activités.",
    });
  }

  if (!access_token) {
    return res.status(401).send("Utilisateur non authentifié");
  }

  try {
    let allActivities = [];
    let page = 1;
    const per_page = 100;

    // Récupérer la date de la dernière activité de la base de données
    const lastActivityResult = await pool.query(
      `
      SELECT MAX(start_date_local) AS last_activity_date
      FROM activities WHERE athlete_id = $1
    `,
      [athleteId]
    );

    const lastActivityDate = lastActivityResult.rows[0].last_activity_date;

    // Si une date existe, la convertir en timestamp
    const afterParam = lastActivityDate
      ? new Date(lastActivityDate).getTime() / 1000
      : null;

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
            ...(afterParam && { after: afterParam }),
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
        start_date_local,
        location_country,
        kudos_count,
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
          sport_type, start_date_local, location_country,
          kudos_count, gear_id, average_speed, max_speed,
          has_heartrate, average_heartrate, max_heartrate, elev_high, elev_low, upload_id,
          external_id, summary_polyline, start_lat, start_lng, end_lat, end_lng
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24, $25, $26, $27
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
          start_date_local = EXCLUDED.start_date_local,
          location_country = EXCLUDED.location_country,
          kudos_count = EXCLUDED.kudos_count,
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
          start_date_local,
          location_country,
          kudos_count,
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

    // Récupérer les activités à partir de la base de données
    const query = `SELECT * FROM activities WHERE athlete_id = $1 ORDER BY start_date_local DESC`;
    const params = [athleteId];

    const { rows: recentActivities } = await pool.query(query, params);

    if (recentActivities.length === 0) {
      console.log("Aucune activité trouvée pour l'athlète donné.");
    }

    res.json(recentActivities); // Retourne toutes les activités de type "Run"
  } catch (error) {
    console.error("Erreur lors de la récupération des activités:", error);
    res.status(500).send("Erreur lors de la récupération des activités");
  }
};

module.exports.getActivityLaps = async (req, res) => {
  const { access_token } = req.session;
  const { activityId } = req.params;

  if (!access_token) {
    return res.status(401).send("Utilisateur non authentifié");
  }

  try {
    // Vérifiez d'abord si des laps existent déjà dans la base de données
    const existingLapsQuery = `
      SELECT * FROM laps WHERE activity_id = $1;
    `;
    const existingLaps = await pool.query(existingLapsQuery, [activityId]);

    if (existingLaps.rows.length > 0) {
      // Si des laps existent déjà, les renvoyer
      return res.json(existingLaps.rows);
    }

    const activityResponse = await axios.get(
      `https://www.strava.com/api/v3/activities/${activityId}/laps`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const lapsData = activityResponse.data;

    const insertQuery = `
      INSERT INTO laps (
        id, activity_id, name, elapsed_time, moving_time,
        start_date_local, distance, average_speed,
        max_speed, lap_index, total_elevation_gain,
        average_heartrate, max_heartrate, pace_zone
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO NOTHING;  -- Ne rien faire si le lap existe déjà
    `;

    for (const lap of lapsData) {
      const lapValues = [
        lap.id,
        activityId,
        lap.name,
        lap.elapsed_time,
        lap.moving_time,
        lap.start_date_local,
        lap.distance,
        lap.average_speed,
        lap.max_speed,
        lap.lap_index,
        lap.total_elevation_gain,
        lap.average_heartrate || null,
        lap.max_heartrate || null,
        lap.pace_zone || null,
      ];

      await pool.query(insertQuery, lapValues);
    }

    res.json(lapsData);
  } catch (error) {
    console.log(
      "Erreur lors de la récupération des zones de l'activité",
      error
    );
    res.status(500).send("Erreur lors de la récupération des zones d'activité");
  }
};

module.exports.getActivityStreams = async (req, res) => {
  const { access_token } = req.session;
  const activityId = req.params.activityId;

  if (!access_token) {
    return res.status(401).send("Utilisateur non authentifié");
  }

  try {
    const existingStreamsQuery = `
      SELECT * FROM activity_streams WHERE id = $1;
    `;
    const existingStreams = await pool.query(existingStreamsQuery, [
      activityId,
    ]);

    if (existingStreams.rows.length > 0) {
      return res.json(existingStreams.rows[0]);
    }

    const streamsResponse = await axios.get(
      `https://www.strava.com/api/v3/activities/${activityId}/streams`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: {
          keys: "time,distance,heartrate,velocity_smooth",
          key_by_type: true,
        },
      }
    );

    const streamsData = streamsResponse.data;

    const distanceData = streamsData.distance?.data || [];
    const heartrateData = streamsData.heartrate?.data || [];
    const timeData = streamsData.time?.data || [];
    const velocityData = streamsData.velocity_smooth?.data || [];

    const insertQuery = `
      INSERT INTO activity_streams (id, distance, heartrate, time, velocity_smooth)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO NOTHING;
    `;

    const insertValues = [
      activityId,
      distanceData.length ? distanceData : null,
      heartrateData.length ? heartrateData : null,
      timeData.length ? timeData : null,
      velocityData.length ? velocityData : null,
    ];

    await pool.query(insertQuery, insertValues);

    res.json({
      distance: distanceData,
      heartrate: heartrateData,
      time: timeData,
      Velocity: velocityData,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des streams de l'activité",
      error
    );
    res
      .status(500)
      .send("Erreur lors de la récupération des streams d'activité");
  }
};

module.exports.getActivityZones = async (req, res) => {
  const { access_token } = req.session;
  const activityId = req.params.activityId;

  if (!access_token) {
    return res
      .status(401)
      .send("Utilisateur non authentifié ou ID de l'athlète manquant");
  }

  try {
    const existingZonesQuery = `
      SELECT * FROM activity_zones WHERE activity_id = $1;
    `;
    const existingZones = await pool.query(existingZonesQuery, [activityId]);

    if (existingZones.rows.length > 0) {
      // Si des laps existent déjà, les renvoyer
      return res.json(existingZones.rows);
    }

    const zonesResponse = await axios.get(
      `https://www.strava.com/api/v3/activities/${activityId}/zones`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const zonesData = zonesResponse.data;

    // Initialisation des valeurs pace et heartrate
    let pace = null;
    let heartrate = null;

    // Parcourir les zones pour extraire pace et heartrate
    for (const zone of zonesData) {
      if (zone.type === "pace") {
        pace = JSON.stringify(zone.distribution_buckets);
      } else if (zone.type === "heartrate") {
        heartrate = JSON.stringify(zone.distribution_buckets);
      }
    }

    // Insérer ou mettre à jour les données de zones dans la table activity_zones
    const insertQuery = `
      INSERT INTO activity_zones (activity_id, pace, heartrate)
      VALUES ($1, $2, $3)
      ON CONFLICT (activity_id) DO UPDATE 
      SET pace = EXCLUDED.pace, heartrate = EXCLUDED.heartrate;
    `;

    const insertValues = [activityId, pace, heartrate];

    // Effectuer l'insertion ou la mise à jour
    await pool.query(insertQuery, insertValues);

    // Renvoyer les données récupérées
    res.json(zonesData);
  } catch (error) {
    console.log(
      "Erreur lors de la récupération des zones de l'activité",
      error
    );
    res.status(500).send("Erreur lors de la récupération des zones d'activité");
  }
};
