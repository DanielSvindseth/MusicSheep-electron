// Modules to control application life and create native browser window
const {app, Menu, BrowserWindow, globalshortcut, ipcMain} = require('electron')
const contextMenu = require('electron-context-menu');
const path = require('path')
const fs = require('fs-extra')

contextMenu({
    prepend: (defaultActions, params, browserWindow) => [
        {
            label: 'Rainbow',
            // Only show it when right-clicking images
            visible: params.mediaType === 'image'
        }
    ]
});

app.commandLine.appendSwitch('enable-transparent-visuals');

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
      contextIsolation: false,
      enableRemoteModule: true
    }
  })

  ipcMain.on('get-data', (event) => {
      // Get the string data here and send it to renderer process
      const musicFolder = app.getPath('music');
      event.reply('send-data', musicFolder);
  });

  mainWindow.autoHideMenuBar = true;
  Menu.setApplicationMenu(null)
  // and load the index.html of the app.
  mainWindow.loadFile('app/music.html')
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

app.on('ready', () => setTimeout(createWindow, 400));

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
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

app.whenReady().then(() => {
  // Register a 'CommandOrControl+X' shortcut listener.
  const ret = globalShortcut.register('MediaPlayPause', () => {
    console.log('MediaPlayPause Pressed')
  })

  if (!ret) {
    console.log('registration failed')
  }

  // Check whether a shortcut is registered.
  console.log(globalShortcut.isRegistered('MediaPlayPause'))
})

app.on('will-quit', () => {
  // Unregister a shortcut.
  globalShortcut.unregister('MediaPlayPause')

  // Unregister all shortcuts.
  globalShortcut.unregisterAll()
})