import { VaultDriver } from '../utils/vault'
import { SatinSessionData } from './api/base'
import { DrugPriceData } from './functions/drug-price'
import { SatinPersistentData } from './persistent'
import { SatinPopupSettingsData, SatinSettingsData } from './settings'
import { SatinTempData } from './temp'

export enum SatinDriver {
    Temp = 'satin_temp',
    Session = 'satin_session',
    Settings = 'satin_settings',
    Persistent = 'satin_persistent',
    PopupSettings = 'satin_popup_settings',
    DrugPrices = 'satin_drug_prices',
}

interface SatinDriversMap {
    [SatinDriver.Temp]: VaultDriver<SatinTempData>
    [SatinDriver.Session]: VaultDriver<SatinSessionData>
    [SatinDriver.Settings]: VaultDriver<SatinSettingsData>
    [SatinDriver.Persistent]: VaultDriver<SatinPersistentData>
    [SatinDriver.PopupSettings]: VaultDriver<SatinPopupSettingsData>
    [SatinDriver.DrugPrices]: VaultDriver<DrugPriceData>
}

export type SatinDriversContainer = SatinDriversMap
