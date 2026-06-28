import { VaultDriver } from './utils'
import { PopupSettings, SatinPopupEngine } from './popup'
import { DrugPriceRegistry } from './functions/drug-price'
import { SatinContentEngine } from './content'

export interface ExtensionSettings {
    // global
    global_allow_copy: boolean

    // reg
    reg_show_openinnewtab_button: boolean

    // emr
    emr_show_drug_price: boolean
    emr_show_drug_price_summary_title: string
    emr_show_drug_price_summary_more_title: string
    emr_show_drug_price_minimal_display: boolean
    emr_show_drug_price_show_unit_summary: boolean
    emr_show_drug_prescriber_name: boolean
    emr_show_results_menu: boolean
}

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
    global_allow_copy: true,
    reg_show_openinnewtab_button: true,
    emr_show_drug_price: true,
    emr_show_drug_price_summary_title: 'Ringkasan Harga',
    emr_show_drug_price_summary_more_title: 'Detail Keuntungan',
    emr_show_drug_price_minimal_display: true,
    emr_show_drug_price_show_unit_summary: false,
    emr_show_drug_prescriber_name: true,
    emr_show_results_menu: true,
}

export enum ExtensionDriver {
    Settings = 'satin_settings',
    PopupSettings = 'satin_popup_settings',
    Temp = 'satin_temp',
    Persistent = 'satin_persistent',
    Session = 'satin_session',
    DrugPrices = 'satin_drug_prices',
}

export interface ExtensionTempData {
    history_order_resep_cache?: Record<string, HistoryOrderResepCache>
}

interface ExtensionDriversMap {
    [ExtensionDriver.Settings]: VaultDriver<ExtensionSettings>
    [ExtensionDriver.PopupSettings]: VaultDriver<PopupSettings>
    [ExtensionDriver.Temp]: VaultDriver<ExtensionTempData>
    [ExtensionDriver.Persistent]: VaultDriver<any>
    [ExtensionDriver.Session]: VaultDriver<any>
    [ExtensionDriver.DrugPrices]: VaultDriver<DrugPriceRegistry>
}

export type ExtensionDriversContainer = Partial<ExtensionDriversMap>

export abstract class ExtensionFunction {
    constructor(
        protected engine: SatinContentEngine,
        protected get_settings: () => ExtensionSettings,
        protected get_drivers: () => ExtensionDriversContainer,
    ) { }
    init?(): void
    bind_events?(): void
    on_debounce?(): void
    abstract apply(): void
}

export interface PopupTabContentElements {
    container: HTMLElement
}

export abstract class PopupTabContent<T extends PopupTabContentElements = PopupTabContentElements> {
    abstract el: T
    constructor(
        protected engine: SatinPopupEngine,
        protected get_settings: () => ExtensionSettings,
    ) { }
}

export enum ExtensionEvent {
    SessionRefreshed = 'SessionRefreshed',
    HistoryOrderResepFetched = 'HistoryOrderResepFetched',
}

export const UrlRouteFilters: Record<ExtensionEvent, string[][]> = {
    [ExtensionEvent.SessionRefreshed]: [
        // ['/isAuthenticate'],
        ['/isLockApp'],
    ],
    [ExtensionEvent.HistoryOrderResepFetched]: [
        ['/kunjungan', 'JENIS_KUNJUNGAN=11'],
        ['/orderresep', 'HISTORY=1'],
    ],
}

export interface HistoryOrderResepCache {
    id: string
    date: string
    prescriber_name: string
}

export abstract class BaseApiResponse<T> {
    status?: number
    success?: boolean
    total?: number
    abstract data?: T[]
}

export interface KunjunganResponse {
    data: {
        NOMOR: string | number
        MASUK?: string | null
        KELUAR?: string | null
        DIAGNOSAMASUK?: {
            REFERENSI?: {
                DIAGNOSA?: {
                    CODE?: string | number | null
                    STR?: string | null
                } | null
            } | null
        } | null
        REFERENSI?: {
            PENDAFTARAN?: {
                TUJUAN?: {
                    REFERENSI?: {
                        ANTRIAN?: {
                            NOMOR?: string | number | null
                        } | null
                    } | null
                } | null
            } | null
            RUANG_KAMAR_TIDUR?: {
                TEMPAT_TIDUR?: string | null
            } | null
            DPJP?: {
                ID?: string | number | null
            } | null
        } | null
    }[]
    detail: string
    status: number
    success: boolean
    total: number
}
