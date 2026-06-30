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

        if (this.headers_container) this.headers_container.append(header_el)
        if (this.contents_container) this.contents_container.append(content_el)

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
