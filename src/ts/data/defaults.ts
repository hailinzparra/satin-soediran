import { SatinSessionData } from '../types/api/base'
import { SatinPopupSettingsData, SatinSettingsData } from '../types/settings'

export const DEFAULT_SATIN_SESSION: SatinSessionData = {
    raw_token: '',
    auth_token: '',
    is_encrypted: false,
}

export const DEFAULT_SATIN_SETTINGS: SatinSettingsData = {
    global_allow_copy: false,

    dash_show_openinnewtab_button: false,

    emr_enable_manager: true,

    emr_show_drug_price: false,
    emr_show_drug_price_summary_title: 'Ringkasan Harga',
    emr_show_drug_price_summary_full_title: 'Detail Keuntungan',
    emr_show_drug_price_full_display: false,
    emr_show_drug_price_show_unit_summary: false,

    emr_show_drug_prescriber_name: false,

    emr_show_results_menu: false,

    emr_show_cppt_copy_button: false,
}

export const DEFAULT_SATIN_POPUP_SETTINGS: SatinPopupSettingsData = {
    is_sidebar_collapsed: false,
}
