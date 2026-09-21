import { SatinDriver } from '../driver'
import { SatinBaseFunctionConfig, SatinBaseFunctionConfigData, SatinBaseFunctionConfigSelectors } from './base'

// required interfaces
export interface QuickActionsConfigSelectors extends SatinBaseFunctionConfigSelectors {
    queries: {
        layanan_workspace_header: string
    }
}

export interface QuickActionsConfigData extends SatinBaseFunctionConfigData {
    extracted_data: {}
    values_to_render: {}
    new_data: {}
}

export interface QuickActionsConfig extends SatinBaseFunctionConfig {
    primary_settings_key: 'emr_show_quick_actions_menu'
    selectors: QuickActionsConfigSelectors
    data: QuickActionsConfigData
}

export const DEFAULT_QUICK_ACTIONS_CONFIG: QuickActionsConfig = {
    primary_settings_key: 'emr_show_quick_actions_menu',
    primary_driver_key: SatinDriver.Temp,
    selectors: {
        queries: {
            layanan_workspace_header: '[id^="layanan-workspace-"][id$="_header"]',
        },
    },
    data: {
        extracted_data: {},
        values_to_render: {},
        new_data: {},
    },
}

// helper interface

export interface PatientContext {
    mrn: string
    visit_id: string
    reg_id: string
    name: string
}

export interface QuickActionItem {
    id: string
    label: string
    category: 'Layanan' | 'Sign'
    get_secondary_badge: (ctx: PatientContext | null) => { label: string; raw_id: string }
    get_processing_msg: (ctx: PatientContext) => string
    get_success_msg: (ctx: PatientContext) => string
    get_error_msg: (ctx: PatientContext) => string
}
