import { SatinBaseFunctionExtractor } from '../../types/functions/base'
import { SatinDashUIConfig, SatinDashUIVisit, SatinDashUIVisitResponse, SatinDashUIWorkspace } from '../../types/functions/satin-dash-ui'
import { format_medical_name } from '../../utils/formatter'
import { SatinDashUIFunction } from './parent'

export class SatinDashUIExtractor extends SatinBaseFunctionExtractor<SatinDashUIFunction, SatinDashUIConfig> {
    public async on_execute(): Promise<void> {
        // if feature enabled, what happen on each tick?
        // do it here
        this.extract_workspaces()
    }

    extract_workspaces() {
        const wpanels = document.querySelectorAll<HTMLDivElement>(this.parent.config.selectors.queries.panel_kunjungan_workspace)

        if (!wpanels.length) {
            return
        }

        wpanels.forEach(wpanel => {
            const wid = wpanel.id.replace('kunjungan-workspace-', '') ?? ''

            // already exists? dont readd
            if (this.parent.data.extracted_workspaces.has(wid)) return

            // oohh, new panel found! lets reference it
            const lpanel = wpanel.querySelector<HTMLDivElement>(this.parent.config.selectors.queries.panel_kunjungan_list) ?? null
            const lpanel_head = (document.getElementById(`${lpanel?.id ?? ''}_header`) as HTMLDivElement) ?? null
            const lpanel_body = (document.getElementById(`${lpanel?.id ?? ''}-body`) as HTMLDivElement) ?? null

            const extracted_workspace: SatinDashUIWorkspace = {
                id: wid,
                els: {
                    wpanel,
                    lpanel,
                    lpanel_head,
                    lpanel_body,
                    toggle_btn_wrapper: null,
                    consult_btn: null,
                },
                visit_ids: [],
                is_mode_enabled: this.parent.engine.get_settings().dash_enable_satin_dash_ui_on_by_default,
                is_button_injected: false,
            }

            this.parent.data.extracted_workspaces.set(extracted_workspace.id, extracted_workspace)
        })
    }

    async on_visit_response(custom_event: CustomEvent<SatinDashUIVisitResponse>) {
        this.extract_visits(custom_event)
    }

    private extract_visits(custom_event: CustomEvent<SatinDashUIVisitResponse>) {
        const data = custom_event.detail.data
        if (!data) return

        this.parent.data.extracted_visits.clear()
        data.forEach(raw => {
            if (!raw.NOMOR) return

            const discharge_str = raw.KELUAR
            const is_active = !discharge_str || isNaN(Date.parse(discharge_str))
            const queue_num = raw.REFERENSI?.PENDAFTARAN?.TUJUAN?.REFERENSI?.ANTRIAN?.NOMOR ?? ''
            const queue_pos = raw.REFERENSI?.PENDAFTARAN?.TUJUAN?.REFERENSI?.ANTRIAN?.POS ?? ''
            const queue_str = queue_num ? `${queue_pos ? `${queue_pos}-` : ''}${queue_num}` : ''

            const raw_dx = raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.DIAGNOSAUTAMA?.DIAGNOSA ?
                raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.DIAGNOSAUTAMA?.DIAGNOSA
                : null
            const icd_dx = raw.REFERENSI?.PENDAFTARAN?.DIAGNOSAMASUK?.REFERENSI?.DIAGNOSA
                ? `${raw.REFERENSI?.PENDAFTARAN?.DIAGNOSAMASUK?.REFERENSI?.DIAGNOSA?.CODE ?? '??'} - ${raw.REFERENSI?.PENDAFTARAN?.DIAGNOSAMASUK?.REFERENSI?.DIAGNOSA?.STR ?? '??'}`
                : null

            const diagnosticians: string[] = []

            const main_dxtician = raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.DIAGNOSAUTAMA?.REFERENSI?.DIAGNOSA_OLEH?.NAMA
            if (main_dxtician) {
                const prefix_title = raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.DIAGNOSAUTAMA?.REFERENSI?.DIAGNOSA_OLEH?.GELAR_DEPAN
                const postfix_title = raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.DIAGNOSAUTAMA?.REFERENSI?.DIAGNOSA_OLEH?.GELAR_BELAKANG
                diagnosticians.push(`${prefix_title ? prefix_title + '. ' : ''}${main_dxtician}${postfix_title ? ', ' + postfix_title : ''}`)
            }

            const extracted_visit: SatinDashUIVisit = {
                id: raw.NOMOR ?? '',
                registration: {
                    id: raw.NOPEN ?? '',
                    date: raw.REFERENSI?.PENDAFTARAN?.TANGGAL ?? null
                },
                patient: {
                    id: raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.PASIEN?.REFERENSI?.PATIENT?.id ?? '',
                    mrn: raw.REFERENSI?.PENDAFTARAN?.NORM ?? raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.PASIEN?.NORM ?? '',
                    name: raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.PASIEN?.NAMA ?? '',
                    demographic: {
                        living_status: raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.PASIEN?.REFERENSI?.STATUS?.DESKRIPSI ?? '',
                        gender_id: raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.PASIEN?.JENIS_KELAMIN ?? '',
                        birthdate: raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.PASIEN?.TANGGAL_LAHIR ?? '',
                        birthplace: raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.PASIEN?.REFERENSI?.TEMPATLAHIR?.DESKRIPSI ?? '',
                        address: raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.PASIEN?.ALAMAT ?? '',
                        religion: raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.PASIEN?.REFERENSI?.AGAMA?.DESKRIPSI ?? '',
                        education: raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.PASIEN?.REFERENSI?.PENDIDIKAN?.DESKRIPSI ?? '',
                        occupation: raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.PASIEN?.REFERENSI?.PEKERJAAN?.DESKRIPSI ?? '',
                        marriage_status: raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.PASIEN?.REFERENSI?.STATUS_PERKAWINAN?.DESKRIPSI ?? '',
                        blood_type: raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.PASIEN?.REFERENSI?.GOLONGAN_DARAH?.DESKRIPSI ?? '',
                        contact_num: (raw.REFERENSI?.PENDAFTARAN?.REFERENSI?.PASIEN?.KONTAK || []).map(n => n.NOMOR ?? '').join(', ') ?? '',
                    },
                    insurance: {
                        sep_id: raw.REFERENSI?.PENDAFTARAN?.PENJAMIN?.NOMOR ?? '',
                        type: raw.REFERENSI?.PENDAFTARAN?.PENJAMIN?.REFERENSI?.JENIS_PENJAMIN?.DESKRIPSI ?? '',
                        class: raw.REFERENSI?.PENDAFTARAN?.PENJAMIN?.REFERENSI?.KELAS?.DESKRIPSI ?? '',
                        membership: {
                            id: raw.REFERENSI?.PENDAFTARAN?.PENJAMIN?.REFERENSI?.KEPESERTAAN?.noKartu ?? '',
                            type: raw.REFERENSI?.PENDAFTARAN?.PENJAMIN?.REFERENSI?.KEPESERTAAN?.nmJenisPeserta ?? '',
                            provider_name: raw.REFERENSI?.PENDAFTARAN?.PENJAMIN?.REFERENSI?.KEPESERTAAN?.nmProvider ?? '',
                            prb_desc: raw.REFERENSI?.PENDAFTARAN?.PENJAMIN?.REFERENSI?.KEPESERTAAN?.prolanisPRB ?? '',
                            ppk: {
                                name: raw.REFERENSI?.PENDAFTARAN?.PENJAMIN?.REFERENSI?.KAP?.REFERENSI?.PPK?.NAMA ?? '',
                                address: raw.REFERENSI?.PENDAFTARAN?.PENJAMIN?.REFERENSI?.KAP?.REFERENSI?.PPK?.ALAMAT ?? '',
                            },
                            issuance_date: raw.REFERENSI?.PENDAFTARAN?.PENJAMIN?.REFERENSI?.KEPESERTAAN?.tglCetakKartu ?? '',
                        },
                    },
                },
                diagnosis: {
                    main_dx: raw_dx ?? icd_dx ?? null,
                    diagnosticians,
                },
                dpjp: {
                    id: raw.REFERENSI?.DPJP?.ID ?? raw.DPJP ?? '',
                    name: raw.REFERENSI?.DPJP?.NAMA ?? '',
                },
                room: {
                    id: raw.REFERENSI?.RUANGAN?.ID ?? raw.RUANGAN ?? '',
                    name: raw.REFERENSI?.RUANGAN?.DESKRIPSI ?? '',
                    bed_name: raw.REFERENSI?.RUANG_KAMAR_TIDUR?.TEMPAT_TIDUR ?? queue_str,
                },
                admission_date: raw.MASUK ?? null,
                discharge_date: discharge_str ?? null,
                is_active,
            }

            this.parent.data.extracted_visits.set(extracted_visit.id, extracted_visit)
        })
    }
}
