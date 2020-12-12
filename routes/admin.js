const express = require("express");
const fs=require('fs').promises;
const path=require("path");
const db=require('../db');
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const uuidV4 = require("uuid.v4");

const router = express.Router();

const urlencodedParser = bodyParser.urlencoded({ extended: false });


const admin = {
    user: "root",
    passhash: "$2b$12$8/U31eNNYwPxhTMdcC4ogeIttkJNHUUreKGUEuZHFoPD.TT.e//9u"
  }

  var sessionId = 'none';


  //Middleware

router.use(function (req, res, next) {
    if ((req.cookies.id === sessionId) || (req.path == "/login") || (req.path == "/logout")) {
      next();
    } else {
      res.redirect("/admin/login");
    }
  });


//Routes
router.get('/', function (req, res) {
    var title ='Admin'+' | '+res.__('title');
    res.render("admin/admin", { title });
  });
  
  router.get("/login", (req, res) => {  
    var title ='Login'+' | '+res.__('title');
    res.render("admin/login", {title});
  });
  
  router.post("/login", urlencodedParser, (req, res) => {
    if ((req.body.username === admin.user) && (bcrypt.compareSync(req.body.password, admin.passhash))) {
      sessionId = uuidV4();
      res.cookie("id", sessionId, { maxAge: 24 * 60 * 60 * 10000 });
      res.redirect("/admin");
    } else {
      res.redirect("/admin/login");
    }
  });
  
  router.get('/logout', function (req, res) {
    res.clearCookie('id');
    res.redirect("/");
  });


  
module.exports = router;
