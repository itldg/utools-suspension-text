const { ipcRenderer } = require('electron')
let winId
ipcRenderer.on('init', (event) => {
	winId = event.senderId
	window.init()
})

window.resize = (width, height) => {
	ipcRenderer.sendTo(winId, 'resize', width, height)
}

window.saveText = (text) => {
	ipcRenderer.sendTo(winId, 'saveText', text)
}
window.copyText = (text) => {
	ipcRenderer.sendTo(winId, 'copyText', text)
}

window.moveBounds = (x, y, width, height) => {
	ipcRenderer.sendTo(winId, 'moveBounds', x, y, width, height)
}

window.dbSetItem = (key, value) => {
	// console.log('dbSetItem', key, value)
	ipcRenderer.sendTo(winId, 'dbSetItem', key, value)
	// localStorage.setItem(key, value)
}

window.dbRemoveItem = (key) => {
	// console.log('dbRemoveItem', key)
	ipcRenderer.sendTo(winId, 'dbRemoveItem', key)
	// localStorage.removeItem(key)
}
