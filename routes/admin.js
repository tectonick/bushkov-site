const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const db = require("../db");
const { localesDir } = require("../services/locales");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({
  extended: false,
  limit: "50mb",
});
const imageProcessor = require("../services/image-processing");
const router = express.Router();

//Helpers
async function DeleteImageById(nameId, folder) {
  let imgToDel = path.join(__dirname, "..", folder, nameId + ".jpg");
  return fs.unlink(imgToDel);
}

function DateToISOLocal(date) {
  // JS interprets db date as local and converts to UTC
  let localDate = date - date.getTimezoneOffset() * 60 * 1000;
  return new Date(localDate).toISOString().slice(0, 19);
}

async function MakeDefaultImage(newId, folder) {
  let src = path.join(__dirname, "..", folder, "placeholder.jpg");
  let dest = path.join(__dirname, "..", folder, newId + ".jpg");
  return fs.copyFile(src, dest);
}

async function SaveTmpPoster(tmpfile, dstFolder, newId, thumbnailFolder) {
  let name = path.basename(tmpfile, path.extname(tmpfile));
  let dir = path.dirname(tmpfile);
  let src = path.join(dir, name + path.extname(tmpfile));
  let dst = path.join(__dirname, "../", dstFolder, newId + ".jpg");
  let dstThumbnail;
  await fs.copyFile(src, dst);
  if (thumbnailFolder) {
    dstThumbnail = path.join(__dirname, "../", thumbnailFolder, name + ".jpg");
    await fs.copyFile(src, dstThumbnail);
    await imageProcessor.smallImage(dstThumbnail);
  }
  await fs.unlink(src);
  if (tmpfile != src) {
    await fs.unlink(tmpfile);
  }
}

async function PosterUpload(fileToUpload, folder, id, imageProcessorFunction) {
  let tmpfile = path.join(__dirname, "..", "/tmp/", fileToUpload.name);
  await fileToUpload.mv(tmpfile);
  await imageProcessorFunction(tmpfile);
  return SaveTmpPoster(tmpfile, folder, id);
}

function FilesToArray(files) {
  let filesArray = [];
  if (!Array.isArray(files.files)) {
    filesArray.push(files.files);
  } else {
    filesArray = files.files;
  }
  return filesArray;
}

//Middleware
router.use(function (req, res, next) {
  if (req.signedIn) {
    next();
  } else {
    res.redirect("/login");
  }
});

//Routes
router.get("/", function (_req, res) {
  res.redirect("admin/login");
});

router.get("/text", async function (req, res) {
  let text = {};
  text.violinist = await fs.readFile(
    path.join(localesDir, "html", req.locale, "violinist.html")
  );
  text.conductor = await fs.readFile(
    path.join(localesDir, "html", req.locale, "conductor.html")
  );
  text.teacher = await fs.readFile(
    path.join(localesDir, "html", req.locale, "teacher.html")
  );
  res.render("admin/text", { text, signedIn: req.signedIn });
});

router.get("/blog", async function (req, res) {
  res.render("admin/blog", { signedIn: req.signedIn });
});

router.post("/text", urlencodedParser, async function (req, res) {
  await fs.writeFile(
    path.join(localesDir, "html", req.locale, "violinist.html"),
    req.body.violinist_text
  );
  await fs.writeFile(
    path.join(localesDir, "html", req.locale, "conductor.html"),
    req.body.conductor_text
  );
  await fs.writeFile(
    path.join(localesDir, "html", req.locale, "teacher.html"),
    req.body.teacher_text
  );
  res.redirect("text");
});

router.get("/concerts", function (req, res) {
  let title = "Admin" + " | " + res.__("title");

  db.query(
    "SELECT * FROM concerts WHERE hidden=FALSE ORDER BY date",
    function (err, concerts) {
      if (err) console.log(err);

      concerts.forEach((concert) => {
        concert.imagesrc = path.join("/img/concerts/", concert.id + ".jpg");
        concert.date = DateToISOLocal(concert.date);
      });
      res.render("admin/concerts", { title, concerts, signedIn: req.signedIn });
    }
  );
});

router.post("/concerts/delete", urlencodedParser, (req, res) => {
  db.query(`DELETE FROM concerts WHERE id=${req.body.id}`, function (err) {
    if (err) console.log(err);
    DeleteImageById(req.body.id, "/static/img/concerts/").then(() => {
      res.render("admin/concerts", { signedIn: req.signedIn });
    });
  });
});

router.post("/concerts/add", urlencodedParser, (_req, res) => {
  db.query(
    `INSERT INTO concerts VALUES (0,'','1970-01-01 00:00:00','', '',0)`,
    function (err, results) {
      if (err) console.log(err);
      MakeDefaultImage(results.insertId, "/static/img/concerts/").then(
        function () {
          res.redirect("/admin/concerts");
        }
      );
    }
  );
});

router.post("/concerts/edit", urlencodedParser, (req, res) => {
  let date = req.body.date.slice(0, 19).replace("T", " ");
  let hidden = typeof req.body.hidden == "undefined" ? 0 : 1;
  db.query(
    `UPDATE concerts SET title = '${req.body.title}', \
    date = '${date}', place = '${req.body.place}',\
    hidden = '${hidden}', \
    description = '${req.body.description}' WHERE ${req.body.id}=id;`,
    function (err) {
      if (err) {
        console.log(err);
        res.sendStatus(400);
      } else {
        res.sendStatus(200);
      }
    }
  );
});

router.post("/concerts/posterupload", urlencodedParser, async (req, res) => {
  await PosterUpload(
    req.files.fileToUpload,
    "/static/img/concerts/",
    req.body.id,
    imageProcessor.posterImage
  );
  res.redirect("/admin/concerts");
});

router.get("/gallery", async (req, res) => {
  let title = res.__("layout.navbar.gallery") + " | " + res.__("title");
  let images = [];
  let entries = await fs.readdir(path.join(__dirname, "../static/img/gallery"));
  entries.forEach((img) => {
    let name = path.parse(img).name;
    let encodedName = encodeURIComponent(name);
    let src = `/img/gallery/${encodedName}.jpg`;
    let thumbnailSrc = `/img/thumbnails/gallery/${encodedName}.jpg`;
    images.push({ name, src, thumbnailSrc });
  });
  res.render("admin/gallery.hbs", { title, images, signedIn: req.signedIn });
});

router.post("/gallery/delete", urlencodedParser, (req) => {
  fs.unlink(
    path.join(
      __dirname,
      "../",
      "/static/img/gallery",
      req.body.filename + ".jpg"
    )
  );
  fs.unlink(
    path.join(
      __dirname,
      "../",
      "/static/img/thumbnails/gallery/",
      req.body.filename + ".jpg"
    )
  );
});

router.post("/gallery/upload", urlencodedParser, async (req, res) => {
  if (!req.files) {
    return res.status(400);
  }
  let files = FilesToArray(req.files);
  for (const fileToUpload of files) {
    let tmpfile = path.join(__dirname, "..", "/tmp/", fileToUpload.name);
    await fileToUpload.mv(tmpfile);
    await imageProcessor.galleryImage(tmpfile);
    let name = path.basename(tmpfile, path.extname(tmpfile));
    await SaveTmpPoster(
      tmpfile,
      "/static/img/gallery/",
      name,
      "/static/img/thumbnails/gallery/"
    );
  }
  res.redirect("/admin/gallery");
});

module.exports = router;
