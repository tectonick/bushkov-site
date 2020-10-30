const express = require("express");

const router = express.Router();


router.get("/", (req, res) => {
    var title =res.__('title');
    res.render('index.hbs', {title});
});

router.get("/violinist", (req, res) => {
    var title =res.__('layout.navbar.violinist')+' | '+res.__('title');
    res.render('violinist.hbs', {title});
});

router.get("/conductor", (req, res) => {
    var title =res.__('layout.navbar.conductor')+' | '+res.__('title');
    res.render('conductor.hbs', {title});
});


router.get("/teacher", (req, res) => {
    var title =res.__('layout.navbar.teacher')+' | '+res.__('title');
    res.render('teacher.hbs', {title});
});

router.get("/gallery", (req, res) => {
    var title =res.__('layout.navbar.gallery')+' | '+res.__('title');
    res.render('gallery.hbs', {title});
});

router.get("/concerts", (req, res) => {
    var title =res.__('layout.navbar.concerts')+' | '+res.__('title');
    res.render('concerts.hbs', {title});
});

router.get("/contacts", (req, res) => {
    var title =res.__('layout.navbar.contacts')+' | '+res.__('title');
    res.render('contacts.hbs', {title});
});




module.exports = router;
