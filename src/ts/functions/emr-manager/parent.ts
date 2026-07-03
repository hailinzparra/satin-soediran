import { SatinBaseFunction } from '../../types/functions/base'
import { DEFAULT_EMR_MANAGER_CONFIG, EMRManagerConfig } from '../../types/functions/emr-manager'
import { EMRManagerExtractor } from './extractor'
import { EMRManagerInjector } from './injector'

export class EMRManagerFunction extends SatinBaseFunction<EMRManagerConfig> {
    public extractor: EMRManagerExtractor = new EMRManagerExtractor(this)
    public injector: EMRManagerInjector = new EMRManagerInjector(this)
    public config: EMRManagerConfig = DEFAULT_EMR_MANAGER_CONFIG

    get_default_new_data(): EMRManagerConfig['data']['new_data'] {
        return structuredClone(DEFAULT_EMR_MANAGER_CONFIG.data.new_data)
    }

    get_default_extracted_data(): EMRManagerConfig['data']['extracted_data'] {
        return structuredClone(DEFAULT_EMR_MANAGER_CONFIG.data.extracted_data)
    }

    on_debounce(): void {
        this.extractor.execute()
    }

    apply(): void { }
}
