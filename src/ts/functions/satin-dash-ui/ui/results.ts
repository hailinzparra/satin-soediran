import { SatinApiContext } from '../../../api/context'
import { RequestPayloadBuilder } from '../../../utils/api'
import { create_element } from '../../../utils/dom'
import { get_fuzzy_time_yll } from '../../../utils/formatter'
import { Log } from '../../../utils/logger'
import { format_date_variants } from '../ui'

const c = create_element

// ================= INTERFACES =================

export interface PxUmumItem {
    id: string
    date: string
    ku: string       // Keadaan Umum
    loc: string      // Tingkat Kesadaran
    gcs: {
        eye: string
        verbal: string
        motor: string
    }
    vital_sign: {
        bp: {
            sys: string
            dia: string
        }
        pr: string   // Frekuensi Nadi
        rr: string   // Frekuensi Nafas
        temp: string // Suhu
        spo2: string // Saturasi O2
    }
}

export interface PxFisikItem {
    id: string
    date: string
    desc: string     // HTML description string
}

export interface LabOrderItem {
    id: string
    date: string
    procedure_name: string
    is_loaded?: boolean
    is_loading?: boolean
    error?: string | null
    results?: LabDetailItem[]
}

export interface LabDetailItem {
    id: string
    param_name: string
    result: string
    unit: string
    normal_value: string
}

export interface RadioResultItem {
    id?: string
    findings: string
    impression: string
    date: string
    order_name: string
}

// ================= HELPER FUNCTIONS =================

function format_num_val(val: any): string {
    if (val === null || val === undefined || val === '') return ''
    const num = Number(val)
    return isNaN(num) ? String(val) : String(num)
}

// Converts "36.50" -> "36.5", "37.75" -> "37.75", "36.00" -> "36"
function format_temp_val(val: any): string {
    if (val === null || val === undefined || val === '') return ''
    const num = Number(val)
    if (isNaN(num)) return String(val)
    return String(Number(num.toFixed(2))) // Drops unnecessary trailing zeros automatically
}

// ================= CONTROLLER CLASS =================

export class ResultsTabController {
    public pane_el: HTMLElement
    private is_loaded = false
    private is_loading = false

    private px_count = 0
    private lab_count = 0
    private radio_count = 0

    private px_umum_list: PxUmumItem[] = []
    private px_fisik_list: PxFisikItem[] = []
    private lab_orders: LabOrderItem[] = []
    private radio_data: RadioResultItem[] = []

    private expanded_card_id: string | null = null
    private active_sub_tab = 'radio' // Default active sub-tab

    private el: {
        total_title: HTMLElement | null
        refresh_btn: HTMLElement | null
        sub_tab_btns: Record<string, HTMLElement>
        sub_tab_badges: Record<string, HTMLElement>
        sub_panes: Record<string, HTMLElement>
    } = {
            total_title: null,
            refresh_btn: null,
            sub_tab_btns: {},
            sub_tab_badges: {},
            sub_panes: {},
        }

    constructor(
        private mrn: string,
        private visit_id: string,
        private registration_id: string,
        private api_client: SatinApiContext,
        private on_total_loaded?: (total: number) => void
    ) {
        this.pane_el = c('div', { classes: 'tab-pane dash-results-tab-pane hidden' })
        this.build_base_ui()
    }

    private build_base_ui() {
        // 1. Header (No horizontal break, no button icon)
        this.el.total_title = c('span', { classes: 'pane-subheading text-sky', text: '0 Hasil' })

        this.el.refresh_btn = c('button', { classes: 'btn-refresh-pane' }, [
            c('span', { text: 'Refresh' })
        ])
        this.el.refresh_btn.addEventListener('click', (e) => {
            e.stopPropagation()
            this.refresh_all()
        })

        const header = c('div', { classes: 'pane-header flex justify-between items-center mb-4' }, [
            this.el.total_title,
            this.el.refresh_btn
        ])

        // 2. Equal 33% Sub Tab Navigation (Px, Lab, Radio)
        const sub_tab_configs = [
            { key: 'px', label: 'Px' },
            { key: 'lab', label: 'Lab' },
            { key: 'radio', label: 'Radio' },
        ]

        const sub_tab_nav = c('div', { classes: 'dash-results-sub-tabs' })

        sub_tab_configs.forEach(({ key, label }) => {
            const badge = c('span', { classes: 'sub-tab-badge', text: '0' })
            this.el.sub_tab_badges[key] = badge

            const btn = c('button', {
                classes: `sub-tab-btn ${key === this.active_sub_tab ? 'active' : ''}`
            }, [
                c('span', { text: label }),
                badge
            ])

            btn.addEventListener('click', () => this.switch_sub_tab(key))
            this.el.sub_tab_btns[key] = btn
            sub_tab_nav.append(btn)
        })

        // 3. Sub Content Panes
        sub_tab_configs.forEach(({ key }) => {
            const is_active = key === this.active_sub_tab
            const pane = c('div', { classes: `sub-pane ${is_active ? '' : 'hidden'}` })
            this.el.sub_panes[key] = pane
        })

        const content_area = c('div', { classes: 'dash-results-content' }, [
            this.el.sub_panes.px,
            this.el.sub_panes.lab,
            this.el.sub_panes.radio,
        ])

        this.pane_el.append(header, sub_tab_nav, content_area)
    }

    public switch_sub_tab(target_key: string) {
        this.active_sub_tab = target_key
        Object.keys(this.el.sub_panes).forEach((key) => {
            if (key === target_key) {
                this.el.sub_panes[key].classList.remove('hidden')
                this.el.sub_tab_btns[key]?.classList.add('active')
            } else {
                this.el.sub_panes[key].classList.add('hidden')
                this.el.sub_tab_btns[key]?.classList.remove('active')
            }
        })
    }

    public async activate() {
        if (this.is_loaded || this.is_loading) return
        await this.refresh_all()
    }

    public async refresh_all() {
        if (this.is_loading) return
        this.is_loading = true

        Object.values(this.el.sub_panes).forEach(pane => {
            pane.innerHTML = ''
            pane.append(c('div', { classes: 'details-state', text: 'Memuat data...' }))
        })

        try {
            await Promise.all([
                this.fetch_px_data(),
                this.fetch_lab_data(),
                this.fetch_radio_data()
            ])

            this.is_loaded = true
            this.update_totals_ui()
        } catch (err) {
            Log.error('Failed to load Results data:', err)
        } finally {
            this.is_loading = false
        }
    }

    private update_totals_ui() {
        const total = this.px_count + this.lab_count + this.radio_count
        if (this.el.total_title) {
            this.el.total_title.innerText = `${total} Hasil`
        }
        if (this.el.sub_tab_badges.px) this.el.sub_tab_badges.px.innerText = `${this.px_count}`
        if (this.el.sub_tab_badges.lab) this.el.sub_tab_badges.lab.innerText = `${this.lab_count}`
        if (this.el.sub_tab_badges.radio) this.el.sub_tab_badges.radio.innerText = `${this.radio_count}`

        this.on_total_loaded?.(total)
    }

    // ================= 1. PX METHODS (UMUM & FISIK) =================

    private async fetch_px_data() {
        const pane = this.el.sub_panes.px
        pane.innerHTML = ''

        if (!this.visit_id) {
            this.px_count = 0
            pane.append(c('div', { classes: 'details-state', text: 'Visit ID tidak ditemukan.' }))
            return
        }

        try {
            await Promise.all([
                this.fetch_px_umum(),
                this.fetch_px_fisik()
            ])

            this.px_count = this.px_umum_list.length + this.px_fisik_list.length
            this.render_px_list()
        } catch (err) {
            Log.error('Failed to load Px data:', err)
            this.px_count = 0
            pane.append(c('div', { classes: 'details-state', text: 'Gagal memuat data pemeriksaan.' }))
        }
    }

    private async fetch_px_umum() {
        try {
            const result = await this.api_client.api_request<any[]>({
                base_path: 'medicalrecord/pemeriksaan/umum/tandavital',
                payload: new RequestPayloadBuilder({
                    KUNJUNGAN: this.visit_id,
                    page: 1,
                    start: 0,
                    limit: 25,
                }),
            })

            if (!result || !result.data || result.data.length === 0) {
                this.px_umum_list = []
                return
            }

            this.px_umum_list = result.data.map((raw: any) => ({
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

            this.px_umum_list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        } catch (err) {
            Log.error('Failed to fetch Px Umum:', err)
            this.px_umum_list = []
        }
    }

    private async fetch_px_fisik() {
        if (!this.registration_id) {
            this.px_fisik_list = []
            return
        }

        try {
            const result = await this.api_client.api_request<any[]>({
                base_path: 'medicalrecord/pemeriksaan/fisik',
                payload: new RequestPayloadBuilder({
                    KUNJUNGAN: this.visit_id,
                    PENDAFTARAN: this.registration_id,
                    page: 1,
                    start: 0,
                    limit: 25,
                }),
            })

            if (!result || !result.data || result.data.length === 0) {
                this.px_fisik_list = []
                return
            }

            this.px_fisik_list = result.data.map((raw: any) => ({
                id: String(raw.ID || ''),
                date: raw.TANGGAL || '',
                desc: raw.DESKRIPSI || '',
            }))

            this.px_fisik_list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        } catch (err) {
            Log.error('Failed to fetch Px Fisik:', err)
            this.px_fisik_list = []
        }
    }

    private render_px_list() {
        const pane = this.el.sub_panes.px
        pane.innerHTML = ''

        const list_container = c('div', { classes: 'recipe-list' })

        // Card 1: Umum
        list_container.append(this.render_px_umum_card('px-umum-card'))

        // Card 2: Fisik
        list_container.append(this.render_px_fisik_card('px-fisik-card'))

        pane.append(list_container)
    }

    private render_px_umum_card(card_id: string): HTMLElement {
        const is_expanded = this.expanded_card_id === card_id
        const count_label = `${this.px_umum_list.length} Hasil Px Umum`

        const header_el = c('div', { classes: 'recipe-card-header' }, [
            c('div', { classes: 'recipe-title' }, [
                c('span', { text: 'Umum' }),
                c('span', { classes: 'text-xs text-slate-400', text: is_expanded ? '▲' : '▼' })
            ]),
            c('div', { classes: 'recipe-grid' }, [
                c('div', {}, [c('span', { text: count_label })]),
            ])
        ])

        header_el.addEventListener('click', () => {
            this.expanded_card_id = this.expanded_card_id === card_id ? null : card_id
            this.render_px_list()
        })

        const children: HTMLElement[] = [header_el]

        if (is_expanded) {
            let details_content: HTMLElement

            if (this.px_umum_list.length === 0) {
                details_content = c('div', { classes: 'details-state', text: 'Tidak ada data pemeriksaan umum.' })
            } else {
                const rows = this.px_umum_list.map((item) => {
                    const date_text = item.date ? format_date_variants(item.date).longtime : '--'
                    const formatted_text = this.format_px_umum_cell(item)
                    const copy_btn = this.create_copy_button(formatted_text)

                    return c('tr', {}, [
                        c('td', { classes: 'col-date', text: date_text }),
                        c('td', { classes: 'col-content', text: formatted_text }),
                        c('td', { classes: 'col-action' }, [copy_btn])
                    ])
                })

                details_content = c('table', { classes: 'details-table px-table' }, [
                    c('thead', {}, [
                        c('tr', {}, [
                            c('th', { classes: 'col-date', text: 'Tanggal' }),
                            c('th', { classes: 'col-content', text: 'Px Umum' }),
                            c('th', { classes: 'col-action', text: 'Aksi' })
                        ])
                    ]),
                    c('tbody', {}, rows)
                ])
            }

            children.push(c('div', { classes: 'recipe-card-details' }, [details_content]))
        }

        return c('div', { classes: 'recipe-card' }, children)
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

    private render_px_fisik_card(card_id: string): HTMLElement {
        const is_expanded = this.expanded_card_id === card_id
        const count_label = `${this.px_fisik_list.length} Hasil Px Fisik`

        const header_el = c('div', { classes: 'recipe-card-header' }, [
            c('div', { classes: 'recipe-title' }, [
                c('span', { text: 'Fisik' }),
                c('span', { classes: 'text-xs text-slate-400', text: is_expanded ? '▲' : '▼' })
            ]),
            c('div', { classes: 'recipe-grid' }, [
                c('div', {}, [c('span', { text: count_label })]),
            ])
        ])

        header_el.addEventListener('click', () => {
            this.expanded_card_id = this.expanded_card_id === card_id ? null : card_id
            this.render_px_list()
        })

        const children: HTMLElement[] = [header_el]

        if (is_expanded) {
            let details_content: HTMLElement

            if (this.px_fisik_list.length === 0) {
                details_content = c('div', { classes: 'details-state', text: 'Tidak ada data pemeriksaan fisik.' })
            } else {
                const rows = this.px_fisik_list.map((item) => {
                    const date_text = item.date ? format_date_variants(item.date).longtime : '--'
                    const desc_cell = c('td', { classes: 'col-content' })
                    desc_cell.innerHTML = item.desc || '--'

                    // Strip HTML tags for clean text copying
                    const plain_text = this.strip_html(item.desc)
                    const copy_btn = this.create_copy_button(plain_text)

                    return c('tr', {}, [
                        c('td', { classes: 'col-date', text: date_text }),
                        desc_cell,
                        c('td', { classes: 'col-action' }, [copy_btn])
                    ])
                })

                details_content = c('table', { classes: 'details-table px-table' }, [
                    c('thead', {}, [
                        c('tr', {}, [
                            c('th', { classes: 'col-date', text: 'Tanggal' }),
                            c('th', { classes: 'col-content', text: 'Px Fisik' }),
                            c('th', { classes: 'col-action', text: 'Aksi' })
                        ])
                    ]),
                    c('tbody', {}, rows)
                ])
            }

            children.push(c('div', { classes: 'recipe-card-details' }, [details_content]))
        }

        return c('div', { classes: 'recipe-card' }, children)
    }

    // ================= 2. LAB METHODS =================

    private async fetch_lab_data() {
        const pane = this.el.sub_panes.lab
        pane.innerHTML = ''

        if (!this.mrn) {
            this.lab_count = 0
            pane.append(c('div', { classes: 'details-state', text: 'MRN pasien tidak ditemukan.' }))
            return
        }

        try {
            const result = await this.api_client.api_request<any[]>({
                base_path: 'layanan/tindakanmedis',
                payload: new RequestPayloadBuilder({
                    NORM: this.mrn,
                    JENIS_TINDAKAN: 8,
                    STATUS: 1,
                    REFERENSI: JSON.stringify({ Kunjungan: false }),
                    page: 1,
                    start: 0,
                    limit: 100,
                }),
            })

            if (!result || !result.data || result.total === 0 || result.data.length === 0) {
                this.lab_orders = []
                this.lab_count = 0
                pane.append(c('div', { classes: 'details-state', text: 'Tidak ada data laboratorium.' }))
                return
            }

            this.lab_orders = result.data.map((raw: any) => ({
                id: String(raw.ID || ''),
                date: raw.TANGGAL || '',
                procedure_name: raw.TINDAKAN_DESKRIPSI || 'Pemeriksaan Laboratorium',
                is_loaded: false,
                is_loading: false,
                error: null,
                results: []
            }))

            // Sort primary by Date (most recent on top), secondary by Procedure Name (alphabetical A-Z)
            this.lab_orders.sort((a, b) => {
                const time_a = new Date(a.date).getTime()
                const time_b = new Date(b.date).getTime()

                // Primary criterion: Date descending
                if (time_b !== time_a) {
                    return time_b - time_a
                }

                // Secondary criterion: Procedure name ascending (A-Z) for identical dates
                return a.procedure_name.localeCompare(b.procedure_name)
            })
            this.lab_count = this.lab_orders.length

            this.render_lab_list()
        } catch (err) {
            Log.error('Failed to load lab orders:', err)
            this.lab_count = 0
            pane.append(c('div', { classes: 'details-state', text: 'Gagal memuat data laboratorium.' }))
        }
    }

    private async fetch_lab_detail(order: LabOrderItem) {
        order.is_loading = true
        order.error = null
        this.render_lab_list()

        try {
            const result = await this.api_client.api_request<any[]>({
                base_path: 'layanan/hasillab',
                payload: new RequestPayloadBuilder({
                    NORM: this.mrn,
                    STATUS: 1,
                    TINDAKAN_MEDIS: order.id,
                    REFERENSI: JSON.stringify({
                        Kunjungan: {
                            COLUMNS: ['REF'],
                            REFERENSI: false
                        }
                    }),
                    page: 1,
                    start: 0,
                    limit: 25,
                }),
            })

            const raw_details: LabDetailItem[] = (result?.data || []).map((raw: any) => ({
                id: String(raw.ID || ''),
                param_name: raw.REFERENSI?.PARAMETER_TINDAKAN?.PARAMETER || '',
                result: raw.HASIL !== null && raw.HASIL !== undefined ? String(raw.HASIL).trim() : '',
                unit: raw.SATUAN || '',
                normal_value: raw.NILAI_NORMAL || ''
            }))

            const filled: LabDetailItem[] = []
            const empty: LabDetailItem[] = []

            raw_details.forEach(item => {
                if (item.result !== '') {
                    filled.push(item)
                } else {
                    empty.push(item)
                }
            })

            const sort_alpha = (a: LabDetailItem, b: LabDetailItem) => a.param_name.localeCompare(b.param_name)
            filled.sort(sort_alpha)
            empty.sort(sort_alpha)

            order.results = [...filled, ...empty]
            order.is_loaded = true
        } catch (err) {
            Log.error(`Failed to load lab detail for action ${order.id}:`, err)
            order.error = 'Gagal memuat rincian hasil laboratorium.'
        } finally {
            order.is_loading = false
            this.render_lab_list()
        }
    }

    private render_lab_list() {
        const pane = this.el.sub_panes.lab
        pane.innerHTML = ''

        const list_container = c('div', { classes: 'recipe-list' })
        this.lab_orders.forEach((order) => {
            const card_id = `lab-${order.id}`
            list_container.append(this.render_lab_card(order, card_id))
        })
        pane.append(list_container)
    }

    private render_lab_card(order: LabOrderItem, card_id: string): HTMLElement {
        const is_expanded = this.expanded_card_id === card_id
        const date_text = order.date ? format_date_variants(order.date).longtime : '--'
        const fuzzy = get_fuzzy_time_yll(order.date)

        // Header Right Side (Fuzzy Time + Chevron)
        const header_right = c('div', { classes: 'header-controls' }, [
            fuzzy.text ? c('span', { classes: 'fuzzy-time-text', text: fuzzy.text }) : null,
            c('span', { classes: 'chevron-icon', text: is_expanded ? '▲' : '▼' })
        ].filter(Boolean) as HTMLElement[])

        // Card Header
        const header_el = c('div', { classes: 'recipe-card-header' }, [
            c('div', { classes: 'recipe-title flex justify-between items-center' }, [
                c('span', { text: order.procedure_name }),
                header_right
            ]),
            c('div', { classes: 'recipe-grid' }, [
                c('div', {}, [c('strong', { text: 'Tanggal: ' }), c('span', { text: date_text })]),
            ])
        ])

        header_el.addEventListener('click', () => {
            const is_opening = this.expanded_card_id !== card_id
            this.expanded_card_id = is_opening ? card_id : null

            if (is_opening && !order.is_loaded && !order.is_loading) {
                this.fetch_lab_detail(order)
            } else {
                this.render_lab_list()
            }
        })

        const children: HTMLElement[] = [header_el]

        if (is_expanded) {
            let details_content: HTMLElement

            if (order.is_loading) {
                details_content = c('div', { classes: 'details-state', text: 'Memuat detail hasil...' })
            } else if (order.error) {
                details_content = c('div', { classes: 'details-state text-red-500', text: order.error })
            } else if (!order.results || order.results.length === 0) {
                details_content = c('div', { classes: 'details-state', text: 'Belum ada hasil lab yang diinput.' })
            } else {
                const rows = order.results.map(res => c('tr', {}, [
                    c('td', { classes: 'drug-name', text: res.param_name }),
                    c('td', { text: res.result }),
                    c('td', { text: res.unit }),
                    c('td', { text: res.normal_value })
                ]))

                details_content = c('table', { classes: 'details-table' }, [
                    c('thead', {}, [
                        c('tr', {}, [
                            c('th', { text: 'Parameter' }),
                            c('th', { text: 'Hasil' }),
                            c('th', { text: 'Satuan' }),
                            c('th', { text: 'Nilai Normal' })
                        ])
                    ]),
                    c('tbody', {}, rows)
                ])
            }

            children.push(c('div', { classes: 'recipe-card-details' }, [details_content]))
        }

        const card_classes = `recipe-card ${fuzzy.is_fresh ? 'is-fresh' : ''}`
        return c('div', { classes: card_classes }, children)
    }

    // ================= 3. RADIOLOGY METHODS =================

    private async fetch_radio_data() {
        const pane = this.el.sub_panes.radio
        pane.innerHTML = ''

        if (!this.mrn) {
            this.radio_count = 0
            pane.append(c('div', { classes: 'details-state', text: 'MRN pasien tidak ditemukan.' }))
            return
        }

        try {
            const result = await this.api_client.api_request<any[]>({
                base_path: 'layanan/hasilrad',
                payload: new RequestPayloadBuilder({
                    NORM: this.mrn,
                    STATUS: 2,
                    page: 1,
                    start: 0,
                    limit: 25,
                }),
            })

            if (!result || !result.data || result.total === 0 || result.data.length === 0) {
                this.radio_data = []
                this.radio_count = 0
                pane.append(c('div', { classes: 'details-state', text: 'Tidak ada data radiologi.' }))
                return
            }

            this.radio_data = result.data.map((raw: any) => ({
                id: String(raw.ID || ''),
                findings: this.clean_text(raw.HASIL || ''),
                impression: this.clean_text(raw.KESAN || ''),
                date: raw.TANGGAL || '',
                order_name: raw.REFERENSI?.TINDAKAN_MEDIS?.TINDAKAN_DESKRIPSI || 'Prosedur Radiologi',
            }))

            this.radio_data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            this.radio_count = this.radio_data.length

            this.render_radio_list()
        } catch (err) {
            Log.error('Failed to load radiology data:', err)
            this.radio_count = 0
            pane.append(c('div', { classes: 'details-state', text: 'Gagal memuat data radiologi.' }))
        }
    }

    private render_radio_list() {
        const pane = this.el.sub_panes.radio
        pane.innerHTML = ''

        const list_container = c('div', { classes: 'recipe-list' })
        this.radio_data.forEach((item, index) => {
            const card_id = `rad-${item.id || index}`
            list_container.append(this.render_radio_card(item, card_id))
        })
        pane.append(list_container)
    }

    private render_radio_card(item: RadioResultItem, card_id: string): HTMLElement {
        const is_expanded = this.expanded_card_id === card_id
        const date_text = item.date ? format_date_variants(item.date).longtime : '--'
        const fuzzy = get_fuzzy_time_yll(item.date)

        // Header Right Side (Fuzzy Time + Chevron)
        const header_right = c('div', { classes: 'header-controls' }, [
            fuzzy.text ? c('span', { classes: 'fuzzy-time-text', text: fuzzy.text }) : null,
            c('span', { classes: 'chevron-icon', text: is_expanded ? '▲' : '▼' })
        ].filter(Boolean) as HTMLElement[])

        const header_el = c('div', { classes: 'recipe-card-header' }, [
            c('div', { classes: 'recipe-title flex justify-between items-center' }, [
                c('span', { text: item.order_name }),
                header_right
            ]),
            c('div', { classes: 'recipe-grid' }, [
                c('div', {}, [c('strong', { text: 'Tanggal: ' }), c('span', { text: date_text })]),
            ])
        ])

        header_el.addEventListener('click', () => {
            this.expanded_card_id = this.expanded_card_id === card_id ? null : card_id
            this.render_radio_list()
        })

        const children: HTMLElement[] = [header_el]

        if (is_expanded) {
            const table_el = c('table', { classes: 'details-table' }, [
                c('thead', {}, [
                    c('tr', {}, [
                        c('th', { text: 'Kesan' }),
                        c('th', { text: 'Hasil' })
                    ])
                ]),
                c('tbody', {}, [
                    c('tr', {}, [
                        c('td', { text: item.impression }),
                        c('td', { text: item.findings })
                    ])
                ])
            ])

            children.push(c('div', { classes: 'recipe-card-details' }, [table_el]))
        }

        const card_classes = `recipe-card ${fuzzy.is_fresh ? 'is-fresh' : ''}`
        return c('div', { classes: card_classes }, children)
    }

    private clean_text(str: string): string {
        if (!str) return ''
        return str
            .replace(/\r\n/g, '\n')
            .replace(/\n\s*\n+/g, '\n')
            .replace(/[ \t]+/g, ' ')
            .trim()
    }

    // Helper method inside ResultsTabController class
    private create_copy_button(text_to_copy: string): HTMLElement {
        let copy_timeout: number | null = null

        const copy_btn = c('button', {
            classes: 'btn-copy-action',
            text: 'COPY'
        })

        copy_btn.addEventListener('click', async (e) => {
            e.stopPropagation()

            try {
                await navigator.clipboard.writeText(text_to_copy)

                // Reset existing timer if clicked repeatedly before 2 seconds expire
                if (copy_timeout !== null) {
                    clearTimeout(copy_timeout)
                }

                copy_btn.innerText = 'COPIED!'
                copy_btn.classList.add('copied')

                copy_timeout = window.setTimeout(() => {
                    copy_btn.innerText = 'COPY'
                    copy_btn.classList.remove('copied')
                    copy_timeout = null
                }, 2000)
            } catch (err) {
                Log.error('Failed to copy text:', err)
            }
        })

        return copy_btn
    }

    // Utility method to strip HTML tags for Px Fisik copy buffer
    private strip_html(html_str: string): string {
        const tmp = document.createElement('div')
        tmp.innerHTML = html_str
        return tmp.textContent || tmp.innerText || ''
    }
}
