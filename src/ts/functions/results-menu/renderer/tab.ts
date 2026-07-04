import { create_element } from '../../../utils/dom'
import { ResultsMenuFunction } from '../parent'

export class ResultsMenuTab {
    protected manager: ResultsMenuTabManager
    public id: string
    public name: string
    public icon?: string
    public children: HTMLElement[]
    public tab_header_el: HTMLButtonElement | null = null
    public tab_content_el: HTMLDivElement | null = null

    constructor(manager: ResultsMenuTabManager, id: string, name: string, children: HTMLElement[], icon?: string) {
        this.manager = manager
        this.id = id
        this.name = name
        this.children = children
        this.icon = icon
    }

    get_selectors = () => this.manager.parent.config.selectors

    public build_head(): HTMLButtonElement {
        const tab_head = create_element('button', {
            id: this.get_selectors().ids.tab_btn(this.id),
            classes: this.get_selectors().classes.tab_head,
            html: this.icon
                ? `<span class="x-fa ${this.icon}" style="margin-right: 2px"></span> ${this.name}`
                : this.name
        })
        this.tab_header_el = tab_head
        return tab_head
    }

    public build_body(): HTMLDivElement {
        const tab_body = create_element('div', {
            classes: this.get_selectors().classes.tab_body
        }, this.children)
        this.tab_content_el = tab_body
        return tab_body
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

export class ResultsMenuTabManager {
    public container: HTMLDivElement
    public tabs: Map<string, ResultsMenuTab> = new Map()
    public active_tab_id: string | null = null

    private head_container: HTMLDivElement
    private body_container: HTMLDivElement

    constructor(
        public parent: ResultsMenuFunction
    ) {
        this.head_container = create_element('div', { classes: this.parent.config.selectors.classes.tab_head_container })
        this.body_container = create_element('div', { classes: this.parent.config.selectors.classes.tab_body_container })
        this.container = create_element('div', { classes: this.parent.config.selectors.classes.tab_container }, [
            this.head_container,
            this.body_container,
        ])
    }

    public add_tab(id: string, name: string, children: HTMLElement[], icon?: string) {
        if (this.tabs.has(id)) {
            this.switch_tab(id)
            return
        }
        const new_tab = new ResultsMenuTab(this, id, name, children, icon)
        this.tabs.set(id, new_tab)

        const head = new_tab.build_head()
        const body = new_tab.build_body()
        head.addEventListener('click', () => this.switch_tab(id))

        this.head_container.appendChild(head)
        this.body_container.appendChild(body)

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
