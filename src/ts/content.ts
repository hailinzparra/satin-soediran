import {
    ExtensionSettings, DEFAULT_EXTENSION_SETTINGS,
    ExtensionDriver, ExtensionDriversContainer,
    ExtensionFunction,
    ExtensionTempData,
    ExtensionEvent,
    KunjunganResponse,
} from './types'
import { inject_script, VaultDriver } from './utils'
import { AllowCopyFunction } from './functions/allow-copy'
import { DrugPriceFunction, DrugPriceRegistry } from './functions/drug-price'
import { PrescriberNameFunction } from './functions/prescriber-name'
import { ResultsMenuFunction } from './functions/results-menu'
import { DEFAULT_EXTENSION_API_SESSION, ApiSession } from './api/api-types'
import { ApiContextManager } from './api/context'
import { ApiSoediranDriver } from './api/soediran'

class SatinContentEngine {
    active_settings: ExtensionSettings = DEFAULT_EXTENSION_SETTINGS
    drivers: ExtensionDriversContainer = {
        [ExtensionDriver.Settings]: new VaultDriver<ExtensionSettings>(ExtensionDriver.Settings, this.active_settings),
        [ExtensionDriver.Temp]: new VaultDriver<ExtensionTempData>(ExtensionDriver.Temp, {}),
        [ExtensionDriver.Persistent]: new VaultDriver<any>(ExtensionDriver.Persistent),
        [ExtensionDriver.Session]: new VaultDriver<ApiSession>(ExtensionDriver.Session, DEFAULT_EXTENSION_API_SESSION),
        [ExtensionDriver.DrugPrices]: new VaultDriver<DrugPriceRegistry>(ExtensionDriver.DrugPrices, {}),
    }
    api_context: ApiContextManager = new ApiContextManager(new ApiSoediranDriver())
    private get_settings = () => this.active_settings
    private get_drivers = () => this.drivers
    global_functions: ExtensionFunction[] = [
        new AllowCopyFunction(this.get_settings, this.get_drivers),
    ]
    reg_functions: ExtensionFunction[] = [
        // new OpenInNewTabFunction(this.get_settings, this.get_drivers),
    ]
    emr_functions: ExtensionFunction[] = [
        new DrugPriceFunction(this.get_settings, this.get_drivers),
        new PrescriberNameFunction(this.get_settings, this.get_drivers),
        new ResultsMenuFunction(this.get_settings, this.get_drivers),
    ]
    get all_functions(): ExtensionFunction[] {
        return [...this.global_functions, ...this.reg_functions, ...this.emr_functions]
    }
    observer: MutationObserver | null = null
    settings_key = ExtensionDriver.Settings
    debounce_time: number = 250
    constructor() { }
    async init() {
        try {
            inject_script('assets/js/inject.js')
            await this.load_settings()
            this.all_functions.forEach(fn => fn.init?.())
            this.bind_events()
            this.apply_all_extension_functions()
            this.setup_observer()
            console.log('Satin engine initialized successfully.')
        } catch (err) {
            console.error('Failed to initialize engine:', err)
        }
    }
    async load_settings() {
        const load_promises = Object.values(this.drivers).map(driver => driver.load())
        await Promise.all(load_promises)
        const settings_key = this.settings_key
        if (settings_key && this.drivers[settings_key]) {
            this.active_settings = this.drivers[settings_key].data
        }
        this.drivers[ExtensionDriver.Temp]?.reset()
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
        this.all_functions.forEach(fn => fn.bind_events?.())
        chrome.storage.onChanged.addListener((changes, area_name) => {
            if (area_name !== 'local') return
            Object.keys(this.drivers).forEach((raw_key) => {
                const key = raw_key as keyof ExtensionDriversContainer
                if (changes[key] && this.drivers[key]) {
                    this.drivers[key].data = (changes[key].newValue || {}) as any
                    if (key === this.settings_key) {
                        this.active_settings = this.drivers[key].data
                        this.apply_all_extension_functions()
                    }
                }
            })
        })
        this.api_context.bind_events()
    }
    on_debounce_update() {
        this.all_functions.forEach(fn => {
            if (fn.on_debounce) {
                fn.on_debounce()
            } else {
                fn.apply()
            }
        })
    }
    apply_all_extension_functions(): void {
        this.all_functions.forEach(fn => fn.apply())
    }
}

const main_content_engine = new SatinContentEngine()
main_content_engine.init()
