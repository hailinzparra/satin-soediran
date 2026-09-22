import { SatinDriver } from '../driver'
import { SatinBaseFunctionConfig, SatinBaseFunctionConfigData, SatinBaseFunctionConfigSelectors } from './base'

// required interfaces
export interface NotesFilterConfigSelectors extends SatinBaseFunctionConfigSelectors {
    queries: {
        rm_cppt_list: string
        rm_cppt_list_record_table: string
    }
}

export interface NotesFilterConfigData extends SatinBaseFunctionConfigData {
    extracted_data: {}
    values_to_render: {}
    new_data: {}
}

export interface NotesFilterConfig extends SatinBaseFunctionConfig {
    primary_settings_key: 'emr_show_notes_filter_menu'
    selectors: NotesFilterConfigSelectors
    data: NotesFilterConfigData
}

export const DEFAULT_NOTES_FILTER_CONFIG: NotesFilterConfig = {
    primary_settings_key: 'emr_show_notes_filter_menu',
    primary_driver_key: SatinDriver.Temp,
    selectors: {
        queries: {
            rm_cppt_list: '[id^="rekammedis-cppt-list-"]:not([id$="-body"]):not([id$="-bodyWrap"])',
            rm_cppt_list_record_table: '[id^="tableview-"][id*="-record-"]',
        },
    },
    data: {
        extracted_data: {},
        values_to_render: {},
        new_data: {},
    },
}

// helper interface
export interface ExtractedNoteRecord {
    id: string
    element: HTMLElement
    author: string
    date: string // YYYY-MM-DD
}

export type FilterCategory = 'ALL' | 'MINE' | 'DOCTORS' | 'SEARCH'

export interface NotesRuntimeData {
    user_id: string
    extracted_data: {
        records: ExtractedNoteRecord[]
        available_dates: string[]
        user_name?: string | null
    }
    values_to_render: {
        active_category: FilterCategory
        active_date: string // 'ALL' or 'YYYY-MM-DD'
        search_query: string
    }
}
