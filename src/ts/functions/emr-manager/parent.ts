import { SatinBaseFunction } from '../../types/functions/base'
import { DEFAULT_EMR_MANAGER_CONFIG, EMRManagerConfig, EMRManagerConfigData } from '../../types/functions/emr-manager'
import { EMRManagerExtractor } from './extractor'
import { EMRManagerInjector } from './injector'

export class EMRManagerFunction extends SatinBaseFunction<EMRManagerConfig, EMRManagerExtractor, EMRManagerInjector> {
    public extractor = new EMRManagerExtractor(this)
    public injector = new EMRManagerInjector(this)
    public config = DEFAULT_EMR_MANAGER_CONFIG

    get_default_data(): EMRManagerConfigData {
        return structuredClone(DEFAULT_EMR_MANAGER_CONFIG.data)
    }

    // empty apply() to defer auto execute of extractor/injector by default
    apply(): void { }

    // set the feature's main function entrypoint from on_debouce() instead of apply()
    on_debounce(): void {
        if (this.get_is_feature_enabled()) {
            // just extractor at work
            this.extractor.execute()
        } else {
            // do nothing if disabled
            // no reset no nothing
        }
    }
}
