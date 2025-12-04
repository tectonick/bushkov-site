const express = require("express");
const handlebars = require("express-handlebars");
const mainRouter = require("./routes/main");
const adminRouter = require("./routes/admin");
const { initLocales, supportedLocales } = require("./services/locales");
const path = require("path");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const session = require("express-session");
const https = require("https");
const fs = require("fs");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({
  extended: false,
  limit: "200mb",
});
const bcrypt = require("bcrypt");
const uuidV4 = require("uuid.v4");
const config = require("config");

const ssl = config.get("ssl");
const environment = process.env.NODE_ENV || "production";
const isDevelopment = environment === "development";

function CreateApp() {
  const app = express();
  const i18n = initLocales();
  const hbs = handlebars.create({
    defaultLayout: "main",
    extname: "hbs",
    i18n: i18n,
  });
  app.engine("hbs", hbs.engine);
  app.set("view engine", "hbs");
  app.enable("trust proxy");
  app.use(cookieParser());
  app.use(i18n.init);
  app.use(function (req, res, next) {
    res.locals.fullUrl = `${req.protocol}://${req.get("host")}${req.path}`;
    res.locals.locales = supportedLocales;
    next();
  });
  app.use(function (req, res, next) {
    let locale = req.getLocale();
    if (
      req.cookies["locale"] == undefined ||
      req.cookies["locale"] !== locale
    ) {
      res.cookie("locale", locale, { maxAge: 900000 });
    }
    res.locals.lang = locale;
    next();
  });
  app.use(function (req, _res, next) {
    let signed = req.cookies.id === sessionId;
    req.signedIn = signed;
    next();
  });
  app.use(session({ secret: "ssshhhhh" }));
  app.use(fileUpload());
  app.use(express.static(path.join(__dirname, "static")));
  app.use(mainRouter);
  app.use("/admin", adminRouter);

  // auth
  const admin = config.get("adminUser");
  let sessionId = "none";
  app.get("/login", (req, res) => {
    let title = "Login" + " | " + res.__("title");
    res.render("login", { title, signedIn: req.signedIn });
  });
  app.post("/login", urlencodedParser, (req, res) => {
    if (
      req.body.username === admin.user &&
      bcrypt.compareSync(req.body.password, admin.passhash)
    ) {
      sessionId = uuidV4();
      res.cookie("id", sessionId, { maxAge: 24 * 60 * 60 * 10000 });
      res.redirect("/");
    } else {
      res.redirect("/login");
    }
  });
  app.get("/logout", function (_req, res) {
    res.clearCookie("id");
    res.redirect("/");
  });

  return app;
}

function CleanTmpFolder() {
  if (fs.existsSync("./tmp")) {
    fs.rmdirSync("./tmp", { recursive: true });
    fs.mkdirSync("./tmp");
  }
}

function CreateServer(app) {
  if (!isDevelopment) CleanTmpFolder();
  // start http server
  const PORT = process.env.PORT || 80;
  app.listen(PORT, () => {
    console.log("Server started");
  });
  // start https server
  let sslOptions = {
    key: fs.readFileSync(ssl.key),
    cert: fs.readFileSync(ssl.cert),
  };
  https.createServer(sslOptions, app).listen(ssl.httpsport);
  //Log start
  if (isDevelopment) {
    console.log(`Server http address is http://localhost:${PORT}`);
    console.log(`Server https address is https://localhost:${ssl.httpsport}`);
  }
}

module.exports = { CreateApp, CreateServer };
