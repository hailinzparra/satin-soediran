import { BaseApiResponse } from '../../../types/api/base'
import { SoediranDataHasilLab } from '../../../types/api/soediran/data'
import { SoediranParamsHasilLab } from '../../../types/api/soediran/params'
import { ResultsMenuLabPatientData, ResultsMenuLabResult } from '../../../types/functions/results-menu'
import { RequestPayloadBuilder } from '../../../utils/api'
import { create_element } from '../../../utils/dom'
import { Log } from '../../../utils/logger'
import { ResultsMenuLabTable } from './lab/table'
import { ResultsMenuLabToolbar } from './lab/toolbar'
import { ResultsMenuRenderer } from './main'

export class ResultsMenuLabRenderer {
    toolbar: ResultsMenuLabToolbar
    table: ResultsMenuLabTable

    current_loaded: number = 0
    current_total: number = 0

    public static classes = {
        toolbar: {
            el: 'sn-results-menu-lab-toolbar-el',
            btn_load_next: 'sn-results-menu-lab-toolbar-btn-load-next',
        },
        table: {
            el: 'sn-results-menu-lab-table-el',
            wrapper: 'sn-results-menu-lab-table-wrapper',
        },
    }

    limit: number = 100

    hasil_lab_payload = new RequestPayloadBuilder<SoediranParamsHasilLab>({
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

    patient_data: ResultsMenuLabPatientData = {
        mrn: '',
        name: '',
        gender: '',
        dob: '',
    }

    lab_results: Map<string, ResultsMenuLabResult> = new Map()

    constructor(
        public main_renderer: ResultsMenuRenderer,
    ) {
        this.toolbar = new ResultsMenuLabToolbar(this)
        this.table = new ResultsMenuLabTable(this)

        const mrn = this.main_renderer.mrn
        if (typeof mrn === 'string' && mrn.length > 0) {
            this.hasil_lab_payload.update({ NORM: mrn })
        }
        this.patient_data.mrn = mrn || ''
    }

    build_dom_elements(target_el: HTMLDivElement) {
        const wrapper = create_element('div', { classes: ResultsMenuLabRenderer.classes.table.wrapper }, [this.table.el])
        target_el.append(this.toolbar.el, wrapper)
    }

    async load_next_data(): Promise<{ success: boolean }> {
        const ctx = this.main_renderer.parent.engine.api
        try {
            const result = await ctx.api_request<SoediranDataHasilLab[]>({
                base_path: 'layanan/hasillab',
                payload: this.hasil_lab_payload,
            })

            this.process_next_data(result)
            this.update_table()

            return { success: true }
        } catch (err) {
            Log.error(`Failed to load next data:`, err)
            return { success: false }
        }
    }

    update_table() {
        this.table.update_table(this.lab_results)
    }

    process_next_data(result: BaseApiResponse<SoediranDataHasilLab[]>) {
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
                if (!this.lab_results.has(n.id)) {
                    this.lab_results.set(n.id, n)
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

    private extract_patient_data(raw: SoediranDataHasilLab): void {
        const raw_patient = raw?.REFERENSI?.TINDAKAN_MEDIS?.REFERENSI?.KUNJUNGAN?.REFERENSI?.PENDAFTARAN?.REFERENSI?.PASIEN
        if (!raw_patient) return

        // only extract if not yet exists
        if (!this.patient_data.mrn && raw_patient.NORM) {
            this.patient_data.mrn = raw_patient.NORM
        }
        if (!this.patient_data.name && raw_patient.NAMA) {
            this.patient_data.name = raw_patient.NAMA
        }
        if (!this.patient_data.gender && raw_patient.JENIS_KELAMIN) {
            this.patient_data.gender = raw_patient.JENIS_KELAMIN
        }
        if (!this.patient_data.dob && raw_patient.TANGGAL_LAHIR) {
            this.patient_data.dob = raw_patient.TANGGAL_LAHIR
        }
    }

    private extract_hasil_lab_data(raw: SoediranDataHasilLab): ResultsMenuLabResult {
        return {
            id: raw.ID ?? '',
            date: raw.TANGGAL ?? '',
            parameter: {
                id: raw?.REFERENSI?.PARAMETER_TINDAKAN?.ID ?? '',
                name: raw?.REFERENSI?.PARAMETER_TINDAKAN?.PARAMETER ?? '',
                reference_values: raw?.REFERENSI?.PARAMETER_TINDAKAN?.NILAI_RUJUKAN ?? '',
                panel_id: raw?.REFERENSI?.PARAMETER_TINDAKAN?.TINDAKAN ?? '',
            },
            value: raw?.HASIL ?? '',
            unit: raw?.SATUAN ?? '',
            normal_values: raw?.NILAI_NORMAL ?? '',
            order: {
                order_id: raw?.TINDAKAN_MEDIS ?? '',
                order_date: raw?.REFERENSI?.TINDAKAN_MEDIS?.TANGGAL ?? '',
                panel_id: raw?.REFERENSI?.TINDAKAN_MEDIS?.TINDAKAN ?? '',
                panel_desc: raw?.REFERENSI?.TINDAKAN_MEDIS?.TINDAKAN_DESKRIPSI ?? '',
            },
            referrer: {
                id: raw?.REFERENSI?.TINDAKAN_MEDIS?.REFERENSI?.KUNJUNGAN?.REFERENSI?.PERUJUK?.REFERENSI?.DOKTER_ASAL?.ID ?? '',
                name: raw?.REFERENSI?.TINDAKAN_MEDIS?.REFERENSI?.KUNJUNGAN?.REFERENSI?.PERUJUK?.REFERENSI?.DOKTER_ASAL?.NAMA ?? '',
                reason: raw?.REFERENSI?.TINDAKAN_MEDIS?.REFERENSI?.KUNJUNGAN?.REFERENSI?.PERUJUK?.ALASAN ?? '',
            },
        }
    }
}
