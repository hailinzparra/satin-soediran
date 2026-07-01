import { create_element } from '../../utils/dom'
import { PrescriberNameFunction } from './parent'

type TargetNode = HTMLElement | Document

interface ColumnIds {
    prescription_id: string | null
}

interface ExtractedData {
    prescription_id: string
}

export class PrescriberNameInjector {
    constructor(
        protected parent: PrescriberNameFunction
    ) { }

    inject() {
        this.inject_prescriber_badges()
    }

    reset(target_node: TargetNode = document) {
        this.remove_prescriber_badge(target_node)
    }

    remove_prescriber_badge(target_node: TargetNode = document) {
        target_node.querySelectorAll(`.${this.parent.classnames.prescriber_badge}`).forEach(el => el.remove())
    }

    inject_prescriber_badges() {
        const panels = document.querySelectorAll<HTMLDivElement>('.x-panel[id*="resep"]')

        if (!panels.length) {
            this.reset()
            return
        }

        panels.forEach(panel => {
            const table_head = panel.querySelector<HTMLDivElement>('.x-grid-header-ct')
            const table_body = panel.querySelector<HTMLDivElement>('div[id^="tableview-"]')
            const rows = table_body?.querySelectorAll<HTMLTableRowElement>('table.x-grid-item tr.x-grid-row')

            if (!table_head || !table_body || !rows?.length) {
                this.reset(panel)
                return
            }

            const col_headers = table_head.querySelectorAll<HTMLDivElement>('.x-column-header')
            const column_ids: ColumnIds = this.extract_column_headers(col_headers)

            if (!column_ids.prescription_id) return

            rows.forEach(row => this.extract_and_render_row(row, column_ids))
        })
    }

    extract_column_headers(col_headers: NodeListOf<HTMLDivElement>): ColumnIds {
        const ids: ColumnIds = {
            prescription_id: null,
        }

        col_headers.forEach(header => {
            const text_el = header.querySelector('.x-column-header-text-inner')
            if (!text_el) return

            const sanitized_text = text_el.textContent?.trim().replace(/\s+/g, '').toLowerCase()
            const component_id = header.getAttribute('data-componentid')

            if (sanitized_text === 'no.resep' || sanitized_text === 'noresep') {
                ids.prescription_id = component_id
            }
        })

        return ids
    }

    extract_and_render_row(row: HTMLTableRowElement, column_ids: ColumnIds) {
        const name_cell_inner = row.querySelector<HTMLDivElement>(`td[data-columnid="${column_ids.prescription_id}"] .x-grid-cell-inner`)
        if (!name_cell_inner) return

        const extracted_data: ExtractedData = {
            prescription_id: '',
        }

        // try to extract prescription id
        for (const node of Array.from(name_cell_inner.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE) extracted_data.prescription_id += node.textContent
            else if (node.nodeType === Node.ELEMENT_NODE && !(node as HTMLElement).classList.contains(this.parent.classnames.prescriber_badge)) {
                extracted_data.prescription_id += node.textContent
            }
        }
        extracted_data.prescription_id = extracted_data.prescription_id.trim()

        // no "no.resep" column to work on, break early
        if (!extracted_data.prescription_id) {
            this.reset(name_cell_inner)
            return
        }

        const current_cache = this.parent.get_temp_data().prescriber_name_cache || {}
        const cached_data = current_cache[extracted_data.prescription_id]

        // no data yet, break early
        if (!cached_data || !cached_data.prescriber_name) {
            this.reset(name_cell_inner)
            return
        }

        const existing_prescriber_badge = name_cell_inner.querySelector<HTMLDivElement>(`.${this.parent.classnames.prescriber_badge}`)
        const expected_dataset_prescriber_state = cached_data.prescriber_name

        // item with exactly the same data (prescriberState) already rendered, skip rendering
        if (existing_prescriber_badge && existing_prescriber_badge.dataset.prescriberState === expected_dataset_prescriber_state) {
            return
        }

        // already rendered but new data (prescriberState)? remove it
        existing_prescriber_badge?.remove()

        // start rendering
        const c = create_element
        const new_prescriber_badge = c('div', {
            classes: `${this.parent.classnames.prescriber_badge}${cached_data.is_cito ? ' cito-badge' : ''}`,
            text: cached_data.is_cito
                ? `[CITO] ${cached_data.prescriber_name}`
                : `${cached_data.prescriber_name}`
        })
        new_prescriber_badge.dataset.prescriberState = expected_dataset_prescriber_state

        // add styling to parent, not set to default on reset() because it doesnt break, not a bad habit right?
        name_cell_inner.style.cssText += '; display: flex !important; flex-direction: column !important; align-items: flex-start !important;'
        name_cell_inner.append(new_prescriber_badge)
    }
}
