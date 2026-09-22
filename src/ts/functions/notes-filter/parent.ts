import { SoediranEvent } from '../../types/api/soediran/base'
import { SatinBaseFunction } from '../../types/functions/base'
import {
    DEFAULT_NOTES_FILTER_CONFIG,
    NotesFilterConfig,
    NotesFilterConfigData,
    NotesRuntimeData,
} from '../../types/functions/notes-filter'
import { NotesFilterExtractor } from './extractor'
import { NotesFilterInjector } from './injector'

export class NotesFilterFunction extends SatinBaseFunction<NotesFilterConfig, NotesFilterExtractor, NotesFilterInjector> {
    public extractor = new NotesFilterExtractor(this)
    public injector = new NotesFilterInjector(this)
    public config = DEFAULT_NOTES_FILTER_CONFIG

    public data: NotesRuntimeData = {
        user_id: '',
        extracted_data: {
            records: [],
            available_dates: [],
        },
        values_to_render: {
            active_category: 'ALL',
            active_date: 'ALL',
            search_query: '',
        },
    }

    public reset_data(): void {
        this.data = {
            user_id: '',
            extracted_data: {
                records: [],
                available_dates: [],
            },
            values_to_render: {
                active_category: 'ALL',
                active_date: 'ALL',
                search_query: '',
            },
        }
    }

    get_default_data(): NotesFilterConfigData {
        return structuredClone(DEFAULT_NOTES_FILTER_CONFIG.data)
    }

    bind_events(): void {
        window.addEventListener(SoediranEvent.IsAuthenticate, (custom_event) => {
            this.extract_user_auth(custom_event as CustomEvent<any>)
        })
    }

    extract_user_auth(custom_event: CustomEvent<any>): void {
        const data = custom_event.detail?.data
        if (!data || !data.NAME) return

        // Update state directly without forcing a full API refetch
        if (!this.data.extracted_data) {
            this.data.extracted_data = { records: [], available_dates: [], user_name: null }
        }

        this.data.extracted_data.user_name = data.NAME.trim()

        // Re-apply filters to update the MINE filter badges & row display
        this.injector?.apply_filters()
    }
}
