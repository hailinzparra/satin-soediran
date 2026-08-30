import { SatinApiContext } from '../../../api/context'
import { RequestPayloadBuilder } from '../../../utils/api'
import { create_element } from '../../../utils/dom'
import { Log } from '../../../utils/logger'
import { format_date_variants } from '../ui'

const c = create_element

export interface RadioResultItem {
    id?: string
    findings: string
    impression: string
    date: string
    order_name: string
}

export class ResultsTabController {
    public pane_el: HTMLElement
    private is_loaded = false
    private is_loading = false

    private px_count = 0
    private lab_count = 0
    private radio_count = 0

    private radio_data: RadioResultItem[] = []
    private expanded_card_id: string | null = null

    private active_sub_tab = 'radio' // Default to radio

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

        // 2. Sub Tabs Nav (Px, Lab, Radio spanning equally 33% each)
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

    private async fetch_px_data() {
        this.px_count = 0
        const pane = this.el.sub_panes.px
        pane.innerHTML = ''
        pane.append(c('div', { classes: 'details-state', text: 'Tidak ada data pemeriksaan (Px).' }))
    }

    private async fetch_lab_data() {
        this.lab_count = 0
        const pane = this.el.sub_panes.lab
        pane.innerHTML = ''
        pane.append(c('div', { classes: 'details-state', text: 'Tidak ada data laboratorium.' }))
    }

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
                id: raw.ID,
                findings: this.clean_text(raw.HASIL || '-'),
                impression: this.clean_text(raw.KESAN || '-'),
                date: raw.TANGGAL || '',
                order_name: raw.REFERENSI?.TINDAKAN_MEDIS?.TINDAKAN_DESKRIPSI || 'Prosedur Radiologi',
            }))

            // Sort by most recent date on top
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
            const card_id = item.id || `rad-${index}`
            list_container.append(this.render_radio_card(item, card_id))
        })
        pane.append(list_container)
    }

    private render_radio_card(item: RadioResultItem, card_id: string): HTMLElement {
        const is_expanded = this.expanded_card_id === card_id
        const date_text = item.date ? format_date_variants(item.date).longtime : '--'

        // Card Header (Matches Recipe card structure & styling)
        const header_el = c('div', { classes: 'recipe-card-header' }, [
            c('div', { classes: 'recipe-title' }, [
                c('span', { text: item.order_name }),
                c('span', { classes: 'text-xs text-slate-400', text: is_expanded ? '▲' : '▼' })
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

        // Expandable Table Content (Impression and Findings)
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

        return c('div', { classes: 'recipe-card' }, children)
    }

    private clean_text(str: string): string {
        if (!str) return ''
        return str
            .replace(/\r\n/g, '\n')
            .replace(/\n\s*\n+/g, '\n')
            .replace(/[ \t]+/g, ' ')
            .trim()
    }
}
