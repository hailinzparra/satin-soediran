import { SatinBaseFunctionInjector, SatinBaseFunctionTargetNode } from '../../types/functions/base'
import { FilterCategory, NotesFilterConfig } from '../../types/functions/notes-filter'
import { NotesFilterFunction } from './parent'

export class NotesFilterInjector extends SatinBaseFunctionInjector<NotesFilterFunction, NotesFilterConfig> {
    private container_class = 'satin-notes-filter-menu'

    private dates_row_element: HTMLElement | null = null
    private active_date_buttons: Map<string, HTMLButtonElement> = new Map()
    private current_dates_signature = ''

    public async on_execute(): Promise<void> {
        const cppt_list = document.querySelector<HTMLElement>(this.parent.config.selectors.queries.rm_cppt_list)
        if (!cppt_list) return

        this.ensure_ui_mounted(cppt_list)
        this.apply_filters()
    }

    public reset(target_node?: SatinBaseFunctionTargetNode): void {
        const container = document.querySelector(`.${this.container_class}`)
        if (container) container.remove()

        const records = this.parent.data.extracted_data.records || []
        records.forEach((record) => {
            record.element.style.display = ''
        })

        this.dates_row_element = null
        this.active_date_buttons.clear()
        this.current_dates_signature = ''

        this.parent.reset_data()
    }

    private ensure_ui_mounted(parent_node: HTMLElement): void {
        if (parent_node.querySelector(`.${this.container_class}`)) return

        if (getComputedStyle(parent_node).position === 'static') {
            parent_node.style.position = 'relative'
        }

        const container = document.createElement('div')
        container.className = this.container_class

        // Toggle Row (ALL, MINE, DOCTORS, SEARCH)
        const toggle_row = document.createElement('div')
        toggle_row.className = 'satin-notes-filter-toggles'

        const toggle_group = document.createElement('div')
        toggle_group.className = 'satin-notes-toggle-group'

        const categories: FilterCategory[] = ['ALL', 'MINE', 'DOCTORS', 'SEARCH']
        categories.forEach((cat) => {
            const btn = document.createElement('button')
            btn.type = 'button'
            btn.textContent = cat
            btn.dataset.category = cat
            btn.className = `satin-notes-filter-btn ${this.parent.data.values_to_render.active_category === cat ? 'active' : ''
                }`

            btn.addEventListener('click', () => this.set_category(cat))
            toggle_group.appendChild(btn)
        })

        toggle_row.appendChild(toggle_group)

        // Search Input Field
        const search_input = document.createElement('input')
        search_input.type = 'text'
        search_input.placeholder = 'e.g. imad...'
        search_input.className = 'satin-notes-search-input'
        search_input.style.display =
            this.parent.data.values_to_render.active_category === 'SEARCH' ? 'inline-block' : 'none'
        search_input.value = this.parent.data.values_to_render.search_query || ''

        search_input.addEventListener('input', (e) => {
            this.parent.data.values_to_render.search_query = (e.target as HTMLInputElement).value
            this.apply_filters()
        })

        toggle_row.appendChild(search_input)

        // Date Buttons Bar
        const dates_row = document.createElement('div')
        dates_row.className = 'satin-notes-dates-row'
        this.dates_row_element = dates_row

        container.appendChild(toggle_row)
        container.appendChild(dates_row)

        parent_node.appendChild(container)

        this.attach_destruction_listener(container)

        // Dynamic Scroller Padding Adjustment
        const scroller =
            parent_node.querySelector<HTMLElement>('.x-scroller') ||
            parent_node.querySelector<HTMLElement>('.x-grid-view') ||
            parent_node

        if (scroller) {
            const resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const height =
                        entry.borderBoxSize?.[0]?.blockSize ?? entry.target.getBoundingClientRect().height
                    scroller.style.paddingTop = `${height}px`
                }
            })
            resizeObserver.observe(container)
        }
    }

    private set_category(cat: FilterCategory): void {
        this.parent.data.values_to_render.active_category = cat

        const container = document.querySelector(`.${this.container_class}`)
        if (!container) return

        const buttons = container.querySelectorAll<HTMLButtonElement>('.satin-notes-filter-btn')
        buttons.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.category === cat)
        })

        const search_input = container.querySelector<HTMLInputElement>('.satin-notes-search-input')
        if (search_input) {
            search_input.style.display = cat === 'SEARCH' ? 'inline-block' : 'none'
            if (cat === 'SEARCH') search_input.focus()
        }

        this.apply_filters()
    }

    private set_date(date: string): void {
        this.parent.data.values_to_render.active_date = date
        this.apply_filters()
    }

    private render_date_buttons(): void {
        if (!this.dates_row_element) {
            const container = document.querySelector(`.${this.container_class}`)
            this.dates_row_element = container?.querySelector<HTMLDivElement>('.satin-notes-dates-row') || null
            if (!this.dates_row_element) return
        }

        const available_dates = this.parent.data.extracted_data.available_dates || []
        const records = this.parent.data.extracted_data.records || []
        const user_name = (this.parent.data.extracted_data.user_name || '').toLowerCase()
        const { active_category, active_date, search_query } = this.parent.data.values_to_render

        // Construct local today date string (YYYY-MM-DD) avoiding GMT offset shifts
        const now = new Date()
        const local_year = now.getFullYear()
        const local_month = String(now.getMonth() + 1).padStart(2, '0')
        const local_day = String(now.getDate()).padStart(2, '0')
        const today_str = `${local_year}-${local_month}-${local_day}`

        // Category / Author criteria matcher
        const matches_category_fn = (rec: typeof records[0]) => {
            const author_lower = rec.author.toLowerCase()

            if (active_category === 'MINE') {
                return user_name !== '' && author_lower.includes(user_name)
            }
            if (active_category === 'DOCTORS') {
                return author_lower.includes('dr.') || author_lower.includes('drg.')
            }
            if (active_category === 'SEARCH' && search_query.trim() !== '') {
                return author_lower.includes(search_query.toLowerCase())
            }
            return true
        }

        const category_matching_records = records.filter(matches_category_fn)

        const date_items: { key: string; label: string }[] = []

        // 1. ALL Date Button
        date_items.push({
            key: 'ALL',
            label: `ALL (${category_matching_records.length}/${records.length})`
        })

        // 2. Specific Date Buttons
        available_dates.forEach((date_key) => {
            const records_on_date = records.filter((r) => r.date === date_key)
            const total_on_date = records_on_date.length
            const category_matches_on_date = records_on_date.filter(matches_category_fn).length

            // Format date key ("YYYY-MM-DD") to "DD-MM"
            const date_parts = date_key.split('-')
            const formatted_dd_mm = date_parts.length === 3 ? `${date_parts[2]}-${date_parts[1]}` : date_key

            // Star symbol appears only if date is local today and has notes
            const is_today = date_key === today_str
            const has_matches = total_on_date > 0
            const star_prefix = is_today && has_matches ? '★' : ''

            date_items.push({
                key: date_key,
                label: `${star_prefix}${formatted_dd_mm} (${category_matches_on_date}/${total_on_date})`
            })
        })

        const new_signature = date_items.map((item) => item.key).join('|')

        // In-place DOM update when structure hasn't changed
        if (this.current_dates_signature === new_signature && this.active_date_buttons.size > 0) {
            date_items.forEach((item) => {
                const btn = this.active_date_buttons.get(item.key)
                if (btn) {
                    if (btn.textContent !== item.label) btn.textContent = item.label
                    btn.classList.toggle('active', item.key === active_date)
                }
            })
            return
        }

        // Full DOM rebuild
        this.dates_row_element.innerHTML = ''
        this.active_date_buttons.clear()
        this.current_dates_signature = new_signature

        date_items.forEach((item) => {
            const btn = document.createElement('button')
            btn.type = 'button'
            btn.textContent = item.label
            btn.className = `satin-notes-date-btn ${active_date === item.key ? 'active' : ''}`
            btn.addEventListener('click', () => this.set_date(item.key))

            this.dates_row_element!.appendChild(btn)
            this.active_date_buttons.set(item.key, btn)
        })
    }

    public apply_filters(): void {
        const { active_category, active_date, search_query } = this.parent.data.values_to_render
        const records = this.parent.data.extracted_data.records || []
        const user_name = (this.parent.data.extracted_data.user_name || '').toLowerCase()

        records.forEach((rec) => {
            let matches_category = true
            let matches_date = true

            // Category / Author matching
            const author_lower = rec.author.toLowerCase()
            if (active_category === 'MINE') {
                matches_category = user_name !== '' && author_lower.includes(user_name)
            } else if (active_category === 'DOCTORS') {
                matches_category = author_lower.includes('dr.') || author_lower.includes('drg.')
            } else if (active_category === 'SEARCH' && search_query.trim() !== '') {
                matches_category = author_lower.includes(search_query.toLowerCase())
            }

            // Date matching
            if (active_date !== 'ALL') {
                matches_date = rec.date === active_date
            }

            rec.element.style.display = matches_category && matches_date ? '' : 'none'
        })

        this.render_date_buttons()
    }

    private attach_destruction_listener(element: HTMLElement): void {
        const observer = new MutationObserver(() => {
            if (!element.isConnected) {
                observer.disconnect()
                this.reset()
            }
        })

        observer.observe(document.body, { childList: true, subtree: true })
    }
}
