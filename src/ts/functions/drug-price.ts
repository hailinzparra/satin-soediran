import { ExtensionDriver, ExtensionFunction } from '../types'
import { DB_DRUG_PRICE } from '../databases/db-drug-price'

export interface DrugPriceItem {
    id: string
    price: number
    capital?: number
}

export interface DrugPriceRegistry {
    [drug_name: string]: DrugPriceItem
}

export class DrugPriceFunction extends ExtensionFunction {
    apply() {
        const settings = this.get_settings()
        const show_drug_price = settings.emr_show_drug_price
        if (show_drug_price) {
            this.inject_price_badges({
                title: settings.emr_show_drug_price_summary_title,
                more_title: settings.emr_show_drug_price_summary_more_title,
                minimal_display: settings.emr_show_drug_price_minimal_display,
                show_unit_price_summary: settings.emr_show_drug_price_show_unit_summary,
            })
        } else {
            document.querySelectorAll('.ext-price-badge-group').forEach(el => el.remove())
            document.querySelectorAll('.ext-grand-summary-card').forEach(el => el.remove())
        }
    }

    on_debounce() {
        this.extract_pricing_data()
        this.apply()
    }

    private extract_pricing_data() {
        const drivers = this.get_drivers()
        const driver = drivers[ExtensionDriver.DrugPrices]
        if (!driver) return

        const prices_registry: DrugPriceRegistry = driver.data || {}
        let has_new_data = false

        const active_pickers = document.querySelectorAll('ul[id^="barang-combo-"][id$="-picker-listEl"]')
        active_pickers.forEach(picker => {
            const product_cards = picker.querySelectorAll('.x-boundlist-item')
            product_cards.forEach(card => {
                const inner_divs = card.querySelectorAll('div')
                if (inner_divs.length < 5) return
                const raw_item_name = inner_divs[0].textContent?.trim() || ''
                const match = raw_item_name.match(/^\[\s*(\d+)\s*\]\s*-\s*(.+)$/)
                if (match) {
                    const item_id = match[1]
                    const clean_name = match[2].trim()
                    let raw_price_num = 0

                    inner_divs.forEach(div => {
                        const text = div.textContent || ''
                        if (text.includes('Harga:')) {
                            const matched_price = text.replace(/[^0-9.]/g, '')
                            raw_price_num = parseFloat(matched_price) || 0
                        }
                    })

                    if (clean_name && raw_price_num > 0) {
                        const current_item = prices_registry[clean_name]
                        const is_price_changed = !current_item || current_item.price !== raw_price_num

                        if (is_price_changed) {
                            prices_registry[clean_name] = {
                                ...(current_item ?? {}),
                                price: raw_price_num,
                                id: item_id,
                            }
                            has_new_data = true
                        }
                    }
                }
            })
        })
        if (has_new_data) {
            driver.data = prices_registry
            driver.save()
        }
    }

    private inject_price_badges(options: {
        title: string,
        more_title: string,
        minimal_display: boolean,
        show_unit_price_summary: boolean,
    }) {
        const panels = document.querySelectorAll('.x-panel-bodyWrap')
        if (!panels.length) {
            document.querySelectorAll('.ext-grand-summary-card').forEach(el => el.remove())
            return
        }

        const drivers = this.get_drivers()
        const driver = drivers[ExtensionDriver.DrugPrices]
        if (!driver) return

        const prices_registry: DrugPriceRegistry = driver.data || {}
        const min_display = options.minimal_display
        const currency_formatter = new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: min_display ? 0 : 2,
            maximumFractionDigits: min_display ? 0 : 2,
        })
        let has_new_data_from_rows = false

        panels.forEach(panel => {
            const rows = panel.querySelectorAll('div[id^="tableview-"] table.x-grid-item tr.x-grid-row')
            const local_header_container = panel.querySelector('.x-grid-header-ct')
            const active_table_scroller = panel.querySelector('div[id^="tableview-"]')

            if (!rows.length || !local_header_container || !active_table_scroller) {
                panel.querySelectorAll('.ext-grand-summary-card').forEach(el => el.remove())
                return
            }

            let grand_price_sum = 0
            let grand_total_sum = 0
            let grand_capital_unit_sum = 0
            let grand_capital_total_sum = 0

            let item_count = 0
            let total_item_count = 0
            let valid_badges_rendered = 0

            let name_column_id: string | null = null
            let qty_column_id: string | null = null
            let row_price_column_id: string | null = null
            let total_price_column_id: string | null = null

            const local_headers = local_header_container.querySelectorAll('.x-column-header')
            local_headers.forEach(header => {
                const text_el = header.querySelector('.x-column-header-text-inner')
                if (!text_el) return

                const sanitized_text = text_el.textContent?.trim().replace(/\s+/g, '').toLowerCase()
                const component_id = header.getAttribute('data-componentid')

                if (sanitized_text === 'namaobat') {
                    name_column_id = component_id
                } else if (sanitized_text === 'jumlah') {
                    qty_column_id = component_id
                } else if (sanitized_text === 'hargasatuan') {
                    row_price_column_id = component_id
                } else if (sanitized_text === 'hargatotal') {
                    total_price_column_id = component_id
                }
            })

            const name_selector = name_column_id ? `td[data-columnid="${name_column_id}"]` : 'td:nth-child(5)'
            const qty_selector = qty_column_id ? `td[data-columnid="${qty_column_id}"]` : 'td:nth-child(7)'
            const row_price_selector = row_price_column_id ? `td[data-columnid="${row_price_column_id}"]` : 'td:nth-child(12)'
            const total_price_selector = total_price_column_id ? `td[data-columnid="${total_price_column_id}"]` : 'td:nth-child(13)'

            rows.forEach(row => {
                const name_cell_inner = row.querySelector(`${name_selector} .x-grid-cell-inner`)
                if (!name_cell_inner) return

                const child_nodes = Array.from(name_cell_inner.childNodes)
                let drug_name = ''
                for (const node of child_nodes) {
                    if (node.nodeType === Node.TEXT_NODE) drug_name += node.textContent
                    else if (node.nodeType === Node.ELEMENT_NODE && !(node as HTMLElement).classList.contains('ext-price-badge-group')) {
                        drug_name += node.textContent
                    }
                }
                drug_name = drug_name.trim()

                const qty_cell_inner = row.querySelector(`${qty_selector} .x-grid-cell-inner`)
                let quantity = parseFloat(qty_cell_inner?.textContent?.trim() || '0')
                if (isNaN(quantity)) quantity = 0

                const local_item = prices_registry[drug_name]
                const fallback_item = DB_DRUG_PRICE[drug_name]
                let cached_item = local_item || fallback_item

                let did_update_from_row = false

                if (total_price_selector && quantity > 0) {
                    const total_cell_inner = row.querySelector(`${total_price_selector} .x-grid-cell-inner`)
                    if (total_cell_inner) {
                        const raw_total_price = total_cell_inner.textContent?.replace(/[^0-9.]/g, '').replace(/\./g, '') || ''
                        const parsed_total_price = parseFloat(raw_total_price) || 0
                        if (parsed_total_price > 0) {
                            const expected_rounded_total = cached_item ? Math.round(cached_item.price * quantity) : -1
                            if (expected_rounded_total !== Math.round(parsed_total_price)) {
                                const derived_unit_price = parsed_total_price / quantity
                                prices_registry[drug_name] = {
                                    ...(local_item ?? fallback_item ?? { id: '', capital: 0 }),
                                    price: derived_unit_price,
                                }
                                cached_item = prices_registry[drug_name]
                                has_new_data_from_rows = true
                                did_update_from_row = true
                            }
                        }
                    }
                }

                if (!did_update_from_row && row_price_selector) {
                    const price_cell_inner = row.querySelector(`${row_price_selector} .x-grid-cell-inner`)
                    if (price_cell_inner) {
                        const raw_row_price = price_cell_inner.textContent?.replace(/[^0-9.]/g, '').replace(/\./g, '') || ''
                        const parsed_row_price = parseFloat(raw_row_price) || 0

                        if (parsed_row_price > 0) {
                            const should_update = !cached_item || Math.round(cached_item.price) !== Math.round(parsed_row_price)

                            if (should_update) {
                                prices_registry[drug_name] = {
                                    ...(local_item ?? fallback_item ?? { id: '', capital: 0 }),
                                    price: parsed_row_price,
                                }
                                cached_item = prices_registry[drug_name]
                                has_new_data_from_rows = true
                            }
                        }
                    }
                }

                if (!cached_item || cached_item.price === undefined) {
                    name_cell_inner.querySelector('.ext-price-badge-group')?.remove()
                    return
                }

                const unit_price = cached_item.price
                const line_total = unit_price * quantity
                const unit_capital = cached_item.capital || 0
                const line_capital_total = unit_capital * quantity

                grand_price_sum += unit_price
                grand_total_sum += line_total
                grand_capital_unit_sum += unit_capital
                grand_capital_total_sum += line_capital_total

                item_count++
                total_item_count += quantity
                valid_badges_rendered++

                const existing_group = name_cell_inner.querySelector('.ext-price-badge-group') as HTMLElement | null
                const expected_data_attr = min_display
                    ? `${unit_price}-${line_total}-min`
                    : `${unit_price}-${line_total}-${unit_capital}`

                if (existing_group && existing_group.dataset.priceState === expected_data_attr) return

                existing_group?.remove()

                const badge_group = document.createElement('div')
                badge_group.className = 'ext-price-badge-group'
                badge_group.dataset.priceState = expected_data_attr
                badge_group.style.cssText = `display: flex !important; flex-wrap: wrap !important; gap: 6px !important; row-gap: 4px !important; margin-top: 4px !important; font-size: 11px !important; font-weight: bold !important; pointer-events: none !important;`

                const unit_badge = document.createElement('span')
                unit_badge.style.cssText = `background-color: #e8f5e9 !important; color: #2e7d32 !important; padding: 1px 6px !important; border-radius: 4px !important; white-space: nowrap !important;`
                unit_badge.innerHTML = min_display
                    ? `${currency_formatter.format(Math.round(unit_price))}`
                    : `Satuan: Rp ${currency_formatter.format(unit_price)}`

                const total_badge = document.createElement('span')
                total_badge.style.cssText = `background-color: #e3f2fd !important; color: #1565c0 !important; padding: 1px 6px !important; border-radius: 4px !important; white-space: nowrap !important;`
                total_badge.innerHTML = min_display
                    ? `${currency_formatter.format(Math.round(line_total))} (${quantity})`
                    : `Total (${quantity}): Rp ${currency_formatter.format(line_total)}`

                badge_group.appendChild(unit_badge)
                badge_group.appendChild(total_badge)

                if (!min_display && unit_capital > 0) {
                    const capital_unit_badge = document.createElement('span')
                    capital_unit_badge.style.cssText = `background-color: #fff3e0 !important; color: #e65100 !important; padding: 1px 6px !important; border-radius: 4px !important; white-space: nowrap !important;`
                    capital_unit_badge.innerHTML = `Beli: Rp ${currency_formatter.format(unit_capital)}`

                    const capital_total_badge = document.createElement('span')
                    capital_total_badge.style.cssText = `background-color: #ffebee !important; color: #c62828 !important; padding: 1px 6px !important; border-radius: 4px !important; white-space: nowrap !important;`
                    capital_total_badge.innerHTML = `Total Beli (${quantity}): Rp ${currency_formatter.format(line_capital_total)}`

                    badge_group.appendChild(capital_unit_badge)
                    badge_group.appendChild(capital_total_badge)
                }

                name_cell_inner.appendChild(badge_group)
            })

            const expected_summary_state = `${grand_price_sum}-${grand_total_sum}-${grand_capital_unit_sum}-${grand_capital_total_sum}-${valid_badges_rendered}-${options.show_unit_price_summary}`
            const existing_summary = active_table_scroller.querySelector('.ext-grand-summary-card') as HTMLElement | null

            if (valid_badges_rendered === 0) {
                existing_summary?.remove()
                return
            }

            if (existing_summary && existing_summary.dataset.summaryState === expected_summary_state) {
                if (active_table_scroller.lastChild !== existing_summary) {
                    active_table_scroller.appendChild(existing_summary)
                }
                return
            }

            existing_summary?.remove()

            const summary_card = document.createElement('div')
            summary_card.className = 'ext-grand-summary-card'
            summary_card.dataset.summaryState = expected_summary_state
            summary_card.style.cssText = `display: block !important; position: sticky !important; bottom: 0 !important; left: 0 !important; z-index: 99999 !important; width: 96% !important; margin: 15px auto 5px auto !important; background: #ffffff !important; border: 2px dashed #b5bfc7 !important; border-radius: 6px !important; padding: 12px 14px !important; box-sizing: border-box !important; box-shadow: 0 -4px 12px rgba(0,0,0,0.08) !important;`

            const formatted_total_title = min_display ? 'TOTAL' : `TOTAL (${item_count} Obat, ${total_item_count} Pcs)`
            const formatted_total_val = min_display ? Math.round(grand_total_sum) : grand_total_sum
            const total_margin_diff = grand_total_sum - grand_capital_total_sum

            let table_rows_html = `
                <tr>
                    <th colspan="2" style="text-align: left !important; padding-bottom: 6px !important; font-size: 13px !important; font-weight: bold !important; color: #37474f !important; text-transform: uppercase !important; letter-spacing: 0.5px !important;">
                        ${options.title}
                    </th>
                </tr>
                <tr style="background-color: #e3f2fd !important; color: #1565c0 !important; font-weight: bold !important;">
                    <td style="padding: 6px 10px !important; border: 1px solid #bbdefb !important; border-right: 0 !important;">${formatted_total_title}</td>
                    <td style="padding: 6px 10px !important; border: 1px solid #bbdefb !important; border-left: 0 !important; text-align: right !important;">Rp ${currency_formatter.format(formatted_total_val)}</td>
                </tr>
            `

            if (!min_display) {
                table_rows_html += `
                    <tr>
                        <th colspan="2" style="text-align: left !important; padding: 6px 0px !important; font-size: 12px !important; font-weight: bold !important; color: #455a64 !important; text-transform: uppercase !important; letter-spacing: 0.5px !important;">
                            ${options.more_title}
                        </th>
                    </tr>
                    <tr style="background-color: #ffebee !important; color: #c62828 !important; font-weight: bold !important;">
                        <td style="padding: 6px 10px !important; border: 1px solid #ffcdd2 !important; border-right: 0 !important;">TOTAL HARGA BELI (${item_count} Obat, ${total_item_count} Pcs)</td>
                        <td style="padding: 6px 10px !important; border: 1px solid #ffcdd2 !important; border-left: 0 !important; text-align: right !important;">Rp ${currency_formatter.format(grand_capital_total_sum)}</td>
                    </tr>
                    <tr style="background-color: #f4f6f7 !important; color: #37474f !important; font-weight: bold !important;">
                        <td style="padding: 6px 10px !important; border: 1px solid #cfd8dc !important; border-right: 0 !important;">SELISIH (Keuntungan Bruto)</td>
                        <td style="padding: 6px 10px !important; border: 1px solid #cfd8dc !important; border-left: 0 !important; text-align: right !important; color: ${total_margin_diff >= 0 ? '#2e7d32' : '#c62828'} !important;">Rp ${currency_formatter.format(total_margin_diff)}</td>
                    </tr>
                `

                if (options.show_unit_price_summary) {
                    table_rows_html += `
                        <tr style="background-color: #e8f5e9 !important; color: #2e7d32 !important; font-weight: bold !important;">
                            <td style="padding: 6px 10px !important; border: 1px solid #c8e6c9 !important; border-right: 0 !important;">TOTAL HARGA SATUAN (${item_count} Obat)</td>
                            <td style="padding: 6px 10px !important; border: 1px solid #c8e6c9 !important; border-left: 0 !important; text-align: right !important;">Rp ${currency_formatter.format(grand_price_sum)}</td>
                        </tr>
                        <tr style="background-color: #fff3e0 !important; color: #e65100 !important; font-weight: bold !important;">
                            <td style="padding: 6px 10px !important; border: 1px solid #ffe0b2 !important; border-right: 0 !important;">TOTAL HARGA BELI SATUAN (${item_count} Obat)</td>
                            <td style="padding: 6px 10px !important; border: 1px solid #ffe0b2 !important; border-left: 0 !important; text-align: right !important;">Rp ${currency_formatter.format(grand_capital_unit_sum)}</td>
                        </tr>
                    `
                }
            }

            summary_card.innerHTML = `
                <table style="width: 100% !important; border-collapse: collapse !important; font-size: 12px !important; font-family: inherit !important;">
                    <tbody>
                        ${table_rows_html}
                    </tbody>
                </table>
            `

            active_table_scroller.appendChild(summary_card)
        })

        if (has_new_data_from_rows) {
            driver.data = prices_registry
            driver.save()
        }
    }
}
