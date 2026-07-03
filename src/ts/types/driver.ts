import { VaultDriver } from '../utils/vault'
import { SatinSessionData } from './api/base'
import { DrugPriceData } from './functions/drug-price'
import { EMRManagerConfigData } from './functions/emr-manager'
import { SatinPersistentData } from './persistent'
import { SatinPopupSettingsData, SatinSettingsData } from './settings'
import { SatinTempData } from './temp'

export enum SatinDriver {
    Temp = 'satin_temp',
    Session = 'satin_session',
    Settings = 'satin_settings',
    Persistent = 'satin_persistent',
    PopupSettings = 'satin_popup_settings',
    NewDrugPrices = 'satin_new_drug_prices',
    EMRManagerNewData = 'satin_emr_manager_new_data',
}

interface SatinDriversMap {
    [SatinDriver.Temp]: VaultDriver<SatinTempData>
    [SatinDriver.Session]: VaultDriver<SatinSessionData>
    [SatinDriver.Settings]: VaultDriver<SatinSettingsData>
    [SatinDriver.Persistent]: VaultDriver<SatinPersistentData>
    [SatinDriver.PopupSettings]: VaultDriver<SatinPopupSettingsData>
    [SatinDriver.NewDrugPrices]: VaultDriver<DrugPriceData>
    [SatinDriver.EMRManagerNewData]: VaultDriver<EMRManagerConfigData['new_data']>
}

export type SatinDriversContainer = SatinDriversMap
