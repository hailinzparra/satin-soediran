export const inject_script = (file_path: string) => {
    try {
        const script = document.createElement('script')
        script.src = chrome.runtime.getURL(file_path)
        script.type = 'text/javascript'
        script.onload = (event: Event) => {
            const target_script = event.target as HTMLScriptElement
            target_script.remove()
        }
        const target = document.head || document.documentElement
        if (target) {
            target.append(script)
        } else {
            console.error('inject script: neither document.head nor document.documentElement found.')
        }
    } catch (error) {
        console.error('script injection failed:', error)
    }
}

export const sleep = (ms: number): Promise<any> => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export class VaultDriver<T extends Record<string, any> = Record<string, any>> {
    public key: string
    public data: T
    private default_data: T

    constructor(key: string, default_data: T = {} as T) {
        this.key = key
        this.data = { ...default_data }
        this.default_data = default_data
    }
    async update(new_data: Partial<T>): Promise<void> {
        this.data = { ...this.data, ...new_data }
        await this.save()
    }
    async save(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                chrome.storage.local.set({ [this.key]: this.data }, () => {
                    if (chrome.runtime.lastError) {
                        throw chrome.runtime.lastError
                    } else {
                        resolve()
                    }
                })
            }
            catch (err) {
                console.error(`Failed to save ${this.key}:`, err)
                reject(err)
            }
        })
    }
    async load(): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            chrome.storage.local.get(this.key, (result) => {
                if (chrome.runtime.lastError) {
                    console.error(`Failed to load ${this.key}:`, chrome.runtime.lastError)
                    reject(chrome.runtime.lastError)
                } else {
                    if (result && result[this.key]) {
                        this.data = { ...this.data, ...(result[this.key] as Record<string, any>) }
                    }
                    resolve(this.data)
                }
            })
        })
    }
    async reset(): Promise<void> {
        this.data = { ...this.default_data }
        await this.save()
    }
}

export class Tab {
    public id: string
    public name: string
    public children: HTMLElement[]
    public on_close_callback: (id: string) => void
    public is_permanent: boolean
    public tab_header_el: HTMLButtonElement | null = null
    public tab_content_el: HTMLDivElement | null = null
    static CLOSE_SVG: string = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
    constructor(
        id: string,
        name: string,
        children: HTMLElement[],
        on_close_callback: (id: string) => void,
        is_permanent: boolean = false,
    ) {
        this.id = id
        this.name = name
        this.children = children
        this.on_close_callback = on_close_callback
        this.is_permanent = is_permanent
    }
    public render_header(): HTMLButtonElement {
        const button = document.createElement('button')
        button.id = `tab-${this.id}`
        button.dataset.tabId = this.id
        button.className = 'px-4 h-full text-[11px] font-bold uppercase tracking-wider border-b-2 border-transparent text-slate-400 hover:text-slate-600 flex items-center gap-2 transition-all shrink-0 focus:outline-none'

        const title_span = document.createElement('span')
        title_span.className = 'tab-title-text'
        title_span.textContent = this.name
        button.append(title_span)

        if (!this.is_permanent) {
            const close_btn = document.createElement('span')
            close_btn.className = 'tab-close-icon ml-1 text-slate-400 hover:text-rose-500 transition-colors flex items-center justify-center p-0.5 rounded'
            close_btn.innerHTML = Tab.CLOSE_SVG
            close_btn.addEventListener('click', (e: MouseEvent) => {
                e.stopPropagation()
                if (this.on_close_callback) this.on_close_callback(this.id)
            })
            button.append(close_btn)
        }

        this.tab_header_el = button
        return button
    }
    public render_content(): HTMLDivElement {
        const content_div = document.createElement('div')
        content_div.className = 'tab-content-panel'
        content_div.dataset.tabId = this.id

        content_div.className = 'p-6 space-y-6 mb-10 hidden'
        if (this.children.length) {
            content_div.append(...this.children.filter(Boolean))
        }

        this.tab_content_el = content_div
        return content_div
    }
    public activate() {
        if (this.tab_header_el) {
            this.tab_header_el.classList.remove('border-transparent', 'text-slate-400', 'hover:text-slate-600')
            this.tab_header_el.classList.add('border-blue-600', 'text-blue-600')
        }
        if (this.tab_content_el) {
            this.tab_content_el.classList.remove('hidden')
        }
    }
    public deactivate() {
        if (this.tab_header_el) {
            this.tab_header_el.classList.remove('border-blue-600', 'text-blue-600')
            this.tab_header_el.classList.add('border-transparent', 'text-slate-400', 'hover:text-slate-600')
        }
        if (this.tab_content_el) {
            this.tab_content_el.classList.add('hidden')
        }
    }
    public destroy() {
        this.tab_header_el?.remove()
        this.tab_content_el?.remove()
    }
}

export class TabManager {
    public container: HTMLDivElement
    public tabs: Map<string, Tab> = new Map()
    public active_tab_id: string | null = null
    public wrapper_el: HTMLDivElement | null
    public headers_container: HTMLDivElement | null
    public contents_container: HTMLDivElement | null
    constructor(container_id: string) {
        let target_el = document.getElementById(container_id) as HTMLDivElement
        if (!target_el) {
            target_el = document.createElement('div')
            target_el.id = container_id
            target_el.className = 'h-full'
        }
        this.container = target_el
        this.container.classList.add('hidden')
        this.container.innerHTML = `
            <div class="tab-manager-wrapper flex flex-col h-full w-full">
                <div class="tab-headers-container bg-white border-b border-slate-200 flex items-center px-4 gap-1 h-10 flex-shrink-0 overflow-x-auto scrollbar-none"></div>
                <div class="tab-contents-container flex-1 overflow-y-auto"></div>
            </div>
        `
        this.wrapper_el = this.container.querySelector('.tab-manager-wrapper')
        this.headers_container = this.container.querySelector('.tab-headers-container')
        this.contents_container = this.container.querySelector('.tab-contents-container')
    }
    public get_tab(id: string): Tab | undefined {
        return this.tabs.get(id)
    }
    public get_tab_header_el(id: string): HTMLButtonElement | null {
        const tab = this.get_tab(id)
        return tab ? tab.tab_header_el : null
    }
    public get_tab_content_el(id: string): HTMLDivElement | null {
        const tab = this.get_tab(id)
        return tab ? tab.tab_content_el : null
    }
    public add_tab(id: string, name: string, children: HTMLElement[], is_permanent: boolean = false) {
        if (this.tabs.has(id)) {
            this.switch_tab(id)
            return
        }

        const new_tab = new Tab(id, name, children, (tab_id) => this.remove_tab(tab_id), is_permanent)
        this.tabs.set(id, new_tab)

        const header_el = new_tab.render_header()
        const content_el = new_tab.render_content()

        header_el.addEventListener('click', () => this.switch_tab(id))

        if (this.headers_container) this.headers_container.appendChild(header_el)
        if (this.contents_container) this.contents_container.appendChild(content_el)

        this.switch_tab(id)
    }
    public switch_tab(id: string) {
        if (!this.tabs.has(id)) return
        if (this.active_tab_id && this.tabs.has(this.active_tab_id)) {
            this.tabs.get(this.active_tab_id)!.deactivate()
        }
        this.active_tab_id = id
        this.tabs.get(id)!.activate()
    }
    public remove_tab(id: string) {
        const tab_to_destroy = this.tabs.get(id)

        if (!tab_to_destroy) return
        if (tab_to_destroy.is_permanent) return

        tab_to_destroy.destroy()
        this.tabs.delete(id)

        if (this.active_tab_id === id) {
            const remaining_ids = Array.from(this.tabs.keys())
            if (remaining_ids.length > 0) {
                this.switch_tab(remaining_ids[remaining_ids.length - 1])
            } else {
                this.active_tab_id = null
            }
        }
    }
    public open(id: string = '') {
        this.container.classList.remove('hidden')
        if (id) {
            this.switch_tab(id)
        } else if (this.active_tab_id) {
            this.switch_tab(this.active_tab_id)
        }
    }
    public close() {
        this.container.classList.add('hidden')
    }
}

export const title_case_name = (name: string | undefined): string => {
    if (!name) return ''
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/(?:^|[\s\-])\S/g, (match) => match.toUpperCase())
}

export const clean_and_format_gelar = (title: string | undefined, is_gelar_depan: boolean): string => {
    if (!title) return ''

    let cleaned = title
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\.+/g, '.')
        .replace(/,+$/, '')

    let result = ''

    if (is_gelar_depan) {
        const tokens = cleaned.split(' ')
        const formatted_tokens = tokens.map(token => {
            const lower_token = token.toLowerCase()
            if (lower_token === 'dr' || lower_token === 'dr.') {
                return 'dr.'
            }
            return token.toLowerCase().replace(/(?:^|[\s\-])\S/g, (match) => match.toUpperCase())
        })
        result = formatted_tokens.join(' ')
        if (result && !result.endsWith('.')) result += '.'
        result = result.replace(/\.+$/, '.')
    } else {
        result = cleaned
        result = result.replace(/,(?!\s)/g, ', ')
        result = result.replace(/\s+/g, ' ')
    }

    return result.replace(/\.+/g, '.')
}

export const format_fullname = (
    raw_name: string | undefined,
    gelar_depan: string | undefined,
    gelar_belakang: string | undefined,
): string => {
    const clean_name = title_case_name(raw_name)
    if (!clean_name) return ''

    const depan = clean_and_format_gelar(gelar_depan, true)
    const belakang = clean_and_format_gelar(gelar_belakang, false)

    const name_parts: string[] = []
    if (depan) name_parts.push(depan)
    name_parts.push(clean_name)

    let fullname = name_parts.join(' ')
    if (belakang) {
        fullname += `, ${belakang}`
    }

    return fullname
}

interface CreateElementOptions {
    classes?: string
    attrs?: Record<string, string | number | boolean>
    styles?: {
        [K in keyof Omit<
            CSSStyleDeclaration,
            'length' | 'parentRule' | 'getPropertyPriority' | 'getPropertyValue' | 'item' | 'removeProperty' | 'setProperty' | number
        >]?: string | number | null
    }
    text?: string
    html?: string
}

type CreatedElement<T extends string> =
    T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] :
    T extends keyof SVGElementTagNameMap ? SVGElementTagNameMap[T] :
    Element

export const create_element = <T extends (keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap)>(
    tag: T,
    { classes = '', attrs = {}, styles = {}, text = '', html = '' }: CreateElementOptions = {},
    children: (Node | string | null | undefined | false)[] = []
): CreatedElement<T> => {
    const svg_tags = ['svg', 'path', 'g', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'use', 'defs']
    const is_svg = svg_tags.includes(tag.toLowerCase())

    const element = (is_svg
        ? document.createElementNS('http://www.w3.org/2000/svg', tag)
        : document.createElement(tag)) as CreatedElement<T>

    if (classes.length) {
        element.setAttribute('class', classes)
    }

    for (const [key, val] of Object.entries(attrs)) {
        element.setAttribute(key, String(val))
    }

    if (element instanceof HTMLElement || element instanceof SVGElement) {
        for (const [key, val] of Object.entries(styles)) {
            if (val !== null && val !== undefined) {
                (element.style as any)[key] = String(val)
            }
        }
    }

    if (html) {
        element.innerHTML = html
    } else if (text) {
        element.textContent = text
    }

    if (children.length) {
        const valid_children = children.filter((child): child is Node | string => !!child)
        element.append(...valid_children)
    }

    return element
}

interface ModalConfig {
    id: string
    title: string
    content: HTMLElement | string
    top?: string
    left?: string
    width?: string
    height?: string
    parent_el: HTMLElement
}

export class ModalInstance {
    public id: string
    public el: HTMLElement
    public header: HTMLElement
    public title_el: HTMLSpanElement
    public min_btn: HTMLButtonElement
    public close_btn: HTMLButtonElement
    public body: HTMLElement
    public parent: HTMLElement

    public original_width: string
    public original_height: string
    public is_minimized: boolean = false

    constructor(data: {
        id: string
        el: HTMLElement
        header: HTMLElement
        title_el: HTMLSpanElement
        min_btn: HTMLButtonElement
        close_btn: HTMLButtonElement
        body: HTMLElement
        parent: HTMLElement
        original_width: string
        original_height: string
    }) {
        this.id = data.id
        this.el = data.el
        this.header = data.header
        this.title_el = data.title_el
        this.min_btn = data.min_btn
        this.close_btn = data.close_btn
        this.body = data.body
        this.parent = data.parent
        this.original_width = data.original_width
        this.original_height = data.original_height
    }

    public close(): void {
        ModalUI.close(this.id)
    }

    public focus(should_animate: boolean = false): void {
        ModalUI.focus(this.id, should_animate)
    }

    public toggle_minimize(): void {
        ModalUI.toggle_minimize(this.id)
    }
}

class ModalManager {
    private static instance: ModalManager
    private modals: Map<string, ModalInstance> = new Map()
    private base_z_index: number = 100
    private style_id: string = 'custom-modal-manager-styles'
    private font_id: string = 'custom-modal-font-link'

    private static CHEVRON_SVG = `<svg class="modal-chevron-icon" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="transform: rotate(0deg);"><path d="M19 9l-7 7-7-7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`
    private static CLOSE_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`

    private constructor() { }

    public static get_instance(): ModalManager {
        if (!ModalManager.instance) {
            ModalManager.instance = new ModalManager()
        }
        return ModalManager.instance
    }

    private ensure_styles_injected(): void {
        if (!document.getElementById(this.font_id)) {
            const link_el = document.createElement('link')
            link_el.id = this.font_id
            link_el.rel = 'stylesheet'
            link_el.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'
            document.head.appendChild(link_el)
        }

        if (document.getElementById(this.style_id)) return

        const style_el = document.createElement('style')
        style_el.id = this.style_id
        style_el.textContent = `
            @keyframes modalFirstOpen {
                0% { opacity: 0; transform: scale(0.92); }
                100% { opacity: 1; transform: scale(1); }
            }
            @keyframes modalPop {
                0% { transform: scale(0.92); }
                100% { transform: scale(1); }
            }
            .custom-managed-modal {
                transform-origin: center center;
                transition: height 0.2s ease, width 0.2s ease, border-radius 0.2s ease;
                border-radius: 4px;
                font-family: "Plus Jakarta Sans", sans-serif !important;
                letter-spacing: -0.01em;
                font-size: 13px;
            }
            .custom-managed-modal input, 
            .custom-managed-modal textarea, 
            .custom-managed-modal button,
            .custom-managed-modal select {
                font-family: "Plus Jakarta Sans", sans-serif !important;
            }
            .modal-header-handle {
                transition: border-radius 0.2s ease;
                border-radius: 4px 4px 0px 0px;
            }
            .custom-managed-modal.is-minimized,
            .custom-managed-modal.is-minimized .modal-header-handle {
                border-radius: 4px !important;
            }
            .custom-managed-modal.animate-open {
                animation: modalFirstOpen 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
            .custom-managed-modal.animate-pop {
                animation: modalPop 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
            .custom-managed-modal.is-minimized .modal-header-handle span {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 110px;
            }
            .modal-action-btn {
                border: 1px solid transparent;
                background: transparent;
                cursor: pointer;
                padding: 3px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                color: #64748b;
                transition: all 0.2s ease;
            }
            .modal-action-btn svg {
                transition: transform 0.2s ease;
            }
            .modal-min-btn:hover {
                color: #1d4ed8;
                background-color: #dbeafe;
                border-color: #1e40af;
            }
            .modal-close-btn:hover {
                color: #f43f5e;
                background-color: #ffe4e6;
                border-color: #9f1239;
            }
            .modal-body-content {
                transition: height 0.2s ease, min-height 0.2s ease, max-height 0.2s ease, padding 0.2s ease;
            }
            .custom-managed-modal.is-minimized .modal-body-content {
                height: 0px !important;
                min-height: 0px !important;
                max-height: 0px !important;
                padding-top: 0px !important;
                padding-bottom: 0px !important;
                overflow: hidden !important;
                border-bottom: none !important;
            }
        `
        document.head.append(style_el)
    }

    public fire(config: ModalConfig): { instance: ModalInstance; is_existing: boolean } {
        this.ensure_styles_injected()

        const { id, title, content, parent_el } = config
        const existing = this.modals.get(id)

        if (existing) {
            if (existing.parent !== parent_el) {
                this.close(id)
            } else {
                this.focus(id, true)
                return { instance: existing, is_existing: true }
            }
        }

        const modal_top = config.top ?? '50px'
        const modal_left = config.left ?? '50px'
        const modal_width = config.width ?? '400px'
        const modal_height = config.height ?? '300px'

        const modal_el = document.createElement('div')
        modal_el.id = `custom-modal-${id}`
        modal_el.className = 'custom-managed-modal animate-open'
        modal_el.style.position = 'absolute'
        modal_el.style.top = modal_top
        modal_el.style.left = modal_left
        modal_el.style.width = modal_width
        modal_el.style.height = modal_height
        modal_el.style.backgroundColor = '#ffffff'
        modal_el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'
        modal_el.style.display = 'flex'
        modal_el.style.flexDirection = 'column'
        modal_el.style.border = '1px solid #b5b5b5'

        modal_el.addEventListener('mousedown', () => this.focus(id, false))

        const header_el = document.createElement('div')
        header_el.className = 'modal-header-handle'
        header_el.style.padding = '8px 12px'
        header_el.style.background = '#f1f1f1'
        header_el.style.cursor = 'move'
        header_el.style.display = 'flex'
        header_el.style.justifyContent = 'space-between'
        header_el.style.alignItems = 'center'
        header_el.style.borderBottom = '1px solid #d0d0d0'
        header_el.style.userSelect = 'none'
        header_el.style.overflow = 'hidden'

        const title_el = document.createElement('span')
        title_el.innerText = title
        title_el.style.fontWeight = 'bold'
        header_el.append(title_el)

        const actions_wrapper = document.createElement('div')
        actions_wrapper.style.display = 'flex'
        actions_wrapper.style.alignItems = 'center'
        actions_wrapper.style.gap = '2px'
        actions_wrapper.style.flexShrink = '0'

        const min_btn = document.createElement('button')
        min_btn.className = 'modal-action-btn modal-min-btn'
        min_btn.innerHTML = ModalManager.CHEVRON_SVG

        const chevron_svg = min_btn.querySelector('svg') as SVGElement
        if (chevron_svg) chevron_svg.style.transform = 'rotate(0deg)'

        min_btn.addEventListener('click', (e) => {
            e.stopPropagation()
            this.toggle_minimize(id)
        })
        actions_wrapper.append(min_btn)

        const close_btn = document.createElement('button')
        close_btn.className = 'modal-action-btn modal-close-btn'
        close_btn.innerHTML = ModalManager.CLOSE_SVG
        close_btn.addEventListener('click', (e) => {
            e.stopPropagation()
            this.close(id)
        })
        actions_wrapper.append(close_btn)
        header_el.append(actions_wrapper)
        modal_el.append(header_el)

        const body_el = document.createElement('div')
        body_el.className = 'modal-body-content'
        body_el.style.padding = '12px'
        body_el.style.flex = '1'
        body_el.style.overflow = 'auto'

        if (typeof content === 'string') {
            body_el.innerHTML = content
        } else {
            body_el.append(content)
        }
        modal_el.append(body_el)

        this.setup_dragging(header_el, modal_el)

        if (parent_el.style.position !== 'relative' && parent_el.style.position !== 'absolute') {
            parent_el.style.position = 'relative'
        }

        parent_el.append(modal_el)

        const instance = new ModalInstance({
            id: id,
            el: modal_el,
            header: header_el,
            title_el: title_el,
            min_btn: min_btn,
            close_btn: close_btn,
            body: body_el,
            parent: parent_el,
            original_width: modal_width,
            original_height: modal_height
        })

        this.modals.set(id, instance)
        this.focus(id, false)

        return { instance, is_existing: false }
    }

    public toggle_minimize(id: string): void {
        const target = this.modals.get(id)
        if (!target) return

        const chevron_svg = target.min_btn.querySelector('svg') as SVGElement

        if (!target.is_minimized) {
            target.el.classList.add('is-minimized')
            target.el.style.width = '200px'
            target.el.style.height = 'auto'
            target.is_minimized = true
            if (chevron_svg) chevron_svg.style.transform = 'rotate(-90deg)'
        } else {
            target.el.classList.remove('is-minimized')
            target.el.style.width = target.original_width
            target.el.style.height = target.original_height
            target.is_minimized = false
            if (chevron_svg) chevron_svg.style.transform = 'rotate(0deg)'
        }
    }

    public focus(id: string, should_animate: boolean = false): void {
        const target = this.modals.get(id)
        if (!target) return

        this.modals.forEach((item) => {
            if (item.el !== target.el) {
                item.el.classList.remove('animate-open')
            }
            item.el.classList.remove('is-focused', 'animate-pop')
            item.el.style.borderColor = '#b5b5b5'
            if (item.header) item.header.style.background = '#f1f1f1'
        })

        this.base_z_index += 1
        target.el.style.zIndex = this.base_z_index.toString()

        target.el.classList.add('is-focused')
        target.el.style.borderColor = '#157fcc'
        if (target.header) target.header.style.background = '#e1effb'

        if (should_animate) {
            target.el.classList.remove('animate-open')
            void target.el.offsetWidth
            target.el.classList.add('animate-pop')
        }
    }

    public close(id: string): void {
        const target = this.modals.get(id)
        if (target) {
            target.el.remove()
            this.modals.delete(id)
        }
    }

    public close_all(): void {
        this.modals.forEach((item) => {
            item.el.remove()
        })
        this.modals.clear()
    }

    private setup_dragging(handle: HTMLElement, target: HTMLElement): void {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0

        handle.onmousedown = (e: MouseEvent) => {
            e.preventDefault()
            pos3 = e.clientX
            pos4 = e.clientY

            document.onmouseup = () => {
                document.onmouseup = null
                document.onmousemove = null
            }

            document.onmousemove = (moveEvent: MouseEvent) => {
                moveEvent.preventDefault()
                pos1 = pos3 - moveEvent.clientX
                pos2 = pos4 - moveEvent.clientY
                pos3 = moveEvent.clientX
                pos4 = moveEvent.clientY

                target.style.top = `${target.offsetTop - pos2}px`
                target.style.left = `${target.offsetLeft - pos1}px`
            }
        }
    }
}

export const ModalUI = ModalManager.get_instance()
