import { ActionsModalController } from '../../functions/satin-dash-ui/actions'
import { BaseApiResponse } from '../api/base'
import { SoediranDataKunjungan } from '../api/soediran/data'
import { SatinDriver } from '../driver'
import { SatinBaseFunctionConfig, SatinBaseFunctionConfigData, SatinBaseFunctionConfigSelectors } from './base'

// required interfaces
export interface SatinDashUIConfigSelectors extends SatinBaseFunctionConfigSelectors {
    queries: {
        panel_kunjungan_workspace: string
        panel_kunjungan_list: string
    }
}

export interface SatinDashUIConfigData extends SatinBaseFunctionConfigData {
    extracted_data: {}
    values_to_render: {}
    new_data: {}
}

export interface SatinDashUIConfig extends SatinBaseFunctionConfig {
    primary_settings_key: 'dash_enable_satin_dash_ui'
    selectors: SatinDashUIConfigSelectors
    data: SatinDashUIConfigData
}

export const DEFAULT_SATIN_DASH_UI_CONFIG: SatinDashUIConfig = {
    primary_settings_key: 'dash_enable_satin_dash_ui',
    primary_driver_key: SatinDriver.Temp,
    selectors: {
        queries: {
            panel_kunjungan_workspace: '.x-panel[id*="kunjungan-workspace"]',
            panel_kunjungan_list: '.x-panel[id*="kunjungan-list"]',
        },
    },
    data: {
        extracted_data: {},
        values_to_render: {},
        new_data: {},
    },
}

// helper interface
export type SatinDashUIVisitResponse = BaseApiResponse<Array<SoediranDataKunjungan>>

export interface SatinDashUIData {
    extracted_visits: Map<string, SatinDashUIVisit>
    extracted_workspaces: Map<string, SatinDashUIWorkspace>
}

export interface SatinDashUIVisit {
    id: string
    registration: {
        id: string
        date: string | null
    }
    patient: {
        id: string
        mrn: string
        name: string
        demographic: {
            living_status: string
            gender_id: string
            birthdate: string
            birthplace: string
            address: string
            religion: string
            education: string
            occupation: string
            marriage_status: string
            blood_type: string
            contact_num: string
        }
        insurance: {
            sep_id: string
            type: string
            class: string
            membership: {
                id: string
                type: string
                provider_name: string
                prb_desc: string
                ppk: {
                    name: string
                    address: string
                }
                issuance_date: string
            }
        }
    }
    diagnosis: {
        main_dx: string | null
        diagnosticians: string[]
    }
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

export interface SatinDashUIWorkspace {
    id: string
    name: string
    els: {
        wpanel: HTMLDivElement | null
        lpanel: HTMLDivElement | null
        lpanel_head: HTMLDivElement | null
        lpanel_body: HTMLDivElement | null
        toggle_btn_wrapper: HTMLDivElement | null
        actions_controller: ActionsModalController | null
    }
    visit_ids: string[]
    is_mode_enabled: boolean
    is_button_injected: boolean
}
