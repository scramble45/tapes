const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const console = require('console')
const cheerio = require('cheerio')
const https = require('https')

function getAppDataPath() {
  switch (process.platform) {
    case "darwin": {
      return path.join(process.env.HOME, "Library", "Application Support", "tapes_iptv")
    }
    case "win32": {
      return path.join(process.env.APPDATA, "tapes_iptv")
    }
    case "linux": {
      return path.join(process.env.HOME, ".tapes_iptv")
    }
    default: {
      console.error("unsupported platform!")
      process.exit(1)
    }
  }
}
const streamDir = `${getAppDataPath()}/streams`

if (!fs.existsSync(streamDir)) {
  // Make the streams directory if it doesn't exist
  fs.mkdirSync(streamDir, { recursive: true })
  console.log('created stream directory:', streamDir)
} else {
  console.log('found stream directory:', streamDir)
}

app.console = new console.Console(process.stdout, process.stderr)

// auto update for windows and mac
require('update-electron-app')({
  repo: 'scramble45/tapes',
  updateInterval: '1 hour',
  logger: require('electron-log')
})

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

// File menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open Directory',
        accelerator: 'CmdOrCtrl+O',
        click: () => {
          // Open a directory selection dialog
          dialog.showOpenDialog({
            properties: ['openDirectory']
          }).then(result => {
            // Handle the selected directory
            if (result) {
              const directory = result.filePaths[0]

              fs.readdir(directory, async (err, files) => {
                if (err) {
                  console.error(err)
                  return
                }

                const allFileData = await readFileContents(directory, files)

                let data = {
                  directory: directory,
                  fileData: allFileData
                }

                win.webContents.send("fromMain", JSON.stringify(data))
              })
            }
          }).catch(err => {
            console.log(err)
          })

        }
      },
      {
        label: 'Load IPTV-org',
        accelerator: 'CmdOrCtrl+O',
        click: () => {
          // Open a directory selection dialog
          downloadStreams()
        }
      },
      // {
      //   label: 'Update iptv-org Streams',
      //   accelerator: 'CmdOrCtrl+S',
      //   click: () => {
      //     downloadStreams()
      //   }
      // },
      {
        label: 'DevTools',
        accelerator: 'CmdOrCtrl+D',
        click: () => {
          win.webContents.toggleDevTools() //Toggle the dev tools for the current window
        }
      },
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          // const win = BrowserWindow.getFocusedWindow() // Get a reference to the current window
          win.close()
        }
      }
    ]
    // }, {
    //   label: 'Edit',
    //   submenu: [
    //     {
    //       label: 'Options',
    //       accelerator: 'CmdOrCtrl+E',
    //       click: () => {
    //       }
    //     }
    //   ]
  }
]

// Create the browser window.
function createWindow() {
  win = new BrowserWindow({
    width: 1275,
    height: 720,
    minWidth: 1275,
    minHeight: 720,
    icon: './src/icons/png/64x64.png',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  win.loadFile(path.join(__dirname, 'index.html'))

  // custom menu
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

async function downloadStreams() {
  const streamUrl = 'https://github.com/iptv-org/iptv/tree/master/streams'

  https.get(streamUrl, (res) => {
    let html = ''

    res.on('data', (chunk) => {
      html += chunk
    })

    res.on('end', async () => {
      const $ = cheerio.load(html)
      const links = $('a')
      const streamLinks = links.filter((i, link) => {
        return $(link).attr('href').endsWith('.m3u')
      })

      // Array to hold all the promises
      const promises = []

      for (let link of streamLinks) {
        let url = `https://raw.githubusercontent.com${$(link).attr('href')}`
        url = url.replace(/\/blob\//g, '/')

        // Create a new promise for each file write operation
        promises.push(new Promise((resolve, reject) => {
          https.get(url, (res) => {
            let data = ''
            res.on('data', (chunk) => {
              data += chunk
            })
            res.on('end', () => {
              // Write the file to the streams directory
              fs.writeFileSync(`${streamDir}/${$(link).text()}`, data)
              resolve()
            })
          })
        }))
      }

      await Promise.all(promises)

      // Call after all the file write operations are complete
      readStreamData()
    })
  })
}

// Reads the file contents into a single variable
async function readFileContents(directory, files) {
  // Create an array of file paths
  const filePaths = files.map(file => path.join(directory, file))

  const filePromises = filePaths.map(filePath => {
    return fs.promises.readFile(filePath, 'utf8')
  })

  const fileContents = await Promise.all(filePromises)
  return fileContents
}

// if the streams folder is already present go ahead and load the content
function readStreamData() {
  if (fs.existsSync(streamDir)) {
    fs.readdir(streamDir, async (err, files) => {
      if (err) {
        console.error(err)
        return
      }

      const allFileData = await readFileContents(streamDir, files)

      let data = {
        directory: streamDir,
        fileData: allFileData
      }

      setTimeout(() => {
        win.webContents.send("fromMain", JSON.stringify(data))
      }, 500)
    })
  }
}

readStreamData()