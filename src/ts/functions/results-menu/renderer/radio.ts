import { RequestPayloadBuilder } from '../../../utils/api'
import { create_element } from '../../../utils/dom'
import { Log } from '../../../utils/logger'
import { ResultsMenuRenderer } from './main'

export interface ResultsMenuRadioResult {
    findings: string
    impression: string
    date: string
    order: {
        name: string
    }
}

export class ResultsMenuRadioRenderer {
    private radio_data: ResultsMenuRadioResult[] = []
    private selected_index: number = 0

    private el: {
        container: HTMLDivElement | null
        left_pane: HTMLDivElement | null
        right_pane: HTMLDivElement | null
        textarea_impression: HTMLTextAreaElement | null
        textarea_findings: HTMLTextAreaElement | null
    } = {
            container: null,
            left_pane: null,
            right_pane: null,
            textarea_impression: null,
            textarea_findings: null,
        }

    public static classes = {
        container: 'sn-results-menu-radio-container',
        left_pane: 'sn-results-menu-radio-left-pane',
        right_pane: 'sn-results-menu-radio-right-pane',
        item_card: 'sn-results-menu-radio-item-card',
        item_card_active: 'sn-results-menu-radio-item-card-active',
        section_label: 'sn-results-menu-radio-section-label',
        textarea: 'sn-results-menu-radio-textarea',
    }

    constructor(public main_renderer: ResultsMenuRenderer) { }

    build_dom_elements(target_el: HTMLDivElement) {
        this.el.left_pane = create_element('div', {
            classes: ResultsMenuRadioRenderer.classes.left_pane,
        })

        this.el.textarea_impression = create_element('textarea', {
            classes: ResultsMenuRadioRenderer.classes.textarea,
            attrs: { readonly: true },
            styles: {
                height: '140px',
                marginBottom: '12px',
            },
        })

        this.el.textarea_findings = create_element('textarea', {
            classes: ResultsMenuRadioRenderer.classes.textarea,
            attrs: { readonly: true },
            styles: {
                height: '280px',
            },
        })

        this.el.right_pane = create_element('div', {
            classes: ResultsMenuRadioRenderer.classes.right_pane,
        }, [
            create_element('div', { classes: ResultsMenuRadioRenderer.classes.section_label, text: 'Kesan:' }),
            this.el.textarea_impression,
            create_element('div', { classes: ResultsMenuRadioRenderer.classes.section_label, text: 'Hasil:' }),
            this.el.textarea_findings,
        ])

        this.el.container = create_element('div', {
            classes: ResultsMenuRadioRenderer.classes.container,
        }, [
            this.el.left_pane,
            this.el.right_pane,
        ])

        target_el.append(this.el.container)
    }

    private clean_text(str: string): string {
        if (!str) return ''
        return str
            .replace(/\r\n/g, '\n')
            .replace(/\n\s*\n+/g, '\n')
            .replace(/[ \t]+/g, ' ')
            .trim()
    }

    async start(): Promise<void> {
        const ctx = this.main_renderer.parent.engine.api
        const mrn = this.main_renderer.mrn

        if (!mrn) return

        try {
            const result = await ctx.api_request<any[]>({
                base_path: 'layanan/hasilrad',
                payload: new RequestPayloadBuilder({
                    NORM: mrn,
                    STATUS: 2,
                    page: 1,
                    start: 0,
                    limit: 25,
                }),
            })

            if (!result || !result.data || result.total === 0 || result.data.length === 0) {
                this.radio_data = []
                this.render_ui()
                return
            }

            this.radio_data = result.data.map((raw: any) => ({
                findings: this.clean_text(raw.HASIL || ''),
                impression: this.clean_text(raw.KESAN || ''),
                date: raw.TANGGAL || '',
                order: {
                    name: raw.REFERENSI?.TINDAKAN_MEDIS?.TINDAKAN_DESKRIPSI || 'Prosedur Radiologi',
                },
            }))

            this.radio_data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

            this.selected_index = 0
            this.render_ui()
            this.main_renderer.sync_tab_text()
        } catch (err) {
            Log.error('Failed to load radiology data:', err)
        }
    }

    public get_data(): ResultsMenuRadioResult[] {
        return this.radio_data
    }

    private render_ui() {
        if (!this.el.left_pane || !this.el.right_pane) return

        this.el.left_pane.innerHTML = ''

        if (this.radio_data.length === 0) {
            this.el.left_pane.append(create_element('div', { text: 'Tidak ada data radiologi.', styles: { padding: '8px', color: '#666', fontSize: '11px' } }))
            if (this.el.textarea_impression) this.el.textarea_impression.value = ''
            if (this.el.textarea_findings) this.el.textarea_findings.value = ''
            return
        }

        this.radio_data.forEach((item, idx) => {
            const date_obj = new Date(item.date)
            const formatted_date = !isNaN(date_obj.getTime())
                ? `${String(date_obj.getDate()).padStart(2, '0')}/${String(date_obj.getMonth() + 1).padStart(2, '0')}/${date_obj.getFullYear()}`
                : item.date

            const card = create_element('div', {
                classes: `${ResultsMenuRadioRenderer.classes.item_card} ${idx === this.selected_index ? ResultsMenuRadioRenderer.classes.item_card_active : ''}`,
            }, [
                create_element('div', { classes: 'item-title', text: item.order.name }),
                create_element('div', { classes: 'item-date', text: formatted_date }),
            ])

            card.addEventListener('click', () => {
                this.selected_index = idx
                this.render_ui()
            })

            this.el.left_pane!.append(card)
        })

        const active_item = this.radio_data[this.selected_index]
        if (active_item) {
            if (this.el.textarea_impression) this.el.textarea_impression.value = active_item.impression
            if (this.el.textarea_findings) this.el.textarea_findings.value = active_item.findings
        }
    }
}
