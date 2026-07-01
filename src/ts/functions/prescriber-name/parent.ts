import { SoediranEvent } from '../../types/api/soediran/base'
import { SatinDriver } from '../../types/driver'
import { SatinBaseFunction } from '../../types/functions/base'
import { PrescriberNameResponse } from '../../types/functions/prescriber-name'
import { SatinTempData } from '../../types/temp'
import { VaultDriver } from '../../utils/vault'
import { PrescriberNameExtractor } from './extractor'
import { PrescriberNameInjector } from './injector'


export class PrescriberNameFunction extends SatinBaseFunction {
    extractor: PrescriberNameExtractor = new PrescriberNameExtractor(this)
    injector: PrescriberNameInjector = new PrescriberNameInjector(this)

    classnames = {
        prescriber_badge: 'sn-prescriber-badge',
    }

    get_temp_driver = (): VaultDriver<SatinTempData> => this.engine.drivers[SatinDriver.Temp]
    get_temp_data = (): SatinTempData => this.get_temp_driver().data || {}

    bind_events() {
        window.addEventListener(SoediranEvent.HistoryOrderResepFetched, (custom_event) => {
            this.extractor.extract(custom_event as CustomEvent<PrescriberNameResponse>)
        })
    }

    apply() {
        const show_drug_prescriber_name = this.engine.get_settings().emr_show_drug_prescriber_name
        if (show_drug_prescriber_name) {
            this.injector.inject()
        } else {
            this.reset()
        }
    }

    reset() {
        this.injector.reset()
    }
}
