const userOption = {
	//明亮颜色
	lightColor: '#f8f7b6',
	//明亮字体颜色
	lightFontColor: '#000000',
	//暗黑颜色
	darkColor: '#303133',
	//暗黑字体颜色
	darkFontColor: '#999999',
	//透明度
	opacity: 9,
	//字体大小
	fontSize: 20,

	//最小字体尺寸
	minFontSize: 6,
	//边框尺寸
	border: 10,
	//最大宽度
	maxWidth: 600,
}
let options = {}

function show(options) {
	const elstyle = document.documentElement.style
	elstyle.setProperty('--font-size', options.fontSize + 'px')
	elstyle.setProperty('--light-font-color', options.lightFontColor)
	elstyle.setProperty('--light-color', hexToRgba(options.lightColor, options.opacity / 10))
	elstyle.setProperty('--dark-font-color', options.darkFontColor)
	elstyle.setProperty('--dark-color', hexToRgba(options.darkColor, options.opacity / 10))

	//根据系统主题更改主题
	const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
	isDark ? document.body.classList.add('dark') : document.body.classList.remove('dark')
}
window.init = async () => {
	let lastOption = localStorage.getItem('option')
	options = {
		...userOption,
		...JSON.parse(lastOption),
	}
	show(options)
	//dom元素
	const content = document.getElementById('content')
	const option = document.getElementById('option')
	document.getElementById('setting-btn').addEventListener('click', () => {
		if (window.outerWidth < 200 || window.outerHeight < 400) {
			window.resize(200, 400)
		}
		option.style.display = 'block'
		document.body.classList.add('open')
		setOption()
	})
	document.getElementById('option-cancel').addEventListener('click', () => {
		document.body.classList.remove('open')
		option.style.display = 'none'
		show(options)
	})
	document.getElementById('option-save').addEventListener('click', () => {
		document.body.classList.remove('open')
		option.style.display = 'none'
		options = { ...optionTemp }
		saveOptions()
	})
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
		window.resize(width, options.fontSize)
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
	let lastWidth = 0
	let lastHeight = 0
	//设置焦点
	content.focus()
	let closeTimer = null
	let escFirst = false
	function close() {
		localStorage.setItem('lastText', content.value)
		localStorage.setItem('width', window.outerWidth)
		localStorage.setItem('height', window.outerHeight)
		window.close()
	}
	//按下esc关闭窗口
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') {
			if (escFirst) {
				clearTimeout(closeTimer)
				localStorage.removeItem('lastText')
				window.close()
				return
			}
			escFirst = true
			closeTimer = setTimeout(close, 200)
		}
		if (!event.ctrlKey) return
		//保存文件
		if (event.key === 's') {
			event.preventDefault()
			window.saveText(content.value)
		}
	})

	// 绑定鼠标滚轮事件
	document.addEventListener('wheel', function (event) {
		// 检查是否按下了Ctrl键
		if (event.ctrlKey) {
			// 判断滚轮方向
			if (event.deltaY < 0) {
				// 放大字体
				options.fontSize++
			} else {
				// 缩小字体
				options.fontSize--
				options.fontSize < options.minFontSize && (options.fontSize = options.minFontSize)
			}
			changeFontSize()
		}
	})

	let moveIng = false
	let startX = 0
	let startY = 0
	const move = (event) => {
		if (!moveIng) return
		const x = window.screenX + event.clientX - startX
		const y = window.screenY + event.clientY - startY
		window.moveBounds(parseInt(x), parseInt(y), lastWidth, lastHeight)
	}
	//绑定拖拽移动事件
	document.addEventListener('mousedown', (event) => {
		if (event.button === 0 && event.target.id === 'container') {
			moveIng = true
			startX = parseInt(event.clientX)
			startY = parseInt(event.clientY)
			lastWidth = parseInt(window.outerWidth)
			lastHeight = parseInt(window.outerHeight)
			document.addEventListener('mousemove', move)
		}
	})
	document.addEventListener('mouseup', (event) => {
		if (!moveIng) return
		document.removeEventListener('mousemove', move)
		moveIng = false
	})

	async function autoHeight(width) {
		//加个延迟,避免之前的宽度修改未生效
		await sleep()
		//获取dom的高度,更改窗口高度
		const height = content.scrollHeight + options.border * 2
		// console.log('高度', height)
		window.resize(width, height)
	}
	let optionTemp = {}
	//绑定参数更新事件
	document.getElementById('option').addEventListener('input', (event) => {
		const target = event.target
		const name = target.id
		if (optionTemp[name] === undefined) return
		const value = target.value
		optionTemp[name] = value
		show(optionTemp)
	})

	//更新设置界面
	function setOption() {
		for (const key in options) {
			const el = document.getElementById(key)
			if (el) {
				el.value = options[key]
			}
		}
		optionTemp = { ...options }
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
 * 颜色格式 hex 转 rgba
 * @param {*} bgColor
 * @param {*} opacity
 * @return {*}
 */
function hexToRgba(bgColor, opacity = 1) {
	let color = bgColor.slice(1) // 去掉'#'号
	let rgba = [parseInt('0x' + color.slice(0, 2)), parseInt('0x' + color.slice(2, 4)), parseInt('0x' + color.slice(4, 6)), opacity]
	return 'rgba(' + rgba.toString() + ')'
}

/**
 * 修改页面字体大小(修改CSS变量的方式)
 */
function changeFontSize() {
	document.documentElement.style.setProperty('--font-size', options.fontSize + 'px')
	saveOptions()
}
/**
 * 保存设置
 */
function saveOptions() {
	localStorage.setItem('option', JSON.stringify(options))
}
