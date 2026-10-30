// 输入：键盘 / 鼠标指针锁定 / 移动端虚拟摇杆
export class Input {
  constructor(dom) {
    this.dom = dom
    this.keys = new Set()
    this.pressed = new Set()
    this.lookDX = 0
    this.lookDY = 0
    this.wheel = 0
    this.joy = { x: 0, y: 0, active: false }
    this.touchLook = null
    this.locked = false
    this.enabled = true
    this.mouseDown = false
    this.onKey = null
    this._kd = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return
      if (!this.keys.has(e.code)) this.pressed.add(e.code)
      this.keys.add(e.code)
      if (['Space', 'Tab'].includes(e.code)) e.preventDefault()
      if (this.onKey) this.onKey(e.code, e)
    }
    this._ku = (e) => this.keys.delete(e.code)
    this._mm = (e) => {
      if (this.locked || this.mouseDown) {
        this.lookDX += e.movementX || 0
        this.lookDY += e.movementY || 0
      }
    }
    this._wh = (e) => {
      if (e.target === dom) this.wheel += Math.sign(e.deltaY)
    }
    this._md = (e) => {
      if (e.target !== dom) return
      if (e.button === 2) this.mouseDown = true
    }
    this._mu = () => (this.mouseDown = false)
    this._plc = () => (this.locked = document.pointerLockElement === dom)
    this._blur = () => this.keys.clear()
    window.addEventListener('keydown', this._kd)
    window.addEventListener('keyup', this._ku)
    window.addEventListener('mousemove', this._mm)
    window.addEventListener('wheel', this._wh, { passive: true })
    window.addEventListener('mousedown', this._md)
    window.addEventListener('mouseup', this._mu)
    window.addEventListener('blur', this._blur)
    document.addEventListener('pointerlockchange', this._plc)
    dom.addEventListener('contextmenu', (e) => e.preventDefault())
    // 触摸视角（右半屏拖动）
    dom.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) if (t.clientX > window.innerWidth * 0.4 && !this.touchLook) this.touchLook = { id: t.identifier, x: t.clientX, y: t.clientY }
    }, { passive: true })
    dom.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches)
        if (this.touchLook && t.identifier === this.touchLook.id) {
          this.lookDX += (t.clientX - this.touchLook.x) * 1.6
          this.lookDY += (t.clientY - this.touchLook.y) * 1.6
          this.touchLook.x = t.clientX
          this.touchLook.y = t.clientY
        }
    }, { passive: true })
    const end = (e) => {
      for (const t of e.changedTouches) if (this.touchLook && t.identifier === this.touchLook.id) this.touchLook = null
    }
    dom.addEventListener('touchend', end)
    dom.addEventListener('touchcancel', end)
  }
  requestLock() {
    if (this.dom.requestPointerLock && !('ontouchstart' in window && navigator.maxTouchPoints > 0)) {
      try {
        const p = this.dom.requestPointerLock()
        if (p && p.catch) p.catch(() => {})
      } catch (e) {}
    }
  }
  exitLock() {
    if (document.pointerLockElement) document.exitPointerLock()
  }
  down(code) {
    return this.enabled && this.keys.has(code)
  }
  hit(code) {
    return this.enabled && this.pressed.has(code)
  }
  axis() {
    if (!this.enabled) return { x: 0, y: 0 }
    let x = 0, y = 0
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y += 1
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y -= 1
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1
    if (this.joy.active) {
      x += this.joy.x
      y += this.joy.y
    }
    const l = Math.hypot(x, y)
    if (l > 1) {
      x /= l
      y /= l
    }
    return { x, y }
  }
  consumeLook() {
    const r = { x: this.lookDX, y: this.lookDY }
    this.lookDX = this.lookDY = 0
    return r
  }
  endFrame() {
    this.pressed.clear()
    this.wheel = 0
  }
  dispose() {
    window.removeEventListener('keydown', this._kd)
    window.removeEventListener('keyup', this._ku)
    window.removeEventListener('mousemove', this._mm)
    window.removeEventListener('wheel', this._wh)
    window.removeEventListener('mousedown', this._md)
    window.removeEventListener('mouseup', this._mu)
    window.removeEventListener('blur', this._blur)
    document.removeEventListener('pointerlockchange', this._plc)
  }
}
