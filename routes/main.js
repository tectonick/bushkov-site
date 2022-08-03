const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const db = require("../db");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({
  extended: false,
  limit: "50mb",
});
const router = express.Router();

function DateToISOLocal(date) {
  // JS interprets db date as local and converts to UTC
  let localDate = date - date.getTimezoneOffset() * 60 * 1000;
  return new Date(localDate).toISOString().slice(0, 19);
}

async function getLocalizedHtml(localeName, filename) {
  return fs.readFile(
    path.join(__dirname, "..", `/locales/html/${localeName}/${filename}`)
  );
}

router.get("/", (req, res) => {
  let title = res.__("title");
  res.render("index.hbs", { title, signedIn: req.signedIn });
});

router.get("/violinist", async (req, res) => {
  let title = res.__("layout.navbar.violinist") + " | " + res.__("title");
  let localizedText = await getLocalizedHtml(req.locale, "violinist.html");
  res.render("violinist.hbs", { title, signedIn: req.signedIn, localizedText });
});

router.get("/conductor", async (req, res) => {
  let title = res.__("layout.navbar.conductor") + " | " + res.__("title");
  let localizedText = await getLocalizedHtml(req.locale, "conductor.html");
  res.render("conductor.hbs", { title, signedIn: req.signedIn, localizedText });
});

router.get("/teacher", async (req, res) => {
  let title = res.__("layout.navbar.teacher") + " | " + res.__("title");
  let localizedText = await getLocalizedHtml(req.locale, "teacher.html");
  res.render("teacher.hbs", { title, signedIn: req.signedIn, localizedText });
});

router.get("/gallery", async (req, res) => {
  let title = res.__("layout.navbar.gallery") + " | " + res.__("title");
  let images = [];
  let entries = await fs.readdir(path.join(__dirname, "../static/img/gallery"));
  entries.forEach((img) => {
    let name = path.parse(img).name;
    let src = `/img/gallery/${encodeURIComponent(name)}.jpg`;
    images.push({ name, src });
  });

  res.render("gallery.hbs", { title, images, signedIn: req.signedIn });
});

router.get("/concerts", (req, res) => {
  let title = res.__("layout.navbar.concerts") + " | " + res.__("title");
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
  let title = res.__("layout.navbar.blog") + " | " + res.__("title");
  res.render("blog.hbs", { title, signedIn: req.signedIn });
});

router.post("/api/blog/add", urlencodedParser, async (_req, res) => {
  let newPost = {
    id: 0,
    title: "",
    text: "",
    date: DateToISOLocal(new Date()),
    tags: "",
    hidden: 0,
  };
  db.query(
    `INSERT INTO posts VALUES (${newPost.id},'${newPost.title}','${newPost.text}','${newPost.date}', '${newPost.tags}', ${newPost.hidden})`,
    function (err) {
      if (err) console.log(err);
      res.json({ newPost });
    }
  );
});
router.post("/api/blog/delete", urlencodedParser, async (req, res) => {
  db.query(`DELETE FROM posts WHERE id=${req.body.id}`, function (err) {
    if (err) console.log(err);
    res.json({ status: "deleted" });
  });
});

router.post("/api/blog/save", urlencodedParser, async (req, res) => {
  let updatedPost = {
    id: req.body.id,
    title: req.body.title,
    date: req.body.date.slice(0, 19).replace("T", " "),
    text: req.body.text,
    tags: req.body.tags,
    hidden: typeof req.body.hidden == "undefined" ? 0 : 1,
  };

  db.query(
    `UPDATE posts SET title = '${updatedPost.title}', \
    date = '${updatedPost.date}', text = '${updatedPost.text}',\
    hidden = '${updatedPost.hidden}', \
    tags = '${updatedPost.tags}' WHERE ${updatedPost.id}=id;`,
    function (err) {
      if (err) {
        console.log(err);
        res.sendStatus(400);
      } else {
        res.json({ updatedPost });
      }
    }
  );
});

router.get("/api/blog/posts", async (req, res) => {
  let from = req.query.from || 0;
  let count = req.query.count || 5;
  let tag = req.query.tag || "%";

  db.query(
    `SELECT * FROM posts WHERE hidden=FALSE AND date>='1970-01-01' AND tags LIKE '%${tag}%' ORDER BY date DESC LIMIT ${count} OFFSET ${from}`,
    function (err, posts) {
      if (err) console.log(err);
      posts.forEach((post) => {
        post.tags = post.tags.split(", ");
        post.date = DateToISOLocal(post.date).replace("T", " ").slice(0, 16);
      });
      res.json(posts);
    }
  );
});

router.get("/contacts", (req, res) => {
  let title = res.__("layout.navbar.contacts") + " | " + res.__("title");
  res.render("contacts.hbs", { title, signedIn: req.signedIn });
});

router.get("/video", (req, res) => {
  let title = res.__("layout.navbar.video") + " | " + res.__("title");
  res.render("video.hbs", { title, signedIn: req.signedIn });
});

module.exports = router;
