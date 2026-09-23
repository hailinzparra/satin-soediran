import { SatinBaseFunctionExtractor } from '../../types/functions/base'
import { QuickActionsConfig } from '../../types/functions/quick-actions'
import { format_medical_name } from '../../utils/formatter'
import { Log } from '../../utils/logger'
import { get_current_patient_summary, init_workspace_listener } from '../../utils/workspace'
import { QuickActionsFunction } from './parent'

export class QuickActionsExtractor extends SatinBaseFunctionExtractor<QuickActionsFunction, QuickActionsConfig> {
    public async on_execute(): Promise<void> {
        this.update_patient_data()
    }

    update_patient_data(): void {
        const summary = get_current_patient_summary()
        if (!summary) return

        const new_name = format_medical_name(summary.name)
        const current = this.parent.data.patient

        // Create unique key signatures
        const current_signature = `${current?.mrn || ''}_${current?.visit_id || ''}_${current?.reg_id || ''}_${current?.name || ''}`
        const new_signature = `${summary.mrn}_${summary.visit_id}_${summary.reg_id}_${new_name}`

        // Early exit if signatures match
        if (current_signature === new_signature) return

        Log.log('Patient changed from', current_signature, 'to', new_signature)

        this.parent.data.patient = {
            ...this.parent.data.patient,
            mrn: summary.mrn,
            name: new_name,
            reg_id: summary.reg_id,
            visit_id: summary.visit_id
        }

        this.parent.injector.on_execute()
    }

    bind_events(): void {
        init_workspace_listener()
    }
}
