import { ExtensionSettings, ExtensionEvent, KunjunganResponse } from './types'
import { inject_script, VaultDriver } from './utils'

class SatinContentEngine {
    active_settings: ExtensionSettings = {
        global_allow_copy: true,
        reg_show_openinnewtab_button: true,
        emr_show_drug_price: true,
    }
    drivers = {
        settings: new VaultDriver<ExtensionSettings>('satin_settings', this.active_settings),
    }
    observer: MutationObserver | null = null
    primary_key: (keyof SatinContentEngine['drivers']) | null = null
    debounce_time: number = 250
    constructor() {
    }
    async init() {
        try {
            inject_script('assets/js/inject.js')
            await this.load_settings()
            this.apply_all_extension_functions()
            this.setup_observer()
            this.bind_events()
            console.log('Satin engine initialized successfully.')
        } catch (err) {
            console.error('Failed to initialize engine:', err)
        }
    }
    async load_settings() {
        const load_promises = Object.values(this.drivers).map(driver => driver.load())
        await Promise.all(load_promises)
        if (this.primary_key && this.drivers[this.primary_key]) {
            this.active_settings = this.drivers[this.primary_key].data
        }
    }
    setup_observer() {
        let debounce_timer: number
        this.observer = new MutationObserver((mutations_list) => {
            const content_changed = mutations_list.some(m => m.type === 'childList' || m.type === 'characterData')
            if (!content_changed) return
            clearTimeout(debounce_timer)
            debounce_timer = setTimeout(() => {
                window.requestAnimationFrame(() => {
                    this.on_debounce_update()
                })
            }, this.debounce_time)
        })
        this.observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    }
    bind_events() {
        chrome.storage.onChanged.addListener((changes, area_name) => {
            if (area_name !== 'local') return
            Object.keys(this.drivers).forEach((raw_key) => {
                const key = raw_key as keyof SatinContentEngine['drivers']
                if (changes[key]) {
                    this.drivers[key].data = (changes[key].newValue || {}) as any
                    if (key === this.primary_key) {
                        this.active_settings = this.drivers[key].data
                        this.apply_all_extension_functions()
                    }
                }
            })
        })
        document.addEventListener('selectstart', (e) => {
            if (!this.active_settings.global_allow_copy) return
            if (e.type === 'selectstart') {
                e.stopPropagation()
                return true
            }
        }, true)
        window.addEventListener(ExtensionEvent.KunjunganFetched, (event) => {
            const custom_event = event as CustomEvent<KunjunganResponse>
            const item = custom_event.detail.data[0]

            console.log(item.NOMOR)
        })
    }
    on_debounce_update() {
        this.apply_all_extension_functions()
    }
    apply_all_extension_functions(): void {
        this.apply_global_functions()
        this.apply_reg_functions()
        this.apply_emr_functions()
    }
    apply_global_functions(): void {
        const allow_copy = this.active_settings.global_allow_copy

        const unselectable_elements = document.querySelectorAll<HTMLElement>('.x-unselectable')
        unselectable_elements.forEach(el => {
            if (allow_copy) {
                el.style.setProperty('user-select', 'text', 'important')
                el.style.setProperty('-webkit-user-select', 'text', 'important')
                if (!el.matches('button, a, .x-btn')) {
                    el.style.setProperty('cursor', 'text', 'important')
                }
            } else {
                el.style.removeProperty('user-select')
                el.style.removeProperty('-webkit-user-select')
                el.style.removeProperty('cursor')
            }
        })
    }
    apply_reg_functions(): void { }
    apply_emr_functions(): void { }
}

const main_content_engine = new SatinContentEngine()
main_content_engine.init()
