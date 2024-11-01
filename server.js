const express = require("express");
require("dotenv").config({ path: "./config/.env" });
const stravRoutes = require("./routes/strava.routes");
const app = express();

const PORT = process.env.PORT;

const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const pool = require("./config/db");
const bodyParser = require("body-parser");

app.use(express.json());

//Body Parseer
app.use(bodyParser.json());

app.use(
  session({
    store: new PgSession({
      pool: pool,
      tableName: "session",
    }),
    secret: process.env.TOKEN_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 14, // 2 semaines
    },
  })
);

app.get("/", (req, res) => {
  res.send("Serveur fonctionne correctement");
});

// Strava oauth
app.use("/api/strava", stravRoutes);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
