import { SatinBaseFunctionExtractor } from '../../types/functions/base'
import { QuickActionsConfig } from '../../types/functions/quick-actions'
import { QuickActionsFunction } from './parent'

export class QuickActionsExtractor extends SatinBaseFunctionExtractor<QuickActionsFunction, QuickActionsConfig> {
    public async on_execute(): Promise<void> {
        this.extract_data()
    }

    extract_data(): void {
        const mrn_el = document.querySelector('.js-patient-mrn, .patient-mrn')
        const name_el = document.querySelector('.js-patient-name, .patient-name')
        const reg_el = document.querySelector('.js-registration-id, .no-pendaftaran')

        const mrn = mrn_el?.textContent?.trim() || '00.79.78.75'
        const name = name_el?.textContent?.trim() || 'SULARJO'
        const reg_id = reg_el?.textContent?.replace('No. Pendaftaran:', '').trim() || '260921.0609'
        const visit_id = `VST-${reg_id}`

        this.parent.data.patient = {
            mrn,
            name,
            reg_id,
            visit_id,
        }
    }
}
