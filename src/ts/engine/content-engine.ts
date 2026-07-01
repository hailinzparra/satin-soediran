import { AllowCopyFunction } from '../functions/allow-copy'
import { DrugPriceFunction } from '../functions/drug-price/parent'
import { PrescriberNameFunction } from '../functions/prescriber-name/parent'
import { SatinDriver, SatinDriversContainer } from '../types/driver'
import { SatinBaseFunction } from '../types/functions/base'
import { inject_css, inject_script } from '../utils/injector'
import { SatinEngine } from './base'

export class SatinContentEngine extends SatinEngine {
    observer: MutationObserver | null = null
    debounce_time: number = 250

    global_functions: SatinBaseFunction[] = [
        new AllowCopyFunction(this),
    ]

    dash_functions: SatinBaseFunction[] = [
        // new OpenInNewTabFunction(this),
    ]

    emr_functions: SatinBaseFunction[] = [
        new DrugPriceFunction(this),
        new PrescriberNameFunction(this),
        // new ResultsMenuFunction(this),
    ]

    get_all_functions = (): SatinBaseFunction[] => [
        ...this.global_functions,
        ...this.dash_functions,
        ...this.emr_functions,
    ]

    async on_init() {
        inject_css('assets/css/content.css')
        inject_script('assets/js/inject.js')
        await this.all_drivers_initialized()
        this.get_all_functions().forEach(fn => fn.init?.())
        this.bind_events()
        this.apply_all_functions()
        this.setup_observer()
    }

    bind_events() {
        this.get_all_functions().forEach(fn => fn.bind_events?.())

        // check for realtime changes from other tabs
        chrome.storage.onChanged.addListener((changes, area_name) => {
            if (area_name !== 'local') return
            Object.keys(this.drivers).forEach((raw_key) => {
                const key = raw_key as keyof SatinDriversContainer
                if (changes[key] && this.drivers[key]) {
                    // update the new value to match the changes
                    this.drivers[key].data = (changes[key].newValue || {}) as any
                    if (key === SatinDriver.Settings) {
                        // Settings updated? reapply functions once
                        this.apply_all_functions()
                    }
                }
            })
        })
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

    on_debounce_update() {
        this.get_all_functions().forEach(fn => {
            if (fn.on_debounce) fn.on_debounce()
            fn.apply()
        })
    }

    apply_all_functions(): void {
        this.get_all_functions().forEach(fn => fn.apply())
    }
}
