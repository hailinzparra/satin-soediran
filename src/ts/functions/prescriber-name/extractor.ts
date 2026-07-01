import { SoediranDataOrderResep } from '../../types/api/soediran/data'
import { PrescriberNameData, PrescriberNameItem, PrescriberNameResponse } from '../../types/functions/prescriber-name'
import { title_case_name } from '../../utils/misc'
import { PrescriberNameFunction } from './parent'

type ExtractedData = PrescriberNameItem & {
    order_resep_data: SoediranDataOrderResep | null
}

export class PrescriberNameExtractor {
    private has_new_data: boolean = false
    private new_data: PrescriberNameData = {}

    constructor(
        protected parent: PrescriberNameFunction
    ) { }

    extract(custom_event: CustomEvent<PrescriberNameResponse>) {
        this.has_new_data = false
        this.new_data = {}

        this.extract_from_response(custom_event)

        if (this.has_new_data) {
            const driver = this.parent.get_temp_driver()
            const old_cache = driver.data.prescriber_name_cache
            driver.update({
                prescriber_name_cache: { ...old_cache, ...this.new_data }
            })
        }
    }

    private extract_from_response(custom_event: CustomEvent<PrescriberNameResponse>) {
        const data = custom_event.detail.data
        if (!data) return

        data.forEach(item => {
            const extracted_data: ExtractedData = {
                id: '',
                date: '',
                is_cito: false,
                prescriber_name: '',
                order_resep_data: null,
            }

            if (item.REFERENSI && 'ASAL' in item.REFERENSI) {
                extracted_data.order_resep_data = item.REFERENSI.ASAL || null
                if ('MASUK' in item) {
                    extracted_data.date = item.MASUK || ''
                }
            } else {
                extracted_data.order_resep_data = item
                if ('TANGGAL' in item) {
                    extracted_data.date = item.TANGGAL || ''
                }
            }

            if (!extracted_data.order_resep_data) return

            extracted_data.id = extracted_data.order_resep_data.NOMOR || ''
            extracted_data.is_cito = extracted_data.order_resep_data.CITO === '1'
            extracted_data.prescriber_name = title_case_name(extracted_data.order_resep_data.PEMBERI_RESEP)

            this.new_data[extracted_data.id] = {
                id: extracted_data.id,
                date: extracted_data.date,
                is_cito: extracted_data.is_cito,
                prescriber_name: extracted_data.prescriber_name,
            }

            this.has_new_data = true
        })
    }
}
