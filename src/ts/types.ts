import { VaultDriver } from './utils'
import { PopupSettings } from './popup'
import { DrugPriceRegistry } from './functions/drug-price'

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
}

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
    global_allow_copy: true,
    reg_show_openinnewtab_button: true,
    emr_show_drug_price: true,
    emr_show_drug_price_summary_title: 'Ringkasan Harga',
    emr_show_drug_price_summary_more_title: 'Detail Keuntungan',
    emr_show_drug_price_minimal_display: true,
    emr_show_drug_price_show_unit_summary: false,
}

export enum ExtensionDriver {
    Settings = 'satin_settings',
    PopupSettings = 'satin_popup_settings',
    Persistent = 'satin_persistent',
    DrugPrices = 'satin_drug_prices',
}

interface ExtensionDriversMap {
    [ExtensionDriver.Settings]: VaultDriver<ExtensionSettings>
    [ExtensionDriver.PopupSettings]: VaultDriver<PopupSettings>
    [ExtensionDriver.Persistent]: VaultDriver<any>
    [ExtensionDriver.DrugPrices]: VaultDriver<DrugPriceRegistry>
}

export type ExtensionDriversContainer = Partial<ExtensionDriversMap>

export abstract class ExtensionFunction {
    constructor(
        protected get_settings: () => ExtensionSettings,
        protected get_drivers: () => ExtensionDriversContainer,
    ) { }
    init?(): void
    bind_events?(): void
    on_debounce?(): void
    abstract apply(): void
}

export enum ExtensionEvent {
    KunjunganFetched = 'KUNJUNGAN_FETCHED',
}

export const UrlRouteFilters: Record<ExtensionEvent, string> = {
    [ExtensionEvent.KunjunganFetched]: '/kunjungan',
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
