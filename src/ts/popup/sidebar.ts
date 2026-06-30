import { SatinPopupEngine } from '../engine/popup-engine'
import { PopupSidebarElements, PopupSidebarNav, PopupTabManagerName, PopupTabName } from '../types/popup'

export class PopupSidebar {
    el: PopupSidebarElements
    active_nav: PopupSidebarNav = PopupSidebarNav.Settings

    constructor(
        protected engine: SatinPopupEngine,
    ) {
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
        const settings = this.engine.get_popup_settings()
        this.toggle_sidebar(settings.is_sidebar_collapsed === true)
        this.switch_active_tab(PopupTabManagerName.Settings, PopupSidebarNav.Settings)
    }

    bind_events() {
        this.el.toggle_btn.addEventListener('click', () => {
            const driver = this.engine.get_popup_settings_driver()
            if (!driver) return

            const old_is_sidebar_collapsed = driver.data.is_sidebar_collapsed === true
            const new_is_sidebar_collapsed = !old_is_sidebar_collapsed

            driver.update({
                is_sidebar_collapsed: new_is_sidebar_collapsed,
            })

            this.toggle_sidebar(new_is_sidebar_collapsed)
        })

        this.init_nav_events()

        this.el.tools_accordion_btn.addEventListener('click', (e) => {
            e.stopPropagation()
            this.toggle_tools_accordion()
        })
    }

    init_nav_events() {
        const nav_mapping = [
            {
                btn: this.el.settings_btn,
                tab_name: PopupTabManagerName.Settings,
                nav_state: PopupSidebarNav.Settings,
            },
            {
                btn: this.el.tools_btn,
                tab_name: PopupTabManagerName.Tools,
                nav_state: PopupSidebarNav.Tools,
            },
        ]
        for (const target of nav_mapping) {
            target.btn.addEventListener('click', () => {
                this.switch_active_tab(target.tab_name, target.nav_state)
            })
        }
        this.el.template_btn.addEventListener('click', () => {
            this.switch_active_tab(PopupTabManagerName.Tools, PopupSidebarNav.Tools)
            this.engine.tab.open_tab(PopupTabManagerName.Tools, PopupTabName.Template)
        })
        this.el.check_update_btn.addEventListener('click', async () => {
            const result = await this.engine.swal.main.fire({
                title: 'Periksa Pembaruan',
                html: `<div class="text-sm text-gray-500 mt-2">Ini akan membuka halaman unduhan di tab baru.</div>`,
                showCancelButton: true,
                confirmButtonText: 'Buka Halaman',
            })
            if (result.isConfirmed) {
                window.open('https://github.com/hailinzparra/satin-soediran/releases', '_blank', 'noopener,noreferrer')
            }
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
    switch_active_tab(active_tab_name: PopupTabManagerName, active_nav_state: PopupSidebarNav) {
        const managers = this.engine.tab.tab_manager
        Object.values(PopupTabManagerName).forEach((tab_name) => {
            if (managers[tab_name]) {
                if (tab_name === active_tab_name) {
                    managers[tab_name].open()
                } else {
                    managers[tab_name].close()
                }
            }
        })
        this.update_sidebar_nav(active_nav_state)
    }
}
