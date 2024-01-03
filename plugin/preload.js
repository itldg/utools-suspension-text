const { ipcRenderer } = require('electron')
// 存储只与当前设备相关的信息
const nativeId = utools.getNativeId() + '/'
const fs = require('fs')
function show() {
	const ubWindow = utools.createBrowserWindow(
		'win.html',
		{
			show: false,
			// 无任务栏图标
			skipTaskbar: true,
			//不能最大最小化
			minimizable: false,
			maximizable: false,
			//最小尺寸
			minWidth: 130,
			minHeight: 10,
			// 全屏
			fullscreenable: false,
			//背景透明，防止放大缩小时出现白框
			transparent: true,
			backgroundColor: '#00000000',
			frame: false,
			alwaysOnTop: true,
			// 无边框
			thickFrame: false,
			webPreferences: {
				preload: 'win_preload.js',
				devTools: true,
			},
		},
		() => {
			if (utools.isDev()) {
				ubWindow.webContents.openDevTools()
			}

			//调整窗口尺寸
			ipcRenderer.on('resize', (event, width, height) => {
				if (event.senderId != ubWindow.webContents.id) return
				ubWindow.setSize(parseInt(width), parseInt(height))
				ubWindow.center() // 窗口居中
			})

			//保存悬浮文本
			ipcRenderer.on('saveText', (event, text) => {
				if (event.senderId != ubWindow.webContents.id) return
				let defaultPath = utools.getPath('downloads') + '/suspend_text_' + new Date().getTime() + '.txt'
				let savePath = utools.showSaveDialog({
					title: '保存悬浮文本',
					defaultPath: defaultPath,
					buttonLabel: '保存',
				})
				if (savePath) {
					fs.writeFileSync(savePath, text)
					utools.showNotification('保存成功')
					utools.shellShowItemInFolder(savePath)
				}
			})

			//复制悬浮文本
			ipcRenderer.on('copyText', (event, text) => {
				if (event.senderId != ubWindow.webContents.id) return
				if (utools.copyText(text)) {
					utools.showNotification('内容已复制')
				} else {
					utools.showNotification('复制内容失败')
				}
			})

			//退出插件
			ipcRenderer.on('exit', (event) => {
				if (event.senderId != ubWindow.webContents.id) return
				utools.outPlugin()
				//fix: 修复关闭窗口所有多开窗口都会被关闭
				// process.exit()
			})

			ipcRenderer.on('dbSetItem', (event, key, value) => {
				if (event.senderId != ubWindow.webContents.id) return
				utools.dbStorage.setItem(nativeId + key, value)
			})

			// ipcMain.handle('dbGetItem', (event, args) => {
			// 	// if (event.senderId != ubWindow.webContents.id) return
			// 	return utools.dbStorage.getItem(nativeId + args.key)
			// })

			ipcRenderer.on('dbRemoveItem', (event, key) => {
				if (event.senderId != ubWindow.webContents.id) return
				utools.dbStorage.removeItem(nativeId + key)
			})

			//拖拽移动窗口(纯css的win支持不好,光标不变化)
			ipcRenderer.on('moveBounds', (event, x, y, width, height) => {
				if (event.senderId != ubWindow.webContents.id) return
				let newBounds = {
					x: parseInt(x),
					y: parseInt(y),
					width: parseInt(width),
					height: parseInt(height),
				}
				ubWindow.setBounds(newBounds)
			})
			// 显示
			ubWindow.show()
			// 初始化
			ipcRenderer.sendTo(ubWindow.webContents.id, 'init')
		}
	)
}
window.exports = {
	suspend: {
		mode: 'none',
		args: {
			enter: (action) => {
				window.utools.hideMainWindow()
				localStorage.clear()
				const datas = utools.db.allDocs(nativeId)
				datas.forEach((data) => {
					localStorage.setItem(data._id.substr(nativeId.length), data.value)
				})
				if (action.type === 'over') {
					localStorage.setItem('lastText', action.payload)
					localStorage.setItem('new', true)
				}
				show()
				if (!utools.isDev()) {
					window.utools.outPlugin()
				}
			},
		},
	},
}
