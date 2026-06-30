import { DB_DRUG_PRICE_DATABASE } from '../../data/db-drug-price'
import { SatinDriver } from '../../types/driver'
import { SatinBaseFunction } from '../../types/functions/base'
import { DrugPriceData } from '../../types/functions/drug-price'
import { VaultDriver } from '../../utils/vault'
import { DrugPriceExtractor } from './extractor'
import { DrugPriceInjector } from './injector'

export class DrugPriceFunction extends SatinBaseFunction {
    extractor: DrugPriceExtractor = new DrugPriceExtractor(this)
    injector: DrugPriceInjector = new DrugPriceInjector(this)

    classnames = {
        summary_card: 'sn-summary-card',
        price_badge_group: 'sn-price-badge-group',
    }

    get_new_price_driver = (): VaultDriver<DrugPriceData> => this.engine.drivers[SatinDriver.NewDrugPrices]
    get_new_price_data = (): DrugPriceData => this.get_new_price_driver().data || {}
    get_db_price_data = (): DrugPriceData => DB_DRUG_PRICE_DATABASE

    apply() {
        const show_drug_price = this.engine.get_settings().emr_show_drug_price
        if (show_drug_price) {
            this.injector.inject()
        } else {
            this.reset()
        }
    }

    on_debounce() {
        this.extractor.extract()
    }

    reset() {
        this.injector.reset()
    }
}
