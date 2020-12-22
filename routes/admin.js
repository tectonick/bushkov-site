const express = require("express");
const fs=require('fs').promises;
const path=require("path");
const db=require('../db');

const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const imageProcessor = require("../image-processing");

const router = express.Router();



async function NamesOfDirFilesWOExtension(basepath){
  var names=[];
  var realpath=path.join(__dirname,'../', basepath);
  
  var files = await fs.readdir(realpath);
    files.forEach(file => {
      names.push(path.basename(file, ".jpg"));                 
    });
 
    
  return names;
}




//Helpers
async function DeleteImageById(nameId, folder){
  let imgToDel = path.join(__dirname, '..', folder, nameId + ".jpg");
  return fs.unlink(imgToDel); 
}
function DateToISOLocal(date){
  // JS interprets db date as local and converts to UTC
  var localDate = date - date.getTimezoneOffset() * 60 * 1000;
  return new Date(localDate).toISOString().slice(0, 19);  
}
async function MakeDefaultImage(newId, folder){  
  let src = path.join(__dirname, '..', folder, "placeholder.jpg");
  let dest = path.join(__dirname, '..', folder, newId  + ".jpg");
  return fs.copyFile(src, dest);  
}

async function SaveTmpPoster(tmpfile, dstFolder, newId, thumbnailFolder){
  let name = path.basename(tmpfile, path.extname(tmpfile));
  let dir = path.dirname(tmpfile);
  let src = path.join(dir,  name+ '.jpg');
  let dst=path.join(__dirname,'../',dstFolder, newId + ".jpg");
  var dstThumbnail;
  if (thumbnailFolder){
    var dstThumbnail=path.join(__dirname,'../',thumbnailFolder, name + '.jpg');
  }

  return fs.copyFile(src, dst)
  .then(()=>{
    if (thumbnailFolder){return fs.copyFile(src, dstThumbnail)}
  })
  .then(()=>{
    if (thumbnailFolder){return imageProcessor.smallImage(dstThumbnail)}    
  })
  .then(()=>{ return fs.unlink(src);})
  .then(()=>{
    if (tmpfile!=src){
      return fs.unlink(tmpfile);
    }
  });
}



async function PosterUpload(fileToUpload, folder, id, imageProcessorFunction){
  let tmpfile = path.join(__dirname, '..', '/tmp/', fileToUpload.name);
  await fileToUpload.mv(tmpfile);
  await imageProcessorFunction(tmpfile);
  return SaveTmpPoster(tmpfile,folder, id);
}

function FilesToArray(files){
  var filesArray=[];
  if (!Array.isArray(files.files)) {
    filesArray.push(files.files);
  } else {
    filesArray = files.files;
  } 
  return filesArray;
}





  //Middleware


  router.use(function (req, res, next) {
    if (req.signedIn){
      next();
    } else {
      res.redirect('/login');
    }
  });
  

//Routes
router.get('/', function (req, res) {
  res.redirect("admin/login");
});

router.get('/concerts', function (req, res) {
    var title ='Admin'+' | '+res.__('title');

    db.query('SELECT * FROM concerts WHERE hidden=FALSE ORDER BY date',
    function (err, concerts) {
        if (err) console.log(err);
        
        concerts.forEach((concert)=>{
            concert.imagesrc=path.join('/img/concerts/',concert.id+'.jpg');
            //concert.date=concert.date.toString().slice(0,21);
            concert.date= DateToISOLocal(concert.date); 
        })
        res.render("admin/concerts", { title, concerts,signedIn:req.signedIn});
    });


  });
  






router.post("/concerts/delete", urlencodedParser, (req, res) => {
  db.query(`DELETE FROM concerts WHERE id=${req.body.id}`,
    function (err, results) {
      if (err) console.log(err);
      DeleteImageById(req.body.id, '/static/img/concerts/').then(()=>{
        res.render('admin/concerts', {signedIn:req.signedIn});
      });      
    });
});


router.post("/concerts/add", urlencodedParser, (req, res) => {
  db.query(`INSERT INTO concerts VALUES (0,'','1970-01-01 00:00:00','', '',0)`,
    function (err, results) {
      if (err) console.log(err);
      MakeDefaultImage(results.insertId, '/static/img/concerts/').then(function(){
        res.redirect("/admin/concerts");
      });
    });
});

router.post("/concerts/edit", urlencodedParser, (req, res) => {
  var date = req.body.date.slice(0, 19).replace('T', ' ');
  let hidden= ((typeof req.body.hidden)=='undefined')?0:1;
  db.query(`UPDATE concerts SET title = '${req.body.title}', \
    date = '${date}', place = '${req.body.place}',\
    hidden = '${hidden}', \
    description = '${req.body.description}' WHERE ${req.body.id}=id;`,
    function (err, results) {
      if (err) {
        console.log(err);
        res.sendStatus(400);
      } else {
        res.sendStatus(200);
      }
    });
});


router.post("/concerts/posterupload", urlencodedParser, async (req, res) => {
  await PosterUpload(req.files.fileToUpload, '/static/img/concerts/', req.body.id, imageProcessor.posterImage);
  res.redirect('/admin/concerts'); 
});










router.get("/gallery", async (req, res) => {
  var title =res.__('layout.navbar.gallery')+' | '+res.__('title');
  let images=[];
  fs.readdir(path.join(__dirname,"../static/img/gallery")).then((entries)=>{
      entries.forEach((img)=>{
          let name=path.parse(img).name;
          let src=path.join('/img/gallery/',img);
          images.push({name, src});
      });
      
  });
  res.render('admin/gallery.hbs', { images, signedIn:req.signedIn});
});

router.post("/gallery/delete", urlencodedParser, (req, res) => {
  fs.unlink(path.join(__dirname, '../', '/static/', req.body.filename));
  fs.unlink(path.join(__dirname, '../', '/static/img/thumbnails/gallery/', req.body.filename));
});

router.post("/gallery/upload", urlencodedParser, (req, res) => {
  if (!req.files) {return res.status(400);}
  var files = FilesToArray(req.files);
  files.forEach((fileToUpload) => {
    let tmpfile = path.join(__dirname, '..', '/tmp/', fileToUpload.name);
    fileToUpload.mv(tmpfile, function (err) {
      imageProcessor.galleryImage(tmpfile).then(()=>{
        let name = path.basename(tmpfile, path.extname(tmpfile));
        return SaveTmpPoster(tmpfile, '/static/img/gallery/', name, '/static/img/thumbnails/gallery/');
      });
    });
  });    
  res.redirect('/admin/gallery');
});






  
module.exports = router;
