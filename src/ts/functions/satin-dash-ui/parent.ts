import { SatinBaseFunction } from '../../types/functions/base'
import { DEFAULT_SATIN_DASH_UI_CONFIG, SatinDashUIConfig, SatinDashUIConfigData } from '../../types/functions/satin-dash-ui'
import { SatinDashUIExtractor } from './extractor'
import { SatinDashUIInjector } from './injector'

export class SatinDashUIFunction extends SatinBaseFunction<SatinDashUIConfig, SatinDashUIExtractor, SatinDashUIInjector> {
    public extractor = new SatinDashUIExtractor(this)
    public injector = new SatinDashUIInjector(this)
    public config = DEFAULT_SATIN_DASH_UI_CONFIG

    get_default_data(): SatinDashUIConfigData {
        return structuredClone(DEFAULT_SATIN_DASH_UI_CONFIG.data)
    }
}
