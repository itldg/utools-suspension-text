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
			// 全屏
			fullscreenable: false,
			//背景透明，防止放大缩小时出现白框
			transparent: true,
			backgroundColor: '#00000000',
			frame: false,
			alwaysOnTop: true,
			// 无边框
			thickFrame: false,
		},
		() => {
			if (utools.isDev()) {
				ubWindow.webContents.openDevTools()
			}
			// 显示
			ubWindow.show()
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
