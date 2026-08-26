import { SatinDriver } from '../driver'
import { SatinBaseFunctionConfig, SatinBaseFunctionConfigData, SatinBaseFunctionConfigSelectors } from './base'

// required interfaces
export interface SatinDashUIConfigSelectors extends SatinBaseFunctionConfigSelectors {
    queries: {
        panel_kunjungan_workspace: string
    }
}

export interface SatinDashUIConfigData extends SatinBaseFunctionConfigData {
    extracted_data: {
        active_panel_id: string
        active_panel_kunjungan_workspace_ids: string[]
    }
    values_to_render: {
        active_panel_id: string
    }
    new_data: {
        active_panel_id: string
        active_panel_kunjungan_workspace_ids: string[]
    }
}

export interface SatinDashUIConfig extends SatinBaseFunctionConfig {
    primary_settings_key: 'dash_enable_satin_dash_ui'
    selectors: SatinDashUIConfigSelectors
    data: SatinDashUIConfigData
}

export const DEFAULT_SATIN_DASH_UI_CONFIG: SatinDashUIConfig = {
    primary_settings_key: 'dash_enable_satin_dash_ui',
    primary_driver_key: SatinDriver.Session,
    selectors: {
        queries: {
            panel_kunjungan_workspace: '.x-panel[id*="kunjungan-workspace"]',
        },
    },
    data: {
        extracted_data: {
            active_panel_id: '',
            active_panel_kunjungan_workspace_ids: [],
        },
        values_to_render: {
            active_panel_id: '',
        },
        new_data: {
            active_panel_id: '',
            active_panel_kunjungan_workspace_ids: [],
        }
    },
}

// helper interface
export interface SatinDashUISession {
    visits: SatinDashUISessionVisit[]
}

export interface SatinDashUISessionVisit {
    id: string
    reg_id: string
    dpjp: {
        id: string
        name: string
    }
    room: {
        id: string
        name: string
        bed_name: string
    }
    admission_date: string | null
    discharge_date: string | null
    is_active: boolean
}
