const express = require("express");
const handlebars = require("express-handlebars");
const mainRouter = require("./routes/main");
const adminRouter = require("./routes/admin");
const db = require("./db");
const path = require('path');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const i18n = require('i18n');
const https = require('https');
const fs = require('fs');
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false, limit: '200mb' });
const bcrypt = require('bcrypt');
const uuidV4 = require("uuid.v4");

i18n.configure({
  // setup some locales - other locales default to en silently
  locales: ['en', 'ru'],
  defaultLocale: 'ru',
  // sets a custom cookie name to parse locale settings from
  cookie: 'locale',
  // where to store json files - defaults to './locales'
  directory: path.join(__dirname, 'locales'),
  // setting of log level DEBUG - default to require('debug')('i18n:debug')
  logDebugFn: function (msg) {
    console.log('debug', msg)
  },
  // setting of log level WARN - default to require('debug')('i18n:warn')
  logWarnFn: function (msg) {
    console.log('warn', msg)
  },
  // setting of log level ERROR - default to require('debug')('i18n:error')
  logErrorFn: function (msg) {
    console.log('error', msg)
  },
});



const app = express();
const hbs = handlebars.create({
  defaultLayout: "main",
  extname: "hbs",
  i18n: i18n
});
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.use(cookieParser());
app.use(i18n.init);
app.use(function (req, res, next) {
  if (req.cookies['locale'] == undefined) {
    res.cookie('locale', req.getLocale(), { maxAge: 900000 });
  }
  next();
});
app.use(function (req, res, next) {
  let signed = req.cookies.id === sessionId;
  req.signedIn = signed;
  next();
});
app.use(session({ secret: 'ssshhhhh' }));
app.use(fileUpload());
app.use(express.static(path.join(__dirname, "static")));
app.use(mainRouter);
app.use('/admin', adminRouter);

// auth
const admin = {
  user: "root",
  passhash: "$2b$12$8/U31eNNYwPxhTMdcC4ogeIttkJNHUUreKGUEuZHFoPD.TT.e//9u"
}
var sessionId = 'none';
app.get("/login", (req, res) => {
  var title = 'Login' + ' | ' + res.__('title');
  res.render("login", { title, signedIn: req.signedIn });
});
app.post("/login", urlencodedParser, (req, res) => {
  if ((req.body.username === admin.user) && (bcrypt.compareSync(req.body.password, admin.passhash))) {
    sessionId = uuidV4();
    res.cookie("id", sessionId, { maxAge: 24 * 60 * 60 * 10000 });
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});
app.get('/logout', function (req, res) {
  res.clearCookie('id');
  res.redirect("/");
});



// start http server
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log("Server started");
})
// start https server
let sslOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
let serverHttps = https.createServer(sslOptions, app).listen(8002);


