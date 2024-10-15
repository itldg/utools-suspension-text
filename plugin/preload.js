const { ipcRenderer } = require('electron')
// 存储只与当前设备相关的信息
const nativeId = utools.getNativeId() + '/'
const fs = require('fs')
const path = require('path')
function getNow() {
	const now = new Date()
	const year = now.getFullYear()
	const month = String(now.getMonth() + 1).padStart(2, '0')
	const day = String(now.getDate()).padStart(2, '0')
	const hours = String(now.getHours()).padStart(2, '0')
	const minutes = String(now.getMinutes()).padStart(2, '0')
	const seconds = String(now.getSeconds()).padStart(2, '0')

	const currentDateTime = `${year}_${month}_${day} ${hours}_${minutes}_${seconds}`
	return currentDateTime
}
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
			minWidth: 160,
			minHeight: 10,
			// 全屏
			fullscreenable: false,
			//背景透明，防止放大缩小时出现白框
			transparent: true,
			backgroundColor: '#00000000',
			frame: false,
			// alwaysOnTop: true,//改为自定义
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
				let save_dir = utools.dbStorage.getItem(nativeId + 'save_dir')
				if (save_dir == null) {
					save_dir = utools.getPath('downloads')
				}
				let defaultPath = save_dir + '/悬浮文本_' + getNow() + '.txt'
				let savePath = utools.showSaveDialog({
					title: '保存悬浮文本',
					defaultPath: defaultPath,
					buttonLabel: '保存',
				})
				if (savePath) {
					const folderPath = path.dirname(savePath)
					utools.dbStorage.setItem(nativeId + 'save_dir', folderPath)
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
			function setOnTop() {
				// 设置窗口在所有工作区都可见
				ubWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
				ubWindow.setAlwaysOnTop(true, 'screen-saver') // 设置窗口置顶状态
			}
			//设置窗口置顶 value不等于空时设置为置顶
			ipcRenderer.on('setAlwaysOnTop', (event, value) => {
				if (event.senderId != ubWindow.webContents.id) return
				if (value) {
					setOnTop()
				} else {
					ubWindow.setAlwaysOnTop(false) // 设置窗口非置顶状态
				}

				utools.dbStorage.setItem(nativeId + 'AlwaysOnTop', value)
			})
			if (!!localStorage.getItem('AlwaysOnTop')) {
				setOnTop()
			}
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
