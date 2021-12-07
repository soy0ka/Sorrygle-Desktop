const os = require("os")
const fs = require("fs-extra")
const { dialog } = require("electron")

class FileManager {
  constructor(app_window) {
    const { homedir, username } = os.userInfo()
    this.homedir = homedir
    this.username = username
    this.app_window = app_window
  }
  openFileWindow() {
    // Open dialog for selecting files from syetem
    dialog
      .showOpenDialog(this.app_window, { properties: ["openFile"], filters: [{ name: 'Sorrygle File', extensions: ['srg'] }]})
      .then((res) => {
        if (!res.canceled) {
          fs.readFile(res.filePaths[0], "utf-8", (err, data) => {
            this.app_window.webContents.send("filedata", {
              data: data,
              path: res.filePaths[0],
            })
          })
        }
      })
      .catch((err) => {
        console.log(err)
      })
  }
  saveFileWindow() {
    dialog.showSaveDialog(this.app_window, { properties: ["saveFile"], filters: [
      { name: 'Sorrygle File', extensions: ['srg'] }
    ]})
    .then((res) => {
      console.log(res)
      if (!res.canceled) {
        this.app_window.webContents.send("savesrg", {
          path: res.filePath,  
        })
      }
    })
  }
}

module.exports = {
  FileManager
}
