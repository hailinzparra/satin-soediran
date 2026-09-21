import { SatinBaseFunction } from '../../types/functions/base'
import {
    DEFAULT_QUICK_ACTIONS_CONFIG,
    QuickActionsConfig,
    QuickActionsConfigData,
    PatientContext
} from '../../types/functions/quick-actions'
import { QuickActionsExtractor } from './extractor'
import { QuickActionsInjector } from './injector'

export interface QuickActionsData {
    patient: PatientContext | null
}

export class QuickActionsFunction extends SatinBaseFunction<QuickActionsConfig, QuickActionsExtractor, QuickActionsInjector> {
    public extractor = new QuickActionsExtractor(this)
    public injector = new QuickActionsInjector(this)
    public config = DEFAULT_QUICK_ACTIONS_CONFIG

    public data: QuickActionsData = {
        patient: null,
    }

    get_default_data(): QuickActionsConfigData {
        return structuredClone(DEFAULT_QUICK_ACTIONS_CONFIG.data)
    }

    bind_events(): void {
        this.injector.bind_events()
    }
}
