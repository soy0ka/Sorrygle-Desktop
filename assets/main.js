const sleep = (ms) => {
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}
const fs = require("fs")
const { Sorrygle } = require("sorrygle-node12")
const { 'web-midi-player': { default: MidiPlayer } } = window
const { ipcRenderer } = require('electron')
const midiPlayer = new MidiPlayer()
const midi = require('midi-player-js')
const info = new midi.Player()
const os = require('os')
const { homedir, username } = os.userInfo()
const temppath = `${homedir}/ouput.mid`
function play(srg) {
  if(!srg) return alert('쏘리글 데이터가 없습니다')
  try{
    Sorrygle.parse(srg)
  }catch(e){
    return alert('쏘리글 컴파일에 실패했습니다\n'+e)
  }
  document.getElementsByName("playButton")[0].disabled = true
  document.getElementsByName("playButton")[0].childNodes[1].data = " 재생중"
  document.getElementsByName("playButton")[0].getElementsByTagName('i')[0].className = 'icon fa-fw fa-spin fas fa-spinner'
  try {
    if (fs.existsSync(temppath)) {
      try{
        fs.unlinkSync(temppath)
      }catch(e){
        console.log(e)
      }
    }
  } catch(err) {
    console.error(err)
  }
  setTimeout(() => {
    fs.writeFileSync(temppath,Sorrygle.compile(srg))
    midiPlayer.play({ url: temppath })
    info.loadFile(temppath)
    info.play()
  }, 150)
}
info.on('endOfFile', async function() {
  await sleep(700)
  stop()
  try{
    fs.unlinkSync(temppath)
  }catch(e){
    console.log(e)
  }
})
function stop() {
  midiPlayer.stop()
  info.stop()
  document.getElementsByName("playButton")[0].disabled = false
  document.getElementsByName("playButton")[0].getElementsByTagName('i')[0].className = 'icon fa-fw fas fa-play'
  document.getElementsByName("playButton")[0].childNodes[1].data = " 재생"
}
document.onkeydown = function(evt) {
  evt = evt || window.event;
  if (evt.keyCode == 27) {
    stop()
  }
}
function save2midi(srg) {
if(!srg) return alert('쏘리글 데이터가 없습니다')
try{
  Sorrygle.parse(srg)
}catch (e) {
  return alert('쏘리글 컴파일에 실패했습니다\n'+e)
}
ipcRenderer.send('save2midi', Sorrygle.compile(srg))
}
ipcRenderer.on("filedata", (event, data) => {
document.getElementsByTagName('textarea')[0].value = data.data
})
ipcRenderer.on("savesrg", (event, data) => {
const srg = document.getElementsByTagName('textarea')[0].value
if(!srg) return alert('쏘리글 데이터가 없습니다')
try{
  fs.writeFileSync(data.path,srg)
}catch (e) {
  return alert('파일저장에 실패했습니다\n'+e)
}
})