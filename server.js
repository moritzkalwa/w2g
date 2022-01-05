const port = 80;
const secure = false;

function md5(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}

function makeid() {
    var length = 10;
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

function resPartial(req, res, video) {
    var file = 'downloads/' + md5(video);
    fs.stat(file, function(err, stats) {
        if (err) {
            if (err.code === 'ENOENT') {
            return res.sendStatus(404);
            }
            res.end(err);
        }
        var range = req.headers.range;
        if (!range) {
            return res.sendStatus(416);
        }
        var positions = range.replace(/bytes=/, "").split("-");
        var start = parseInt(positions[0], 10);
        var total = stats.size;
        var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
        var chunksize = (end - start) + 1;
        if(end >= 0 && end < total) {
            res.writeHead(206, {
                "Content-Range": "bytes " + start + "-" + end + "/" + total,
                "Accept-Ranges": "bytes",
                "Content-Length": chunksize,
                "Content-Type": "video/mp4"
            });

            var stream = fs.createReadStream(file, { start: start, end: end })
                .on("open", function() {
                stream.pipe(res);
                }).on("error", function(err) {
                res.end(err);
                });
        } else {
            console.log('weird');
        };
    });
}

String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
      chr   = this.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };

const express = require('express');
const bodyParser = require('body-parser');
const app = new express();
const ytdl = require('ytdl-core')
const fs = require('fs')
const session = require('express-session');
const crypto = require('crypto');
app.use(session(
{
    secret: md5('thisisasecuresecret!!!1293898HHkwejk++'),
    cookie: {
        secure: secure,
        maxAge: 5184000000 // 60 days
    }
}
));
app.use(bodyParser.urlencoded({ extended: true }));
app.use( bodyParser.json() );

rooms = {};

app.get('/', function(req, res){
    res.sendFile(__dirname + '/sites/index.html');
});

app.post('/createroom/', (req, res) => {
    var id = makeid();
    rooms.id = {video: null, playing:true, lastStop:+ new Date()};
    res.redirect('/room/' + id);
});

app.post('/playerchange', (req, res) => {
    var type = req.body.type;
    var id = req.session.id;
    switch(type) {
        case 'newVideo':
            rooms.id.video = req.body.video;
            rooms.id.lastStop = req.body.lastStop;
            break;
        case 'playingChange':
            rooms.id.playing = req.body.playing;
            rooms.id.lastStop = req.body.lastStop;
            break;
        default:
            console.log('Hm, this is weird.');
            break;
    }
});

app.get('/room/:id', (req, res) => {
    var id = req.params.id;
    ses = req.session;
    ses.id = id;
    res.sendFile('/sites/room.html', { root: __dirname });
});

app.get('/js/:name', function(req, res) {
    var name = req.params.name;
    res.sendFile('/js/' + name, { root: __dirname });
});

app.get('/css/:name', function(req, res) {
    var name = req.params.name;
    res.sendFile('/css/' + name, { root: __dirname });
});

app.get('/playerData', (req, res) => {
    var id = req.session.id;
    var room = rooms.id;
    res.send(JSON.stringify(room));
});

app.get("/video/:rand", function (req, res) {
    var id = req.session.id;
    var video = rooms.id.video;
    console.log(req.session.id)
    if(!video) {
        video = "https://www.youtube.com/watch?v=Obgnr9pc820";
    }
    if(fs.existsSync('downloads/' + md5(video))) {
        resPartial(req, res, video);
    } else {
        var myFile = fs.createWriteStream('downloads/' + md5(video));
        ytdl(video)
        .on("response", response => {
            console.log(response.headers["content-length"]);
        })
        .pipe(myFile)
        .on("finish", () => {
            resPartial(req, res, video);
        });
    }
  });

app.listen(port, () => {})
  
