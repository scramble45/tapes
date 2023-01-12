const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const console = require('console')
const cheerio = require('cheerio')
const https = require('https')

const streamDir = path.join(__dirname, '..', 'streams')
console.log('streamDir:', streamDir)

app.console = new console.Console(process.stdout, process.stderr)

// auto update for windows and mac
require('update-electron-app')({
  repo: 'scramble45/tapes',
  updateInterval: '1 hour',
  logger: require('electron-log')
})

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1275,
    height: 740,
    minWidth: 1275,
    minHeight: 740,
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
  win.loadFile(path.join(__dirname, 'index.html'));


  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  // Open the DevTools.
  // win.webContents.openDevTools()
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
                const win = BrowserWindow.getFocusedWindow() // Get a reference to the current window

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
        label: 'Load iptv-org Streams',
        accelerator: 'CmdOrCtrl+O',
        click: async () => {
          // Open a directory selection dialog
          await downloadStreams().then(() => {
            // Load preloaded iptv-org streams
            const directory = streamDir

            fs.readdir(directory, async (err, files) => {
              if (err) {
                console.error(err)
                return
              }

              const allFileData = await readFileContents(directory, files)
              const win = BrowserWindow.getFocusedWindow() // Get a reference to the current window

              let data = {
                directory: directory,
                fileData: allFileData
              }

              win.webContents.send("fromMain", JSON.stringify(data))

            })
          }).catch(err => {
            console.log(err)
          })
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
          const win = BrowserWindow.getFocusedWindow() // Get a reference to the current window
          win.webContents.toggleDevTools() //Toggle the dev tools for the current window
        }
      },
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          const win = BrowserWindow.getFocusedWindow() // Get a reference to the current window
          win.close()
        }
      }
    ]
  }, {
    label: 'Edit',
    submenu: [
      {
        label: 'Options',
        accelerator: 'CmdOrCtrl+E',
        click: () => {
        }
      }
    ]
  }
]

async function downloadStreams() {
  const streamUrl = 'https://github.com/iptv-org/iptv/tree/master/streams'

  if (!fs.existsSync(streamDir)) {
    // Make the streams directory if it doesn't exist
    fs.mkdirSync(streamDir)
  }

  // Scrape the website for the file links
  // either this or put a full blown git client into
  // the application, I opted for scraping for now
  return new Promise((resolve, reject) => {
    https.get(streamUrl, (res) => {
      let html = ''

      res.on('data', (chunk) => {
        html += chunk
      })

      res.on('end', () => {
        // Load the HTML into cheerio
        const $ = cheerio.load(html)

        // Find all the links on the page
        const links = $('a')

        // Filter the links to only include ones that end in .m3u
        const streamLinks = links.filter((i, link) => {
          return $(link).attr('href').endsWith('.m3u')
        })

        // Download each stream file
        streamLinks.each((i, link) => {
          let url = `https://raw.githubusercontent.com${$(link).attr('href')}`
          url = url.replace(/\/blob\//g, '/')

          https.get(url, (res) => {
            let data = ''
            res.on('data', (chunk) => {
              data += chunk
            })
            res.on('end', () => {
              // Write the file to the streams directory
              fs.writeFileSync(`${streamDir}/${$(link).text()}`, data)
            })
          })
        })
        resolve()
      })
    })
  })
}

// if the streams folder is already present go ahead and load the content
if (fs.existsSync(streamDir)) {
  const directory = streamDir

  function isEmpty(path) {
    return fs.readdirSync(path).length === 0;
  }

  if (!isEmpty(streamDir)) {
    fs.readdir(directory, async (err, files) => {
      if (err) {
        console.error(err)
        return
      }

      const allFileData = await readFileContents(directory, files)
      const win = BrowserWindow.getFocusedWindow() // Get a reference to the current window

      let data = {
        directory: directory,
        fileData: allFileData
      }

      setTimeout(() => {
        win.webContents.send("fromMain", JSON.stringify(data))
      }, 500)
    })
  }
}

// Reads the file contents into a single variable
async function readFileContents(directory, files) {
  // Create an array of file paths
  const filePaths = files.map(file => path.join(directory, file))

  let fileContents = ''
  for (const filePath of filePaths) {
    const fileData = await fs.promises.readFile(filePath, 'utf8')
    fileContents += fileData
  }
  return fileContents
}
