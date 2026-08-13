import { RESULTS_MENU_LAB_SYMBOL_MAP } from '../../../types/functions/results-menu'
import { create_element } from '../../../utils/dom'
import { Log } from '../../../utils/logger'
import { ResultsMenuRenderer } from './main'

export class ResultsMenuTextLabRenderer {
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
        toggle_hide_panel_name: HTMLButtonElement | null
        toggle_hide_symbol: HTMLButtonElement | null
        toggle_single_line: HTMLButtonElement | null
        toggle_shorten_values: HTMLButtonElement | null
        toggle_split_by_date: HTMLButtonElement | null
        toggle_short_date: HTMLButtonElement | null
        toggle_reverse_dates: HTMLButtonElement | null
        btn_template_flat_no_unit: HTMLButtonElement | null
        btn_template_interna_1: HTMLButtonElement | null
        btn_template_interna_2: HTMLButtonElement | null
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
            toggle_hide_panel_name: null,
            toggle_hide_symbol: null,
            toggle_single_line: null,
            toggle_shorten_values: null,
            toggle_split_by_date: null,
            toggle_short_date: null,
            toggle_reverse_dates: null,
            btn_template_flat_no_unit: null,
            btn_template_interna_1: null,
            btn_template_interna_2: null,
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
        hide_panel_name: false,
        hide_symbol: false,
        single_line: false,
        shorten_values: false,
        split_by_date: false,
        short_date: false,
        reverse_dates: false,
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
        this.el.toggle_short_name = create_element('button', { classes: ResultsMenuTextLabRenderer.classes.btn_toggle, text: 'Singkat (AE/Hb)' })
        this.el.toggle_flattened = create_element('button', { classes: ResultsMenuTextLabRenderer.classes.btn_toggle, text: 'Ratakan (Pake Koma)' })
        this.el.toggle_letters = create_element('button', { classes: ResultsMenuTextLabRenderer.classes.btn_toggle, text: 'Simbol Huruf (H/L)' })
        this.el.toggle_omit_empty = create_element('button', { classes: ResultsMenuTextLabRenderer.classes.btn_toggle, text: 'Sembunyikan Nilai Kosong' })
        this.el.toggle_unit_label = create_element('button', { classes: ResultsMenuTextLabRenderer.classes.btn_toggle, text: 'Satuan di Nama' })
        this.el.toggle_unit_value = create_element('button', { classes: ResultsMenuTextLabRenderer.classes.btn_toggle, text: 'Satuan di Nilai' })

        // New feature buttons
        this.el.toggle_hide_panel_name = create_element('button', { classes: ResultsMenuTextLabRenderer.classes.btn_toggle, text: 'Sembunyikan Nama Panel' })
        this.el.toggle_hide_symbol = create_element('button', { classes: ResultsMenuTextLabRenderer.classes.btn_toggle, text: 'Sembunyikan Simbol' })
        this.el.toggle_single_line = create_element('button', { classes: ResultsMenuTextLabRenderer.classes.btn_toggle, text: 'Satu Baris' })
        this.el.toggle_shorten_values = create_element('button', { classes: ResultsMenuTextLabRenderer.classes.btn_toggle, text: 'Singkat Nilai (NR/+1)' })
        this.el.toggle_split_by_date = create_element('button', { classes: ResultsMenuTextLabRenderer.classes.btn_toggle, text: 'Pisahkan per Tanggal' })
        this.el.toggle_short_date = create_element('button', { classes: ResultsMenuTextLabRenderer.classes.btn_toggle, text: 'Singkat Tanggal' })
        this.el.toggle_reverse_dates = create_element('button', { classes: ResultsMenuTextLabRenderer.classes.btn_toggle, text: 'Balik Urutan Tanggal' })

        // Macros
        this.el.btn_template_flat_no_unit = create_element('button', { classes: ResultsMenuTextLabRenderer.classes.btn_macro, text: 'Templat: Rata & Tanpa Satuan' })
        this.el.btn_template_interna_1 = create_element('button', { classes: ResultsMenuTextLabRenderer.classes.btn_macro, text: 'Templat: Interna 1' })
        this.el.btn_template_interna_2 = create_element('button', { classes: ResultsMenuTextLabRenderer.classes.btn_macro, text: 'Templat: Interna 2' })
        this.el.btn_template_reset = create_element('button', { classes: `${ResultsMenuTextLabRenderer.classes.btn_macro} reset`, text: 'Reset Filter' })

        this.el.btn_copy = create_element('button', { classes: ResultsMenuTextLabRenderer.classes.btn_action, text: 'SALIN TEKS' })

        const options_row = create_element('div', { classes: ResultsMenuTextLabRenderer.classes.toolbar_row }, [
            create_element('div', { classes: ResultsMenuTextLabRenderer.classes.toolbar_group }, [
                this.el.toggle_short_name,
                this.el.toggle_flattened,
                this.el.toggle_letters,
                this.el.toggle_omit_empty,
                this.el.toggle_unit_label,
                this.el.toggle_unit_value,
                this.el.toggle_hide_panel_name,
                this.el.toggle_hide_symbol,
                this.el.toggle_single_line,
                this.el.toggle_shorten_values,
                this.el.toggle_split_by_date,
                this.el.toggle_short_date,
                this.el.toggle_reverse_dates,
                // this.el.btn_template_flat_no_unit,
                this.el.btn_template_interna_1,
                this.el.btn_template_interna_2,
                this.el.btn_template_reset,
            ]),
            this.el.btn_copy,
        ])

        // Date selection grid
        this.el.date_filter_container = create_element('div', { classes: ResultsMenuTextLabRenderer.classes.date_filter_container })
        this.el.btn_select_all_dates = create_element('button', {
            classes: ResultsMenuTextLabRenderer.classes.btn_toggle,
            text: 'Hapus Semua Pilihan',
        })

        const date_grid_wrapper = create_element('div', { classes: ResultsMenuTextLabRenderer.classes.date_filter_grid_wrapper }, [
            this.el.date_filter_container,
            this.el.btn_select_all_dates,
        ])

        const filter_row = create_element('div', { classes: ResultsMenuTextLabRenderer.classes.date_filter_row }, [
            create_element('span', { classes: ResultsMenuTextLabRenderer.classes.date_filter_label, text: 'Filter Tanggal:' }),
            date_grid_wrapper,
        ])

        const toolbar = create_element('div', { classes: ResultsMenuTextLabRenderer.classes.toolbar }, [
            options_row,
            filter_row,
        ])

        // Textarea system
        this.el.textarea = create_element('textarea', {
            classes: ResultsMenuTextLabRenderer.classes.textarea_el,
            attrs: { readonly: true }
        })

        const textarea_wrapper = create_element('div', { classes: ResultsMenuTextLabRenderer.classes.textarea_wrapper }, [
            this.el.textarea
        ])

        // Putting it all together
        this.el.container = create_element('div', { classes: ResultsMenuTextLabRenderer.classes.container }, [
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
        bind_toggle(this.el.toggle_hide_panel_name, 'hide_panel_name')
        bind_toggle(this.el.toggle_hide_symbol, 'hide_symbol')
        bind_toggle(this.el.toggle_single_line, 'single_line')
        bind_toggle(this.el.toggle_shorten_values, 'shorten_values')
        bind_toggle(this.el.toggle_split_by_date, 'split_by_date')
        bind_toggle(this.el.toggle_short_date, 'short_date')
        bind_toggle(this.el.toggle_reverse_dates, 'reverse_dates')

        // Template Macro: Flat No Unit
        this.el.btn_template_flat_no_unit?.addEventListener('click', () => {
            this.config.short_name = true
            this.config.flattened = true
            this.config.show_unit_label = false
            this.config.show_unit_value = false
            this.sync_ui_button_states()
            this.sync_text_output()
        })

        // Template Macro: Interna 1
        this.el.btn_template_interna_1?.addEventListener('click', () => {
            this.config.short_name = true
            this.config.flattened = true
            this.config.use_letters = true
            this.config.omit_empty = true
            this.config.show_unit_label = false
            this.config.show_unit_value = false
            this.config.hide_panel_name = true
            this.config.hide_symbol = false
            this.config.single_line = true
            this.config.shorten_values = true
            this.config.split_by_date = true
            this.config.short_date = true
            this.config.reverse_dates = true
            this.sync_ui_button_states()
            this.sync_text_output()
        })

        // Template Macro: Interna 2
        this.el.btn_template_interna_2?.addEventListener('click', () => {
            this.config.short_name = false
            this.config.flattened = false
            this.config.use_letters = true
            this.config.omit_empty = true
            this.config.show_unit_label = false
            this.config.show_unit_value = false
            this.config.hide_panel_name = false
            this.config.hide_symbol = false
            this.config.single_line = false
            this.config.shorten_values = false
            this.config.split_by_date = false
            this.config.short_date = false
            this.config.reverse_dates = true
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
            this.config.hide_panel_name = false
            this.config.hide_symbol = false
            this.config.single_line = false
            this.config.shorten_values = false
            this.config.split_by_date = false
            this.config.short_date = false
            this.config.reverse_dates = false
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
                    .catch(err => Log.error('Could not copy text: ', err))
            }
        })
    }

    private sync_ui_button_states() {
        const set_active = (btn: HTMLButtonElement | null, state: boolean) => {
            btn?.classList.toggle(ResultsMenuTextLabRenderer.classes.btn_toggle_active, state)
        }
        set_active(this.el.toggle_short_name, this.config.short_name)
        set_active(this.el.toggle_flattened, this.config.flattened)
        set_active(this.el.toggle_letters, this.config.use_letters)
        set_active(this.el.toggle_omit_empty, this.config.omit_empty)
        set_active(this.el.toggle_unit_label, this.config.show_unit_label)
        set_active(this.el.toggle_unit_value, this.config.show_unit_value)
        set_active(this.el.toggle_hide_panel_name, this.config.hide_panel_name)
        set_active(this.el.toggle_hide_symbol, this.config.hide_symbol)
        set_active(this.el.toggle_single_line, this.config.single_line)
        set_active(this.el.toggle_shorten_values, this.config.shorten_values)
        set_active(this.el.toggle_split_by_date, this.config.split_by_date)
        set_active(this.el.toggle_short_date, this.config.short_date)
        set_active(this.el.toggle_reverse_dates, this.config.reverse_dates)
    }

    private sync_date_toggles_visual_state() {
        this.el.date_toggles.forEach((btn, date_id) => {
            const is_active = !this.config.excluded_date_ids.has(date_id)
            btn.classList.toggle(ResultsMenuTextLabRenderer.classes.btn_toggle_active, is_active)
        })
    }

    private update_date_master_button_text(total_available: number) {
        if (!this.el.btn_select_all_dates) return

        const { btn_action, btn_toggle } = ResultsMenuTextLabRenderer.classes

        if (this.config.excluded_date_ids.size === 0 && total_available > 0) {
            this.el.btn_select_all_dates.textContent = 'Hapus Semua Pilihan'
            this.el.btn_select_all_dates.className = btn_toggle
        } else {
            this.el.btn_select_all_dates.textContent = 'Pilih Semua'
            this.el.btn_select_all_dates.className = btn_action
        }
    }

    private render_date_filter_toggles(available_dates: any[]) {
        if (!this.el.date_filter_container) return

        this.el.date_filter_container.innerHTML = ''
        this.el.date_toggles.clear()

        available_dates.forEach(date => {
            const formatted_label = this.format_date_to_table_style(date)
            const is_active = !this.config.excluded_date_ids.has(date.id)

            const date_btn = create_element('button', {
                classes: `${ResultsMenuTextLabRenderer.classes.btn_toggle} ${is_active ? ResultsMenuTextLabRenderer.classes.btn_toggle_active : ''}`,
                text: formatted_label
            })

            date_btn.addEventListener('click', () => {
                if (this.config.excluded_date_ids.has(date.id)) {
                    this.config.excluded_date_ids.delete(date.id)
                } else {
                    this.config.excluded_date_ids.add(date.id)
                }
                date_btn.classList.toggle(ResultsMenuTextLabRenderer.classes.btn_toggle_active, !this.config.excluded_date_ids.has(date.id))
                this.update_date_master_button_text(available_dates.length)
                this.sync_text_output()
            })

            this.el.date_toggles.set(date.id, date_btn)
            this.el.date_filter_container!.append(date_btn)
        })
        this.update_date_master_button_text(available_dates.length)
    }

    private get_shortened_value(value: any): string {
        if (value === undefined || value === null) return ''
        const lookup_key = value
        const display_value = RESULTS_MENU_LAB_SYMBOL_MAP[lookup_key] ? RESULTS_MENU_LAB_SYMBOL_MAP[lookup_key].short : value
        return display_value
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

        let filtered_dates = available_dates.filter(d => !this.config.excluded_date_ids.has(d.id))

        if (filtered_dates.length === 0) {
            this.el.textarea.value = ''
            return
        }

        // Apply date reversal when config.reverse_dates is active
        if (this.config.reverse_dates) {
            filtered_dates = [...filtered_dates].reverse()
        }

        if (this.config.split_by_date) {
            const date_blocks: string[] = []

            filtered_dates.forEach(d => {
                const date_str = this.format_date_to_table_style(d)
                const header_title = this.config.short_date ? 'Lab' : 'HASIL LAB'

                let block = this.config.short_date
                    ? `${header_title} ${date_str}`
                    : `${header_title} (${date_str})`

                const panel_blocks: string[] = []

                values.forEach(panel => {
                    const row_line_outputs: string[] = []

                    panel.rows.forEach(row => {
                        const render_value = row.values.get(d.id)
                        if (render_value && render_value.status === 'loaded') {
                            const unit_str = render_value.lab_result?.unit || ''
                            let flag_text = ''

                            if (!this.config.hide_symbol) {
                                if (render_value.arrow_type === 'up') flag_text = this.config.use_letters ? ' (H)' : ' ↑'
                                if (render_value.arrow_type === 'down') flag_text = this.config.use_letters ? ' (L)' : ' ↓'
                                if (render_value.arrow_type === 'exclamation') flag_text = this.config.use_letters ? ' (!)' : ' ⚠'
                            }

                            const has_value = render_value.value !== undefined && render_value.value !== null && render_value.value !== ''
                            let raw_val = render_value.value
                            if (this.config.shorten_values && has_value) {
                                raw_val = this.get_shortened_value(raw_val)
                            }

                            const inline_value_unit = (this.config.show_unit_value && unit_str && has_value) ? ` ${unit_str}` : ''

                            if (has_value) {
                                const label = this.config.short_name ? row.meta.display_name.short : row.meta.display_name.full
                                const clean_unit_string = this.config.show_unit_label ? (unit_str ? ` (${unit_str})` : ' (-)') : ''
                                const formatted_val = `${raw_val}${inline_value_unit}${flag_text}`

                                if (this.config.flattened) {
                                    row_line_outputs.push(`${label}${clean_unit_string} ${formatted_val}`)
                                } else {
                                    row_line_outputs.push(`${label}${clean_unit_string}: ${formatted_val}`)
                                }
                            }
                        }
                    })

                    if (row_line_outputs.length > 0) {
                        let panel_str = ''
                        if (!this.config.hide_panel_name) {
                            const p_date_str = this.format_date_to_table_style(d, true)
                            // If Single Line mode is active, prevent adding newlines after panel name
                            panel_str += this.config.single_line ? `${panel.panel_name} ${p_date_str} ` : `${panel.panel_name} ${p_date_str}\n`
                        }

                        if (this.config.flattened) {
                            panel_str += row_line_outputs.join(', ')
                        } else {
                            panel_str += row_line_outputs.join('\n')
                        }

                        panel_blocks.push(panel_str)
                    }
                })

                if (panel_blocks.length > 0) {
                    if (this.config.single_line) {
                        block += ' ' + panel_blocks.join(', ')
                    } else {
                        block += '\n\n' + panel_blocks.join('\n\n')
                    }
                    date_blocks.push(block)
                }
            })

            this.el.textarea.value = date_blocks.join('\n\n').trim()
            return
        }

        // Default layout (across date ranges)
        const global_newest = filtered_dates[0]
        const global_oldest = filtered_dates[filtered_dates.length - 1]
        const global_newest_str = this.format_date_to_table_style(global_newest)
        const global_oldest_str = this.format_date_to_table_style(global_oldest)

        // Dynamic arrow separator based on date direction
        const arrow = this.config.reverse_dates ? ' -> ' : ' <- '

        const global_range_str = (global_newest_str === global_oldest_str)
            ? global_newest_str
            : `${global_newest_str}${arrow}${global_oldest_str}`

        const header_title = this.config.short_date ? 'Lab' : 'HASIL LAB'
        let final_text_buffer = `${header_title} (${global_range_str})`

        const panel_output_blocks: string[] = []

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
                        if (!this.config.hide_symbol) {
                            if (render_value.arrow_type === 'up') flag_text = this.config.use_letters ? ' (H)' : ' ↑'
                            if (render_value.arrow_type === 'down') flag_text = this.config.use_letters ? ' (L)' : ' ↓'
                            if (render_value.arrow_type === 'exclamation') flag_text = this.config.use_letters ? ' (!)' : ' ⚠'
                        }

                        const has_value = render_value.value !== undefined && render_value.value !== null && render_value.value !== ''
                        let raw_val = render_value.value
                        if (this.config.shorten_values && has_value) {
                            raw_val = this.get_shortened_value(raw_val)
                        }

                        const inline_value_unit = (this.config.show_unit_value && unit_str && has_value) ? ` ${unit_str}` : ''

                        if (has_value) {
                            chronological_history_trace.push(`${raw_val}${inline_value_unit}${flag_text}`)
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
                const historical_trace_string = !is_trace_empty
                    ? absolute_valuable_trace.join(this.config.reverse_dates ? ' -> ' : ' <- ')
                    : '-'

                if (this.config.omit_empty && is_trace_empty) return

                const clean_unit_string = this.config.show_unit_label ? (unit_str ? ` (${unit_str})` : ' (-)') : ''

                if (this.config.flattened) {
                    row_line_outputs.push(`${label}${clean_unit_string} ${historical_trace_string}`)
                } else {
                    row_line_outputs.push(`${label}${clean_unit_string}: ${historical_trace_string}`)
                }
            })

            if (row_line_outputs.length === 0) return

            dates_with_data_in_panel.sort((a, b) => {
                const time_a = new Date(a.raw_date).getTime()
                const time_b = new Date(b.raw_date).getTime()
                return this.config.reverse_dates ? time_a - time_b : time_b - time_a
            })

            let panel_range_string = ''
            if (dates_with_data_in_panel.length > 0) {
                const p_newest = dates_with_data_in_panel[0]
                const p_oldest = dates_with_data_in_panel[dates_with_data_in_panel.length - 1]
                const p_newest_str = this.format_date_to_table_style(p_newest)
                const p_oldest_str = this.format_date_to_table_style(p_oldest)
                panel_range_string = (p_newest_str === p_oldest_str)
                    ? p_newest_str
                    : `${p_newest_str}${arrow}${p_oldest_str}`
            } else {
                panel_range_string = global_range_str
            }

            let panel_block = ''
            if (!this.config.hide_panel_name) {
                // If Single Line mode is active, prevent adding newlines after panel name
                panel_block += this.config.single_line ? `${panel.panel_name} (${panel_range_string}) ` : `${panel.panel_name} (${panel_range_string})\n`
            }

            if (this.config.flattened) {
                panel_block += row_line_outputs.join(', ')
            } else {
                panel_block += row_line_outputs.join('\n')
            }

            panel_output_blocks.push(panel_block)
        })

        if (this.config.single_line) {
            final_text_buffer += ' ' + panel_output_blocks.join(', ')
        } else {
            final_text_buffer += '\n\n' + panel_output_blocks.join('\n\n')
        }

        this.el.textarea.value = final_text_buffer.trim()
    }

    private format_date_to_table_style(date_obj: any, hide_parens_and_time = false): string {
        const d = new Date(date_obj?.raw_date || date_obj)
        if (isNaN(d.getTime())) return '??/??'

        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')

        if (this.config.short_date) {
            return `${day}/${month}`
        }

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
        const day_month = `${day} ${months[d.getMonth()]}`
        const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        const short_year = String(d.getFullYear()).slice(-2)

        if (hide_parens_and_time) {
            return `${day_month} '${short_year}`
        }

        return `${day_month} '${short_year} (${time})`
    }
}
