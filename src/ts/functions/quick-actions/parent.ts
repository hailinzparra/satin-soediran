import { SatinBaseFunction } from '../../types/functions/base'
import {
    DEFAULT_QUICK_ACTIONS_CONFIG,
    QuickActionsConfig,
    QuickActionsConfigData,
    PatientContext
} from '../../types/functions/quick-actions'
import { QuickActionsExtractor } from './extractor'
import { QuickActionsInjector } from './injector'
import { SatinApiContext } from '../../api/context'
import { SoediranEvent } from '../../types/api/soediran/base'

export interface QuickActionsData {
    patient: PatientContext
    user_name: string
}

export class QuickActionsFunction extends SatinBaseFunction<QuickActionsConfig, QuickActionsExtractor, QuickActionsInjector> {
    public extractor = new QuickActionsExtractor(this)
    public injector = new QuickActionsInjector(this)
    public config = DEFAULT_QUICK_ACTIONS_CONFIG

    public data: QuickActionsData = {
        patient: {
            mrn: '',
            name: '',
            reg_id: '',
            visit_id: '',
        },
        user_name: '',
    }

    public reset_data(): void {
        this.data.patient = {
            mrn: '',
            name: '',
            reg_id: '',
            visit_id: '',
        }
    }

    public get api_client(): SatinApiContext {
        return this.engine.api
    }

    get_default_data(): QuickActionsConfigData {
        return structuredClone(DEFAULT_QUICK_ACTIONS_CONFIG.data)
    }

    bind_events() {
        window.addEventListener(SoediranEvent.IsAuthenticate, (custom_event) => {
            this.extract_user_auth(custom_event as CustomEvent<any>)
        })
        this.injector.bind_events()
        this.extractor.bind_events()
    }

    extract_user_auth(custom_event: CustomEvent<any>): void {
        const data = custom_event.detail?.data
        if (!data || !data.NAME) return
        this.data.user_name = data.NAME.trim()
    }
}
