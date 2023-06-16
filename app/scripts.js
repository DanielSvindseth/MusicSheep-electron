function id(id) { return document.getElementById(id); } // Make accessing HTML elements more convenient

const fs = require('fs-extra');
const {app, globalshortcut, ipcRenderer, dialog} = require('electron');
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
var folder
localStorage.setItem('currentSong', '1');

// 7 Playlists
var playlist_0 = "/"
var playlist_1 = "/1/";
var playlist_2 = "/2/";
var playlist_3 = "/3/";
var playlist_4 = "/4/";
var playlist_5 = "/5/";
var playlist_6 = "/6/";

const playlists = ['/', '/1/', '/2/', '/3/', '/4/', '/5/', '/6/']

// Send message to main process to get the string data
ipcRenderer.send('get-data');

// Handle the 'send-data' channel message from main process
ipcRenderer.on('send-data', (event, data) => {
  // Use the string data received here
  console.log(data);
  var musicFolder = data;
  if (localStorage.getItem('folder') === null) {
    localStorage.setItem('folder', musicFolder); } });

// Howler Settings
Howler.autoSuspend = true;
Howler.volume(vol);

// Speed controls
var speedometer = id("speedometer");
speedometer.innerHTML = speedChanger.value;
speedChanger.oninput = function() {
  speed = speedChanger.value;
  if (audio !== undefined) {
    audio.rate(speed); }
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

  id('now-playing').innerHTML = songName; // mark active track with css
  id(number).className += ' active-playing';
  setEmblem(filetype);
  showBitrate(filetype, metadata);
  // playButton();
  //setTimeout(() => {initSeeker();}, 2000); } //Removed in favour of audio.once
  audio.once('load', function() {
    playButton();
    initSeeker();
    updateSeeker(); }); }

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
  console.log(Howler.volume());
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
  if (currentSong) {
    id(currentSong).classList.remove('active-playing'); // throws error if switching playlist while playing
  }
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
// seekometer.innerHTML = seeker.value;
seekometer.innerHTML = '00:00';
seeker.oninput = function() {
  s = seeker.value;
  if (audio !== undefined) {
    audio.seek(s); }
  t = Math.round(s);
  seekometer.innerHTML = t; }

function updateSeeker() {
  seeker = id('seeker');
  function update() {
    if (audio != undefined || audio != null) {
      seeker.value = audio.seek();
      v = seeker.value; // time in seconds
      s = Math.round(v); // time rounded to whole seconds
      d = audio.duration(); // length of song in seconds
      e = Math.round(d); // length of song rounded to whole seconds

      m = Math.round( s / 60 ); // time in minutes
      s = ( s % 60 );
      h = Math.round( m / 60 ); // time in hours
      // m = ( m % 60 ); uncomment to convert minutes to hours

      // seekometer.innerHTML = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); // hh:mm:ss
      seekometer.innerHTML = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); // mm:ss
      // if (v == e && e != 0 && localStorage.getItem('AutoPlay') == 'yes') {
      //   nextSong(); // Something is weird here
      //   console.log('playing next song'); }
      } }
  setInterval(update, 1);
  // if (audio && localStorage.getItem('AutoPlay') == 'yes') { audio.on('end'), function () { nextSong(); console.log('song ended'); } }
if (audio) {
  audio.on('end', () => {
    nextSong();
    console.log("audio.on('end') triggered. Playing next song"); } ); } }


function initSeeker() {
  seeker = id('seeker');
  let l = audio.duration();
  seeker.max = l;
  s = Math.round(l)
  // k = toTime(i);
  // console.log(k);

  m = Math.round( s / 60 ); // time in minutes
  s = ( s % 60 );
  h = Math.round( m / 60 ); // time in hours
  // m = ( m % 60 );

  id('song-duration').innerHTML = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); // mm:ss
}

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


function toTime(i) {
  var min = 0;
  var sec = 0;
  var time = '';
  if (audio) {
    while ((i / 60) > 1) {
      i -= 60;
      min++; }
    sec = i;
    if (sec.toString().length == 1) { sec = '0' + sec; }
    time = min + ':' + sec;
    return time; } }


// Add eventListeners to app elements
id('body').addEventListener("load", function() { loadTheme(); listSongs(); updateSeeker(); initEnabled(); })
// id('body').addEventListener("load", function() { hideStartupScreen(); } );

id('play-button').addEventListener("click", playButton);
id('prev-button').addEventListener("click", prevSong);
id('next-button').addEventListener("click", nextSong);

id('exit-app').addEventListener("click", closeWindow);
id('refresh-app').addEventListener("click", refreshApp);
id('switch-theme').addEventListener("click", switchTheme);

id('playlist-0').addEventListener("click", function() { setPlaylist(0); });
id('playlist-1').addEventListener("click", function() { setPlaylist(1); });
id('playlist-2').addEventListener("click", function() { setPlaylist(2); });
id('playlist-3').addEventListener("click", function() { setPlaylist(3); });
id('playlist-4').addEventListener("click", function() { setPlaylist(4); });
id('playlist-5').addEventListener("click", function() { setPlaylist(5); });
id('playlist-6').addEventListener("click", function() { setPlaylist(6); });

id('toggle-auto-play').addEventListener("click", toggleAutoPlay);
id('new-folder').addEventListener("click", setNewFolder);


// Add keypress functions
Mousetrap.bind('space', function() { id('play-button').click(); return false; });
Mousetrap.bind('k', function() { id('play-button').click(); return false; });
Mousetrap.bind('q', function() {
  volumeChanger.value = parseFloat((volumeChanger.value * 10) - 0.1 * 10) / 10;
  volumometer.innerHTML = volumeChanger.value;
  vol = volumeChanger.value;
  Howler.volume(vol);
  localStorage.setItem("volume", vol);
  return false; });
Mousetrap.bind('w', function() {
  volumeChanger.value = parseFloat((volumeChanger.value * 10) + 0.1 * 10) / 10;
  volumometer.innerHTML = volumeChanger.value;
  vol = volumeChanger.value;
  Howler.volume(vol);
  localStorage.setItem("volume", vol);
  return false; });
Mousetrap.bind('[', function() {
  speedChanger.value = parseFloat((speedChanger.value * 10) - 0.05 * 10) / 10;
  speedometer.innerHTML = speedChanger.value;
  speed = speedChanger.value;
  if (audio !== undefined) { audio.rate(speed); }
  localStorage.setItem("speed", speed);
  return false; });
Mousetrap.bind(']', function() {
  speedChanger.value = parseFloat((speedChanger.value * 10) + 0.05 * 10) / 10;
  speedometer.innerHTML = speedChanger.value;
  speed = speedChanger.value;
  if (audio !== undefined) { audio.rate(speed); }
  localStorage.setItem("speed", speed);
  return false; });
Mousetrap.bind("'", function() {
  speedChanger.value = parseFloat((speedChanger.value * 10) - 0.01 * 10) / 10;
  speedometer.innerHTML = speedChanger.value;
  speed = speedChanger.value;
  if (audio !== undefined) { audio.rate(speed); }
  return false; });
Mousetrap.bind("\\", function() {
  speedChanger.value = parseFloat((speedChanger.value * 10) + 0.01 * 10) / 10;
  speedometer.innerHTML = speedChanger.value;
  speed = speedChanger.value;
  if (audio !== undefined) { audio.rate(speed); }
  return false; });
Mousetrap.bind('f', function(){ prevSong(); return false; });
Mousetrap.bind('j', function(){ nextSong(); return false; });
Mousetrap.bind('r', function(){ refreshApp(); });
Mousetrap.bind('a', function(){ toggleAutoPlay(); });
Mousetrap.bind('1', function(){ setPlaylist(1);});
Mousetrap.bind('2', function(){ setPlaylist(2);});
Mousetrap.bind('3', function(){ setPlaylist(3);});
Mousetrap.bind('4', function(){ setPlaylist(4);});
Mousetrap.bind('5', function(){ setPlaylist(5);});
Mousetrap.bind('6', function(){ setPlaylist(6);});
Mousetrap.bind('`', function(){ setPlaylist(0);});
Mousetrap.bind('0', function(){ setPlaylist(0);});

Mousetrap.addKeycodes({ 164: 'play' });   // Not working hmm
Mousetrap.bind('play', function() { id('play-button').click(); return false; });


function highlightPlaylist(n) {
  for (let i = 0; i < 7; i++) {
    id('playlist-' + i).classList.remove('enabled');
  }
  id('playlist-' + n).className = 'enabled';
}


// Where to get files from
if (localStorage.getItem('folder') !== null) {
  folder = localStorage.getItem('folder') + "/"; } else {
  folder = localStorage.getItem('musicFolder'); }
var w = 1;
var q;


function setPlaylist(n) {
 folder = localStorage.getItem('folder') + playlists[n];
 highlightPlaylist(n)
 refreshSongs(); }


function setNewFolder() {
  ipcRenderer.send('request-folder'); }

ipcRenderer.on('response-folder', (event, argFilePaths, argCanceled) => {
    console.log(argFilePaths);
    if (argCanceled == false) {
      localStorage.setItem('folder', argFilePaths[0]);
      setPlaylist(0) } // '/'
    else {
      console.log('Canceled selecting new filepath'); } });


// List all files in variable 'folder' and make buttons for them
function listSongs() {
  console.log("Starting to list files in directory " + folder);
  let output = id("listing");
  let fileName;

  fs.readdir(folder, function(err, files) {
    if (err) {
      return console.error(err); }

    files.forEach( function (file) {
      // Check whether the file is audio
      // let e = file.slice(-3);
      if (file.slice(-4, -3) == '.') {
        var fileName = file.slice(0, -4);
        var fileType = file.slice(-3);
      } else if (file.slice(-5, -4) == '.') {
        var fileName = file.slice(0, -5);
        var fileType = file.slice(-4);
      } else {
        console.warn(file + ' might not be a supported file! File extension not 3 or 4 characters long! Skipping…'); }

      if (fileType == 'mp3' || fileType == 'm4a' || fileType == 'wav' || fileType == 'flac' || fileType == 'ogg' || fileType == 'aac' || fileType == 'mp4' || fileType == 'opus' || fileType == 'aiff') {
        let item = document.createElement("li");
        let button = document.createElement("button");
        button.setAttribute('number', w);
        button.setAttribute('id', w);
        item.appendChild(button);
        button.setAttribute('class', 'list-item');
        button.innerHTML = fileName;
        button.setAttribute('onclick', 'setSrc(' /*+ '"' + folder + file + '"' + ','*/ + w + ');');
        button.setAttribute('path',  folder + file);
        button.setAttribute('short-path', file);
        button.setAttribute('fileName', fileName);
        button.setAttribute('filetype', fileType);
        output.appendChild(item);
        w++;
        localStorage.setItem('w', w); } }); });
  console.log("Finished listing files"); }

// Refresh the files -without refreshing the whole application
function refreshSongs() {
  let output = id("listing");
  listing.innerHTML = '';
  listSongs(); }

function refreshApp() {
  window.location.reload(true); }

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
    r.style.setProperty('--backdrop-darker', "linear-gradient(#0004, #0004), url('./backdrops/color_gradients.png')"); } }

function switchTheme() {
  var r = document.querySelector(':root');
  theme = getComputedStyle(r).getPropertyValue('--backdrop');
  console.log(theme);
  if (theme == 'url("./backdrops/color_gradients.png")') {
    localStorage.setItem('theme', '2');
    r.style.setProperty('--backdrop', "url('./backdrops/color_gradients_2.png')");
    r.style.setProperty('--backdrop-dark', "linear-gradient(#0002, #0002), url('./backdrops/color_gradients_2.png')");
    r.style.setProperty('--backdrop-darker', "linear-gradient(#0004, #0004), url('./backdrops/color_gradients_2.png')"); }
  else if (theme == 'url("./backdrops/color_gradients_2.png")') {
    localStorage.setItem('theme', '3');
    r.style.setProperty('--backdrop', "url('./backdrops/color_gradients_3.png')");
    r.style.setProperty('--backdrop-dark', "linear-gradient(#0002, #0002), url('./backdrops/color_gradients_3.png')");
    r.style.setProperty('--backdrop-darker', "linear-gradient(#0004, #0004), url('./backdrops/color_gradients_3.png')"); }
  else {
    localStorage.setItem('theme', '1');
    r.style.setProperty('--backdrop', "url('./backdrops/color_gradients.png')");
    r.style.setProperty('--backdrop-dark', "linear-gradient(#0002, #0002), url('./backdrops/color_gradients.png')");
    r.style.setProperty('--backdrop-darker', "linear-gradient(#0004, #0004), url('./backdrops/color_gradients.png')"); }
  console.log('Changed theme!'); }

function setFolder() {
  var input = id('custom-folder-input').value;
  localStorage.setItem('folder', input); }

function setEmblem(filetype) {
  let fileEmblem = id('file-emblem')
  console.log(filetype);
  if (filetype == 'flac') {
    fileEmblem.className = 'file-emblem-flac';
    emblem.innerHTML = 'flac'; }
  else if (filetype == 'mp3') {
    fileEmblem.className = 'file-emblem-mp3';
    emblem.innerHTML = 'mp3'; }
  else if (filetype == 'm4a') {
    fileEmblem.className = 'file-emblem-m4a';
    emblem.innerHTML = 'm4a'; }
  else if (filetype == 'opus') {
    fileEmblem.className = 'file-emblem-opus';
    emblem.innerHTML = 'opus'; }
  else if (filetype == 'ogg') {
    fileEmblem.className = 'file-emblem-ogg';
    emblem.innerHTML = 'ogg'; }
  else if (filetype == 'wav') {
    fileEmblem.className = 'file-emblem-wav';
    emblem.innerHTML = 'wav'; }
  else {
    fileEmblem.className = 'file-emblem-generic';
    emblem.innerHTML = '';
    console.warn('Filetype does not have an emblem'); } }

function showBitrate(filetype, metadata) {
  if (filetype == 'm4a') {
    let bitrate = parseInt(metadata.AvgBitrate);
    id('file-bitrate').innerHTML = bitrate;
    localStorage.setItem('bitrate', bitrate); }

  else if (filetype == 'mp3') {
    let bitrate = parseInt(metadata.AudioBitrate);
    id('file-bitrate').innerHTML = bitrate;
    localStorage.setItem('bitrate', bitrate); }

  else if (filetype == 'flac') {
    let bitrate = ((metadata.SampleRate * metadata.BitsPerSample * 2) / 1000);
    id('file-bitrate').innerHTML = bitrate;
    localStorage.setItem('bitrate', bitrate); }

  updateBitrate(); }

function updateBitrate() {
  let bitrate = localStorage.getItem('bitrate') * speed;
  id('file-bitrate').innerHTML = bitrate.toFixed(2) + ' kbps'; }

function hideStartupScreen() {
  id('startup-screen').style.opacity = '0';
  setTimeout( function() { id('startup-screen').style.display = 'none'; }, 400 );

}

function closeWindow() {
  window.close(); }

  /* TODO:
    Add pitch-changing pause/play functionality like LP-disc
    Add video-view if mp4 // LOL
  */
