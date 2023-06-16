const { ipcRenderer } = require('electron')
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
			minWidth: 10,
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

			ipcRenderer.on('resize', (event, width, height) => {
				if (event.senderId == ubWindow.webContents.id) {
					ubWindow.setSize(parseInt(width), parseInt(height))
					ubWindow.center() // 窗口居中
				}
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
