import { create_element } from '../../../utils/dom'
import { Log } from '../../../utils/logger'
import { ResultsMenuRenderer } from './main'
import { ResultsMenuRadioResult } from './radio'

export class ResultsMenuTextRadioRenderer {
    private selected_dates: Set<string> = new Set()
    private hide_findings: boolean = true
    public on_change?: () => void

    private el: {
        container: HTMLDivElement | null
        textarea: HTMLTextAreaElement | null
        btn_copy: HTMLButtonElement | null
        btn_reset: HTMLButtonElement | null
        btn_clear: HTMLButtonElement | null
        btn_hide_findings: HTMLButtonElement | null
        dates_container: HTMLDivElement | null
    } = {
            container: null,
            textarea: null,
            btn_copy: null,
            btn_reset: null,
            btn_clear: null,
            btn_hide_findings: null,
            dates_container: null,
        }

    public static classes = {
        container: 'sn-results-menu-text-container',
        toolbar: 'sn-results-menu-text-toolbar',
        toolbar_row: 'sn-results-menu-text-toolbar-row',
        toolbar_group: 'sn-results-menu-text-toolbar-group',
        date_filter_row: 'sn-results-menu-text-date-filter-row',
        date_filter_label: 'sn-results-menu-text-date-filter-label',
        date_filter_grid: 'sn-results-menu-text-date-filter-grid-wrapper',
        date_filter_container: 'sn-results-menu-text-date-filter-container',
        btn_toggle: 'sn-results-menu-text-btn-toggle',
        btn_toggle_active: 'sn-results-menu-text-btn-toggle-active',
        btn_macro: 'sn-results-menu-text-btn-macro',
        btn_action: 'sn-results-menu-text-btn-action',
        textarea_wrapper: 'sn-results-menu-text-textarea-wrapper',
        textarea_el: 'sn-results-menu-text-textarea-el',
    }

    constructor(public main_renderer: ResultsMenuRenderer) { }

    build_dom_elements(target_el: HTMLDivElement) {
        this.el.btn_hide_findings = create_element('button', {
            classes: `${ResultsMenuTextRadioRenderer.classes.btn_toggle} ${ResultsMenuTextRadioRenderer.classes.btn_toggle_active}`,
            text: 'Sembunyikan Hasil',
        })

        this.el.btn_copy = create_element('button', {
            classes: ResultsMenuTextRadioRenderer.classes.btn_action,
            text: 'SALIN TEKS',
        })

        const toolbar_row = create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.toolbar_row }, [
            create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.toolbar_group }, [
                this.el.btn_hide_findings,
            ]),
            create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.toolbar_group }, [
                this.el.btn_copy,
            ]),
        ])

        this.el.dates_container = create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.date_filter_container })

        this.el.btn_clear = create_element('button', {
            classes: `${ResultsMenuTextRadioRenderer.classes.btn_macro} reset`,
            text: 'Hapus Semua Pilihan',
        })

        this.el.btn_reset = create_element('button', {
            classes: ResultsMenuTextRadioRenderer.classes.btn_macro,
            text: 'Reset Filter',
        })

        const date_filter_row = create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.date_filter_row }, [
            create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.date_filter_label, text: 'Filter Tanggal:' }),
            create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.date_filter_grid }, [
                this.el.dates_container,
                create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.toolbar_group }, [
                    this.el.btn_clear,
                    this.el.btn_reset,
                ]),
            ]),
        ])

        const toolbar = create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.toolbar }, [
            toolbar_row,
            date_filter_row,
        ])

        this.el.textarea = create_element('textarea', {
            classes: ResultsMenuTextRadioRenderer.classes.textarea_el,
            attrs: { readonly: true },
        })

        const textarea_wrapper = create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.textarea_wrapper }, [
            this.el.textarea,
        ])

        this.el.container = create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.container }, [
            toolbar,
            textarea_wrapper,
        ])

        target_el.append(this.el.container)

        this.bind_events()
    }

    private bind_events() {
        this.el.btn_copy?.addEventListener('click', () => {
            if (this.el.textarea && this.el.textarea.value) {
                navigator.clipboard.writeText(this.el.textarea.value)
                    .catch(err => Log.error('Could not copy radio text: ', err))
            }
        })

        this.el.btn_hide_findings?.addEventListener('click', () => {
            this.hide_findings = !this.hide_findings
            if (this.hide_findings) {
                this.el.btn_hide_findings?.classList.add(ResultsMenuTextRadioRenderer.classes.btn_toggle_active)
            } else {
                this.el.btn_hide_findings?.classList.remove(ResultsMenuTextRadioRenderer.classes.btn_toggle_active)
            }
            this.update_text()
        })

        this.el.btn_clear?.addEventListener('click', () => {
            this.selected_dates.clear()
            this.render_date_buttons()
            this.update_text()
        })

        this.el.btn_reset?.addEventListener('click', () => {
            this.reset_dates_to_default()
            this.render_date_buttons()
            this.update_text()
        })
    }

    private reset_dates_to_default() {
        const data = this.main_renderer.radio_renderer.get_data()
        this.selected_dates.clear()
        if (data.length > 0) {
            this.selected_dates.add(data[0].date)
        }
    }

    public sync_text_output() {
        this.reset_dates_to_default()
        this.render_date_buttons()
        this.update_text()
    }

    private render_date_buttons() {
        if (!this.el.dates_container) return
        this.el.dates_container.innerHTML = ''

        const data = this.main_renderer.radio_renderer.get_data()
        const unique_dates = Array.from(new Set(data.map(d => d.date)))

        unique_dates.forEach(date_str => {
            const date_obj = new Date(date_str)
            const formatted_date = !isNaN(date_obj.getTime())
                ? `${String(date_obj.getDate()).padStart(2, '0')}/${String(date_obj.getMonth() + 1).padStart(2, '0')}/${date_obj.getFullYear()}`
                : date_str

            const is_selected = this.selected_dates.has(date_str)
            const btn_cls = `${ResultsMenuTextRadioRenderer.classes.btn_toggle} ${is_selected ? ResultsMenuTextRadioRenderer.classes.btn_toggle_active : ''}`

            const btn = create_element('button', {
                classes: btn_cls,
                text: formatted_date,
            })

            btn.addEventListener('click', () => {
                if (this.selected_dates.has(date_str)) {
                    this.selected_dates.delete(date_str)
                } else {
                    this.selected_dates.add(date_str)
                }
                this.render_date_buttons()
                this.update_text()
            })

            this.el.dates_container!.append(btn)
        })
    }

    private update_text() {
        if (!this.el.textarea) return

        const all_data = this.main_renderer.radio_renderer.get_data()
        const filtered = all_data.filter(item => this.selected_dates.has(item.date))

        if (filtered.length === 0) {
            this.el.textarea.value = ''
            if (this.on_change) this.on_change()
            return
        }

        const blocks = filtered.map(item => {
            const date_obj = new Date(item.date)
            const formatted_date = !isNaN(date_obj.getTime())
                ? `${String(date_obj.getDate()).padStart(2, '0')}/${String(date_obj.getMonth() + 1).padStart(2, '0')}/${date_obj.getFullYear()}`
                : item.date

            const title = `${item.order.name} ${formatted_date}`
            const impression = item.impression || '-'

            if (!this.hide_findings && item.findings) {
                return `${title}\n${impression}\n\nHasil:\n${item.findings}`
            }

            return `${title}\n${impression}`
        })

        this.el.textarea.value = blocks.join('\n\n').trim()

        if (this.on_change) {
            this.on_change()
        }
    }

    public get_text(): string {
        return this.el.textarea?.value || ''
    }
}
