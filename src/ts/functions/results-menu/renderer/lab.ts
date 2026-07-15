import { BaseApiResponse } from '../../../types/api/base'
import { SoediranDataHasilLab } from '../../../types/api/soediran/data'
import { RawDataTindakanMedisLab } from '../../../types/api/soediran/lab'
import { SOEDIRAN_RAW_LAB_MAP } from '../../../types/api/soediran/lab-map'
import { SoediranParamsHasilLab, SoediranParamsTindakanMedis } from '../../../types/api/soediran/params'
import { ResultsMenuLabPatientData, ResultsMenuLabResult } from '../../../types/functions/results-menu'
import { RequestPayloadBuilder } from '../../../utils/api'
import { create_element } from '../../../utils/dom'
import { Log } from '../../../utils/logger'
import { EMRManagerFunction } from '../../emr-manager/parent'
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
        limit: 100,
    })

    get_limit(): number {
        return this.hasil_lab_payload.params.limit || 0
    }

    set_limit(new_limit: number): void {
        this.hasil_lab_payload.update({ limit: new_limit })
        this.update_next_params()
    }

    update_next_params(): void {
        const next_start = this.current_loaded
        const next_page = 1 + Math.floor(next_start / this.get_limit())

        this.hasil_lab_payload.update({
            page: next_page,
            start: next_start,
        })
    }

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

    async start() {
        await this.toolbar.handle_load_next()

        // TODO: create the ui to refresh data from select panels/procedures
        // const engine = this.main_renderer.parent.engine
        // const emr_manager = EMRManagerFunction.get_instance(engine)
        // if (!emr_manager) return

        // const { from_cache, session } = await emr_manager.get_emr_session()

        // if (session) {
        //     const active_visit = session.visits.filter(visit => visit.is_active)[0]
        //     if (active_visit && active_visit.id) {
        //         const ctx = engine.api
        //         const result = await ctx.api_request<RawDataTindakanMedisLab[]>({
        //             base_path: 'layanan/tindakanmedis',
        //             payload: new RequestPayloadBuilder<SoediranParamsTindakanMedis>({
        //                 KUNJUNGAN: `ne${active_visit.id}`,
        //                 REFERENSI: {
        //                     Kunjungan: false,
        //                 },
        //                 NORM: session.mrn,
        //                 JENIS_TINDAKAN: '8',
        //                 STATUS: 1,
        //                 page: 1,
        //                 start: 0,
        //                 limit: 200, // get 200 most recent lab panels/procedures
        //             }),
        //         })
        //         console.log(result!.data![0].TINDAKAN_DESKRIPSI)
        //     }
        // }
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
        this.update_next_params()
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

    private extract_hasil_lab_data(raw?: SoediranDataHasilLab): ResultsMenuLabResult {
        const raw_param_id = raw?.REFERENSI?.PARAMETER_TINDAKAN?.ID ?? ''
        const centralized_param_id = SOEDIRAN_RAW_LAB_MAP[raw_param_id] ?? raw_param_id
        return {
            id: raw?.ID ?? '',
            date: raw?.TANGGAL ?? '',
            parameter: {
                id: centralized_param_id,
                name: raw?.REFERENSI?.PARAMETER_TINDAKAN?.PARAMETER ?? '',
                raw_id: raw_param_id,
                reference_values: raw?.REFERENSI?.PARAMETER_TINDAKAN?.NILAI_RUJUKAN ?? '',
                reference_unit: raw?.REFERENSI?.PARAMETER_TINDAKAN?.REFERENSI?.SATUAN?.DESKRIPSI ?? '',
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
