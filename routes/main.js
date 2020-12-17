const express = require("express");
const fs=require('fs').promises;
const path=require("path");
const db=require('../db');

const router = express.Router();



function DateToISOLocal(date){
    // JS interprets db date as local and converts to UTC
    var localDate = date - date.getTimezoneOffset() * 60 * 1000;
    return new Date(localDate).toISOString().slice(0, 19);  
  }




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
    let images=[];
    fs.readdir(path.join(__dirname,"../static/img/gallery")).then((entries)=>{
        entries.forEach((img)=>{
            let name=path.parse(img).name;
            let src=path.join('/img/gallery/',img);
            images.push({name, src});
        });
        
    });
    
    res.render('gallery.hbs', {title, images});
});

router.get("/concerts", (req, res) => {
    var title =res.__('layout.navbar.concerts')+' | '+res.__('title');
    db.query('SELECT * FROM concerts WHERE hidden=FALSE AND date>=NOW() ORDER BY date',
    function (err, concerts) {
        if (err) console.log(err);
        
        concerts.forEach((concert)=>{
            concert.imagesrc=path.join('/img/concerts/',concert.id+'.jpg');
            //concert.date=concert.date.toString().slice(0,21);
            concert.date= DateToISOLocal(concert.date).replace('T'," ").slice(0, 16);           
        })
        res.render('concerts.hbs', {title, concerts});
    });

    
});

router.get("/contacts", (req, res) => {
    var title =res.__('layout.navbar.contacts')+' | '+res.__('title');
    res.render('contacts.hbs', {title});
});








module.exports = router;
