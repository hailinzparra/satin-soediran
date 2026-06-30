import { SatinApiContext } from '../api/context'
import { SoediranApiDriver } from '../api/soediran-driver'
import { DEFAULT_SATIN_SESSION, DEFAULT_SATIN_POPUP_SETTINGS, DEFAULT_SATIN_SETTINGS } from '../data/defaults'
import { SatinSessionData } from '../types/api/base'
import { SatinDriver, SatinDriversContainer } from '../types/driver'
import { SatinPersistentData } from '../types/persistent'
import { SatinPopupSettingsData, SatinSettingsData } from '../types/settings'
import { SatinTempData } from '../types/temp'
import { Log } from '../utils/logger'
import { VaultDriver } from '../utils/vault'

export abstract class SatinEngine {
    drivers: SatinDriversContainer = {
        [SatinDriver.Temp]: new VaultDriver(SatinDriver.Temp, {}, 'session'),
        [SatinDriver.Session]: new VaultDriver(SatinDriver.Session, DEFAULT_SATIN_SESSION, 'session'),
        [SatinDriver.Settings]: new VaultDriver(SatinDriver.Settings, DEFAULT_SATIN_SETTINGS),
        [SatinDriver.Persistent]: new VaultDriver(SatinDriver.Persistent),
        [SatinDriver.PopupSettings]: new VaultDriver(SatinDriver.PopupSettings, DEFAULT_SATIN_POPUP_SETTINGS),
        [SatinDriver.NewDrugPrices]: new VaultDriver(SatinDriver.NewDrugPrices),
    }
    api: SatinApiContext = new SatinApiContext(this, new SoediranApiDriver(this))
    get_temp = (): SatinTempData => this.drivers[SatinDriver.Temp].data
    get_session = (): SatinSessionData => this.drivers[SatinDriver.Session].data
    get_settings = (): SatinSettingsData => this.drivers[SatinDriver.Settings].data
    get_persistent = (): SatinPersistentData => this.drivers[SatinDriver.Persistent].data
    get_popup_settings = (): SatinPopupSettingsData => this.drivers[SatinDriver.PopupSettings].data
    get_temp_driver = (): VaultDriver<SatinTempData> => this.drivers[SatinDriver.Temp]
    get_session_driver = (): VaultDriver<SatinSessionData> => this.drivers[SatinDriver.Session]
    get_settings_driver = (): VaultDriver<SatinSettingsData> => this.drivers[SatinDriver.Settings]
    get_persistent_driver = (): VaultDriver<SatinPersistentData> => this.drivers[SatinDriver.Persistent]
    get_popup_settings_driver = (): VaultDriver<SatinPopupSettingsData> => this.drivers[SatinDriver.PopupSettings]
    async all_drivers_initialized(): Promise<void> {
        const tracking_promises = (Object.values(this.drivers) as VaultDriver[]).map(
            (driver) => driver.is_initialized
        )
        await Promise.all(tracking_promises)
        Log.log('All vault drivers have successfully initialized.')
    }
    abstract on_init(): Promise<void>
    async init() {
        try {
            this.on_init()
            Log.log('Satin engine initialized successfully.')
        } catch (err) {
            Log.error('Failed to initialize engine:', err)
        }
    }
}
