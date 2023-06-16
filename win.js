window.init=async () => {
	//基本选项
	const options = {
		//字宽
		fontSize: 20,
		//最小字体尺寸
		minFontSize: 6,
		//边框尺寸
		border: 10,
		//最大宽度
		maxWidth: 600,
	}
	let fontSize = localStorage.getItem('fontSize') ?? options.fontSize
	changeFontSize(fontSize)
	//根据系统主题更改主题
	const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
	isDark && document.body.classList.add('dark')

	//dom元素
	const content = document.getElementById('content')

	//读取历史数据
	const lastText = localStorage.getItem('lastText') ?? ''
	content.value = lastText

	if (localStorage.getItem('new') !== null) {
		console.log('带着内容进入插件')
		localStorage.removeItem('new')
		//根据文本计算每行最宽
		const lines = lastText.split('\n')
		let maxWidth = 0
		const font = window.getComputedStyle(content).font
		for (let i = 0; i < lines.length; i++) {
			maxWidth = Math.max(maxWidth, getTextWidth(lines[i], font))
		}
		//末尾+10 适应滚动条
		const width = (maxWidth > options.maxWidth ? options.maxWidth : maxWidth) + options.border * 2 + 10
		window.resize(width, fontSize)
		autoHeight(width)
	} else {
		console.log('使用上次缓存内容')
		const width = localStorage.getItem('width')
		const height = localStorage.getItem('height')
		if (width && height) {
			window.resize(width, height)
		}
	}
	content.style.height = '100%'
	//设置焦点
	content.focus()
	//按下esc关闭窗口
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') {
			if (event.ctrlKey) {
				localStorage.clear()
			} else {
				localStorage.setItem('lastText', content.value)
				localStorage.setItem('width', window.outerWidth)
				localStorage.setItem('height', window.outerHeight)
			}
			window.close()
		}
	})

	// 绑定鼠标滚轮事件
	document.addEventListener('wheel', function (event) {
		// 检查是否按下了Ctrl键
		if (event.ctrlKey) {
			// 判断滚轮方向
			if (event.deltaY < 0) {
				// 放大字体
				fontSize++
			} else {
				// 缩小字体
				fontSize--
				fontSize < options.minFontSize && (fontSize = options.minFontSize)
			}
			changeFontSize(fontSize)
		}
	})

	async function autoHeight(width) {
		//加个延迟,避免之前的宽度修改未生效
		await sleep()
		//获取dom的高度,更改窗口高度
		const height = content.scrollHeight + options.border * 2
		// console.log('高度', height)
		window.resize(width, height)
	}
}

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

/**
 * 修改页面字体大小(修改CSS变量的方式)
 * @param {Number} newFontSize 新的字体大小
 */
function changeFontSize(newFontSize) {
	document.documentElement.style.setProperty('--font-size', newFontSize + 'px')
	localStorage.setItem('fontSize', newFontSize)
}
