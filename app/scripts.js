function id(id) {
  return document.getElementById(id); }

const fs = require('fs-extra');
const {app, globalshortcut, ipcRenderer} = require('electron');
const Mousetrap = require('mousetrap');
const { Howler } = require('howler');
const { ExifTool } = require('exiftool-vendored');
const Exif = new ExifTool();
// const jsmediatags = window.jsmediatags;


// Declaring Variables
var speedChanger = id("speed-changer");
var volumeChanger = id("volume-changer");
var audio;
var speed = speedChanger.value;
var vol = volumeChanger.value;
var playing = 0;
var currentSong = 1;
localStorage.setItem('currentSong', '1');

// Send message to main process to get the string data
ipcRenderer.send('get-data');

// Handle the 'send-data' channel message from main process
ipcRenderer.on('send-data', (event, data) => {
  // Use the string data received here
  console.log(data);
  var musicFolder = data;
  if (localStorage.getItem('folder') === null) {
    localStorage.setItem('folder', musicFolder);
  }
});


// Howler Settings
Howler.autoSuspend = true;
Howler.volume(vol);


// Speed controls
var speedometer = id("speedometer");
speedometer.innerHTML = speedChanger.value;
speedChanger.oninput = function() {
  speed = speedChanger.value;
  if (audio !== undefined) {
    audio.rate(speed);
  }
  localStorage.setItem("speed", speed);
  speedometer.innerHTML = this.value;
  updateBitrate(); }

// initialize speed from last session
speed = localStorage.getItem("speed");
speedometer.innerHTML = speed;
speedChanger.value = speed;

// Volume controls
var volumometer = id("volumometer");
volumometer.innerHTML = volumeChanger.value;
volumeChanger.oninput = function() {
  vol = volumeChanger.value;
  Howler.volume(vol);
  localStorage.setItem("volume", vol);
  volumometer.innerHTML = this.value; }

// initialize volume from last session
vol = localStorage.getItem("volume");
Howler.volume(vol);
volumometer.innerHTML = vol;
volumeChanger.value = vol;

function waitToSetSrc() {
  let lock = 1;
  setTimeout(lock = 0, 1000);
  setTimeout(c, 1100);
  function c() {
    if (lock == 0) {
      return true; }
    else if (lock == 1) {
      return false; } } }

// What happens when user clicks on a song
const setSrc = async (number) => {
  const result = await waitToSetSrc();
  if (audio != undefined) {
    audio.unload();
    stopSong(); }
  if (id(currentSong)) {
    id(currentSong).classList.remove('active-playing'); }

  song = id(number).getAttribute('path');
  songName = id(number).getAttribute('fileName');
  audio = new Howl({ src: [song], rate:speed}); //added html5:true to better handle large files // MASSIVE speedup for long tracks //nvm this breaks pitch change *sigh* //WHY do people prefer terrible audio quality with preserved pitch over normal rate changes?????
  currentSong = number;
  filetype = id(number).getAttribute('filetype');
  const metadata = await Exif.read(song);
  console.log(metadata);
  console.log(metadata.AvgBitrate);
  // Exif.end(); // This might be needed but implemented another way

  id('now-playing').innerHTML = songName; // mark active track with css
  id(number).className += ' active-playing';
  setEmblem(filetype);
  showBitrate(filetype, metadata);
  // playButton();
  //setTimeout(() => {initSeeker();}, 2000); } //Removed in favour of audio.once
  audio.once('load', function() {
    playButton();
    initSeeker();
    updateSeeker();
  }); }

// Play and Pause functions
function playSong() {
  audio.fade(0, vol, 70);
  audio.play();
  playing = 1; }

function pauseSong() {
  var windingDown;
  audio.fade(vol, 0, 70);
  setTimeout(() => { windingDown = false; }, 70);
  setTimeout(() => { audio.pause(); }, 70);
  playing = 0; }

// Play button behaviour
function playButton() {
  if (typeof audio !== 'undefined') {
    if (playing === 0) {
      playSong();
      //id('play-button-text').innerHTML = '⏸';
      id("play-button-icon").style.display = 'none';
      id("pause-button-icon").style.display = ''; }
    else {
      pauseSong();
      //id('play-button-text').innerHTML = '▶️';
      id("play-button-icon").style.display = '';
      id("pause-button-icon").style.display = 'none'; } } }

// Stop the song and undefine audio
function stopSong() {
  if (audio) {
    audio.stop();
    playing = 0;
    audio.unload();
    audio = undefined;
    //id('play-button-text').innerHTML = '▶️';
    id("play-button-icon").style.display = '';
    id("pause-button-icon").style.display = 'none';
    id('now-playing').innerHTML = '';
    id('seeker').value = 0;
    id('seeker').max = 0;
    id('song-duration').innerHTML = '0';
    id('seekometer').innerHTML = '0'; } }


// Previous Song
function prevSong() {
  w = parseInt(localStorage.getItem('w'));
  //console.log('First number was ' + currentSong);
  id(currentSong).classList.remove('active-playing');
  if (currentSong == 1) {
    currentSong = w - 1; } else {
    currentSong --; }
  //console.log('New number is ' + currentSong);
  id(currentSong).className += ' active-playing';
  localStorage.setItem('currentSong', currentSong);
  let song = id(currentSong).getAttribute('path');
  setSrc(currentSong); }

// Next Song
function nextSong() {
  w = parseInt(localStorage.getItem('w'));
  //console.log('First number was ' + currentSong);
  id(currentSong).classList.remove('active-playing');
  if (currentSong == w - 1) {
    currentSong = 1; } else {
    currentSong ++; }
  //console.log('New number is ' + currentSong);
  id(currentSong).className += ' active-playing';
  localStorage.setItem('currentSong', currentSong);
  let song = id(currentSong).getAttribute('path');
  setSrc(currentSong); }

// Get / Set position in song
var seeker = id("seeker");
seekometer.innerHTML = seeker.value;
seeker.oninput = function() {
  s = seeker.value;
  if (audio !== undefined) {
    audio.seek(s); }
  t = Math.round(s);
  seekometer.innerHTML = t; }

function updateSeeker() {
  seeker = id('seeker');
  function u() {
    if (audio != undefined || audio != null) {
      seeker.value = audio.seek();
      s = seeker.value;
      t = Math.round(s);
      d = audio.duration();
      h = Math.round(d);
      //q = toTime(t);
      seekometer.innerHTML = t;
      if (t == h && h != 0 && localStorage.getItem('AutoPlay') == 'yes') {
        nextSong(); // Something is weird here
        console.log('playing next song'); } } }
  setInterval(u, 1);
  if (audio) {
    audio.on('end'), function () { console.log('song ended'); } } }

function initSeeker() {
  seeker = id('seeker');
  let l = audio.duration();
  seeker.max = l;
  i = Math.round(l)
  k = toTime(i);
  // console.log(k);
  id('song-duration').innerHTML = k; }

function toggleAutoPlay() {
  if (localStorage.getItem('AutoPlay') == 'yes') {
    localStorage.setItem('AutoPlay', 'no');
    id('toggle-auto-play').className = 'disabled'; } else {
    localStorage.setItem('AutoPlay', 'yes');
    id('toggle-auto-play').className = 'enabled'; } }

function initEnabled() {
  if (localStorage.getItem('AutoPlay') == 'no') {
    id('toggle-auto-play').className = 'disabled'; } else {
    id('toggle-auto-play').className = 'enabled'; } }

/* // Who needs the time told in minutes anyway?
function timeify(i) {
  if (i >= 60 && i <= 119) {
    console.log(i);
    n = i -= 60;
    console.log(n);
    return '1:' + n; }
  else if (i >= 120) {
    console.log(i);
    n = i -= 120;
    console.log(n);
    return '2:' + n; } }
*/

function toTime(i) {
  var min = 0;
  var sec = 0;
  var time = '';
  if (audio) {
    while ((i / 60) > 1) {
      i -= 60;
      min++; }
    sec = i;
    if (sec.toString().length == 1) {
      sec = '0' + sec;
    }
    time = min + ':' + sec;
    return time; } }

Mousetrap.addKeycodes({
    164: 'play' });   // Not working (?)

// Add keypress functions
Mousetrap.bind('space', function() {
  id('play-button').click();
  return false; });
Mousetrap.bind('k', function() {
  id('play-button').click();
  return false; });
Mousetrap.bind('q', function() {
  volumeChanger.value = parseFloat((volumeChanger.value * 10) - 0.1 * 10) / 10;
  //console.log('Volume is now ' + vol);
  volumometer.innerHTML = volumeChanger.value;
  vol = volumeChanger.value;
  Howler.volume(vol);
  localStorage.setItem("volume", vol);
  return false; });
Mousetrap.bind('w', function() {
  volumeChanger.value = parseFloat((volumeChanger.value * 10) + 0.1 * 10) / 10;
  //console.log('Volume is now ' + vol);
  volumometer.innerHTML = volumeChanger.value;
  vol = volumeChanger.value;
  Howler.volume(vol);
  localStorage.setItem("volume", vol);
  return false; });
Mousetrap.bind('[', function() {
  speedChanger.value = parseFloat((speedChanger.value * 10) - 0.05 * 10) / 10;
  //console.log('Speed is now ' + speedChanger.value);
  speedometer.innerHTML = speedChanger.value;
  speed = speedChanger.value;
  if (audio !== undefined) {
    audio.rate(speed); }
  localStorage.setItem("speed", speed);
  return false; });
Mousetrap.bind(']', function() {
  speedChanger.value = parseFloat((speedChanger.value * 10) + 0.05 * 10) / 10;
  //console.log('Speed is now ' + speedChanger.value);
  speedometer.innerHTML = speedChanger.value;
  speed = speedChanger.value;
  if (audio !== undefined) {
    audio.rate(speed); }
  localStorage.setItem("speed", speed);
  return false; });
Mousetrap.bind("'", function() {
  speedChanger.value = parseFloat((speedChanger.value * 10) - 0.01 * 10) / 10;
  //console.log('Speed is now ' + speedChanger.value);
  speedometer.innerHTML = speedChanger.value;
  speed = speedChanger.value;
  if (audio !== undefined) {
    audio.rate(speed); }
  return false; });
Mousetrap.bind("\\", function() {
  speedChanger.value = parseFloat((speedChanger.value * 10) + 0.01 * 10) / 10;
  //console.log('Speed is now ' + speedChanger.value);
  speedometer.innerHTML = speedChanger.value;
  speed = speedChanger.value;
  if (audio !== undefined) {
    audio.rate(speed); }
  return false; });
Mousetrap.bind('f', function(){
  prevSong();
  return false; });
Mousetrap.bind('j', function(){
  nextSong();
  return false; });
Mousetrap.bind('play', function() {
  id('play-button').click();
  return false; });
Mousetrap.bind('r', function(){
  refreshApp();
});
Mousetrap.bind('a', function(){
  toggleAutoPlay();
});

Mousetrap.bind('1', function(){
  setPlaylist(Playlist_1);
  highlightPlaylist(1);
});
Mousetrap.bind('2', function(){
  setPlaylist(Playlist_2);
  highlightPlaylist(2);
});
Mousetrap.bind('3', function(){
  setPlaylist(Playlist_3);
  highlightPlaylist(3);
});
Mousetrap.bind('4', function(){
  setPlaylist(Playlist_4);
  highlightPlaylist(4);
});
Mousetrap.bind('5', function(){
  setPlaylist(Playlist_5);
  highlightPlaylist(5);
});
Mousetrap.bind('6', function(){
  setPlaylist(Playlist_6);
  highlightPlaylist(6);
});
Mousetrap.bind('`', function(){
  setPlaylist(Playlist_0);
  highlightPlaylist(0);
});
Mousetrap.bind('0', function(){
  setPlaylist(Playlist_0);
  highlightPlaylist(0);
});

function highlightPlaylist(n) {
  for (let i = 0; i < 7; i++) {
    id('Playlist_' + i).classList.remove('enabled');
  }
  id('Playlist_' + n).className = 'enabled';
}

// Where to get files from
var folder;
if (localStorage.getItem('folder') !== null) {
  folder = localStorage.getItem('folder') + "/"; } else {
  folder = "/home/daniel/Music/"; }
var w = 1;
var q;

// 6 Playlists
var Playlist_0 = "/"
var Playlist_1 = "/1/";
var Playlist_2 = "/2/";
var Playlist_3 = "/3/";
var Playlist_4 = "/4/";
var Playlist_5 = "/5/";
var Playlist_6 = "/6/";

function setPlaylist(number) {
 folder = localStorage.getItem('folder') + number;
 refreshSongs();

}

function setNewFolder() {
  var path = dialog.showOpenDialog({
    properties: ['openDirectory']
  });
}


// List all files in variable 'folder' and make buttons for them
function listSongs() {
  console.log("Starting to list files in directory " + folder);
  let output = id("listing");
  let fileName;

  fs.readdir(folder, function(err, files) {
    if (err) {
      return console.error(err); }

    files.forEach( function (file) {
      // Debugging
      //console.log("Current src: " + folder + file);
      // Here We Create the list of all the songs

      // Check whether the file is audio
      //console.log(file);
      // extract last 3 characters of file names
      let e = file.slice(-3);
      // console.log(e);
      if (file.slice(-4, -3) == '.') {
        // console.log(file.slice(-4));
        var fileName = file.slice(0, -4);
        var filetype = file.slice(-3);
        // console.log(fileName);
      } else if (file.slice(-5, -4) == '.') {
        // console.log(file.slice(-5));
        var fileName = file.slice(0, -5);
        var filetype = file.slice(-4);
        // console.log(fileName);
      } else {
        console.warn(file + ' might not be a supported file! File extension not 3 or 4 characters long!');
      }

      if (e == 'mp3' || e == 'm4a' || e == 'wav' || e == 'lac' || e == 'ogg' || e == 'aac' || e == 'mp4' || e == 'pus' || e == 'iff') {
        let item = document.createElement("li");
        let button = document.createElement("button");
        button.setAttribute('number', w);
        button.setAttribute('id', w);
        item.appendChild(button);
        button.setAttribute('class', 'list-item');
        // console.log('fileName is ' + fileName);
        button.innerHTML = fileName;
        button.setAttribute('onclick', 'setSrc(' /*+ '"' + folder + file + '"' + ','*/ + w + ');');
        button.setAttribute('path',  folder + file);
        button.setAttribute('short-path', file);
        button.setAttribute('fileName', fileName);
        button.setAttribute('filetype', filetype);
        output.appendChild(item);
        w++;
        localStorage.setItem('w', w); } }); });
  console.log("Finished listing files"); }

// Refresh the files -without refreshing the whole application- ( <--- That's a lie, it reloads the whole application )
function refreshSongs() {
  let output = id("listing");
  listing.innerHTML = '';
  listSongs();
  //window.location.reload(true); // Is this really needed?
}

function refreshApp() {
  window.location.reload(true);
}

// Obsolete :D
// Keeping for future reference
/*
document.getElementById("filepicker").addEventListener("change", function(event) {
  let output = document.getElementById("listing");
  let files = event.target.files;

  for (let i=0; i<files.length; i++) {
    let item = document.createElement("li");
    let button = document.createElement("button");
    item.appendChild(button);
    button.setAttribute('class', 'list-item');
    button.innerHTML = files[i].path;
    button.setAttribute('onclick', 'setSrc(' + "'" + files[i].path + "'" + ');');
    output.appendChild(item); }; }, false);
*/

function loadTheme() {
  var r = document.querySelector(':root');
  theme = getComputedStyle(r).getPropertyValue('--backdrop');
  console.log(theme);
  if (localStorage.getItem('theme') == '1') {
    r.style.setProperty('--backdrop', "url('./backdrops/color_gradients.png')");
    r.style.setProperty('--backdrop-dark', "linear-gradient(#0002, #0002), url('./backdrops/color_gradients.png')");
    r.style.setProperty('--backdrop-darker', "linear-gradient(#0004, #0004), url('./backdrops/color_gradients.png')");
  } else if (localStorage.getItem('theme') == '2') {
    r.style.setProperty('--backdrop', "url('./backdrops/color_gradients_2.png')");
    r.style.setProperty('--backdrop-dark', "linear-gradient(#0002, #0002), url('./backdrops/color_gradients_2.png')");
    r.style.setProperty('--backdrop-darker', "linear-gradient(#0004, #0004), url('./backdrops/color_gradients_2.png')");
  } else if (localStorage.getItem('theme') == '3') {
    r.style.setProperty('--backdrop', "url('./backdrops/color_gradients_3.png')");
    r.style.setProperty('--backdrop-dark', "linear-gradient(#0002, #0002), url('./backdrops/color_gradients_3.png')");
    r.style.setProperty('--backdrop-darker', "linear-gradient(#0004, #0004), url('./backdrops/color_gradients_3.png')");
  } else {
    console.warn(localStorage.getItem('theme') + 'is not a valid theme! Falling back to default (1)');
    r.style.setProperty('--backdrop', "url('./backdrops/color_gradients.png')");
    r.style.setProperty('--backdrop-dark', "linear-gradient(#0002, #0002), url('./backdrops/color_gradients.png')");
    r.style.setProperty('--backdrop-darker', "linear-gradient(#0004, #0004), url('./backdrops/color_gradients.png')");
  }
}

function switchTheme() {
  var r = document.querySelector(':root');
  theme = getComputedStyle(r).getPropertyValue('--backdrop');
  console.log(theme);
  if (theme == 'url("./backdrops/color_gradients.png")') {
    localStorage.setItem('theme', '2');
    r.style.setProperty('--backdrop', "url('./backdrops/color_gradients_2.png')");
    r.style.setProperty('--backdrop-dark', "linear-gradient(#0002, #0002), url('./backdrops/color_gradients_2.png')");
    r.style.setProperty('--backdrop-darker', "linear-gradient(#0004, #0004), url('./backdrops/color_gradients_2.png')");
  } else if (theme == 'url("./backdrops/color_gradients_2.png")') {
    localStorage.setItem('theme', '3');
    r.style.setProperty('--backdrop', "url('./backdrops/color_gradients_3.png')");
    r.style.setProperty('--backdrop-dark', "linear-gradient(#0002, #0002), url('./backdrops/color_gradients_3.png')");
    r.style.setProperty('--backdrop-darker', "linear-gradient(#0004, #0004), url('./backdrops/color_gradients_3.png')");
  } else {
    localStorage.setItem('theme', '1');
    r.style.setProperty('--backdrop', "url('./backdrops/color_gradients.png')");
    r.style.setProperty('--backdrop-dark', "linear-gradient(#0002, #0002), url('./backdrops/color_gradients.png')");
    r.style.setProperty('--backdrop-darker', "linear-gradient(#0004, #0004), url('./backdrops/color_gradients.png')");
  }
  console.log('Changed theme!');
}

function setFolder() {
  var input = id('custom-folder-input').value;
  localStorage.setItem('folder', input); }

function toggleImport() {
  if (id('import').className == 'width-full') {
    id('import').className = 'width-0'; } else {
    id('import').className = 'width-full'; } }

function setEmblem(filetype) {
  let emblem = id('emblem')
  console.log(filetype);
  if (filetype == 'flac') {
    emblem.src = './icons/flac_emblem.png';
  } else if (filetype == 'mp3') {
    emblem.src = './icons/mp3_emblem.png';
  } else if (filetype == 'm4a') {
    emblem.src = './icons/m4a_emblem.png';
  } else {
    emblem.src = './icons/file_emblem.png';
    console.warn('Filetype does not have an emblem');
  }
}

function showBitrate(filetype, metadata) {
  if (filetype == 'm4a') {
    let bitrate = parseInt(metadata.AvgBitrate);
    id('file-bitrate').innerHTML = bitrate;
    localStorage.setItem('bitrate', bitrate);

  } else if (filetype = 'flac') {
    let bitrate = ((metadata.SampleRate * metadata.BitsPerSample * 2) / 1000);
    id('file-bitrate').innerHTML = bitrate;
    localStorage.setItem('bitrate', bitrate);
  }
  updateBitrate();
}

function updateBitrate() {
  let bitrate = localStorage.getItem('bitrate') * speed;
  id('file-bitrate').innerHTML = bitrate.toFixed(2) + ' kbps';
}


/* TODO:
  Add pitch-changing pause/play functionality like LP-disc
  Add video-view if mp4 // LOL
*/



function closeWindow() {
  window.close(); }

/*
function minimizeWindow() {
  window.minimize(); }

function maximizeWindow() {
  window.maximize(); }
*/
/*
// Window Control
(function () {

      var remote = require('remote');
      var BrowserWindow = remote.require('browser-window');
      //var BrowserWindow = require('browser-window');

     function init() {
          document.getElementById("min-btn").addEventListener("click", function (e) {
               var window = BrowserWindow.getFocusedWindow();
               window.minimize();
          });

          document.getElementById("max-btn").addEventListener("click", function (e) {
               var window = BrowserWindow.getFocusedWindow();
               window.maximize();
          });

          document.getElementById("close-btn").addEventListener("click", function (e) {
               var window = BrowserWindow.getFocusedWindow();
               window.close();
          });
     };

     document.onreadystatechange = function () {
          if (document.readyState == "complete") {
               init();
          }
     }; })();
*/