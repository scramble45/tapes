
/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 * 
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})

const {
  contextBridge,
  ipcRenderer
} = require("electron")

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  "api", {
      send: (channel, data) => {
          // whitelist channels
          let validChannels = ["toMain"]
          if (validChannels.includes(channel)) {
              ipcRenderer.send(channel, data)
          }
      },
      receive: (channel, func) => {
          let validChannels = ["fromMain"]
          if (validChannels.includes(channel)) {
              // Deliberately strip event as it includes `sender` 
              ipcRenderer.on(channel, (event, ...args) => func(...args))
          }
      }
  }
)
