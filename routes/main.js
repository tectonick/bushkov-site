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

  async function getLocalizedHtml(localeName, filename){
    return await fs.readFile(path.join(__dirname,'..',`/locales/html/${localeName}/${filename}`));
}


router.get("/", (req, res) => {
    var title =res.__('title');
    res.render('index.hbs', {title,signedIn:req.signedIn});
});



router.get("/violinist", async (req, res) => {
    var title =res.__('layout.navbar.violinist')+' | '+res.__('title');
    let localizedText= await getLocalizedHtml(req.locale, 'violinist.html');
    res.render('violinist.hbs', {title,signedIn:req.signedIn,localizedText});
});

router.get("/conductor", async (req, res) => {
    var title =res.__('layout.navbar.conductor')+' | '+res.__('title');
    let localizedText= await getLocalizedHtml(req.locale, 'conductor.html');
    res.render('conductor.hbs', {title,signedIn:req.signedIn,localizedText});
});


router.get("/teacher", async (req, res) => {
    var title =res.__('layout.navbar.teacher')+' | '+res.__('title');
    let localizedText= await getLocalizedHtml(req.locale, 'teacher.html');
    res.render('teacher.hbs', {title,signedIn:req.signedIn,localizedText});
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
    
    res.render('gallery.hbs', {title, images,signedIn:req.signedIn});
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
        res.render('concerts.hbs', {title, concerts,signedIn:req.signedIn});
    });

    
});

router.get("/contacts", (req, res) => {
    var title =res.__('layout.navbar.contacts')+' | '+res.__('title');
    res.render('contacts.hbs', {title,signedIn:req.signedIn});
});

router.get("/video", (req, res) => {
    var title =res.__('layout.navbar.video')+' | '+res.__('title');
    res.render('video.hbs', {title,signedIn:req.signedIn});
});







module.exports = router;
