const { ipcRenderer } = require('electron')
let winId
ipcRenderer.on('init', (event) => {
	winId = event.senderId
	window.init()
})
window.resize = (width, height) => {
	ipcRenderer.sendTo(winId,'resize',width, height)
}
window.saveText = (text) => {
	ipcRenderer.sendTo(winId,'saveText',text)
}
