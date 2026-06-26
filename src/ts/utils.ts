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

export class VaultDriver<T extends Record<string, any> = Record<string, any>> {
    public key: string
    public data: T
    constructor(key: string, default_data: T = {} as T) {
        this.key = key
        this.data = default_data
    }
    async update(new_data: Partial<T>): Promise<void> {
        this.data = { ...this.data, ...new_data }
        await this.save()
    }
    async save(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            chrome.storage.local.set({ [this.key]: this.data }, () => {
                if (chrome.runtime.lastError) {
                    console.error(`Failed to save ${this.key}:`, chrome.runtime.lastError)
                    reject(chrome.runtime.lastError)
                } else {
                    resolve()
                }
            })
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
    text?: string
    html?: string
}

type CreatedElement<T extends string> =
    T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] :
    T extends keyof SVGElementTagNameMap ? SVGElementTagNameMap[T] :
    Element

export const create_element = <T extends string>(
    tag: T,
    { classes = '', attrs = {}, text = '', html = '' }: CreateElementOptions = {},
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
