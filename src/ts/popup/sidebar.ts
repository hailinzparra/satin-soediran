import { ExtensionDriver } from '../types'
import { SatinPopupEngine } from '../popup'

interface SidebarElements {
    container: HTMLElement
    brand_text: HTMLHeadingElement
    toggle_btn: HTMLButtonElement
    toggle_icon: SVGElement
    settings_btn: HTMLButtonElement
    tools_btn: HTMLButtonElement
    tools_accordion_btn: HTMLButtonElement
    tools_accordion_arrow: SVGElement
    tools_accordion_content: HTMLDivElement
    template_btn: HTMLButtonElement
    check_update_btn: HTMLButtonElement
}

enum PopupSidebarNav {
    Settings = 'settings',
    Tools = 'tools',
}

export class PopupSidebar {
    public el: SidebarElements
    public active_nav: PopupSidebarNav = PopupSidebarNav.Settings
    private engine: SatinPopupEngine
    constructor(engine: SatinPopupEngine) {
        this.engine = engine
        this.el = {
            container: document.getElementById('sidebar-container-0000')!,
            brand_text: document.getElementById('sidebar-brand-text-0000')! as HTMLHeadingElement,
            toggle_btn: document.getElementById('sidebar-toggle-btn-0000')! as HTMLButtonElement,
            toggle_icon: document.getElementById('sidebar-toggle-icon-0000')! as unknown as SVGElement,
            settings_btn: document.getElementById('sidebar-settings-0000')! as HTMLButtonElement,
            tools_btn: document.getElementById('sidebar-tools-0000')! as HTMLButtonElement,
            tools_accordion_btn: document.getElementById('sidebar-tools-accordion-btn-0000')! as HTMLButtonElement,
            tools_accordion_arrow: document.getElementById('sidebar-tools-accordion-arrow-0000')! as unknown as SVGElement,
            tools_accordion_content: document.getElementById('sidebar-tools-accordion-content-0000')! as HTMLDivElement,
            template_btn: document.getElementById('sidebar-template-0000')! as HTMLButtonElement,
            check_update_btn: document.getElementById('sidebar-check-update-0000')! as HTMLButtonElement,
        }
    }
    init() {
        // call once to match loaded settings
        const popup_settings = this.engine.drivers[ExtensionDriver.PopupSettings]
        this.toggle_sidebar(popup_settings?.data.is_sidebar_collapsed === true)
        this.update_sidebar_nav()
    }
    bind_events() {
        this.el.toggle_btn.addEventListener('click', () => {
            const popup_settings = this.engine.drivers[ExtensionDriver.PopupSettings]
            if (!popup_settings) return

            const old_is_sidebar_collapsed = popup_settings.data.is_sidebar_collapsed === true
            const new_is_sidebar_collapsed = !old_is_sidebar_collapsed
            popup_settings.update({
                is_sidebar_collapsed: new_is_sidebar_collapsed
            })
            this.toggle_sidebar(new_is_sidebar_collapsed)
        })
        this.el.settings_btn.addEventListener('click', () => {
            this.update_sidebar_nav(PopupSidebarNav.Settings)
        })
        this.el.tools_btn.addEventListener('click', () => {
            this.update_sidebar_nav(PopupSidebarNav.Tools)
        })
        this.el.tools_accordion_btn.addEventListener('click', (e) => {
            e.stopPropagation()
            this.toggle_tools_accordion()
        })
    }
    toggle_sidebar(is_sidebar_collapsed: boolean) {
        const nav_texts = this.el.container.querySelectorAll('.nav-text')
        if (is_sidebar_collapsed) {
            this.el.container.classList.replace('w-56', 'w-16')
            this.el.toggle_icon.classList.add('rotate-180')
            this.el.brand_text.classList.add('opacity-0', 'hidden')
            nav_texts.forEach(el => el.classList.add('opacity-0', 'hidden'))
        } else {
            this.el.container.classList.replace('w-16', 'w-56')
            this.el.toggle_icon.classList.remove('rotate-180')
            this.el.brand_text.classList.remove('opacity-0', 'hidden')
            nav_texts.forEach(el => el.classList.remove('opacity-0', 'hidden'))
        }
    }
    update_sidebar_nav(active_nav = this.active_nav) {
        const base_classes = 'nav-item w-full flex items-center px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer'
        const active_classes = 'text-blue-600 bg-blue-50'
        const inactive_classes = 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'

        const get_nav_class = (target_nav: PopupSidebarNav) => {
            const variant = active_nav === target_nav ? active_classes : inactive_classes
            return `${base_classes} ${variant}`
        }

        this.el.settings_btn.className = get_nav_class(PopupSidebarNav.Settings)
        this.el.tools_btn.className = get_nav_class(PopupSidebarNav.Tools)
        this.el.tools_btn.parentElement!.className = 'w-full flex items-center justify-between rounded-lg transition-all group '
            + (active_nav === PopupSidebarNav.Tools ? 'bg-blue-50' : 'hover:bg-slate-50')
    }
    toggle_tools_accordion() {
        const content = this.el.tools_accordion_content
        const arrow = this.el.tools_accordion_arrow
        const is_closed = content.classList.contains('max-h-0')
        if (is_closed) {
            content.classList.remove('max-h-0')
            content.classList.add('max-h-[1000px]')
            arrow.classList.remove('-rotate-90')
            arrow.classList.add('rotate-0')
        } else {
            content.classList.remove('max-h-[1000px]')
            content.classList.add('max-h-0')
            arrow.classList.remove('rotate-0')
            arrow.classList.add('-rotate-90')
        }
    }
}
