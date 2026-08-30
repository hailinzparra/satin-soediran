export interface SatinSettingsData {
    global_allow_copy: boolean

    dash_enable_satin_dash_ui: boolean
    dash_enable_satin_dash_ui_on_by_default: boolean
    dash_enable_satin_dash_ui_show_actions_button: boolean
    dash_show_openinnewtab_button: boolean

    emr_enable_manager: boolean

    emr_show_drug_price: boolean
    emr_show_drug_price_summary_title: string
    emr_show_drug_price_summary_full_title: string
    emr_show_drug_price_full_display: boolean
    emr_show_drug_price_show_unit_summary: boolean

    emr_show_drug_prescriber_name: boolean

    emr_show_results_menu: boolean

    emr_show_cppt_copy_button: boolean
}

export interface SatinPopupSettingsData {
    is_sidebar_collapsed: boolean
}
