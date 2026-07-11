import { create_element } from '../../../utils/dom'
import { ResultsMenuRenderer } from './main'

export class ResultsMenuTextRenderer {
    private el: {
        container: HTMLDivElement | null
        textarea: HTMLTextAreaElement | null
        btn_copy: HTMLButtonElement | null
        toggle_short_name: HTMLButtonElement | null
        toggle_flattened: HTMLButtonElement | null
        toggle_letters: HTMLButtonElement | null
        toggle_omit_empty: HTMLButtonElement | null
        toggle_unit_label: HTMLButtonElement | null
        toggle_unit_value: HTMLButtonElement | null
        btn_template_flat_no_unit: HTMLButtonElement | null
        btn_template_reset: HTMLButtonElement | null
        btn_select_all_dates: HTMLButtonElement | null
        date_filter_container: HTMLDivElement | null
        date_toggles: Map<string, HTMLButtonElement>
    } = {
            container: null,
            textarea: null,
            btn_copy: null,
            toggle_short_name: null,
            toggle_flattened: null,
            toggle_letters: null,
            toggle_omit_empty: null,
            toggle_unit_label: null,
            toggle_unit_value: null,
            btn_template_flat_no_unit: null,
            btn_template_reset: null,
            btn_select_all_dates: null,
            date_filter_container: null,
            date_toggles: new Map(),
        }

    private config = {
        short_name: true,
        flattened: false,
        use_letters: true,
        omit_empty: true,
        show_unit_label: true,
        show_unit_value: false,
        excluded_date_ids: new Set<string>(),
    }

    public static classes = {
        container: 'sn-results-menu-text-container',
        toolbar: 'sn-results-menu-text-toolbar',
        toolbar_row: 'sn-results-menu-text-toolbar-row',
        toolbar_group: 'sn-results-menu-text-toolbar-group',
        date_filter_row: 'sn-results-menu-text-date-filter-row',
        date_filter_label: 'sn-results-menu-text-date-filter-label',
        date_filter_grid_wrapper: 'sn-results-menu-text-date-filter-grid-wrapper',
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
        // Options toggles
        this.el.toggle_short_name = create_element('button', { classes: ResultsMenuTextRenderer.classes.btn_toggle, text: 'Singkat (AE/Hb)' })
        this.el.toggle_flattened = create_element('button', { classes: ResultsMenuTextRenderer.classes.btn_toggle, text: 'Ratakan (Pake Koma)' })
        this.el.toggle_letters = create_element('button', { classes: ResultsMenuTextRenderer.classes.btn_toggle, text: 'Simbol Huruf (H/L)' })
        this.el.toggle_omit_empty = create_element('button', { classes: ResultsMenuTextRenderer.classes.btn_toggle, text: 'Sembunyikan Nilai Kosong' })
        this.el.toggle_unit_label = create_element('button', { classes: ResultsMenuTextRenderer.classes.btn_toggle, text: 'Satuan di Nama' })
        this.el.toggle_unit_value = create_element('button', { classes: ResultsMenuTextRenderer.classes.btn_toggle, text: 'Satuan di Nilai' })

        // Macros
        this.el.btn_template_flat_no_unit = create_element('button', { classes: ResultsMenuTextRenderer.classes.btn_macro, text: 'Templat: Rata & Tanpa Satuan' })
        this.el.btn_template_reset = create_element('button', { classes: `${ResultsMenuTextRenderer.classes.btn_macro} reset`, text: 'Reset Filter' })

        this.el.btn_copy = create_element('button', { classes: ResultsMenuTextRenderer.classes.btn_action, text: 'SALIN TEKS' })

        const options_row = create_element('div', { classes: ResultsMenuTextRenderer.classes.toolbar_row }, [
            create_element('div', { classes: ResultsMenuTextRenderer.classes.toolbar_group }, [
                this.el.toggle_short_name,
                this.el.toggle_flattened,
                this.el.toggle_letters,
                this.el.toggle_omit_empty,
                this.el.toggle_unit_label,
                this.el.toggle_unit_value,
                this.el.btn_template_flat_no_unit,
                this.el.btn_template_reset,
            ]),
            this.el.btn_copy,
        ])

        // Date selection grid
        this.el.date_filter_container = create_element('div', { classes: ResultsMenuTextRenderer.classes.date_filter_container })
        this.el.btn_select_all_dates = create_element('button', {
            classes: ResultsMenuTextRenderer.classes.btn_action,
            text: 'Hapus Semua Pilihan',
        })

        const date_grid_wrapper = create_element('div', { classes: ResultsMenuTextRenderer.classes.date_filter_grid_wrapper }, [
            this.el.date_filter_container,
            this.el.btn_select_all_dates,
        ])

        const filter_row = create_element('div', { classes: ResultsMenuTextRenderer.classes.date_filter_row }, [
            create_element('span', { classes: ResultsMenuTextRenderer.classes.date_filter_label, text: 'Filter Tanggal:' }),
            date_grid_wrapper,
        ])

        const toolbar = create_element('div', { classes: ResultsMenuTextRenderer.classes.toolbar }, [
            options_row,
            filter_row,
        ])

        // Textarea system
        this.el.textarea = create_element('textarea', {
            classes: ResultsMenuTextRenderer.classes.textarea_el,
            attrs: { readonly: true }
        })

        const textarea_wrapper = create_element('div', { classes: ResultsMenuTextRenderer.classes.textarea_wrapper }, [
            this.el.textarea
        ])

        // Putting it all together
        this.el.container = create_element('div', { classes: ResultsMenuTextRenderer.classes.container }, [
            toolbar,
            textarea_wrapper,
        ])

        target_el.append(this.el.container)

        this.sync_ui_button_states()
        this.init_event_listeners()
    }

    private init_event_listeners() {
        const bind_toggle = (btn: HTMLButtonElement | null, key: keyof typeof this.config) => {
            if (!btn) return
            btn.addEventListener('click', () => {
                (this.config as any)[key] = !this.config[key]
                this.sync_ui_button_states()
                this.sync_text_output()
            })
        }

        bind_toggle(this.el.toggle_short_name, 'short_name')
        bind_toggle(this.el.toggle_flattened, 'flattened')
        bind_toggle(this.el.toggle_letters, 'use_letters')
        bind_toggle(this.el.toggle_omit_empty, 'omit_empty')
        bind_toggle(this.el.toggle_unit_label, 'show_unit_label')
        bind_toggle(this.el.toggle_unit_value, 'show_unit_value')

        // Template Macro: Flat No Unit
        this.el.btn_template_flat_no_unit?.addEventListener('click', () => {
            this.config.short_name = true
            this.config.flattened = true
            this.config.show_unit_label = false
            this.config.show_unit_value = false
            this.sync_ui_button_states()
            this.sync_text_output()
        })

        // Template Macro: Reset Filter System
        this.el.btn_template_reset?.addEventListener('click', () => {
            this.config.short_name = true
            this.config.flattened = false
            this.config.use_letters = true
            this.config.omit_empty = true
            this.config.show_unit_label = true
            this.config.show_unit_value = false
            this.config.excluded_date_ids.clear()

            // Force re-render dates array to catch reset exclusions state
            this.el.date_toggles.clear()
            this.sync_ui_button_states()
            this.sync_text_output()
        })

        // Master Date Array Selection Link Button
        this.el.btn_select_all_dates?.addEventListener('click', () => {
            const table = this.main_renderer.lab_renderer.table
            const available_dates = (table?.data?.dates || []).filter(d => d.raw_date !== '--------')

            if (this.config.excluded_date_ids.size === 0) {
                // If everything is selected, exclude all items
                available_dates.forEach(d => this.config.excluded_date_ids.add(d.id))
            } else {
                // If anything or everything is excluded, clear array to select all
                this.config.excluded_date_ids.clear()
            }
            this.update_date_master_button_text(available_dates.length)
            this.sync_date_toggles_visual_state()
            this.sync_text_output()
        })

        this.el.btn_copy?.addEventListener('click', () => {
            if (this.el.textarea && this.el.textarea.value) {
                navigator.clipboard.writeText(this.el.textarea.value)
                    .catch(err => console.error('Could not copy text: ', err))
            }
        })
    }

    private sync_ui_button_states() {
        const set_active = (btn: HTMLButtonElement | null, state: boolean) => {
            btn?.classList.toggle(ResultsMenuTextRenderer.classes.btn_toggle_active, state)
        }
        set_active(this.el.toggle_short_name, this.config.short_name)
        set_active(this.el.toggle_flattened, this.config.flattened)
        set_active(this.el.toggle_letters, this.config.use_letters)
        set_active(this.el.toggle_omit_empty, this.config.omit_empty)
        set_active(this.el.toggle_unit_label, this.config.show_unit_label)
        set_active(this.el.toggle_unit_value, this.config.show_unit_value)
    }

    private sync_date_toggles_visual_state() {
        this.el.date_toggles.forEach((btn, date_id) => {
            const is_active = !this.config.excluded_date_ids.has(date_id)
            btn.classList.toggle(ResultsMenuTextRenderer.classes.btn_toggle_active, is_active)
        })
    }

    private update_date_master_button_text(total_available: number) {
        if (!this.el.btn_select_all_dates) return
        if (this.config.excluded_date_ids.size === 0 && total_available > 0) {
            this.el.btn_select_all_dates.textContent = 'Hapus Semua Pilihan'
        } else {
            this.el.btn_select_all_dates.textContent = 'Pilih Semua'
        }
    }

    private render_date_filter_toggles(available_dates: any[]) {
        if (!this.el.date_filter_container) return

        this.el.date_filter_container.innerHTML = ''
        this.el.date_toggles.clear()

        available_dates.forEach(date => {
            const formatted_label = `${this.convert_iso_to_indonesian_style(date.iso_date)} (${date.time})`
            const is_active = !this.config.excluded_date_ids.has(date.id)

            const date_btn = create_element('button', {
                classes: `${ResultsMenuTextRenderer.classes.btn_toggle} ${is_active ? ResultsMenuTextRenderer.classes.btn_toggle_active : ''}`,
                text: formatted_label
            })

            date_btn.addEventListener('click', () => {
                if (this.config.excluded_date_ids.has(date.id)) {
                    this.config.excluded_date_ids.delete(date.id)
                } else {
                    this.config.excluded_date_ids.add(date.id)
                }
                date_btn.classList.toggle(ResultsMenuTextRenderer.classes.btn_toggle_active, !this.config.excluded_date_ids.has(date.id))
                this.update_date_master_button_text(available_dates.length)
                this.sync_text_output()
            })

            this.el.date_toggles.set(date.id, date_btn)
            this.el.date_filter_container!.append(date_btn)
        })
        this.update_date_master_button_text(available_dates.length)
    }

    sync_text_output() {
        if (!this.el.textarea) return

        const table = this.main_renderer.lab_renderer.table
        if (!table || !table.data?.dates || table.data.dates.length === 0) {
            this.el.textarea.value = ''
            return
        }

        const all_dates = table.data.dates
        const values = table.values_to_render?.tbody?.panels || []
        const available_dates = all_dates.filter(d => d.raw_date !== '--------')

        if (available_dates.length === 0) {
            this.el.textarea.value = ''
            if (this.el.date_filter_container) this.el.date_filter_container.innerHTML = ''
            return
        }

        if (this.el.date_toggles.size !== available_dates.length) {
            this.render_date_filter_toggles(available_dates)
        }

        const filtered_dates = available_dates.filter(d => !this.config.excluded_date_ids.has(d.id))

        if (filtered_dates.length === 0) {
            this.el.textarea.value = ''
            return
        }

        const global_newest = filtered_dates[0]
        const global_oldest = filtered_dates[filtered_dates.length - 1]
        const global_newest_str = `${this.convert_iso_to_indonesian_style(global_newest.iso_date)}, ${global_newest.time}`
        const global_oldest_str = `${this.convert_iso_to_indonesian_style(global_oldest.iso_date)}, ${global_oldest.time}`
        const global_range_str = (global_newest_str === global_oldest_str) ? global_newest_str : `${global_newest_str} <- ${global_oldest_str}`

        let final_text_buffer = `HASIL LAB (${global_range_str})\n\n`

        values.forEach(panel => {
            const row_line_outputs: string[] = []
            const dates_with_data_in_panel: typeof filtered_dates = []

            panel.rows.forEach(row => {
                const label = this.config.short_name ? row.meta.display_name.short : row.meta.display_name.full
                let unit_str = ''
                const chronological_history_trace: string[] = []

                filtered_dates.forEach(d => {
                    const render_value = row.values.get(d.id)
                    if (render_value && render_value.status === 'loaded') {
                        if (render_value.lab_result?.unit) unit_str = render_value.lab_result.unit

                        let flag_text = ''
                        if (render_value.arrow_type === 'up') flag_text = this.config.use_letters ? ' (H)' : ' ↑'
                        if (render_value.arrow_type === 'down') flag_text = this.config.use_letters ? ' (L)' : ' ↓'
                        if (render_value.arrow_type === 'exclamation') flag_text = this.config.use_letters ? ' (!)' : ' ⚠'

                        const has_value = render_value.value !== undefined && render_value.value !== null && render_value.value !== ''
                        const inline_value_unit = (this.config.show_unit_value && unit_str && has_value) ? ` ${unit_str}` : ''

                        if (has_value) {
                            chronological_history_trace.push(`${render_value.value}${inline_value_unit}${flag_text}`)
                            // Capture this date since it actively holds data for this panel
                            if (!dates_with_data_in_panel.includes(d)) {
                                dates_with_data_in_panel.push(d)
                            }
                        } else {
                            chronological_history_trace.push('')
                        }
                    } else if (render_value && render_value.status === 'loading') {
                        chronological_history_trace.push('...')
                    } else {
                        chronological_history_trace.push('')
                    }
                })

                const absolute_valuable_trace = chronological_history_trace.filter(v => v !== '')
                const is_trace_empty = absolute_valuable_trace.length === 0
                const historical_trace_string = !is_trace_empty ? absolute_valuable_trace.join(' <- ') : '-'

                if (this.config.omit_empty && is_trace_empty) return

                const clean_unit_string = this.config.show_unit_label ? (unit_str ? ` (${unit_str})` : ' (-)') : ''

                if (this.config.flattened) {
                    row_line_outputs.push(`${label}${clean_unit_string} ${historical_trace_string}`)
                } else {
                    row_line_outputs.push(`${label}${clean_unit_string}: ${historical_trace_string}`)
                }
            })

            if (row_line_outputs.length === 0) return

            dates_with_data_in_panel.sort((a, b) => new Date(b.raw_date).getTime() - new Date(a.raw_date).getTime())

            let panel_range_string = ''
            if (dates_with_data_in_panel.length > 0) {
                const p_newest = dates_with_data_in_panel[0]
                const p_oldest = dates_with_data_in_panel[dates_with_data_in_panel.length - 1]
                const p_newest_str = `${this.convert_iso_to_indonesian_style(p_newest.iso_date)}, ${p_newest.time}`
                const p_oldest_str = `${this.convert_iso_to_indonesian_style(p_oldest.iso_date)}, ${p_oldest.time}`
                panel_range_string = (p_newest_str === p_oldest_str) ? p_newest_str : `${p_newest_str} <- ${p_oldest_str}`
            } else {
                panel_range_string = global_range_str // fallback if somehow empty
            }

            final_text_buffer += `${panel.panel_name} (${panel_range_string})\n`
            if (this.config.flattened) {
                final_text_buffer += row_line_outputs.join(', ') + '\n\n'
            } else {
                final_text_buffer += row_line_outputs.join('\n') + '\n\n'
            }
        })

        this.el.textarea.value = final_text_buffer.trim()
    }

    private convert_iso_to_indonesian_style(iso_str: string): string {
        const parts = iso_str.split('-')
        if (parts.length !== 3) return iso_str
        return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
}
