;(async () => {
	//基本选项
	const options = {
		//字宽
		fontwidth: 20,
		//边框尺寸
		border: 10,
		//默认最大宽度
		maxWidth: 600,
	}
	//根据系统主题更改主题
	const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
	isDark && document.body.classList.add('dark')

	//dom元素
	const content = document.getElementById('content')

	//读取历史数据
	const lastText = localStorage.getItem('lastText') ?? ''
	content.value = lastText
	let width
	if (localStorage.getItem('new') !== null) {
		console.log('带着内容进入插件')
		localStorage.removeItem('new')
		//根据文本计算每行最宽
		const lines = lastText.split('\n')
		let line = ''
		let maxWidth = 0
		const font = window.getComputedStyle(content).font
		console.log(font)
		for (let i = 0; i < lines.length; i++) {
			maxWidth = Math.max(maxWidth, getTextWidth(lines[i], font))
		}
		//末尾+10 适应滚动条
		width = (maxWidth > options.maxWidth ? options.maxWidth : maxWidth) + options.border * 2 + 10
	} else {
		console.log('使用上次缓存内容')
		width = localStorage.getItem('width')
	}
	if (width) {
		window.resizeTo(width, 40)
		await sleep()
		//获取dom的高度,更改窗口高度
		const height = content.offsetHeight + content.scrollHeight + options.border * 2
		window.resizeTo(width, height)
		content.style.height = '100%'
		//设置焦点
		content.focus()
	}

	//按下esc关闭窗口
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') {
			window.close()
		}
	})
	//关闭前保存数据
	window.onbeforeunload = () => {
		localStorage.setItem('lastText', content.value)
		localStorage.setItem('width', window.outerWidth)
	}
})()

/**
 * 等待一段时间
 * @param {Number} time 等待的毫秒数
 * @return {Promise}
 */
function sleep(time = 50) {
	return new Promise((resolve) => setTimeout(resolve, time))
}
/**
 * 测量文本宽度
 * @param {String} text 要测量的文本内容
 * @param {String} font 字体样式
 * @return {Number} 文本宽度
 */
function getTextWidth(text, font) {
	var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'))
	var context = canvas.getContext('2d')
	context.font = font
	var metrics = context.measureText(text)
	return metrics.width
}
