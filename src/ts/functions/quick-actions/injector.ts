import { SatinBaseFunctionInjector, SatinBaseFunctionTargetNode } from '../../types/functions/base'
import { QuickActionsConfig, QuickActionItem, PatientContext } from '../../types/functions/quick-actions'
import { QuickActionsFunction } from './parent'
import { Toast } from '../../utils/toast'
import { RequestPayloadBuilder } from '../../utils/api'
import { get_current_date_time, irandom } from '../../utils/misc'
import { Log } from '../../utils/logger'

export class QuickActionsInjector extends SatinBaseFunctionInjector<QuickActionsFunction, QuickActionsConfig> {
    private readonly menu_class = 'satin-quick-actions-menu'
    private readonly palette_id = 'satin-quick-palette-portal'

    private active_palette: HTMLDivElement | null = null
    private is_events_bound = false
    private selected_index = 0

    private readonly actions: QuickActionItem[] = [
        {
            id: 'visite',
            label: 'Add Layanan "Visite"',
            category: 'Layanan',
            get_secondary_badge: (ctx) => ({
                label: `VISIT: ${ctx?.visit_id || '---'}`,
                raw_id: ctx?.visit_id || '',
            }),
            get_processing_msg: (ctx) => `QA: Adding Visite... (${ctx.name} - Visit: ${ctx.visit_id})`,
            get_success_msg: (ctx) => `QA: Visite added! (${ctx.name} - Visit: ${ctx.visit_id})`,
            get_error_msg: (ctx) => `QA: Failed to add Visite for ${ctx.name}`,
        },
        {
            id: 'ekg',
            label: 'Add Layanan "Pembacaan EKG"',
            category: 'Layanan',
            get_secondary_badge: (ctx) => ({
                label: `VISIT: ${ctx?.visit_id || '---'}`,
                raw_id: ctx?.visit_id || '',
            }),
            get_processing_msg: (ctx) => `QA: Adding Pembacaan EKG... (${ctx.name} - Visit: ${ctx.visit_id})`,
            get_success_msg: (ctx) => `QA: EKG added! (${ctx.name} - Visit: ${ctx.visit_id})`,
            get_error_msg: (ctx) => `QA: Failed to add EKG for ${ctx.name}`,
        },
        {
            id: 'sign_resume',
            label: 'Sign "Resume Medis"',
            category: 'Sign',
            get_secondary_badge: (ctx) => ({
                label: `VISIT: ${ctx?.visit_id || '---'}`,
                raw_id: ctx?.visit_id || '',
            }),
            get_processing_msg: (ctx) => `QA: Signing Resume Medis... (Visit: ${ctx.visit_id})`,
            get_success_msg: (ctx) => `QA: Resume Medis signed! (Visit: ${ctx.visit_id})`,
            get_error_msg: (ctx) => `QA: Failed to sign Resume Medis (Visit: ${ctx.visit_id})`,
        },
        {
            id: 'sign_harian',
            label: 'Sign "Pengkajian Harian"',
            category: 'Sign',
            get_secondary_badge: (ctx) => ({
                label: `REG: ${ctx?.reg_id || '---'}`,
                raw_id: ctx?.reg_id || '',
            }),
            get_processing_msg: (ctx) => `QA: Signing Pengkajian Harian... (Reg: ${ctx.reg_id})`,
            get_success_msg: (ctx) => `QA: Pengkajian Harian signed! (Reg: ${ctx.reg_id})`,
            get_error_msg: (ctx) => `QA: Failed to sign Pengkajian Harian (Reg: ${ctx.reg_id})`,
        },
    ]

    public async on_execute(): Promise<void> {
        this.inject_menu()
        this.update_badges_if_opened()
    }

    public bind_events(): void {
        if (this.is_events_bound) return
        this.is_events_bound = true

        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.altKey && e.code === 'Slash') {
                e.preventDefault()
                const trigger = document.querySelector(`.${this.menu_class} .satin-quick-actions-trigger`) as HTMLButtonElement
                if (trigger) {
                    this.toggle_palette(trigger)
                }
            }
        })

        document.addEventListener('click', (e: MouseEvent) => {
            if (!this.active_palette) return

            const target = e.target as Node
            const trigger = document.querySelector(`.${this.menu_class} .satin-quick-actions-trigger`)

            const is_click_inside_palette = this.active_palette.contains(target)
            const is_click_on_trigger = trigger ? trigger.contains(target) : false

            if (!is_click_inside_palette && !is_click_on_trigger) {
                this.close_palette()
            }
        })
    }

    public reset(target_node?: SatinBaseFunctionTargetNode): void {
        const menus = document.querySelectorAll(`.${this.menu_class}`)
        menus.forEach(menu => menu.remove())
        this.close_palette()
    }

    inject_menu(): void {
        const parent_headers = document.querySelectorAll(this.parent.config.selectors.queries.layanan_workspace_header)
        const parent_header = parent_headers.item(0)

        if (parent_header) {
            const is_already_exists = parent_header.querySelector(`.${this.menu_class}`) !== null

            if (!is_already_exists) {
                const menu = this.create_menu()
                parent_header.append(menu)
            }
        }
    }

    create_menu(): HTMLDivElement {
        const menu = document.createElement('div')
        menu.classList.add(this.menu_class)

        const trigger_btn = document.createElement('button')
        trigger_btn.type = 'button'
        trigger_btn.className = 'satin-quick-actions-trigger'
        trigger_btn.innerHTML = `<span>Search actions...</span><kbd>Alt+/</kbd>`

        trigger_btn.addEventListener('click', (e) => {
            e.stopPropagation()
            this.toggle_palette(trigger_btn)
        })

        menu.appendChild(trigger_btn)
        return menu
    }

    private toggle_palette(trigger_btn: HTMLButtonElement): void {
        if (this.active_palette) {
            this.close_palette()
        } else {
            this.open_palette(trigger_btn)
        }
    }

    private open_palette(trigger_btn: HTMLButtonElement): void {
        const rect = trigger_btn.getBoundingClientRect()

        const palette = document.createElement('div')
        palette.id = this.palette_id
        palette.className = 'satin-quick-palette-portal'

        palette.style.top = `${rect.bottom + 6}px`
        palette.style.left = `${rect.left + rect.width / 2}px`

        const input = document.createElement('input')
        input.type = 'text'
        input.className = 'satin-quick-input'
        input.placeholder = 'Type action or command...'

        const dropdown = document.createElement('ul')
        dropdown.className = 'satin-quick-dropdown'

        palette.appendChild(input)
        palette.appendChild(dropdown)

        let filtered_actions: QuickActionItem[] = []

        const update_selection_ui = () => {
            const items = dropdown.querySelectorAll('.satin-quick-item:not(.satin-empty)')
            items.forEach((item, idx) => {
                if (idx === this.selected_index) {
                    item.classList.add('selected')
                    item.scrollIntoView({ block: 'nearest' })
                } else {
                    item.classList.remove('selected')
                }
            })
        }

        const render_items = (filter_text: string = '') => {
            dropdown.innerHTML = ''
            filtered_actions = this.actions.filter(item =>
                item.label.toLowerCase().includes(filter_text.toLowerCase())
            )

            this.selected_index = 0

            if (filtered_actions.length === 0) {
                const empty = document.createElement('li')
                empty.className = 'satin-quick-item satin-empty'
                empty.textContent = 'No matching actions found'
                dropdown.appendChild(empty)
                return
            }

            const patient = this.parent.data.patient

            filtered_actions.forEach((item, index) => {
                const secondary = item.get_secondary_badge(patient)

                const li = document.createElement('li')
                li.className = `satin-quick-item ${index === 0 ? 'selected' : ''}`
                li.dataset.actionId = item.id
                li.dataset.contextId = secondary.raw_id

                li.innerHTML = `
                    <span class="satin-item-label">${item.label}</span>
                    <div class="satin-item-badges">
                        <span class="satin-item-badge satin-badge-id">${secondary.label}</span>
                        <span class="satin-item-badge satin-badge-cat">${item.category}</span>
                    </div>
                `

                li.addEventListener('click', (e) => {
                    e.stopPropagation()
                    this.execute_action(item)
                    this.close_palette()
                })

                dropdown.appendChild(li)
            })
        }

        input.addEventListener('keydown', (e: KeyboardEvent) => {
            if (filtered_actions.length === 0) return

            if (e.key === 'ArrowDown') {
                e.preventDefault()
                this.selected_index = (this.selected_index + 1) % filtered_actions.length
                update_selection_ui()
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                this.selected_index = (this.selected_index - 1 + filtered_actions.length) % filtered_actions.length
                update_selection_ui()
            } else if (e.key === 'Enter') {
                e.preventDefault()
                const selected_action = filtered_actions[this.selected_index]
                if (selected_action) {
                    this.execute_action(selected_action)
                    this.close_palette()
                }
            } else if (e.key === 'Escape') {
                e.preventDefault()
                this.close_palette()
            }
        })

        input.addEventListener('input', (e) => {
            render_items((e.target as HTMLInputElement).value)
        })

        document.body.appendChild(palette)
        this.active_palette = palette

        render_items()
        input.focus()
    }

    private update_badges_if_opened(): void {
        if (!this.active_palette) return

        const patient = this.parent.data.patient
        const list_items = this.active_palette.querySelectorAll<HTMLLIElement>('.satin-quick-item:not(.satin-empty)')

        list_items.forEach((li) => {
            const action_id = li.dataset.actionId
            const action = this.actions.find(a => a.id === action_id)
            if (!action) return

            const secondary = action.get_secondary_badge(patient)

            if (li.dataset.contextId === secondary.raw_id) {
                return
            }

            li.dataset.contextId = secondary.raw_id
            const id_badge = li.querySelector('.satin-badge-id')
            if (id_badge) {
                id_badge.textContent = secondary.label
            }
        })
    }

    private close_palette(): void {
        if (this.active_palette) {
            this.active_palette.remove()
            this.active_palette = null
            this.selected_index = 0
        }
    }

    // Core implementation method
    private async add_layanan(visit_id: string, tindakan_id: number): Promise<boolean> {
        if (!visit_id) {
            Log.error('add_layanan requires a valid visit_id')
            return false
        }

        const payload = {
            ID: `data.model.TindakanMedis-${irandom(1, 100)}`,
            KUNJUNGAN: visit_id,
            TINDAKAN: tindakan_id,
            TANGGAL: get_current_date_time(),
            VERIFIKASI: 0,
            VERIFIKASI_OLEH: 0,
            VERIFIKASI_TANGGAL: null,
            OLEH: 0,
            STATUS: 1,
            SIMPAN: true,
        }

        const result = await this.parent.api_client.api_request({
            base_path: 'layanan/tindakanmedis',
            payload: new RequestPayloadBuilder({
                _dc: Date.now(),
            }),
        }, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        return result.success
    }

    // Convenient helper methods for specific actions
    private async add_visite(visit_id: string): Promise<boolean> {
        return this.add_layanan(visit_id, 8393)
    }

    private async add_ekg(visit_id: string): Promise<boolean> {
        return this.add_layanan(visit_id, 4474)
    }

    // Updated execution handler
    private async execute_action(item: QuickActionItem): Promise<void> {
        const patient_context: PatientContext = this.parent.data.patient || {
            mrn: 'UNKNOWN',
            visit_id: 'UNKNOWN',
            reg_id: 'UNKNOWN',
            name: 'UNKNOWN',
        }

        Toast.pop(item.get_processing_msg(patient_context), Toast.type.info)

        try {
            let is_success = false

            if (item.id === 'visite') {
                is_success = await this.add_visite(patient_context.visit_id)
            } else if (item.id === 'ekg') {
                is_success = await this.add_ekg(patient_context.visit_id)
            } else {
                // Mock execution delay for other unimplemented actions
                await new Promise((resolve) => setTimeout(resolve, 1200))
                is_success = true
            }

            if (is_success) {
                Toast.pop(item.get_success_msg(patient_context), Toast.type.success)
            } else {
                Toast.pop(item.get_error_msg(patient_context), Toast.type.error)
            }
        } catch (err: any) {
            Log.error(err)
            Toast.pop(item.get_error_msg(patient_context), Toast.type.error)
        }
    }
}
