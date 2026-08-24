import { DEFAULT_RESULTS_MENU_PANELS_CONFIG, RESULTS_MENU_LAB_PARAM_MAP, RESULTS_MENU_LAB_SYMBOL_MAP, PanelsConfig, ResultsMenuLabResult } from '../../../../types/functions/results-menu'
import { ModalManager } from '../../../../ui/modal'
import { create_element } from '../../../../utils/dom'
import { format_gender, format_pt_age, format_pt_name } from '../../../../utils/formatter'
import { ResultsMenuLabRenderer } from '../lab'

type LabResults = Map<string, ResultsMenuLabResult>

interface TableDataDate {
    id: string
    year: string
    day_month: string
    time: string
    iso_date: string
    raw_date: string
    rounded_date: string
}

interface LabResultRenderValue {
    value: string
    display_value: string
    status: 'loaded' | 'loading' | 'empty'
    is_normal: boolean
    arrow_type: 'up' | 'down' | 'exclamation' | null
    lab_result?: ResultsMenuLabResult
}

interface PanelsRow {
    meta: {
        param_id: string
        display_name: {
            full: string
            short: string
        }
    }
    values: Map<TableDataDate['id'], LabResultRenderValue>
}

interface TableData {
    dates: Array<TableDataDate>
    date_id_lookup: Map<TableDataDate['rounded_date'], TableDataDate['id']>
    default_panels_config: PanelsConfig
}

interface TableValuesToRender {
    thead: {
        year_rows: Array<{
            year: string
            colspan: number
        }>
        date_rows: Array<{
            day_month: string
            time: string
        }>
    }
    tbody: {
        panels: Array<{
            panel_name: string
            rows: Array<PanelsRow>
        }>
    }
}

export class ResultsMenuLabTable {
    el: HTMLDivElement

    private static next_date_id = 1000
    public static get_next_date_id(): string {
        return String(ResultsMenuLabTable.next_date_id++)
    }
    get_minute_string(date_str: string) {
        return date_str && date_str.length >= 16 ? date_str.slice(0, 16) : date_str
    }

    public data: TableData = {
        dates: [],
        date_id_lookup: new Map(),
        default_panels_config: DEFAULT_RESULTS_MENU_PANELS_CONFIG,
    }

    public values_to_render: TableValuesToRender = {
        thead: {
            year_rows: [],
            date_rows: [],
        },
        tbody: {
            panels: [],
        },
    }

    private static tooltip_element: HTMLDivElement | null = null
    private static active_cell: HTMLElement | null = null

    // --- Existing & Updated Regexes ---
    private static readonly RANGE_REGEX = /^([-+]?[0-9.]+)-([-+]?[0-9.]+)$/
    private static readonly LESS_THAN_REGEX = /^<([-+]?[0-9.]+)$/
    private static readonly GREATER_THAN_REGEX = /^>([-+]?[0-9.]+)$/
    private static readonly SINGLE_NUM_REGEX = /^([-+]?[0-9.]+)$/
    private static readonly REGEX_ESCAPE_CHARS = /[-\/\\^$*+?.()|[\]{}]/g

    // --- Time-related Regexes ---
    private static readonly HAS_TIME_MARKER_REGEX = /['"]/
    private static readonly HAS_TIME_REGEX = /(\d+(?:[.,]\d+)?)['"]+(?:(\d+)['"]*)?/g
    private static readonly PLAIN_NUMBERS_REGEX = /\b\d+(?:[.,]\d+)?\b/g
    private static readonly WHITESPACE_REGEX = /\s+/g

    // --- Formatting & Number Sanitization Regexes ---
    private static readonly DECIMAL_COMMA_REGEX = /(\d+),(\d{1,2})(?!\d)/g
    private static readonly EU_THOUSANDS_REGEX = /\d+\.\d{3},/
    private static readonly US_THOUSANDS_REGEX = /\d+,\d{3}\./

    constructor(
        protected lab_renderer: ResultsMenuLabRenderer,
    ) {
        this.el = create_element('div', { classes: ResultsMenuLabRenderer.classes.table.el })
        this.el.append(create_element('div', { classes: 'empty-table', html: '<div class="sn-spinner"></div> Memuat data...' }))
        this.init_global_tooltip()
    }

    update_table(lab_results: LabResults) {
        const updated_config = this.extend_default_panels_config(lab_results, this.data.default_panels_config)
        this.set_data_structure(lab_results, updated_config)
        this.render_table()
        this.populate_table(lab_results)
        this.lab_renderer.main_renderer.sync_tab_text()
    }

    extend_default_panels_config(lab_results: LabResults, default_panels_config: PanelsConfig): PanelsConfig {
        const extended_config = { ...default_panels_config }

        const existing_params = new Set<string>(
            Object.values(extended_config).flatMap(panel => panel.parameter_ids)
        )

        lab_results.forEach(item => {
            const param_id = item.parameter.id
            const fallback_panel_name = item.order.panel_desc

            if (!existing_params.has(param_id)) {
                const new_key = fallback_panel_name.toLowerCase().replace(/\s+/g, '_')

                if (!extended_config[new_key]) {
                    extended_config[new_key] = {
                        panel_name: fallback_panel_name,
                        parameter_ids: [],
                    }
                }

                if (!extended_config[new_key].parameter_ids.includes(param_id as any)) {
                    extended_config[new_key].parameter_ids.push(param_id as any)
                    // FOR DEBUG
                    // extended_config[new_key].parameter_ids.push((param_id + ': ' + item.parameter.name) as any)
                }

                existing_params.add(param_id)
            }
        })

        return extended_config
    }

    set_data_structure(lab_results: LabResults, panels_config: PanelsConfig) {
        const sorted_lab_results = Array.from(lab_results.values()).sort((a, b) => new Date(b.order.order_date).getTime() - new Date(a.order.order_date).getTime())
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']

        this.data.dates = sorted_lab_results
            .filter((item, index, array) => {
                if (index === 0) return true
                return this.get_minute_string(item.order.order_date) !== this.get_minute_string(array[index - 1].order.order_date)
            })
            .map(item => {
                const order_date = item.order.order_date
                const d = new Date(order_date)
                const year = !isNaN(d.getTime()) ? d.getFullYear().toString() : '????'
                const day_month = !isNaN(d.getTime()) ? `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}` : '?? ??'
                const time = !isNaN(d.getTime()) ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : '??:??'
                const iso_date = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '????-??-??'

                return {
                    id: ResultsMenuLabTable.get_next_date_id(),
                    year,
                    day_month,
                    time,
                    iso_date,
                    raw_date: order_date,
                    rounded_date: this.get_minute_string(order_date),
                }
            })

        const min_dates_count = 13 //5
        while (this.data.dates.length < min_dates_count) {
            this.data.dates.push({
                id: ResultsMenuLabTable.get_next_date_id(),
                year: '----',
                day_month: '-- --',
                time: '--:--',
                iso_date: '--------',
                raw_date: '--------',
                rounded_date: '--------',
            })
        }

        this.data.date_id_lookup = new Map(this.data.dates.map(d => [d.rounded_date, d.id]))

        const year_rows: TableValuesToRender['thead']['year_rows'] = []
        this.data.dates.forEach(d => {
            if (year_rows.length > 0 && year_rows[year_rows.length - 1].year === d.year) {
                year_rows[year_rows.length - 1].colspan++
            } else {
                year_rows.push({ year: d.year, colspan: 1 })
            }
        })
        this.values_to_render.thead.year_rows = year_rows

        this.values_to_render.tbody.panels = Object.values(panels_config).map(p => {
            const rows: PanelsRow[] = p.parameter_ids.map(param_id => {
                const values = new Map<string, LabResultRenderValue>()

                // set empty data for each timestamp
                this.data.dates.forEach(d => {
                    values.set(d.id, {
                        value: '',
                        display_value: '',
                        status: 'empty',
                        // status: 'loading', TODO: find a way to know if the value is expected/loading
                        // use another api call? call the order list first then the bulk data
                        // later, if that order data still expected but the bulk data failed to fulfill, call that specific order
                        is_normal: true,
                        arrow_type: null,
                    })
                })

                const lookup_key = param_id
                const param_map = RESULTS_MENU_LAB_PARAM_MAP[lookup_key]
                const display_name: PanelsRow['meta']['display_name'] = {
                    full: param_map?.full || param_id,
                    short: param_map?.short || param_id,
                }

                return {
                    meta: {
                        param_id,
                        display_name,
                    },
                    values,
                }
            })
            return {
                panel_name: p.panel_name,
                rows,
            }
        })
    }

    render_table() {
        this.el.innerHTML = ''

        const c = create_element

        if (!this.data.dates.length) {
            this.el.append(c('div', { classes: 'empty-table', text: '[Hasil Lab]: Belum ada data.' }))
            return
        }

        const th_patient = this.render_th_patient()
        const tr_year_children: HTMLElement[] = [th_patient]
        this.values_to_render.thead.year_rows.forEach(row => {
            tr_year_children.push(c('th', { classes: 'year-cell', attrs: { colspan: String(row.colspan) } }, [
                c('div', { classes: 'sticky-text-wrapper', text: row.year }),
            ]))
        })

        const tr_date_children: HTMLElement[] = []
        this.data.dates.forEach(d => {
            tr_date_children.push(c('th', { classes: 'date-cell' }, [
                c('div', { classes: 'flex-wrapper' }, [
                    c('div', { classes: 'text-stack' }, [
                        c('div', { classes: 'date-text', text: d.day_month }),
                        c('div', { classes: 'time-text', text: d.time }),
                    ]),
                ]),
            ]))
        })

        const tbody_children: HTMLElement[] = []
        const title_cell_colspan = String(this.data.dates.length + 1)
        this.values_to_render.tbody.panels.forEach((panel, panel_idx) => {
            const title_row = c('tr', { classes: 'panel-title-row' }, [
                c('td', { classes: 'panel-title-cell', attrs: { colspan: title_cell_colspan } }, [
                    c('div', { classes: 'panel-header-sticky-wrapper-ribbon' }, [
                        c('div', { classes: 'panel-trigger-side' }, [
                            c('span', { classes: 'chevron-icon', html: '▼' }),
                            c('span', { text: panel.panel_name }),
                        ]),
                    ]),
                ]),
            ])

            const panel_rows: HTMLTableRowElement[] = []
            panel.rows.forEach(row => {
                const tr = c('tr', { classes: `panel-data-row group-${panel_idx}` }, [
                    c('td', { classes: 'param-name-cell', text: row.meta.display_name.full }),
                ])
                this.data.dates.forEach(d => {
                    const val_td = c('td', { attrs: { 'data-date-id': d.id, 'data-param-id': row.meta.param_id } })
                    tr.append(val_td)
                    const render_value = row.values.get(d.id)
                    if (render_value) this.update_cell(d.id, row.meta.param_id, render_value)
                })
                panel_rows.push(tr)
            })

            tbody_children.push(title_row, ...panel_rows)

            title_row.addEventListener('click', () => {
                const is_collapsed = title_row.classList.toggle('is-collapsed')
                panel_rows.forEach(r => { r.style.display = is_collapsed ? 'none' : 'table-row' })
                ResultsMenuLabTable.hide_tooltip()
            })
        })

        const tr_year = c('tr', { classes: 'tr-year' }, tr_year_children)
        const tr_date = c('tr', { classes: 'tr-date' }, tr_date_children)
        const thead = c('thead', {}, [tr_year, tr_date])
        const tbody = c('tbody', {}, tbody_children)
        const colgroup = c('colgroup', {}, [
            c('col', { classes: 'fixed-column' }),
            c('col', { classes: 'auto-column' }),
            // c('col', { classes: 'auto-column' }),
        ])
        const table = c('table', { classes: 'sn-lab-table' }, [colgroup, thead, tbody])

        tbody.addEventListener('click', (e) => {
            const cell = (e.target as HTMLElement).closest('.state-loaded') as HTMLElement
            if (cell && (cell as any)._lab_result) {
                e.stopPropagation()
                ResultsMenuLabTable.show_tooltip(cell, (cell as any)._lab_result)
            }
        })

        this.el.append(table)
    }

    populate_table(lab_results: LabResults) {
        lab_results.forEach(item => {
            const lookup_key = this.get_minute_string(item.order.order_date)
            const date_id = this.data.date_id_lookup.get(lookup_key)
            const param_id = item.parameter.id

            if (!date_id || !param_id) return

            this.update_cell(date_id, param_id, ResultsMenuLabTable.get_render_value(item))
        })
    }

    render_th_patient() {
        const c = create_element
        const th_patient = c('th', {
            classes: 'pt-info-cell',
            attrs: {
                rowspan: '2',
            },
        })

        const patient = this.lab_renderer.patient_data
        if (patient) {
            const gender = format_gender(patient.gender === '1' ? 'Male' : 'Female')
            th_patient.append(
                c('div', { classes: 'pt-mrn', text: patient.mrn }),
                c('div', { classes: 'pt-name-row' }, [
                    c('span', { classes: 'pt-gender', styles: { color: gender.color }, text: `(${gender.short})` }),
                    c('span', { text: format_pt_name(patient.name) }),
                ]),
                c('div', { classes: 'pt-age', text: format_pt_age(patient.dob) }),
            )
        } else {
            th_patient.append(
                c('div', { classes: 'pt-mrn', text: '??????' }),
                c('div', { classes: 'pt-name-row' }, [
                    c('span', { classes: 'pt-gender', text: '(?)' }),
                    c('span', { text: '??' }),
                ]),
                c('div', { classes: 'pt-age', text: '?y, ?m, ?d' }),
            )
        }
        return th_patient
    }

    update_cell(date_id: string, param_id: string, value: LabResultRenderValue) {
        this.update_internal_state(date_id, param_id, value)

        const cell = this.el.querySelector<HTMLTableCellElement>(`[data-date-id="${date_id}"][data-param-id="${param_id}"]`)
        if (!cell) return

        cell.className = 'param-value-cell'
        cell.innerHTML = ''

        if (value.status === 'loaded') {
            cell.classList.add('state-loaded')
            if (!value.is_normal) cell.classList.add('state-abnormal')

            const text = create_element('span', { classes: 'cell-text-truncate', text: value.display_value })
            cell.append(text)
            if (value.arrow_type) {
                const icon = create_element('span', { classes: 'indicator-icon icon-flagged', text: value.arrow_type === 'up' ? '↑' : value.arrow_type === 'down' ? '↓' : '⚠' })
                cell.append(icon)
            }

            if (value.lab_result) {
                (cell as any)._lab_result = value.lab_result
            }
        } else if (value.status === 'loading') {
            cell.classList.add('state-expecting')
            cell.textContent = '...'
        } else {
            cell.classList.add('state-clear')
            cell.textContent = ''
        }
    }

    private update_internal_state(date_id: string, param_id: string, value: LabResultRenderValue) {
        for (const panel of this.values_to_render.tbody.panels) {
            const matching_row = panel.rows.find(row => row.meta.param_id === param_id)
            if (matching_row) {
                matching_row.values.set(date_id, value)
                break
            }
        }
    }

    public static get_render_value(item: ResultsMenuLabResult): LabResultRenderValue {
        let value = item.value.trim()
        if (item.unit) {
            const escaped_unit = item.unit.replace(ResultsMenuLabTable.REGEX_ESCAPE_CHARS, '\\$&')
            value = value.replace(new RegExp(`\\s*${escaped_unit}$`, 'i'), '').trim()
        }

        const lookup_key = value
        const display_value = RESULTS_MENU_LAB_SYMBOL_MAP[lookup_key] ? RESULTS_MENU_LAB_SYMBOL_MAP[lookup_key].full : value
        const evaluation = ResultsMenuLabTable.evaluate_abnormality(value, item.normal_values || item.parameter.reference_values)

        return {
            value,
            display_value,
            status: 'loaded',
            is_normal: evaluation.is_normal,
            arrow_type: evaluation.arrow_type,
            lab_result: item,
        }
    }

    private static sanitize_number_format(str: string): string {
        let sanitized = str

        // Handle European thousands dot (e.g. "1.234,56" -> "1234,56")
        if (ResultsMenuLabTable.EU_THOUSANDS_REGEX.test(sanitized)) {
            sanitized = sanitized.replace(/\./g, '')
        }
        // Handle Standard thousands comma (e.g. "1,234.56" -> "1234.56")
        else if (ResultsMenuLabTable.US_THOUSANDS_REGEX.test(sanitized)) {
            sanitized = sanitized.replace(/,/g, '')
        }

        // Replace decimal commas (e.g., "5,4" -> "5.4")
        sanitized = sanitized.replace(ResultsMenuLabTable.DECIMAL_COMMA_REGEX, '$1.$2')

        return sanitized
    }

    private static normalize_time_to_seconds(str: string, is_time_context = false): string {
        const converted = str.replace(ResultsMenuLabTable.HAS_TIME_REGEX, (_, mins, secs) => {
            const normalized_mins = mins ? mins.replace(',', '.') : '0'
            const m = parseFloat(normalized_mins) || 0
            const s = parseInt(secs, 10) || 0

            return Math.round(m * 60 + s).toString()
        })

        if (is_time_context && !str.includes("'") && !str.includes('"')) {
            return converted.replace(ResultsMenuLabTable.PLAIN_NUMBERS_REGEX, (num) => {
                const normalized_num = num.replace(',', '.')
                return Math.round(parseFloat(normalized_num) * 60).toString()
            })
        }

        return converted
    }

    private static parse_interval(str: string, is_time_context = false): [number, number] | null {
        if (!str) return null

        // Strip ALL whitespace
        // Example: "- 3.0 - + 3.0" becomes "-3.0-+3.0"
        // Example: "-5 - -2" becomes "-5--2"
        let clean_str = str.replace(ResultsMenuLabTable.WHITESPACE_REGEX, '')

        // Standardize numbers (convert decimal commas like 5,4 to 5.4)
        clean_str = ResultsMenuLabTable.sanitize_number_format(clean_str)

        const has_time_marker = ResultsMenuLabTable.HAS_TIME_MARKER_REGEX.test(clean_str)
        if (has_time_marker || is_time_context) {
            clean_str = ResultsMenuLabTable.normalize_time_to_seconds(clean_str, is_time_context)
        }

        // Case 1: Range "-3.0-+3.0" or "-5--2"
        const range_match = clean_str.match(ResultsMenuLabTable.RANGE_REGEX)
        if (range_match) return [parseFloat(range_match[1]), parseFloat(range_match[2])]

        // Case 2: Less than "<-5"
        const less_match = clean_str.match(ResultsMenuLabTable.LESS_THAN_REGEX)
        if (less_match) return [-Infinity, parseFloat(less_match[1])]

        // Case 3: Greater than ">-20"
        const greater_match = clean_str.match(ResultsMenuLabTable.GREATER_THAN_REGEX)
        if (greater_match) return [parseFloat(greater_match[1]), Infinity]

        // Case 4: Single number "-4.5"
        const single_match = clean_str.match(ResultsMenuLabTable.SINGLE_NUM_REGEX)
        if (single_match) {
            const num = parseFloat(single_match[1])
            return [num, num]
        }

        return null
    }

    public static evaluate_abnormality(value: string, reference_range: string): { is_normal: boolean, arrow_type: 'up' | 'down' | 'exclamation' | null } {
        if (!reference_range || reference_range === '-' || reference_range.trim() === '') {
            return { is_normal: true, arrow_type: null }
        }

        const is_time_context = ResultsMenuLabTable.HAS_TIME_MARKER_REGEX.test(value) || ResultsMenuLabTable.HAS_TIME_MARKER_REGEX.test(reference_range)

        const val_interval = ResultsMenuLabTable.parse_interval(value, is_time_context)
        const ref_interval = ResultsMenuLabTable.parse_interval(reference_range, is_time_context)

        // If both parsed successfully as numeric intervals, run the smart comparison logic
        if (val_interval && ref_interval) {
            const [val_min, val_max] = val_interval
            const [ref_min, ref_max] = ref_interval

            // Calculate how much the value drops BELOW the reference floor
            let low_margin = 0
            if (val_min < ref_min) {
                low_margin = val_min === -Infinity ? Infinity : ref_min - val_min
            }

            // Calculate how much the value exceeds ABOVE the reference ceiling
            let high_margin = 0
            if (val_max > ref_max) {
                high_margin = val_max === Infinity ? Infinity : val_max - ref_max
            }

            // If it doesn't break any boundaries, it's normal
            if (low_margin === 0 && high_margin === 0) {
                return { is_normal: true, arrow_type: null }
            }

            // Tie-breaker: If it breaks both boundaries equally (Example 1: 0-6 vs 1-5)
            if (low_margin === high_margin) {
                return { is_normal: false, arrow_type: 'exclamation' }
            }

            // Return directional arrow based on which margin is worse
            if (high_margin > low_margin) return { is_normal: false, arrow_type: 'up' }
            if (low_margin > high_margin) return { is_normal: false, arrow_type: 'down' }
        }

        // --- Fallback to text/qualitative evaluation ---

        // Clean whitespaces and force lowercase
        const clean = (str: string) => str.toLowerCase().replace(/\s+/g, '')
        const val_clean = clean(value)
        const ref_clean = clean(reference_range)

        // Helper functions to identify positive/negative indicators
        const is_positive = (str: string) => str.includes('+') || str.includes('pos')
        const is_negative = (str: string) => str.includes('-') || str.includes('neg')

        // Direct exact match after cleaning (e.g. "normal" === "normal")
        if (val_clean === ref_clean) {
            return { is_normal: true, arrow_type: null }
        }

        // Handle variation matches (e.g. "neg" vs "negatif" or "pos" vs "+")
        if (is_negative(val_clean) && is_negative(ref_clean)) {
            return { is_normal: true, arrow_type: null }
        }
        if (is_positive(val_clean) && is_positive(ref_clean)) {
            return { is_normal: true, arrow_type: null }
        }

        // Handle explicit positive/negative cross-mismatches
        // (covers: ref is negative/val is positive, OR ref is positive/val is negative)
        if (
            (is_negative(ref_clean) && is_positive(val_clean)) ||
            (is_positive(ref_clean) && is_negative(val_clean))
        ) {
            return { is_normal: false, arrow_type: 'exclamation' }
        }

        // Default string mismatch fallback (e.g. "keruh" vs "jernih", "penuh" vs "0-5")
        if (val_clean !== ref_clean) {
            return { is_normal: false, arrow_type: 'exclamation' }
        }

        return { is_normal: true, arrow_type: null }
    }

    private init_global_tooltip() {
        if (ResultsMenuLabTable.tooltip_element) return
        const tooltip = document.createElement('div')
        tooltip.className = 'sn-singleton-tooltip'
        document.body.append(tooltip)
        ResultsMenuLabTable.tooltip_element = tooltip

        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement
            if (!target.closest('.state-loaded') && !target.closest('.sn-singleton-tooltip')) {
                ResultsMenuLabTable.hide_tooltip()
            }
        })

        window.addEventListener('scroll', () => {
            ResultsMenuLabTable.hide_tooltip()
        }, true)

        window.addEventListener(ModalManager.Event.Interaction, () => {
            ResultsMenuLabTable.hide_tooltip()
        })
    }

    private static show_tooltip(target_cell: HTMLElement, data: ResultsMenuLabResult) {
        const tooltip = ResultsMenuLabTable.tooltip_element
        if (!tooltip) return

        ResultsMenuLabTable.active_cell = target_cell

        const render_value = ResultsMenuLabTable.get_render_value(data)
        const clean = (value: any): string => value === '' ? '??' : value ?? '??'

        const value_text_div = create_element('div', { classes: 'tt-value' }, [
            create_element('span', { html: clean(data.value) }),
        ])

        if (!render_value.is_normal) {
            tooltip.classList.add('state-abnormal')
        } else {
            tooltip.classList.remove('state-abnormal')
        }

        if (render_value.arrow_type) {
            const icon = create_element('span', { classes: 'indicator-icon icon-flagged', text: render_value.arrow_type === 'up' ? '↑' : render_value.arrow_type === 'down' ? '↓' : '⚠' })
            value_text_div.append(icon)
        }

        tooltip.innerHTML = ''
        tooltip.append(
            value_text_div,
            create_element('div', { classes: 'tt-unit', html: clean(data.unit) }),
            create_element('div', { classes: 'tt-divider' }),
            create_element('div', {
                classes: 'tt-meta', html: [
                    `<p>Parameter:</p>`,
                    `${clean(data.parameter?.name)}`,
                    `<p>Satuan:</p>`,
                    `${clean(data.parameter?.reference_unit)}`,
                    `<p>Nilai Normal:</p>`,
                    `${clean(data.normal_values)}`,
                    `<p>Nilai Rujukan:</p>`,
                    `${clean(data.parameter?.reference_values)}`,
                    `<p>Tindakan:</p>`,
                    `${clean(data.order?.panel_desc)}`,
                    `<p>Dipesan pada:</p>`,
                    `${clean(data.order?.order_date)}`,
                    `<p>Selesai pada:</p>`,
                    `${clean(data.date)}`,
                    `<p>Perujuk:</p>`,
                    `${clean(data.referrer?.name)}`,
                    `<p>Alasan:</p>`,
                    `${clean(data.referrer?.reason)}`,
                ].join('')
            }),
        )

        tooltip.classList.add('is-visible')
        ResultsMenuLabTable.position_tooltip(target_cell)
    }

    private static position_tooltip(target: HTMLElement) {
        const tooltip = ResultsMenuLabTable.tooltip_element
        if (!tooltip) return

        const rect = target.getBoundingClientRect()
        const window_h = window.innerHeight
        const tooltip_h = tooltip.offsetHeight
        const gap = 4

        let visual_y = rect.bottom + gap

        if (visual_y + tooltip_h > window_h) {
            visual_y = window_h - tooltip_h
        }

        if (visual_y < 0) {
            visual_y = 0
        }

        tooltip.style.top = `${visual_y + window.scrollY}px`
        tooltip.style.left = `${rect.left + window.scrollX + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`
    }

    private static hide_tooltip() {
        if (ResultsMenuLabTable.tooltip_element) {
            ResultsMenuLabTable.tooltip_element.classList.remove('is-visible')
        }
        ResultsMenuLabTable.active_cell = null
    }
}
