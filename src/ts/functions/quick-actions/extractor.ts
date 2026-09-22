import { SoediranEvent } from '../../types/api/soediran/base'
import { SatinBaseFunctionExtractor } from '../../types/functions/base'
import { QuickActionsConfig, TagihanPendaftaranResponse } from '../../types/functions/quick-actions'
import { format_medical_name } from '../../utils/formatter'
import { QuickActionsFunction } from './parent'

export class QuickActionsExtractor extends SatinBaseFunctionExtractor<QuickActionsFunction, QuickActionsConfig> {
    public async on_execute(): Promise<void> {
    }

    bind_events(): void {
        window.addEventListener(SoediranEvent.TagihanPendaftaranFetched, (custom_event) => {
            this.extract_name_mrn_reg(custom_event as CustomEvent<TagihanPendaftaranResponse>)
            this.parent.injector.on_execute()
        })

        window.addEventListener(SoediranEvent.AdmisiFetched, (custom_event) => {
            this.extract_visit_id(custom_event as CustomEvent<any>)
            this.parent.injector.on_execute()
        })
    }

    extract_name_mrn_reg(custom_event: CustomEvent<TagihanPendaftaranResponse>): void {
        const data = custom_event.detail.data
        if (!data) return

        let mrn = ''
        let name = ''
        let reg_id = ''

        if (data.length) {
            const raw = data[0]
            if (raw) {
                mrn = raw.REFERENSI?.PENDAFTARAN?.NORM ?? ''
                name = raw.REFERENSI?.PENDAFTARAN?.REFERENSI.PASIEN?.NAMA ?? ''
                reg_id = raw.PENDAFTARAN ?? ''
            }
        }

        this.parent.data.patient = {
            ...this.parent.data.patient,
            mrn: mrn,
            name: format_medical_name(name),
            reg_id: reg_id,
        }
    }

    extract_visit_id(custom_event: CustomEvent<any>): void {
        const payload = custom_event.detail.payload
        if (!payload) return

        const visit_id = payload.KUNJUNGAN ?? ''

        this.parent.data.patient = {
            ...this.parent.data.patient,
            visit_id: visit_id,
        }
    }
}
