import { SatinDashUIVisit, SatinDashUIWorkspace } from '../../types/functions/satin-dash-ui'
import { ModalInstance, ModalUI } from '../../ui/modal'
import { RequestPayloadBuilder } from '../../utils/api'
import { create_element } from '../../utils/dom'
import { format_medical_name } from '../../utils/formatter'
import { Log } from '../../utils/logger'
import { SatinDashUIFunction } from './parent'
import { get_age_metrics, get_patient_prefix } from './ui'
import { PxFisikItem, PxUmumItem } from './ui/results'

export interface AnamnesisItem {
    id: string
    date: string
    desc: string
}

export interface PlanningItem {
    id: string
    date: string
    desc: string
}

interface PatientExamCacheItem {
    timestamp: number
    anamnesis: AnamnesisItem[]
    px_umum: PxUmumItem[]
    px_fisik: PxFisikItem[]
    planning: PlanningItem[]
}

// ================= HELPER FUNCTIONS =================

function format_num_val(val: any): string {
    if (val === null || val === undefined || val === '') return ''
    const num = Number(val)
    return isNaN(num) ? String(val) : String(num)
}

function format_temp_val(val: any): string {
    if (val === null || val === undefined || val === '') return ''
    const num = Number(val)
    if (isNaN(num)) return String(val)
    return String(Number(num.toFixed(2)))
}

function strip_html(str: string): string {
    if (!str) return ''

    let processed = str
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(div|p|li|tr|h[1-6])>/gi, '\n')
        .replace(/<span[^>]*style="[^"]*white-space:\s*pre[^"]*"[^>]*>\s*<\/span>/gi, '\t')

    const tmp = document.createElement('div')
    tmp.innerHTML = processed
    const text = tmp.textContent || tmp.innerText || ''

    return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line, index, arr) => {
            if (line === '') {
                return index > 0 && index < arr.length - 1 && arr[index - 1] !== ''
            }
            return true
        })
        .join('\n')
        .trim()
}

// ================= CONTROLLER CLASS =================

export class ActionsModalController {
    private parent: SatinDashUIFunction
    private ws: SatinDashUIWorkspace
    public container_el: HTMLElement
    public btn_el: HTMLButtonElement

    // Dynamic UI references for Konsul Pasien
    private konsul_title_el!: HTMLElement
    private select_el!: HTMLSelectElement
    private load_btn!: HTMLButtonElement
    private last_updated_el!: HTMLElement
    private output_textarea!: HTMLTextAreaElement

    // Copy button timer handler
    private copy_timeout: number | null = null

    // Cache store per visit ID
    private exam_cache: Map<string, PatientExamCacheItem> = new Map()

    public static MODAL = {
        ID: 'sn-actions-modal-instance',
        WIDTH: 800,
        HEIGHT: 640,
    }

    constructor(parent: SatinDashUIFunction, ws: SatinDashUIWorkspace) {
        this.parent = parent
        this.ws = ws
        this.container_el = create_element('div', { classes: 'sn-actions-container' })
        this.btn_el = this.create_actions_btn()

        this.render_accordions()
        this.on_inject_update()
    }

    private render_accordions(): void {
        this.container_el.innerHTML = ''

        const konsul_accordion = this.create_konsul_accordion()
        const diagnosis_accordion = this.create_accordion(
            'Diagnosis Pasien',
            create_element('div', { text: 'coming soon' })
        )

        this.container_el.append(
            konsul_accordion,
            // diagnosis_accordion,
        )
    }

    private create_konsul_accordion(): HTMLElement {
        // Header
        this.konsul_title_el = create_element('span', {
            classes: 'sn-accordion-title',
            text: 'Konsul Pasien (0 pasien)',
        })

        const chevron = create_element('span', {
            classes: 'sn-accordion-icon',
            text: '▼',
        })

        const header = create_element('div', { classes: 'sn-accordion-header' }, [
            this.konsul_title_el,
            chevron,
        ])

        // Content - 50/50 Layout
        const left_panel = create_element('div', { classes: 'sn-konsul-panel left-panel' })
        const right_panel = create_element('div', { classes: 'sn-konsul-panel right-panel' })

        // Left Area: Select Dropdown + Load Button + Subtitle
        const select_label = create_element('label', {
            classes: 'sn-field-label',
            text: 'Pilih Pasien',
        })

        this.select_el = create_element('select', {
            classes: 'sn-select-input',
        }) as HTMLSelectElement

        this.load_btn = create_element('button', {
            classes: 'sn-btn-load btn-actions', // Matching action button styling
            text: 'Muat Data',
            attrs: { disabled: 'true' },
        }) as HTMLButtonElement

        this.last_updated_el = create_element('span', {
            classes: 'sn-subtitle-updated',
            text: 'Terakhir diperbarui -',
        })

        this.select_el.addEventListener('change', () => {
            const selected_visit_id = this.select_el.value
            if (selected_visit_id) {
                this.load_btn.disabled = false
                const cache = this.exam_cache.get(selected_visit_id)
                if (cache) {
                    this.update_last_updated_text(cache.timestamp)
                } else {
                    this.last_updated_el.textContent = 'Terakhir diperbarui -'
                }
            } else {
                this.load_btn.disabled = true
                this.last_updated_el.textContent = 'Terakhir diperbarui -'
            }
            this.update_output_text()
        })

        this.load_btn.addEventListener('click', () => {
            const selected_visit_id = this.select_el.value
            if (selected_visit_id) {
                this.handle_load_data(selected_visit_id)
            }
        })

        left_panel.append(select_label, this.select_el, this.load_btn, this.last_updated_el)

        // Right Area: Uneditable Textarea + Copy Button
        const output_label = create_element('label', {
            classes: 'sn-field-label',
            text: 'Draft Konsul',
        })

        this.output_textarea = create_element('textarea', {
            classes: 'sn-output-textarea',
            attrs: { readonly: 'true' },
        }) as HTMLTextAreaElement

        const copy_btn = create_element('button', {
            classes: 'btn-copy-action',
            text: 'Salin Konsul',
        })

        copy_btn.addEventListener('click', async (e: Event) => {
            e.stopPropagation()
            if (!this.output_textarea.value) return

            try {
                await navigator.clipboard.writeText(this.output_textarea.value)

                if (this.copy_timeout !== null) {
                    clearTimeout(this.copy_timeout)
                }

                copy_btn.innerText = 'Tersalin!'
                copy_btn.classList.add('copied')

                this.copy_timeout = window.setTimeout(() => {
                    copy_btn.innerText = 'Salin Konsul'
                    copy_btn.classList.remove('copied')
                    this.copy_timeout = null
                }, 2000)
            } catch (err) {
                Log.error('Failed to copy text:', err)
            }
        })

        right_panel.append(output_label, this.output_textarea, copy_btn)

        // Wrapper Body
        const body_content = create_element('div', { classes: 'sn-konsul-container' }, [
            left_panel,
            right_panel,
        ])

        const body = create_element('div', { classes: 'sn-accordion-body' }, [body_content])

        const accordion_item = create_element('div', { classes: 'sn-accordion-item is-expanded' }, [
            header,
            body,
        ])

        header.addEventListener('click', () => {
            accordion_item.classList.toggle('is-expanded')
        })

        return accordion_item
    }

    private create_accordion(title: string, content_el: HTMLElement): HTMLElement {
        const header_title = create_element('span', {
            classes: 'sn-accordion-title',
            text: title,
        })

        const chevron = create_element('span', {
            classes: 'sn-accordion-icon',
            text: '▼',
        })

        const header = create_element('div', { classes: 'sn-accordion-header' }, [
            header_title,
            chevron,
        ])

        const body = create_element('div', { classes: 'sn-accordion-body' }, [content_el])

        const accordion_item = create_element('div', { classes: 'sn-accordion-item' }, [
            header,
            body,
        ])

        header.addEventListener('click', () => {
            accordion_item.classList.toggle('is-expanded')
        })

        return accordion_item
    }

    private format_px_umum_cell(item: PxUmumItem): string {
        const lines: string[] = []

        if (item.ku) lines.push(`KU ${item.ku}`)
        if (item.loc) lines.push(`Kesadaran ${item.loc}`)

        const { eye, verbal, motor } = item.gcs
        if (eye || verbal || motor) {
            lines.push(`GCS E${eye}V${verbal}M${motor}`)
        }

        const { sys, dia } = item.vital_sign.bp
        if (sys || dia) {
            lines.push(`TD ${sys}/${dia} mmHg`)
        }

        if (item.vital_sign.pr) lines.push(`N ${item.vital_sign.pr} x/menit`)
        if (item.vital_sign.temp) lines.push(`S ${item.vital_sign.temp} °C`)
        if (item.vital_sign.rr) lines.push(`RR ${item.vital_sign.rr} x/menit`)
        if (item.vital_sign.spo2) lines.push(`SpO2 ${item.vital_sign.spo2}%`)

        return lines.join('\n')
    }

    private format_konsul_report(
        visit: SatinDashUIVisit,
        anamnesis_list: AnamnesisItem[],
        px_umum_list: PxUmumItem[],
        px_fisik_list: PxFisikItem[],
        planning_list: PlanningItem[]
    ): string {
        let age = '?? tahun'
        const age_obj = get_age_metrics(visit.patient.demographic.birthdate)
        if (age_obj) {
            if (age_obj.y < 18) {
                age = `${age_obj.y} tahun, ${age_obj.m} bulan, ${age_obj.d} hari`
            } else {
                age = `${age_obj.y} tahun`
            }
        }

        const prefix = get_patient_prefix(
            age_obj?.y ?? 100,
            visit.patient.demographic.gender_id,
            visit.patient.demographic.marriage_status
        )
        const formatted_patient_name = `${prefix} ${format_medical_name(visit.patient.name)}`

        let subjective_section = ''
        if (anamnesis_list.length > 0) {
            const latest_anamnesis = anamnesis_list[0]
            const plain_anamnesis = strip_html(latest_anamnesis.desc)
            if (plain_anamnesis) {
                subjective_section = `\n\nS:\n${plain_anamnesis}`
            }
        }

        const obj_parts: string[] = []
        if (px_umum_list.length > 0) {
            const latest_px_umum = px_umum_list[0]
            const formatted_umum = this.format_px_umum_cell(latest_px_umum)
            if (formatted_umum) {
                obj_parts.push(formatted_umum)
            }
        }

        if (px_fisik_list.length > 0) {
            const latest_px_fisik = px_fisik_list[0]
            const plain_fisik = strip_html(latest_px_fisik.desc)
            if (plain_fisik) {
                obj_parts.push(plain_fisik)
            }
        }

        let objective_section = ''
        if (obj_parts.length > 0) {
            objective_section = `\n\nO:\n${obj_parts.join('\n\n')}`
        }

        let planning_section = ''
        if (planning_list.length > 0) {
            const latest_planning = planning_list[0]
            const plain_planning = strip_html(latest_planning.desc)
            if (plain_planning) {
                planning_section = `\n\nP:\n${plain_planning}`
            }
        }

        let patient_ward = 'baru IGD'
        const is_er_ward = /^\s*\bRD\b/i.test(visit.room.name)
        if (!is_er_ward) patient_ward = `${visit.room.name.replace('Bangsal ', '')}/${visit.room.bed_name}`

        return `Assalamu'alaikum wr. wb. Dokter, mohon izin melaporkan pasien ${patient_ward}.

*${formatted_patient_name}/${age}/${visit.patient.mrn}/${visit.patient.insurance.type}*${subjective_section}${objective_section}${planning_section}

Hasil ekg, lab, radiologi terlampir. Mohon advice selanjutnya dokter, terima kasih 🙏🏻`
    }

    private update_output_text(): void {
        const selected_visit_id = this.select_el.value
        if (!selected_visit_id) {
            this.output_textarea.value = ''
            return
        }

        const visit = this.parent.data.extracted_visits.get(selected_visit_id)
        if (visit) {
            const cache = this.exam_cache.get(selected_visit_id)
            const anamnesis_list = cache ? cache.anamnesis : []
            const px_umum_list = cache ? cache.px_umum : []
            const px_fisik_list = cache ? cache.px_fisik : []
            const planning_list = cache ? cache.planning : []
            this.output_textarea.value = this.format_konsul_report(
                visit,
                anamnesis_list,
                px_umum_list,
                px_fisik_list,
                planning_list
            )
        } else {
            this.output_textarea.value = ''
        }
    }

    private update_last_updated_text(timestamp: number): void {
        const diff_ms = Date.now() - timestamp
        const diff_min = Math.floor(diff_ms / 60000)
        const diff_hr = Math.floor(diff_min / 60)

        let time_str = ''
        if (diff_min < 1) {
            time_str = 'baru saja'
        } else if (diff_min < 60) {
            time_str = `${diff_min} menit yll`
        } else if (diff_hr < 24) {
            time_str = `${diff_hr} jam yll`
        } else {
            time_str = 'sudah lama'
        }

        this.last_updated_el.textContent = `Terakhir diperbarui ${time_str}`
    }

    private async handle_load_data(visit_id: string): Promise<void> {
        const visit = this.parent.data.extracted_visits.get(visit_id)
        const registration_id = visit?.registration?.id

        this.select_el.disabled = true
        this.load_btn.disabled = true
        this.load_btn.innerText = 'Memuat data...'

        try {
            const [anamnesis_result, umum_result, fisik_result, planning_result] =
                await Promise.all([
                    registration_id
                        ? this.parent.engine.api.api_request<any[]>({
                            base_path: 'medicalrecord/anamnesis',
                            payload: new RequestPayloadBuilder({
                                KUNJUNGAN: visit_id,
                                PENDAFTARAN: registration_id,
                                page: 1,
                                start: 0,
                                limit: 25,
                            }),
                        })
                        : Promise.resolve(null),

                    this.parent.engine.api.api_request<any[]>({
                        base_path: 'medicalrecord/pemeriksaan/umum/tandavital',
                        payload: new RequestPayloadBuilder({
                            KUNJUNGAN: visit_id,
                            page: 1,
                            start: 0,
                            limit: 25,
                        }),
                    }),

                    registration_id
                        ? this.parent.engine.api.api_request<any[]>({
                            base_path: 'medicalrecord/pemeriksaan/fisik',
                            payload: new RequestPayloadBuilder({
                                KUNJUNGAN: visit_id,
                                PENDAFTARAN: registration_id,
                                page: 1,
                                start: 0,
                                limit: 25,
                            }),
                        })
                        : Promise.resolve(null),

                    this.parent.engine.api.api_request<any[]>({
                        base_path: 'medicalrecord/perencanaan/rencanaterapi',
                        payload: new RequestPayloadBuilder({
                            KUNJUNGAN: visit_id,
                            page: 1,
                            start: 0,
                            limit: 25,
                        }),
                    }),
                ])

            let anamnesis_list: AnamnesisItem[] = []
            if (anamnesis_result && anamnesis_result.data && Array.isArray(anamnesis_result.data)) {
                anamnesis_list = anamnesis_result.data.map((raw: any) => ({
                    id: String(raw.ID || ''),
                    date: raw.TANGGAL || '',
                    desc: raw.DESKRIPSI || '',
                }))
                anamnesis_list.sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                )
            }

            let px_umum_list: PxUmumItem[] = []
            if (umum_result && umum_result.data && Array.isArray(umum_result.data)) {
                px_umum_list = umum_result.data.map((raw: any) => ({
                    id: String(raw.ID || ''),
                    date: raw.TANGGAL || '',
                    ku: raw.KEADAAN_UMUM || '',
                    loc: raw.REFERENSI?.TINGKAT_KESADARAN?.DESKRIPSI || '',
                    gcs: {
                        eye: format_num_val(raw.EYE),
                        verbal: format_num_val(raw.VERBAL),
                        motor: format_num_val(raw.MOTORIK),
                    },
                    vital_sign: {
                        bp: {
                            sys: format_num_val(raw.SISTOLIK),
                            dia: format_num_val(raw.DISTOLIK),
                        },
                        pr: format_num_val(raw.FREKUENSI_NADI),
                        rr: format_num_val(raw.FREKUENSI_NAFAS),
                        temp: format_temp_val(raw.SUHU),
                        spo2: format_num_val(raw.SATURASI_O2),
                    },
                }))
                px_umum_list.sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                )
            }

            let px_fisik_list: PxFisikItem[] = []
            if (fisik_result && fisik_result.data && Array.isArray(fisik_result.data)) {
                px_fisik_list = fisik_result.data.map((raw: any) => ({
                    id: String(raw.ID || ''),
                    date: raw.TANGGAL || '',
                    desc: raw.DESKRIPSI || '',
                }))
                px_fisik_list.sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                )
            }

            let planning_list: PlanningItem[] = []
            if (planning_result && planning_result.data && Array.isArray(planning_result.data)) {
                planning_list = planning_result.data.map((raw: any) => ({
                    id: String(raw.ID || ''),
                    date: raw.TANGGAL || '',
                    desc: raw.DESKRIPSI || '',
                }))
                planning_list.sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                )
            }

            const now = Date.now()
            this.exam_cache.set(visit_id, {
                timestamp: now,
                anamnesis: anamnesis_list,
                px_umum: px_umum_list,
                px_fisik: px_fisik_list,
                planning: planning_list,
            })

            this.update_last_updated_text(now)
            this.update_output_text()
        } catch (err) {
            Log.error('Failed to fetch patient exam data:', err)
        } finally {
            this.select_el.disabled = false
            this.load_btn.disabled = false
            this.load_btn.innerText = 'Muat Data'
        }
    }

    public on_inject_update(): void {
        const visit_ids = this.ws.visit_ids || []
        const count = visit_ids.length

        if (this.konsul_title_el) {
            this.konsul_title_el.textContent = `Konsul Pasien (${count} pasien)`
        }

        if (this.select_el) {
            const current_val = this.select_el.value
            this.select_el.innerHTML = ''

            if (visit_ids.length === 0) {
                const empty_opt = create_element('option', {
                    text: '-- Tidak Ada Pasien --',
                    attrs: { value: '' },
                })
                this.select_el.append(empty_opt)
                this.load_btn.disabled = true
                this.last_updated_el.textContent = 'Terakhir diperbarui -'
            } else {
                const default_opt = create_element('option', {
                    text: '-- Pilih Pasien --',
                    attrs: { value: '' },
                })
                this.select_el.append(default_opt)

                visit_ids.forEach((id) => {
                    const visit = this.parent.data.extracted_visits.get(id)
                    const label_text = visit
                        ? `${format_medical_name(visit.patient.name)} (${visit.patient.mrn})`
                        : `${this.ws.name} (${id})`

                    const opt = create_element('option', {
                        text: label_text,
                        attrs: { value: id },
                    }) as HTMLOptionElement

                    if (id === current_val) {
                        opt.selected = true
                    }
                    this.select_el.append(opt)
                })

                this.load_btn.disabled = !this.select_el.value
            }

            const selected_visit_id = this.select_el.value
            if (selected_visit_id) {
                const cache = this.exam_cache.get(selected_visit_id)
                if (cache) {
                    this.update_last_updated_text(cache.timestamp)
                } else {
                    this.last_updated_el.textContent = 'Terakhir diperbarui -'
                }
            }

            this.update_output_text()
        }
    }

    open_actions_modal(): ModalInstance | null {
        const parent_el = document.body

        const min_xgap = Math.max(10, Math.min(50, window.innerWidth * 0.05))
        const min_ygap = Math.max(10, Math.min(50, window.innerHeight * 0.05))
        const w = Math.min(window.innerWidth - min_xgap * 2, ActionsModalController.MODAL.WIDTH)
        const h = Math.min(window.innerHeight - min_ygap * 2, ActionsModalController.MODAL.HEIGHT)
        const x = Math.max(0, (window.innerWidth - w) / 2)
        const y = Math.max(0, (window.innerHeight - h) / 2)

        const { instance, is_existing } = ModalUI.fire({
            id: ActionsModalController.MODAL.ID + this.ws.id,
            title: `Aksi (${this.ws.name})`,
            content: this.container_el,
            parent_el: parent_el,
            options: {
                top: `${y}px`,
                left: `${x}px`,
                width: `${w}px`,
                height: `${h}px`,
            },
        })

        if (is_existing || !instance) return instance

        instance.body.style.padding = '0'
        instance.body.style.height = 'calc(100% - 38px)'
        return instance
    }

    create_actions_btn(): HTMLButtonElement {
        const actions_btn = create_element('button', {
            classes: 'btn-actions',
            text: 'Aksi',
        })

        actions_btn.addEventListener('click', (e: Event) => {
            e.stopPropagation()
            this.open_actions_modal()
        })

        return actions_btn
    }
}
