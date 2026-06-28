import { ApiResponseWrapper } from '../../api/api-types'
import { SatinContentEngine } from '../../content'
import { create_element, RequestPayloadBuilder } from '../../utils'
import { ResultsMenuLabPivotTable } from './lab-pivot-table'
import { ResultsMenuLabToolbar } from './lab-toolbar'
import { HasilLabParams, HasilLabResponseData, LabResult } from './types'

interface PatientData {
    mrn: string
    name: string
    gender: string
    dob: string
}

export class ResultsMenuTabLab {
    engine?: SatinContentEngine

    pivot_table: ResultsMenuLabPivotTable
    toolbar: ResultsMenuLabToolbar

    current_loaded: number = 0
    current_total: number = 0

    limit: number = 5

    hasil_lab_payload: RequestPayloadBuilder<HasilLabParams>
        = new RequestPayloadBuilder<HasilLabParams>({
            NORM: '',
            REFERENSI: {
                Kunjungan: {
                    COLUMNS: ['REF'],
                    REFERENSI: false,
                },
            },
            STATUS: 1,
            page: 1,
            start: 0,
            limit: this.limit,
        })

    patient_data: PatientData = {
        mrn: '',
        name: '',
        gender: '',
        dob: '',
    }

    hasil_labs: Map<string, LabResult> = new Map()

    constructor(engine?: SatinContentEngine, mrn?: string) {
        this.engine = engine

        if (typeof mrn === 'string' && mrn.length > 0) {
            this.hasil_lab_payload.update({ NORM: mrn })
        }

        this.pivot_table = new ResultsMenuLabPivotTable(this)
        this.toolbar = new ResultsMenuLabToolbar(this)

        this.patient_data.mrn = mrn || ''
    }

    get_dom_contents(): HTMLDivElement[] {
        return [
            this.toolbar.el,
            create_element('div', {
                styles: {
                    flex: '1',
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '4px'
                }
            }, [
                this.pivot_table.el,
            ]),
        ]
    }

    async load_next_data(): Promise<{ success: boolean }> {
        if (!this.engine) return { success: false }
        const ctx = this.engine.api_context
        try {
            const result = await ctx.api_request<HasilLabResponseData[]>({
                base_path: 'layanan/hasillab',
                payload: this.hasil_lab_payload,
            })

            await this.process_next_data(result)
            console.log(this.hasil_labs.values())

            return { success: true }
        } catch (err) {
            console.error(`Failed to load next data:`, err)
            return { success: false }
        }
    }

    async process_next_data(result: ApiResponseWrapper<HasilLabResponseData[]>) {
        if (!result) return

        if (typeof result.total === 'number') {
            this.current_total = result.total
        }

        if (!Array.isArray(result.data)) return

        let new_loaded = 0

        result.data.forEach(raw => {
            this.extract_patient_data(raw)
            const n = this.extract_hasil_lab_data(raw)
            if (n && n.id) {
                if (!this.hasil_labs.has(n.id)) {
                    this.hasil_labs.set(n.id, n)
                    new_loaded++
                }
            }
        })

        this.current_loaded += new_loaded

        const next_start = this.current_loaded
        const next_page = 1 + Math.floor(next_start / this.limit)

        this.hasil_lab_payload.update({
            page: next_page,
            start: next_start,
        })
    }

    extract_patient_data(raw: HasilLabResponseData): void {
        const raw_patient = raw.REFERENSI.TINDAKAN_MEDIS.REFERENSI.KUNJUNGAN.REFERENSI.PENDAFTARAN.REFERENSI.PASIEN
        if (!this.patient_data.mrn) {
            this.patient_data.mrn = raw_patient.NORM
        }
        if (!this.patient_data.name) {
            this.patient_data.name = raw_patient.NAMA
        }
        if (!this.patient_data.gender) {
            this.patient_data.gender = raw_patient.JENIS_KELAMIN
        }
        if (!this.patient_data.dob) {
            this.patient_data.dob = raw_patient.TANGGAL_LAHIR
        }
    }

    extract_hasil_lab_data(raw: HasilLabResponseData): LabResult {
        return {
            id: raw.ID ?? '',
            date: raw.TANGGAL ?? '',
            parameter: {
                id: raw.REFERENSI.PARAMETER_TINDAKAN.ID ?? '',
                name: raw.REFERENSI.PARAMETER_TINDAKAN.PARAMETER ?? '',
                reference_values: raw.REFERENSI.PARAMETER_TINDAKAN.NILAI_RUJUKAN ?? '',
                panel_id: raw.REFERENSI.PARAMETER_TINDAKAN.TINDAKAN ?? '',
            },
            value: raw.HASIL ?? '',
            unit: raw.SATUAN ?? '',
            normal_values: raw.NILAI_NORMAL ?? '',
            order: {
                order_id: raw.TINDAKAN_MEDIS ?? '',
                order_date: raw.REFERENSI.TINDAKAN_MEDIS.TANGGAL ?? '',
                panel_id: raw.REFERENSI.TINDAKAN_MEDIS.TINDAKAN ?? '',
                panel_desc: raw.REFERENSI.TINDAKAN_MEDIS.TINDAKAN_DESKRIPSI ?? '',
            },
            referrer: {
                id: raw.REFERENSI.TINDAKAN_MEDIS.REFERENSI.KUNJUNGAN.REFERENSI.PERUJUK.REFERENSI.DOKTER_ASAL.ID ?? '',
                name: raw.REFERENSI.TINDAKAN_MEDIS.REFERENSI.KUNJUNGAN.REFERENSI.PERUJUK.REFERENSI.DOKTER_ASAL.NAMA ?? '',
                reason: raw.REFERENSI.TINDAKAN_MEDIS.REFERENSI.KUNJUNGAN.REFERENSI.PERUJUK.ALASAN ?? '',
            },
        }
    }
}
