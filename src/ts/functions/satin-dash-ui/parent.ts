import { SoediranEvent } from '../../types/api/soediran/base'
import { SatinBaseFunction } from '../../types/functions/base'
import { DEFAULT_SATIN_DASH_UI_CONFIG, SatinDashUIConfig, SatinDashUIConfigData, SatinDashUIData, SatinDashUIVisitResponse } from '../../types/functions/satin-dash-ui'
import { SatinDashUIExtractor } from './extractor'
import { SatinDashUIInjector } from './injector'

export class SatinDashUIFunction extends SatinBaseFunction<SatinDashUIConfig, SatinDashUIExtractor, SatinDashUIInjector> {
    public extractor = new SatinDashUIExtractor(this)
    public injector = new SatinDashUIInjector(this)
    public config = DEFAULT_SATIN_DASH_UI_CONFIG

    data: SatinDashUIData = {
        extracted_visits: new Map(),
        extracted_workspaces: new Map(),
    }

    get_default_data(): SatinDashUIConfigData {
        return structuredClone(DEFAULT_SATIN_DASH_UI_CONFIG.data)
    }

    bind_events() {
        window.addEventListener(SoediranEvent.KunjunganFetched, async (custom_event) => {
            if (this.get_is_feature_enabled()) {
                await this.extractor.on_visit_response(custom_event as CustomEvent<SatinDashUIVisitResponse>)
            }
        })
    }
}
