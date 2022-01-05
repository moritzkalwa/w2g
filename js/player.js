var video;
var src;
var curLink;
var playing = false;

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
document.addEventListener('DOMContentLoaded', (event) => {
    video = document.getElementById('vid');
    src = document.getElementById('src');
    var form = document.getElementById("linkform");
    form.addEventListener('submit', updateVideo);
    video.onplay = playVideo;
    video.onpause = pauseVideo;
});

async function pauseVideo(e) {
  if(playing) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/playerchange", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        type: 'playingChange',
        playing: false,
        lastStop: + new Date()
    }));
    playing = false;
  }
}

async function playVideo(e) {
  if(!playing) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/playerchange", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        type: 'playingChange',
        playing: true,
        lastStop: + new Date()
      }));
      playing = true;
  }
}

async function updateVideo(e) {
    e.preventDefault();
    var link = document.getElementById('linkinput').value;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/playerchange", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        type: 'newVideo',
        video: link,
        lastStop: + new Date()
    }));
}

window.setInterval(() => {
  fetch('/playerData')
  .then((res) => {
    return res.json();
  })
  .then(async (res) => {
    if(res.video != null) {
      if(curLink != res.video) {
        await video.pause()
        src.setAttribute('src', '/video/'+res.video.hashCode());
        await video.load();
        if(playing)
        await video.play();
        curLink = res.video;
      }
    }
    if(res.playing != playing) {
      if(res.playing) {
        await video.play();
        playing = true;
      } else {
        await video.pause();
        playing = false;
      }
    }
    if(res.playing && new Date() - res.lastStop - video.currentTime*1000 > 1000) {
      video.currentTime = (new Date() - res.lastStop)/1000;
    }
  });
}, 3000);