const fsSync = require("fs");
const path = require("path");
const i18n = require("i18n");

const supportedLocales = ["en", "ru"];

const localLocalesExist = fsSync.existsSync(
  path.join(__dirname, "..", "locales-local")
);

const localesDir = localLocalesExist
  ? path.join(__dirname, "..", "locales-local")
  : path.join(__dirname, "..", "locales");

function initLocales() {
  i18n.configure({
    // setup some locales - other locales default to en silently
    locales: supportedLocales,
    defaultLocale: "ru",
    queryParameter: "lang",
    // sets a custom cookie name to parse locale settings from
    cookie: "locale",
    // where to store json files - defaults to './locales'
    directory: localesDir,
    // setting of log level DEBUG - default to require('debug')('i18n:debug')
    logDebugFn: function (msg) {
      console.log("debug", msg);
    },
    // setting of log level WARN - default to require('debug')('i18n:warn')
    logWarnFn: function (msg) {
      console.log("warn", msg);
    },
    // setting of log level ERROR - default to require('debug')('i18n:error')
    logErrorFn: function (msg) {
      console.log("error", msg);
    },
  });
  return i18n;
}

module.exports = { localesDir, initLocales, supportedLocales };
