import {
    ExtensionSettings, DEFAULT_EXTENSION_SETTINGS,
    ExtensionDriver, ExtensionDriversContainer,
    ExtensionFunction,
    ExtensionEvent,
    KunjunganResponse,
} from './types'
import { VaultDriver } from './utils'
import { PopupSidebar } from './popup/sidebar'

export interface PopupSettings {
    is_sidebar_collapsed: boolean
}

const DEFAULT_POPUP_SETTINGS: PopupSettings = {
    is_sidebar_collapsed: false
}

export class SatinPopupEngine {
    sidebar: PopupSidebar
    drivers: ExtensionDriversContainer = {
        [ExtensionDriver.Settings]: new VaultDriver<ExtensionSettings>(ExtensionDriver.Settings, DEFAULT_EXTENSION_SETTINGS),
        [ExtensionDriver.PopupSettings]: new VaultDriver<PopupSettings>(ExtensionDriver.PopupSettings, DEFAULT_POPUP_SETTINGS),
    }
    settings_key = ExtensionDriver.Settings
    popup_settings_key = ExtensionDriver.PopupSettings
    constructor() {
        this.sidebar = new PopupSidebar(this)
    }
    async init() {
        try {
            await this.load_settings()
            this.sidebar.init()
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
        this.sidebar.bind_events()
    }
}

const main_popup_engine = new SatinPopupEngine()
main_popup_engine.init()
