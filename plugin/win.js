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
	//字体
	fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",

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
	elstyle.setProperty('--font-family', options.fontFamily)

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
	const fontList = document.getElementById('fontList')
	const option = document.getElementById('option')
	const topBar = document.getElementById('top-bar')
	document.getElementById('setting-btn').addEventListener('click', async () => {
		if (option.style.display === 'block') return
		if (fontList.innerHTML === '') {
			await logFontData()
		}
		if (window.outerWidth < 320 || window.outerHeight < 420) {
			window.resize(Math.max(window.outerWidth, 320), Math.max(window.outerHeight, 420))
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
	document.getElementById('close-btn').addEventListener('click', close)
	document.getElementById('save-btn').addEventListener('click', () => {
		window.saveText(content.value)
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
		const positionJSON = localStorage.getItem('position')
		if (width && height) {
			window.resize(width, height)
			// 位置记忆
			if (positionJSON) {
				const position = JSON.parse(positionJSON)
				window.moveBounds(position.x, position.y, width, height)
			}
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
		const position = {
			y: window.screenTop,
			x: window.screenLeft,
		}
		localStorage.setItem('position', JSON.stringify(position))
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

	async function logFontData() {
		try {
			let availableFonts = await window.queryLocalFonts()
			availableFonts.sort((a, b) => {
				return a.fullName.localeCompare(b.fullName)
			})
			let html = ''
			for (const fontData of availableFonts) {
				let font = fontData.fullName
				if (!isSupportFontFamily(fontData.fullName)) {
					font = fontData.family
				}
				html += `<option value="${font}" style="font-family: '${font}';">${fontData.fullName}</option>`
			}
			fontList.innerHTML = html
			initSelect()
		} catch (err) {
			console.error(err.name, err.message)
		}
	}

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
	topBar.addEventListener('mousedown', (event) => {
		if (event.button === 0) {
			moveIng = true
			startX = parseInt(event.clientX)
			startY = parseInt(event.clientY)
			lastWidth = parseInt(window.outerWidth)
			lastHeight = parseInt(window.outerHeight)
			document.addEventListener('mousemove', move)
		}
	})
	topBar.addEventListener('mouseup', (event) => {
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

	function initSelect() {
		let selects = document.querySelectorAll('.ldg-select')
		selects.forEach(function (select) {
			var selectInput = select.querySelector('.ldg-select-input')
			var selectDropdown = select.querySelector('.ldg-select-dropdown')
			var selectItems = Array.from(selectDropdown.children)

			// 显示下拉菜单
			selectInput.addEventListener('click', function () {
				selectDropdown.style.display = 'block'
			})

			// 隐藏下拉菜单
			document.addEventListener('click', function (event) {
				const parent = event.target.closest('.ldg-select')
				if (parent != select) {
					selectDropdown.style.display = 'none'
				}
			})

			// 选择选项
			selectItems.forEach(function (item) {
				item.addEventListener('click', function () {
					selectInput.value = item.value
					selectDropdown.style.display = 'none'
					optionTemp['fontFamily'] = item.value
					show(optionTemp)
				})
			})

			// 监听键盘事件
			selectInput.addEventListener('keydown', function (event) {
				let selectedItem = select.querySelector('.selected')
				if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
					event.preventDefault()
					let filteredItems = Array.from(selectItems).filter(function (item) {
						return getComputedStyle(item).display !== 'none'
					})
					if (selectedItem) {
						selectedItem.classList.remove('selected')
						if (filteredItems.length === 1) {
							selectedItem = filteredItems[0]
						} else if (filteredItems.length === 0) {
							selectedItem = null
						} else {
							let index = filteredItems.findIndex((item) => item === selectedItem)
							event.key === 'ArrowDown' ? index++ : index--
							if (index < 0) index = 0
							if (index >= filteredItems.length) index = filteredItems.length - 1
							selectedItem = filteredItems[index]
						}
					}

					if (!selectedItem) {
						selectedItem = event.key === 'ArrowDown' ? filteredItems[0] : filteredItems[filteredItems.length - 1]
					}
					if (selectedItem) {
						selectedItem.classList.add('selected')
						selectInput.value = selectedItem.value
						selectedItem.scrollIntoView()
						optionTemp['fontFamily'] = selectedItem.value
						show(optionTemp)
					}
				} else if (event.key === 'Enter') {
					event.preventDefault()
					if (selectedItem) {
						selectDropdown.style.display = 'none'
					}
				}
			})

			// 监听输入事件
			selectInput.addEventListener('input', function () {
				var searchText = selectInput.value.toLowerCase()

				selectItems.forEach(function (item) {
					var itemText = item.textContent.toLowerCase()

					if (itemText.includes(searchText)) {
						item.style.display = 'block'
					} else {
						item.style.display = 'none'
					}
				})
			})
		})
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
const canvasTemp = document.createElement('canvas')
const ctx = canvasTemp.getContext('2d', { willReadFrequently: true })
ctx.textAlign = 'center'
ctx.fillStyle = 'black'
ctx.textBaseline = 'middle'
/**
 * 检查字体是否存在
 * @param {String} f 字体名称
 * @return {Boolean}
 */
function isSupportFontFamily(f) {
	//    f是要检测的字体
	if (typeof f != 'string') {
		return false
	}
	//    h是基础字体
	var h = 'Arial'
	if (f.toLowerCase() == h.toLowerCase()) {
		return true
	}
	//    设置一个检测的字符A,看他是否支持f字体
	var e = 'a'
	var d = 100
	var a = 100,
		i = 100
	ctx.width = a
	ctx.height = i
	var g = function (j) {
		ctx.clearRect(0, 0, a, i)
		//        字体是传入的j,或者是默认的h
		ctx.font = d + 'px ' + j + ', ' + h
		ctx.fillText(e, a / 2, i / 2)
		//        获取所有的canvas图片信息
		var k = ctx.getImageData(0, 0, a, i).data
		//        k调用数组的 filter方法,筛选符合条件的。改变原数组。
		return [].slice.call(k).filter(function (l) {
			return l != 0
		})
	}
	//    返回结果,如果h默认字体和输入待检测字体f.通过g函数检测得到的字符串不一致,说明自提生效
	return g(h).join('') !== g(f).join('')
}
