const { default: axios } = require("axios");

module.exports.getActivities = async (req, res) => {
  const { access_token } = req.session;

  if (!access_token) {
    return res.status(401).send("Utilisateur non authentifié");
  }

  try {
    const activitiesResponse = await axios.get(
      "https://www.strava.com/api/v3/athlete/activities",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    res.json(activitiesResponse.data);
  } catch (error) {
    console.error("Erreur lors de la récupération des activités:", error);
    res.status(500).send("Erreur lors de la récupération des activités");
  }
};
