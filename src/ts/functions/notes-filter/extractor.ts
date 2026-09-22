import { SatinBaseFunctionExtractor } from '../../types/functions/base'
import { ExtractedNoteRecord, NotesFilterConfig } from '../../types/functions/notes-filter'
import { RequestPayloadBuilder } from '../../utils/api'
import { NotesFilterFunction } from './parent'

// Compiled once at the module scope
const DDMMYYYY_REGEX = /(\d{2})[-/](\d{2})[-/](\d{4})/
const YYYYMMDD_REGEX = /(\d{4})[-/](\d{2})[-/](\d{2})/

export class NotesFilterExtractor extends SatinBaseFunctionExtractor<NotesFilterFunction, NotesFilterConfig> {
    public async on_execute(): Promise<void> {
        const cppt_list = document.querySelector(this.parent.config.selectors.queries.rm_cppt_list)
        if (!cppt_list) return

        const record_tables = Array.from(
            cppt_list.querySelectorAll<HTMLElement>(this.parent.config.selectors.queries.rm_cppt_list_record_table)
        )

        const records: ExtractedNoteRecord[] = []
        const date_set = new Set<string>()

        for (const table of record_tables) {
            const row_id = table.id || table.getAttribute('data-recordid') || Math.random().toString()

            // 1. Target the Metadata/Author cell (2nd column) specifically
            const meta_cell = table.querySelector<HTMLElement>('td:nth-child(2)') || table

            let author = ''
            let formatted_date = ''

            if (meta_cell) {
                // Extract Author
                const bold_divs = meta_cell.querySelectorAll('div[style*="font-weight: bold"]')
                if (bold_divs.length > 0) {
                    author = bold_divs[0].textContent?.trim() || ''
                } else {
                    const first_div = meta_cell.querySelector('.x-grid-cell-inner > div')
                    author = first_div ? first_div.textContent?.trim() || '' : author
                }

                // 2. Exact Regex Match for "Tgl. DD-MM-YYYY" or "DD-MM-YYYY"
                const text = meta_cell.textContent || ''
                const ddmmyyyy_match = text.match(DDMMYYYY_REGEX)
                const yyyymmdd_match = text.match(YYYYMMDD_REGEX)

                if (ddmmyyyy_match) {
                    const [, day, month, year] = ddmmyyyy_match
                    formatted_date = `${year}-${month}-${day}` // Standardizes to YYYY-MM-DD
                } else if (yyyymmdd_match) {
                    const [, year, month, day] = yyyymmdd_match
                    formatted_date = `${year}-${month}-${day}`
                }

                if (formatted_date) {
                    date_set.add(formatted_date)
                }
            }

            records.push({
                id: row_id,
                element: table,
                author,
                date: formatted_date,
            })
        }

        // Fetch User Name ONCE
        let user_name = this.parent.data.extracted_data?.user_name || null

        if (!user_name) {
            try {
                const result = await this.parent.engine.api.api_request<any>({
                    base_path: 'authentication/isAuthenticate',
                    payload: new RequestPayloadBuilder(),
                })

                if (result?.data?.NAME) {
                    user_name = result.data.NAME.trim()
                }
            } catch (err) {
                console.error('[NotesFilter] Failed to fetch user name', err)
            }
        }

        // Sort dates descending (newest date first)
        const sorted_dates = Array.from(date_set).sort((a, b) => b.localeCompare(a))

        this.parent.data.extracted_data = {
            records,
            available_dates: sorted_dates,
            user_name,
        }
    }
}
