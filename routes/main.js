const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const db = require("../db");
const bodyParser=require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false, limit:'50mb' });
const router = express.Router();

function DateToISOLocal(date) {
  // JS interprets db date as local and converts to UTC
  var localDate = date - date.getTimezoneOffset() * 60 * 1000;
  return new Date(localDate).toISOString().slice(0, 19);
}

async function getLocalizedHtml(localeName, filename) {
  return await fs.readFile(
    path.join(__dirname, "..", `/locales/html/${localeName}/${filename}`)
  );
}

router.get("/", (req, res) => {
  var title = res.__("title");
  res.render("index.hbs", { title, signedIn: req.signedIn });
});

router.get("/violinist", async (req, res) => {
  var title = res.__("layout.navbar.violinist") + " | " + res.__("title");
  let localizedText = await getLocalizedHtml(req.locale, "violinist.html");
  res.render("violinist.hbs", { title, signedIn: req.signedIn, localizedText });
});

router.get("/conductor", async (req, res) => {
  var title = res.__("layout.navbar.conductor") + " | " + res.__("title");
  let localizedText = await getLocalizedHtml(req.locale, "conductor.html");
  res.render("conductor.hbs", { title, signedIn: req.signedIn, localizedText });
});

router.get("/teacher", async (req, res) => {
  var title = res.__("layout.navbar.teacher") + " | " + res.__("title");
  let localizedText = await getLocalizedHtml(req.locale, "teacher.html");
  res.render("teacher.hbs", { title, signedIn: req.signedIn, localizedText });
});

router.get("/gallery", (req, res) => {
  var title = res.__("layout.navbar.gallery") + " | " + res.__("title");
  let images = [];
  fs.readdir(path.join(__dirname, "../static/img/gallery")).then((entries) => {
    entries.forEach((img) => {
      let name = path.parse(img).name;
      let src = path.join("/img/gallery/", img);
      images.push({ name, src });
    });
  });

  res.render("gallery.hbs", { title, images, signedIn: req.signedIn });
});

router.get("/concerts", (req, res) => {
  var title = res.__("layout.navbar.concerts") + " | " + res.__("title");
  db.query(
    "SELECT * FROM concerts WHERE hidden=FALSE AND date>=NOW() ORDER BY date",
    function (err, concerts) {
      if (err) console.log(err);

      concerts.forEach((concert) => {
        concert.imagesrc = path.join("/img/concerts/", concert.id + ".jpg");
        concert.date = DateToISOLocal(concert.date)
          .replace("T", " ")
          .slice(0, 16);
      });
      res.render("concerts.hbs", { title, concerts, signedIn: req.signedIn });
    }
  );
});

router.get("/blog", async (req, res) => {
  var title = res.__("layout.navbar.blog") + " | " + res.__("title");
  let posts = [
    { title: "title", text: "text", date: "date", tags: ["text", "poem"] },
    {
      title: "title2",
      text: "text2",
      date: "date2",
      tags: ["thoughts", "opinion", "music"],
    },
  ];
  res.render("blog.hbs", { title, posts, signedIn: req.signedIn });
});




var postsDB = [
  { id:1, title: "title", text: "text", date: "date", tags: ["text", "poem"] },
  {
    id:2,
    title: "title2",
    text: "text2",
    date: "date2",
    tags: ["thoughts", "opinion", "music"],
  },
  { id:3, title: "title3", text: "text", date: "date", tags: ["text", "poem"] },
  { id:4, title: "title4", text: "text", date: "date", tags: ["text", "poem"] },
  { id:5, title: "title5", text: "text", date: "date", tags: ["text", "poem"] },
  { id:6, title: "title6", text: "text", date: "date", tags: ["text", "poem"] },
  { id:7, title: "title7", text: "text", date: "date", tags: ["text", "poem"] },
  { id:8, title: "title8", text: "text", date: "date", tags: ["text", "poem"] },
];


router.post("/api/blog/add", urlencodedParser, async (req, res) => {
  let newPost={
    id:0,
    title:'',
    date:'',
    text:'',
    tags:[]   
  }
  postsDB.unshift(newPost);
  res.json({newPost});
});
router.post("/api/blog/delete", urlencodedParser, async (req, res) => {
  let indexToDelete=postsDB.findIndex((elem)=>{
    return elem.id==req.body.id;
  });
  postsDB.splice(indexToDelete,1);
  res.json({status:'deleted'});
});
router.post("/api/blog/save", urlencodedParser, async (req, res) => {
  let updatedPost={
    id:req.body.id,
    title:req.body.title,
    date:req.body.date,
    text:req.body.text,
    tags:req.body.tags.split(', ')   
  };
  let indexToReplace=postsDB.findIndex((elem)=>{ return elem.id==req.body.id;});
  postsDB.splice(indexToReplace,1,updatedPost);
  res.json({updatedPost});
});

router.get("/api/blog/posts", async (req, res) => {
  let from=req.query.from||0;
  let count=req.query.count||5;

let posts=[];
for (let i = from; i < from+count; i++) {
    if (i>=postsDB.length) {
        break;          
    }
    posts.push(postsDB[i]);      
}
res.json(posts);
});



router.get("/contacts", (req, res) => {
  var title = res.__("layout.navbar.contacts") + " | " + res.__("title");
  res.render("contacts.hbs", { title, signedIn: req.signedIn });
});

router.get("/video", (req, res) => {
  var title = res.__("layout.navbar.video") + " | " + res.__("title");
  res.render("video.hbs", { title, signedIn: req.signedIn });
});

module.exports = router;
