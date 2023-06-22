const { app, BrowserWindow, screen, Menu, ipcMain, dialog, TouchBar } = require('electron')
const path = require('path')
const { FileManager } = require("./libs/FileManager")
const fs = require('fs')

require('electron-reload')(__dirname, {
  electron: require(`${__dirname}/node_modules/electron`)
})

const isMac = process.platform === 'darwin'

function format(sec_num) {
  const hours   = Math.floor(sec_num / 3600)
  const minutes = Math.floor((sec_num - (hours * 3600)) / 60)
  const seconds = sec_num - (hours * 3600) - (minutes * 60)

  if (minutes < 10) {minutes = "0"+minutes;}
  if (seconds < 10) {seconds = "0"+seconds;}
  return minutes+':'+seconds;
}

function createWindow () {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    x: (width * 0.5) - 400,
    y: (height * 0.3),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
    backgroundColor: '#312450',
    icon: path.join(__dirname, 'assets/favicon.ico')
  })
  const fileManager = new FileManager(mainWindow)
  // and load the index.html of the app.
  mainWindow.loadFile('renderer.html')
  const template = [  {
    role: 'help',
    label:'Sorrygle Desktop',
    submenu: [
      {
        label: 'About',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://github.com/Muzihuzi/Sorrygle-Desktop')
        }
      }
    ]
  },{
    label: 'File',
    submenu: [
      {
        label: 'Open',
        accelerator: 'CmdOrCtrl+O',
        click: () => {
          fileManager.openFileWindow()
        }
      },    
      {
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        click: () => {
          fileManager.saveFileWindow()
        }
      },
    ]
    },
    {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac ? [
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Speech',
          submenu: [
            { role: 'startSpeaking' },
            { role: 'stopSpeaking' }
          ]
        }
      ] : [
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ])
    ]
    },  {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+T',
          click: async () => {
            createWindow ()
          }
        },
        {
          label: 'close',
          accelerator: 'CmdOrCtrl+W',
          click: async () => {
            app.quit()
          }
        }
      ]
    },]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  return mainWindow
}

let isPlaying = false

app.whenReady().then(async() => {
  const window = createWindow()
  const playButton = new TouchBar.TouchBarButton({
    label: '▶ 재생',
    click: () => {
      isPlaying = !isPlaying
      playButton.label = isPlaying ? '■ 정지' : '▶ 재생'
      window.webContents.send('playToggle', isPlaying)
    }
  })

  const saveButton =  new TouchBar.TouchBarButton({
    label:'💾 MID로 저장',
    click: () => {
      window.webContents.send('save2midi')
    }
  }) 
  
  const player = new TouchBar.TouchBarSlider({
    label: '00:00/00:00',
    minValue: 0,
    maxValue: 0,
    value: 0,
    change: (value) => {
      window.webContents.send('timeChange', value)
    }
  })
  
  const touchBar = new TouchBar({
    items:[playButton, saveButton, player]
  })
  window.setTouchBar(touchBar)
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
  ipcMain.on('stop',()=>{
    isPlaying = false
    player.value = 0
    player.maxValue = 0
    playButton.label = '▶ 재생'
  })
  ipcMain.on('start',()=>{
    isPlaying = true
    playButton.label = '■ 정지'
  })
  ipcMain.on('update',(event, payload)=>{
    if (payload.duration) {
      player.label = `00:00/${new Date(Math.floor(payload.duration) * 1000).toISOString().slice(14, 19)}`
      player.maxValue = Math.floor(payload.duration*100)
    }
    if (!payload.duration || !payload.current) return
    player.maxValue = Math.floor(payload.duration*100)
    player.value = Math.floor(payload.current*100)
    // player.value = Math.floor(payload.current/payload.duration * 1000)
    player.label = `${new Date(Math.floor(payload.current) * 1000).toISOString().slice(14, 19)}/${new Date(Math.floor(payload.duration) * 1000).toISOString().slice(14, 19)}`
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('save2midi', (e, arg) => {
  const path = dialog.showSaveDialog( {
    title: '쏘리글을 mid로 저장하기',
    filters: [ { name:'mid file', extensions: [ 'mid' ] } ],
  }).then(path => path)
  .then(data => {
    if(data.canceled) return
    fs.writeFileSync(data.filePath, arg)
    dialog.showMessageBox(null,{type:'info',title:'저장을 완료했습니다!', message:'저장을 완료했습니다!'})
  })
})