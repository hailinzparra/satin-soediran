import { SatinDriver } from '../driver'
import { SatinBaseFunctionConfig, SatinBaseFunctionConfigData, SatinBaseFunctionConfigSelectors } from './base'

export interface EMRManagerConfigSelectors extends SatinBaseFunctionConfigSelectors {
    queries: {
        panel_short_detail: string
    }
}

export interface EMRManagerConfigData extends SatinBaseFunctionConfigData {
    extracted_data: {
        active_mrn: string
        active_panel_short_detail_id: string
    }
    values_to_render: {
        active_mrn: string
    }
    new_data: {
        active_mrn: string
        active_panel_short_detail_id: string
    }
}

export interface EMRManagerConfig extends SatinBaseFunctionConfig {
    primary_settings_key: 'emr_enable_manager'
    primary_driver_key: SatinDriver.EMRManagerNewData
    selectors: EMRManagerConfigSelectors
    data: EMRManagerConfigData
}

export const DEFAULT_EMR_MANAGER_CONFIG: EMRManagerConfig = {
    primary_settings_key: 'emr_enable_manager',
    primary_driver_key: SatinDriver.EMRManagerNewData,
    selectors: {
        queries: {
            panel_short_detail: '.x-panel[id*="pasien-short-detil"]',
        },
    },
    data: {
        extracted_data: {
            active_mrn: '',
            active_panel_short_detail_id: '',
        },
        values_to_render: {
            active_mrn: '',
        },
        new_data: {
            active_mrn: '',
            active_panel_short_detail_id: '',
        }
    },
}
