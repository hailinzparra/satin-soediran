import { create_element } from '../../../utils/dom'
import { Log } from '../../../utils/logger'
import { ResultsMenuRenderer } from './main'
import { ResultsMenuRadioResult } from './radio'

export class ResultsMenuTextRadioRenderer {
    private selected_dates: Set<string> = new Set()
    private hide_findings: boolean = true
    private reverse_date_order: boolean = false
    public on_change?: () => void

    private el: {
        container: HTMLDivElement | null
        textarea: HTMLTextAreaElement | null
        btn_copy: HTMLButtonElement | null
        btn_reset: HTMLButtonElement | null
        btn_clear: HTMLButtonElement | null
        btn_hide_findings: HTMLButtonElement | null
        btn_reverse_date_order: HTMLButtonElement | null
        dates_container: HTMLDivElement | null
    } = {
            container: null,
            textarea: null,
            btn_copy: null,
            btn_reset: null,
            btn_clear: null,
            btn_hide_findings: null,
            btn_reverse_date_order: null,
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

    private format_date_label(raw_date_str: string): string {
        const date_obj = new Date(raw_date_str)
        if (isNaN(date_obj.getTime())) {
            return raw_date_str
        }

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
        const day = String(date_obj.getDate()).padStart(2, '0')
        const month = months[date_obj.getMonth()]
        const year = String(date_obj.getFullYear()).slice(-2)

        const hours = date_obj.getHours()
        const minutes = date_obj.getMinutes()

        if (hours !== 0 || minutes !== 0) {
            const time_str = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
            return `${day} ${month} '${year} (${time_str})`
        }

        return `${day} ${month} '${year}`
    }

    build_dom_elements(target_el: HTMLDivElement) {
        this.el.btn_hide_findings = create_element('button', {
            classes: `${ResultsMenuTextRadioRenderer.classes.btn_toggle} ${ResultsMenuTextRadioRenderer.classes.btn_toggle_active}`,
            text: 'Sembunyikan Hasil',
        })

        this.el.btn_reverse_date_order = create_element('button', {
            classes: ResultsMenuTextRadioRenderer.classes.btn_toggle,
            text: 'Balik Urutan Tanggal',
        })

        this.el.btn_reset = create_element('button', {
            classes: `${ResultsMenuTextRadioRenderer.classes.btn_macro} reset`,
            text: 'Reset Filter',
        })

        this.el.btn_copy = create_element('button', {
            classes: ResultsMenuTextRadioRenderer.classes.btn_action,
            text: 'SALIN TEKS',
        })

        const toolbar_row = create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.toolbar_row }, [
            create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.toolbar_group }, [
                this.el.btn_hide_findings,
                this.el.btn_reverse_date_order,
                this.el.btn_reset,
            ]),
            create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.toolbar_group }, [
                this.el.btn_copy,
            ]),
        ])

        this.el.dates_container = create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.date_filter_container })

        this.el.btn_clear = create_element('button', {
            classes: ResultsMenuTextRadioRenderer.classes.btn_toggle,
            text: 'Hapus Semua Pilihan',
        })

        const date_filter_row = create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.date_filter_row }, [
            create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.date_filter_label, text: 'Filter Tanggal:' }),
            create_element('div', { classes: ResultsMenuTextRadioRenderer.classes.date_filter_grid }, [
                this.el.dates_container,
                this.el.btn_clear,
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

        this.el.btn_reverse_date_order?.addEventListener('click', () => {
            this.reverse_date_order = !this.reverse_date_order
            if (this.reverse_date_order) {
                this.el.btn_reverse_date_order?.classList.add(ResultsMenuTextRadioRenderer.classes.btn_toggle_active)
            } else {
                this.el.btn_reverse_date_order?.classList.remove(ResultsMenuTextRadioRenderer.classes.btn_toggle_active)
            }
            this.update_text()
        })

        this.el.btn_clear?.addEventListener('click', () => {
            const data = this.main_renderer.radio_renderer.get_data()
            const unique_dates = Array.from(new Set(data.map(d => d.date)))

            if (this.selected_dates.size === unique_dates.length && unique_dates.length > 0) {
                this.selected_dates.clear()
            } else {
                unique_dates.forEach(d => this.selected_dates.add(d))
            }

            this.update_master_date_button_state(unique_dates.length)
            this.render_date_buttons()
            this.update_text()
        })

        this.el.btn_reset?.addEventListener('click', () => {
            this.hide_findings = true
            this.reverse_date_order = false

            this.el.btn_hide_findings?.classList.add(ResultsMenuTextRadioRenderer.classes.btn_toggle_active)
            this.el.btn_reverse_date_order?.classList.remove(ResultsMenuTextRadioRenderer.classes.btn_toggle_active)

            this.reset_dates_to_default()
            this.render_date_buttons()
            this.update_text()
        })
    }

    private reset_dates_to_default() {
        const data = this.main_renderer.radio_renderer.get_data()
        const unique_dates = Array.from(new Set(data.map(d => d.date)))

        this.selected_dates.clear()
        unique_dates.forEach(date => this.selected_dates.add(date))

        this.update_master_date_button_state(unique_dates.length)
    }

    public sync_text_output() {
        this.reset_dates_to_default()
        this.render_date_buttons()
        this.update_text()
    }

    private update_master_date_button_state(total_available: number) {
        if (!this.el.btn_clear) return

        const { btn_action, btn_toggle } = ResultsMenuTextRadioRenderer.classes

        if (this.selected_dates.size === total_available && total_available > 0) {
            this.el.btn_clear.textContent = 'Hapus Semua Pilihan'
            this.el.btn_clear.className = btn_toggle
        } else {
            this.el.btn_clear.textContent = 'Pilih Semua'
            this.el.btn_clear.className = btn_action
        }
    }

    private render_date_buttons() {
        if (!this.el.dates_container) return
        this.el.dates_container.innerHTML = ''

        const data = this.main_renderer.radio_renderer.get_data()
        const unique_dates = Array.from(new Set(data.map(d => d.date)))

        unique_dates.forEach(date_str => {
            const formatted_date = this.format_date_label(date_str)
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
                this.update_master_date_button_state(unique_dates.length)
                this.render_date_buttons()
                this.update_text()
            })

            this.el.dates_container!.append(btn)
        })

        this.update_master_date_button_state(unique_dates.length)
    }

    private update_text() {
        if (!this.el.textarea) return

        const all_data = this.main_renderer.radio_renderer.get_data()
        let filtered = all_data.filter(item => this.selected_dates.has(item.date))

        if (this.reverse_date_order) {
            filtered = [...filtered].reverse()
        }

        if (filtered.length === 0) {
            this.el.textarea.value = ''
            if (this.on_change) this.on_change()
            return
        }

        const blocks = filtered.map(item => {
            const formatted_date = this.format_date_label(item.date)
            const title = `${item.order.name} (${formatted_date})`
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
