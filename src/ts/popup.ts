import {
    ExtensionSettings, DEFAULT_EXTENSION_SETTINGS,
    ExtensionDriver, ExtensionDriversContainer,
    ExtensionFunction,
    ExtensionEvent,
    KunjunganResponse,
} from './types'
import { VaultDriver } from './utils'
import { PopupSidebar } from './popup/sidebar'
import { PopupTab } from './popup/tab'
import { PopupSwal } from './popup/swal'

export interface PopupSettings {
    is_sidebar_collapsed: boolean
}

const DEFAULT_POPUP_SETTINGS: PopupSettings = {
    is_sidebar_collapsed: false
}

export class SatinPopupEngine {
    target_width: number = 360
    main_container: HTMLElement
    sidebar: PopupSidebar
    tab: PopupTab
    drivers: ExtensionDriversContainer = {
        [ExtensionDriver.Settings]: new VaultDriver<ExtensionSettings>(ExtensionDriver.Settings, DEFAULT_EXTENSION_SETTINGS),
        [ExtensionDriver.PopupSettings]: new VaultDriver<PopupSettings>(ExtensionDriver.PopupSettings, DEFAULT_POPUP_SETTINGS),
    }
    settings_key = ExtensionDriver.Settings
    popup_settings_key = ExtensionDriver.PopupSettings
    swal: PopupSwal
    private get_settings = () => this.drivers[ExtensionDriver.Settings]!.data
    constructor() {
        this.main_container = document.getElementById('main-container-0000')!
        this.sidebar = new PopupSidebar(this)
        this.tab = new PopupTab(this, this.get_settings)
        this.swal = new PopupSwal(this)
    }
    async init() {
        try {
            await this.load_settings()
            this.sidebar.init()
            this.tab.init()
            this.bind_events()
            console.log('Popup engine initialized successfully.')
        } catch (err) {
            console.error('Failed to initialize engine:', err)
        }
    }
    async load_settings() {
        const load_promises = Object.values(this.drivers).map(driver => driver.load())
        await Promise.all(load_promises)
    }
    bind_events() {
        this.main_container.style.minWidth = `${this.target_width}px`
        const scale_main_container = () => {
            if (!this.main_container) return
            const scale = window.innerWidth < this.target_width ? window.innerWidth / this.target_width : 1
            this.main_container.style.scale = `${scale}`
            this.main_container.style.height = `${100 / scale}vh`
        }
        window.addEventListener('resize', scale_main_container)
        scale_main_container()
        this.sidebar.bind_events()
    }
}

const main_popup_engine = new SatinPopupEngine()
main_popup_engine.init()
