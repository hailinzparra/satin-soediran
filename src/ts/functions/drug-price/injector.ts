import { DrugPriceData } from '../../types/functions/drug-price'
import { create_element } from '../../utils/dom'
import { DrugPriceFunction } from './parent'

type TargetNode = HTMLElement | Document

interface ColumnIds {
    name: string | null
    qty: string | null
    unit_price: string | null
    total_price: string | null
}

interface ExtractedData {
    name: string
    qty: number
    unit_price: number
    total_price: number
}

interface InjectPriceBadgesValues {
    summary: {
        unit_price_sum: number
        total_price_sum: number
        capital_unit_sum: number
        capital_total_sum: number
    }
    count: {
        item: number
        total_item: number
    }
}

interface InjectPriceBadgesOptions {
    summary_title: string
    summary_full_title: string
    full_display: boolean
    show_unit_summary: boolean
}

export class DrugPriceInjector {
    private has_new_data: boolean = false
    private new_price_data: DrugPriceData = {}
    private currency_formatter: Intl.NumberFormat = this.get_currency_formatter()

    constructor(
        protected parent: DrugPriceFunction
    ) { }

    inject() {
        this.has_new_data = false
        this.new_price_data = this.parent.get_new_price_data()

        this.inject_price_badges()

        if (this.has_new_data) {
            const driver = this.parent.get_new_price_driver()
            driver.data = this.new_price_data
            driver.save()
        }
    }

    reset(target_node: TargetNode = document) {
        this.remove_summary_card(target_node)
        this.remove_price_badge_group(target_node)
    }

    remove_summary_card(target_node: TargetNode = document) {
        target_node.querySelectorAll(`.${this.parent.classnames.summary_card}`).forEach(el => el.remove())
    }

    remove_price_badge_group(target_node: TargetNode = document) {
        target_node.querySelectorAll(`.${this.parent.classnames.price_badge_group}`).forEach(el => el.remove())
    }

    private get_currency_formatter(full_display: boolean = false) {
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: full_display ? 2 : 0,
            maximumFractionDigits: full_display ? 2 : 0,
        })
    }

    inject_price_badges() {
        const panels = document.querySelectorAll<HTMLDivElement>('.x-panel[id*="resep"], .x-panel[id*="obat"]')

        if (!panels.length) {
            this.reset()
            return
        }

        const settings = this.parent.engine.get_settings()
        const options: InjectPriceBadgesOptions = {
            summary_title: settings.emr_show_drug_price_summary_title,
            summary_full_title: settings.emr_show_drug_price_summary_full_title,
            full_display: settings.emr_show_drug_price_full_display,
            show_unit_summary: settings.emr_show_drug_price_show_unit_summary,
        }

        this.currency_formatter = this.get_currency_formatter(options.full_display)

        panels.forEach(panel => {
            const table_head = panel.querySelector<HTMLDivElement>('.x-grid-header-ct')
            const table_body = panel.querySelector<HTMLDivElement>('div[id^="tableview-"]')
            const rows = table_body?.querySelectorAll<HTMLTableRowElement>('table.x-grid-item tr.x-grid-row')

            if (!table_head || !table_body || !rows?.length) {
                this.reset(panel)
                return
            }

            const values: InjectPriceBadgesValues = {
                summary: {
                    unit_price_sum: 0,
                    total_price_sum: 0,
                    capital_unit_sum: 0,
                    capital_total_sum: 0,
                },
                count: {
                    item: 0,
                    total_item: 0,
                },
            }

            const col_headers = table_head.querySelectorAll<HTMLDivElement>('.x-column-header')
            const column_ids: ColumnIds = this.extract_column_headers(col_headers)

            // badge rendering per row
            if (column_ids.name) {
                rows.forEach(row => this.extract_and_render_row(row, column_ids, values, options))
            }

            // summary card rendering
            this.render_summary_card(table_body, values, options)
        })
    }

    extract_column_headers(col_headers: NodeListOf<HTMLDivElement>): ColumnIds {
        const ids: ColumnIds = {
            name: null,
            qty: null,
            unit_price: null,
            total_price: null,
        }

        col_headers.forEach(header => {
            const text_el = header.querySelector('.x-column-header-text-inner')
            if (!text_el) return

            const sanitized_text = text_el.textContent?.trim().replace(/\s+/g, '').toLowerCase()
            const component_id = header.getAttribute('data-componentid')

            if (sanitized_text === 'namaobat') {
                ids.name = component_id
            } else if (sanitized_text === 'jumlah') {
                ids.qty = component_id
            } else if (sanitized_text === 'hargasatuan') {
                ids.unit_price = component_id
            } else if (sanitized_text === 'hargatotal') {
                ids.total_price = component_id
            }
        })

        return ids
    }

    extract_and_render_row(row: HTMLTableRowElement, column_ids: ColumnIds, values: InjectPriceBadgesValues, options: InjectPriceBadgesOptions) {
        const name_cell_inner = row.querySelector<HTMLDivElement>(`td[data-columnid="${column_ids.name}"] .x-grid-cell-inner`)
        if (!name_cell_inner) return

        const extracted_data: ExtractedData = {
            name: '',
            qty: 0,
            unit_price: 0,
            total_price: 0,
        }

        // try to extract name
        for (const node of Array.from(name_cell_inner.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE) extracted_data.name += node.textContent
            else if (node.nodeType === Node.ELEMENT_NODE && !(node as HTMLElement).classList.contains(this.parent.classnames.price_badge_group)) {
                extracted_data.name += node.textContent
            }
        }
        extracted_data.name = extracted_data.name.trim()

        // no name to work on, break early
        if (!extracted_data.name) {
            this.remove_price_badge_group(name_cell_inner)
            return
        }

        const saved_new_price_data = this.new_price_data[extracted_data.name]
        const saved_default_price_data = this.parent.get_db_price_data()[extracted_data.name]
        let current_price_data = saved_new_price_data || saved_default_price_data
        let did_evaluate_on_total_price = false

        // try to extract qty
        if (column_ids.qty) {
            const qty_cell_inner = row.querySelector<HTMLDivElement>(`td[data-columnid="${column_ids.qty}"] .x-grid-cell-inner`)
            extracted_data.qty = parseFloat(qty_cell_inner?.textContent?.trim() || '0')
            if (isNaN(extracted_data.qty)) extracted_data.qty = 0
        }

        // try to extract total price
        if (extracted_data.qty > 0 && column_ids.total_price) {
            const total_price_cell_inner = row.querySelector<HTMLDivElement>(`td[data-columnid="${column_ids.total_price}"] .x-grid-cell-inner`)
            if (total_price_cell_inner) {
                const raw_total_price = total_price_cell_inner.textContent?.replace(/[^0-9.]/g, '').replace(/\./g, '') || ''
                extracted_data.total_price = parseFloat(raw_total_price) || 0
            }
        }

        // try to update price with extracted total price / qty
        if (extracted_data.total_price > 0) {
            const should_update = !current_price_data ||
                Math.round(current_price_data.price * extracted_data.qty) !== Math.round(extracted_data.total_price)

            if (should_update) {
                this.new_price_data[extracted_data.name] = {
                    ...(saved_new_price_data ?? saved_default_price_data ?? { id: '', capital: 0 }),
                    price: extracted_data.total_price / extracted_data.qty,
                }
                current_price_data = this.new_price_data[extracted_data.name]
                this.has_new_data = true
            }
            did_evaluate_on_total_price = true
        }

        // try to extract unit price
        if (!did_evaluate_on_total_price && column_ids.unit_price) {
            const unit_price_cell_inner = row.querySelector<HTMLDivElement>(`td[data-columnid="${column_ids.unit_price}"] .x-grid-cell-inner`)
            if (unit_price_cell_inner) {
                const raw_unit_price = unit_price_cell_inner.textContent?.replace(/[^0-9.]/g, '').replace(/\./g, '') || ''
                extracted_data.unit_price = parseFloat(raw_unit_price) || 0
            }
        }

        // try to update price with extracted unit price
        if (extracted_data.unit_price > 0) {
            const should_update = !current_price_data ||
                Math.round(current_price_data.price) !== Math.round(extracted_data.unit_price)

            if (should_update) {
                this.new_price_data[extracted_data.name] = {
                    ...(saved_new_price_data ?? saved_default_price_data ?? { id: '', capital: 0 }),
                    price: extracted_data.unit_price,
                }
                current_price_data = this.new_price_data[extracted_data.name]
                this.has_new_data = true
            }
        }

        // if no price data found (not on db nor extracted), skip/remove badge rendering
        if (!current_price_data || typeof current_price_data.price !== 'number') {
            this.remove_price_badge_group(name_cell_inner)
            return
        }

        // finalized data, ready to render
        const row_qty = extracted_data.qty
        const row_unit_price = current_price_data.price
        const row_total_price = row_unit_price * row_qty
        const row_capital_unit = current_price_data.capital || 0
        const row_capital_total = row_capital_unit * row_qty

        values.summary.total_price_sum += row_total_price

        if (options.full_display) {
            values.summary.capital_unit_sum += row_capital_unit
            values.summary.capital_total_sum += row_capital_total
        }

        if (options.show_unit_summary) {
            values.summary.unit_price_sum += row_unit_price
        }

        values.count.item++
        values.count.total_item += row_qty

        const existing_price_badge_group = name_cell_inner.querySelector<HTMLDivElement>(`.${this.parent.classnames.price_badge_group}`)
        const expected_dataset_price_state = options.full_display
            ? `${row_unit_price}-${row_total_price}-${row_capital_unit}`
            : `${row_unit_price}-${row_total_price}-min`

        // item with exactly the same data (priceState) already rendered, skip rendering
        if (existing_price_badge_group && existing_price_badge_group.dataset.priceState === expected_dataset_price_state) {
            return
        }

        // already rendered but new data (priceState)? remove it
        existing_price_badge_group?.remove()

        // start rendering
        const c = create_element
        const new_price_badge_group = c('div', { classes: this.parent.classnames.price_badge_group })
        new_price_badge_group.dataset.priceState = expected_dataset_price_state

        const new_price_badge_group_children: HTMLElement[] = []

        const unit_price_badge = c('span', {
            classes: 'unit-price-badge',
            html: options.full_display
                ? `Satuan: Rp ${this.currency_formatter.format(row_unit_price)}`
                : `${this.currency_formatter.format(Math.round(row_unit_price))}`,
        })

        const total_price_badge = c('span', {
            classes: 'total-price-badge',
            html: options.full_display
                ? `Total (${row_qty}): Rp ${this.currency_formatter.format(row_total_price)}`
                : `${this.currency_formatter.format(Math.round(row_total_price))} (${row_qty})`,
        })

        new_price_badge_group_children.push(unit_price_badge, total_price_badge)

        if (options.full_display) {
            const capital_unit_badge = c('span', {
                classes: 'capital-unit-badge',
                html: `Beli: Rp ${this.currency_formatter.format(row_capital_unit)}`,
            })

            const capital_total_badge = c('span', {
                classes: 'capital-total-badge',
                html: `Total Beli (${row_qty}): Rp ${this.currency_formatter.format(row_capital_total)}`,
            })

            new_price_badge_group_children.push(capital_unit_badge, capital_total_badge)
        }

        new_price_badge_group.append(...new_price_badge_group_children)
        name_cell_inner.append(new_price_badge_group)
    }

    render_summary_card(table_body: HTMLDivElement, values: InjectPriceBadgesValues, options: InjectPriceBadgesOptions) {
        const existing_summary_card = table_body.querySelector<HTMLDivElement>(`.${this.parent.classnames.summary_card}`)
        const expected_dataset_summary_state
            = `${values.summary.unit_price_sum}-${values.summary.total_price_sum}-${values.summary.capital_unit_sum}`
            + `-${values.summary.capital_total_sum}-${values.count.item}-${options.show_unit_summary}`

        // summary card with exactly the same data (summaryState) already rendered, skip rendering
        if (existing_summary_card && existing_summary_card.dataset.summaryState === expected_dataset_summary_state) {
            // but hold on one sec, make sure they are at the very bottom
            if (table_body.lastChild !== existing_summary_card) {
                table_body.append(existing_summary_card)
            }
            return
        }

        // already rendered but new data (summaryState)? remove it
        existing_summary_card?.remove()

        // start rendering
        // wait, no item displaying their badge?
        if (values.count.item === 0) {
            // why bother put a summary
            return
        }

        // real start rendering
        const c = create_element
        const new_summary_card = c('div', { classes: this.parent.classnames.summary_card })
        new_summary_card.dataset.summaryState = expected_dataset_summary_state

        const format_field = (short_title: string, full_title: string, raw_value: number) => {
            return {
                title: options.full_display ? full_title : short_title,
                value: options.full_display ? raw_value : Math.round(raw_value),
            }
        }

        const formatted = {
            total_price_sum: format_field(
                'TOTAL',
                `TOTAL (${values.count.item} Obat, ${values.count.total_item} Pcs)`,
                values.summary.total_price_sum,
            ),
            capital_total_sum: format_field(
                'TOTAL HARGA BELI',
                `TOTAL HARGA BELI (${values.count.item} Obat, ${values.count.total_item} Pcs)`,
                values.summary.capital_total_sum,
            ),
            total_margin_diff: format_field(
                'SELISIH',
                'SELISIH (Keuntungan Bruto)',
                values.summary.total_price_sum - values.summary.capital_total_sum,
            ),
            unit_price_sum: format_field(
                'TOTAL HARGA SATUAN',
                `TOTAL HARGA SATUAN (${values.count.item} Obat)`,
                values.summary.unit_price_sum,
            ),
            capital_unit_sum: format_field(
                'TOTAL HARGA BELI SATUAN',
                `TOTAL HARGA BELI SATUAN (${values.count.item} Obat)`,
                values.summary.capital_unit_sum,
            ),
        }

        const table_rows: HTMLTableRowElement[] = []

        if (options.full_display) {
            table_rows.push(
                c('tr', { classes: 'summary-title' }, [
                    c('th', {
                        attrs: { colspan: '2' },
                        html: options.summary_title,
                    }),
                ]),
            )
        }

        table_rows.push(
            c('tr', { classes: 'summary-total-price-sum' }, [
                c('td', { html: formatted.total_price_sum.title }),
                c('td', { html: `Rp ${this.currency_formatter.format(formatted.total_price_sum.value)}` }),
            ]),
        )

        if (options.full_display) {
            table_rows.push(
                c('tr', { classes: 'summary-full-title' }, [
                    c('th', {
                        attrs: { colspan: '2' },
                        html: options.summary_full_title,
                    }),
                ]),
            )

            table_rows.push(
                c('tr', { classes: 'summary-capital-total-sum' }, [
                    c('td', { html: formatted.capital_total_sum.title }),
                    c('td', { html: `Rp ${this.currency_formatter.format(formatted.capital_total_sum.value)}` }),
                ]),
                c('tr', { classes: 'summary-total-margin-diff' }, [
                    c('td', { html: formatted.total_margin_diff.title }),
                    c('td', { html: `Rp ${this.currency_formatter.format(formatted.total_margin_diff.value)}` }),
                ]),
            )
        }

        if (options.show_unit_summary) {
            table_rows.push(
                c('tr', { classes: 'summary-unit-price-sum' }, [
                    c('td', { html: formatted.unit_price_sum.title }),
                    c('td', { html: `Rp ${this.currency_formatter.format(formatted.unit_price_sum.value)}` }),
                ]),
            )
            if (options.full_display) {
                table_rows.push(
                    c('tr', { classes: 'summary-capital-unit-sum' }, [
                        c('td', { html: formatted.capital_unit_sum.title }),
                        c('td', { html: `Rp ${this.currency_formatter.format(formatted.capital_unit_sum.value)}` }),
                    ]),
                )
            }
        }

        new_summary_card.append(c('table', {}, [c('tbody', {}, table_rows)]))
        table_body.append(new_summary_card)
    }
}
