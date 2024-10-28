const { default: axios } = require("axios");

module.exports.authorizeApp = (req, res) => {
  const authorizationUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${process.env.REDIRECT_URI}&scope=activity:read_all`;
  res.redirect(authorizationUrl);
};

module.exports.stravaAuthCallback = async (req, res) => {
  const authorizationCode = req.query.code;

  try {
    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code: authorizationCode,
      grant_type: "authorization_code",
    });

    const { access_token, refresh_token, expires_at } = response.data;

    // Assure-toi que la session est initialisée et stocke les tokens
    req.session.access_token = access_token;
    req.session.refresh_token = refresh_token;
    req.session.expires_at = expires_at;

    res.send("Connexion réussie avec Strava !");
  } catch (error) {
    console.error("Erreur lors de la récupération du token d’accès:", error);
    res.status(500).send("Erreur lors de l’authentification avec Strava");
  }
};

module.exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Erreur lors de la déconnexion");
    }
    res.clearCookie("connect.sid"); // Efface le cookie de session
    res.send("Déconnexion réussie !");
  });
};