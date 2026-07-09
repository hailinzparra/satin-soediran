import { CentralizedParamId } from '../api/soediran/lab-map'
import { SatinDriver } from '../driver'
import { SatinBaseFunctionConfig, SatinBaseFunctionConfigData, SatinBaseFunctionConfigSelectors } from './base'
import { LAB_PARAM_MAP, LAB_SYMBOL_MAP, PANELS_CONFIG } from './results-menu-map'

export interface ResultsMenuSelectors extends SatinBaseFunctionConfigSelectors {
    ids: {
        btn: (panel_id: string) => string
        modal: (mrn: string, panel_id: string) => string
        panel_short_detail: (panel_id: string) => string
        panel_short_detail_target_el: (panel_id: string) => string
        tab_btn: (id: string) => string
    }
    classes: {
        btn: string
        tab_head: string
        tab_body: string
        tab_container: string
        tab_head_container: string
        tab_body_container: string
    }
}

export interface ResultsMenuData extends SatinBaseFunctionConfigData {
}

export interface ResultsMenuConfig extends SatinBaseFunctionConfig {
    primary_settings_key: 'emr_show_results_menu'
    primary_driver_key: SatinDriver.EMRManagerNewData
    selectors: ResultsMenuSelectors
    data: ResultsMenuData
}

export const DEFAULT_RESULTS_MENU_CONFIG: ResultsMenuConfig = {
    primary_settings_key: 'emr_show_results_menu',
    primary_driver_key: SatinDriver.EMRManagerNewData,
    selectors: {
        ids: {
            btn: (panel_id) => `sn-results-menu-btn-${panel_id}`,
            modal: (mrn, panel_id) => `sn-results-menu-panel-${panel_id}-${mrn}`,
            panel_short_detail: (panel_id) => `pasien-short-detil-${panel_id}`,
            panel_short_detail_target_el: (panel_id) => `pasien-short-detil-${panel_id}-targetEl`,
            tab_btn: (id: string) => `sn-results-menu-tab-btn-${id}`,
        },
        classes: {
            btn: 'sn-results-menu-btn',
            tab_head: 'sn-results-menu-tab-head',
            tab_body: 'sn-results-menu-tab-body',
            tab_container: 'sn-results-menu-tab-container',
            tab_head_container: 'sn-results-menu-tab-head-container',
            tab_body_container: 'sn-results-menu-tab-body-container',
        },
    },
    data: {
        extracted_data: {},
        values_to_render: {},
        new_data: {},
    },
}

interface LabParamContext {
    id: string
    name: string
    raw_id: string
    reference_values: string
    reference_unit: string
    panel_id: string
}

interface LabOrderContext {
    order_id: string
    order_date: string
    panel_id: string
    panel_desc: string
}

interface LabReferrerContext {
    id: string
    name: string
    reason: string
}

export interface ResultsMenuLabResult {
    id: string
    date: string
    parameter: LabParamContext
    value: string
    unit: string
    normal_values: string
    order: LabOrderContext
    referrer: LabReferrerContext
}

export interface ResultsMenuLabPatientData {
    mrn: string
    name: string
    gender: string
    dob: string
}

interface PanelConfig {
    panel_name: string
    parameter_ids: CentralizedParamId[]
}

export type PanelsConfig = Record<string, PanelConfig>

export const DEFAULT_RESULTS_MENU_PANELS_CONFIG = PANELS_CONFIG
export const RESULTS_MENU_LAB_SYMBOL_MAP = LAB_SYMBOL_MAP
export const RESULTS_MENU_LAB_PARAM_MAP = LAB_PARAM_MAP
