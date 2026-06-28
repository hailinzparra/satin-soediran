export class ResultsMenuModalTab {
    public id: string
    public name: string
    public icon?: string
    public children: HTMLElement[]
    public tab_header_el: HTMLButtonElement | null = null
    public tab_content_el: HTMLDivElement | null = null

    constructor(id: string, name: string, children: HTMLElement[], icon?: string) {
        this.id = id
        this.name = name
        this.children = children
        this.icon = icon
    }

    public render_header(): HTMLButtonElement {
        const button = document.createElement('button')
        button.id = `results-menu-modal-tab-${this.id}`
        button.className = 'results-menu-modal-tab-btn'

        if (this.icon) {
            button.innerHTML = `<span class="x-fa ${this.icon}" style="margin-right: 2px"></span> ${this.name}`
        } else {
            button.textContent = this.name
        }

        this.tab_header_el = button
        return button
    }

    public render_content(): HTMLDivElement {
        const content_div = document.createElement('div')
        content_div.className = 'results-menu-modal-tab-panel'
        if (this.children.length) {
            content_div.append(...this.children.filter(Boolean))
        }
        this.tab_content_el = content_div
        return content_div
    }

    public activate() {
        this.tab_header_el?.classList.add('is-active')
        this.tab_content_el?.classList.add('is-active')
    }

    public deactivate() {
        this.tab_header_el?.classList.remove('is-active')
        this.tab_content_el?.classList.remove('is-active')
    }
}

export class ResultsMenuModalTabManager {
    public container: HTMLDivElement
    public tabs: Map<string, ResultsMenuModalTab> = new Map()
    public active_tab_id: string | null = null

    private headers_container: HTMLDivElement
    private contents_container: HTMLDivElement
    private style_id: string = 'results-menu-modal-tab-manager-styles'

    constructor() {
        this.ensure_styles_injected()

        this.container = document.createElement('div')
        this.container.className = 'results-menu-modal-tabs-container'

        this.headers_container = document.createElement('div')
        this.headers_container.className = 'results-menu-modal-tab-headers'

        this.contents_container = document.createElement('div')
        this.contents_container.className = 'results-menu-modal-tab-contents'

        this.container.append(this.headers_container, this.contents_container)
    }

    private ensure_styles_injected(): void {
        if (document.getElementById(this.style_id)) return
        const style_el = document.createElement('style')
        style_el.id = this.style_id
        style_el.textContent = `
            .results-menu-modal-tabs-container { display: flex; flex-direction: column; width: 100%; height: 100%; }
            .results-menu-modal-tab-headers { display: flex; border-bottom: 1px solid #d0d0d0; background-color: #f8fafc; user-select: none; }
            .results-menu-modal-tab-btn { min-width: 100px; background: transparent; border: 1px solid transparent; border-top: 2px solid transparent; border-bottom: none; padding: 6px 12px; cursor: pointer; font-size: 12px; color: #64748b; font-weight: 500; transition: color 0.15s ease, background-color 0.15s ease, border-top-color 0.15s ease; }
            .results-menu-modal-tab-btn:hover { color: #1e293b; background-color: #f1f5f9; }
            .results-menu-modal-tab-btn.is-active { color: #157fcc; font-weight: bold; background-color: #f8fafc; margin-bottom: -1px; border-top-color: #157fcc; border-left-color: #d0d0d0; border-right-color: #d0d0d0; border-bottom: 1px solid #f8fafc; padding-top: 4px; }
            .results-menu-modal-tab-contents { flex: 1; position: relative; overflow: hidden; }
            .results-menu-modal-tab-panel { display: none; width: 100%; height: 100%; box-sizing: border-box; }
            .results-menu-modal-tab-panel.is-active { display: block; }
        `
        document.head.append(style_el)
    }

    public add_tab(id: string, name: string, children: HTMLElement[], icon?: string) {
        if (this.tabs.has(id)) {
            this.switch_tab(id)
            return
        }
        const new_tab = new ResultsMenuModalTab(id, name, children, icon)
        this.tabs.set(id, new_tab)

        const header_el = new_tab.render_header()
        const content_el = new_tab.render_content()
        header_el.addEventListener('click', () => this.switch_tab(id))

        this.headers_container.appendChild(header_el)
        this.contents_container.appendChild(content_el)

        if (!this.active_tab_id) {
            this.switch_tab(id)
        }
    }

    public switch_tab(id: string) {
        if (!this.tabs.has(id) || this.active_tab_id === id) return
        if (this.active_tab_id && this.tabs.has(this.active_tab_id)) {
            this.tabs.get(this.active_tab_id)!.deactivate()
        }
        this.active_tab_id = id
        this.tabs.get(id)!.activate()
    }
}
