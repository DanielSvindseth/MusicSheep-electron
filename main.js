// Modules to control application life and create native browser window
const {app, Menu, BrowserWindow, globalShortcut, ipcMain, dialog} = require('electron');
const contextMenu = require('electron-context-menu');
const path = require('path');
const fs = require('fs-extra');
// const {app, globalshortcut, ipcRenderer, dialog} = require('electron');
// const { getCurrentWebContents, Menu, MenuItem } = require ('electron').remote;
// const Mousetrap = require('mousetrap');
// // const { Howler } = require('howler');
// const { ExifTool } = require('exiftool-vendored');
// const Exif = new ExifTool();
// const jsmediatags = window.jsmediatags;

contextMenu({
    prepend: (defaultActions, params, browserWindow) => [
        {
            label: 'Menu', // this is needed, otherwise right-click won't work
            // Only show it when right-clicking images
            visible: params.mediaType === 'video'
        },
        {
            label: "Developer",
            submenu:
          [
            { role: 'reload' },
            { role: 'toggledevtools' }
          ]
        }
    ]
});

app.commandLine.appendSwitch('enable-transparent-visuals', 'enable-features=UseOzonePlatform');

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    transparent: true,
    frame: false,
    icon: __dirname + '/app/logo.png',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  ipcMain.on('get-data', (event) => {
      // Get the string data here and send it to renderer process
      const musicFolder = app.getPath('music');
      event.reply('send-data', musicFolder);
  });

  // Attach listener in the main process with the given ID
  ipcMain.on('request-folder', (event) => {
    console.log('hello from the other file!');
    dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'openDirectory']
    }).then(result => {
      console.log(result.canceled)
      console.log(result.filePaths)
      event.sender.send('response-folder', result.filePaths, result.canceled);
    }).catch(err => {
      console.log(err)
    })
  });

  mainWindow.autoHideMenuBar = true;
  mainWindow.setMinimumSize(596, 596);
  Menu.setApplicationMenu(null);
  mainWindow.loadFile('app/music.html');
  // mainWindow.webContents.openDevTools() // open devtools
}

app.on('ready', () => setTimeout(createWindow, 400)); // 400

/*
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  })
})
*/

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

app.whenReady().then(() => {
  // Register a 'CommandOrControl+X' shortcut listener.
  const ret = globalShortcut.register('MediaPlayPause', () => {
    console.log('MediaPlayPause Pressed')
  });

  if (!ret) {
    console.log('registration failed')
  }

  // Check whether a shortcut is registered.
  console.log(globalShortcut.isRegistered('MediaPlayPause'));
});

app.on('will-quit', () => {
  // Unregister a shortcut.
  globalShortcut.unregister('MediaPlayPause')

  // Unregister all shortcuts.
  globalShortcut.unregisterAll()
});
