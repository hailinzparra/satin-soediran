import { SatinBaseFunctionInjector, SatinBaseFunctionTargetNode } from '../../types/functions/base'
import { QuickActionsConfig, QuickActionItem, PatientContext } from '../../types/functions/quick-actions'
import { QuickActionsFunction } from './parent'
import { Toast } from '../../utils/toast'
import { RequestPayloadBuilder } from '../../utils/api'
import { copy_text, get_current_date_time, irandom } from '../../utils/misc'
import { Log } from '../../utils/logger'
import {
    SATIN_EXT_AUTO_SIGN_REQUEST_EVENT,
    SATIN_EXT_AUTO_SIGN_RESPONSE_EVENT,
    SATIN_EXT_KIRIM_ORDER_RESEP_REQUEST_EVENT,
    SATIN_EXT_KIRIM_ORDER_RESEP_RESPONSE_EVENT,
    SATIN_EXT_NAVIGATE_REQUEST_EVENT,
    SATIN_EXT_NAVIGATE_RESPONSE_EVENT,
    MainTabAlias,
    RekamMedisLeftAlias,
    RekamMedisInnerAlias
} from '../../inject'
import { ModalUI } from '../../ui/modal'

export class QuickActionsInjector extends SatinBaseFunctionInjector<QuickActionsFunction, QuickActionsConfig> {
    private readonly menu_class = 'satin-quick-actions-menu'
    private readonly palette_id = 'satin-quick-palette-portal'

    private active_palette: HTMLDivElement | null = null
    private is_events_bound = false
    private selected_index = 0
    private last_trigger_context_id: string | null = null
    private last_search_query = ''

    private diagnosis_cache: Map<string, { current: any; history: any[] }> = new Map()

    private readonly actions: QuickActionItem[] = [
        {
            id: 'visite',
            label: 'Add Layanan "Visite"',
            category: 'Layanan',
            get_secondary_badge: (ctx) => ({
                label: `VISIT: ${ctx?.visit_id || '---'}`,
                raw_id: ctx?.visit_id || '',
            }),
            get_processing_msg: (ctx) => `Adding Visite... (${ctx.name} - Visit: ${ctx.visit_id})`,
            get_success_msg: (ctx) => `Visite added! (${ctx.name} - Visit: ${ctx.visit_id})`,
            get_error_msg: (ctx) => `Failed to add Visite (${ctx.name} - Visit: ${ctx.visit_id})`,
        },
        {
            id: 'ekg',
            label: 'Add Layanan "Pembacaan EKG"',
            category: 'Layanan',
            get_secondary_badge: (ctx) => ({
                label: `VISIT: ${ctx?.visit_id || '---'}`,
                raw_id: ctx?.visit_id || '',
            }),
            get_processing_msg: (ctx) => `Adding Pembacaan EKG... (${ctx.name} - Visit: ${ctx.visit_id})`,
            get_success_msg: (ctx) => `Pembacaan EKG added! (${ctx.name} - Visit: ${ctx.visit_id})`,
            get_error_msg: (ctx) => `Failed to add Pembacaan EKG (${ctx.name} - Visit: ${ctx.visit_id})`,
        },
        {
            id: 'sign_resume',
            label: 'Sign "Resume Medis"',
            category: 'Sign',
            get_secondary_badge: (ctx) => ({
                label: `REG: ${ctx?.reg_id || '---'}`,
                raw_id: ctx?.reg_id || '',
            }),
            get_processing_msg: (ctx) => `Signing Resume Medis... (${ctx.name} - Reg: ${ctx.reg_id})`,
            get_success_msg: (ctx) => `Resume Medis signed! (${ctx.name} - Reg: ${ctx.reg_id})`,
            get_error_msg: (ctx) => `Failed to sign Resume Medis (${ctx.name} - Reg: ${ctx.reg_id})`,
        },
        {
            id: 'sign_awal',
            label: 'Sign "Pengkajian Awal"',
            category: 'Sign',
            get_secondary_badge: (ctx) => ({
                label: `VISIT: ${ctx?.visit_id || '---'}`,
                raw_id: ctx?.visit_id || '',
            }),
            get_processing_msg: (ctx) => `Signing Pengkajian Awal... (${ctx.name} - Visit: ${ctx.visit_id})`,
            get_success_msg: (ctx) => `Pengkajian Awal signed! (${ctx.name} - Visit: ${ctx.visit_id})`,
            get_error_msg: (ctx) => `Failed to sign Pengkajian Awal (${ctx.name} - Visit: ${ctx.visit_id})`,
        },
        {
            id: 'sign_harian',
            label: 'Sign "Pengkajian Harian"',
            category: 'Sign',
            get_secondary_badge: (ctx) => ({
                label: `VISIT: ${ctx?.visit_id || '---'}`,
                raw_id: ctx?.visit_id || '',
            }),
            get_processing_msg: (ctx) => `Signing Pengkajian Harian... (${ctx.name} - Visit: ${ctx.visit_id})`,
            get_success_msg: (ctx) => `Pengkajian Harian signed! (${ctx.name} - Visit: ${ctx.visit_id})`,
            get_error_msg: (ctx) => `Failed to sign Pengkajian Harian (${ctx.name} - Visit: ${ctx.visit_id})`,
        },
        {
            id: 'goto_lab_riwayat',
            label: 'Goto "Laboratorium" > "Riwayat"',
            category: 'Navigation',
            get_secondary_badge: () => ({}),
            get_processing_msg: () => 'Navigating to Laboratorium > Riwayat...',
            get_success_msg: () => 'Navigated to Laboratorium > Riwayat',
            get_error_msg: () => 'Failed to navigate to Laboratorium > Riwayat',
        },
        {
            id: 'goto_rad_riwayat',
            label: 'Goto "Radiologi" > "Riwayat"',
            category: 'Navigation',
            get_secondary_badge: () => ({}),
            get_processing_msg: () => 'Navigating to Radiologi > Riwayat...',
            get_success_msg: () => 'Navigated to Radiologi > Riwayat',
            get_error_msg: () => 'Failed to navigate to Radiologi > Riwayat',
        },
        {
            id: 'goto_resep',
            label: 'Goto "E-Resep"',
            category: 'Navigation',
            get_secondary_badge: () => ({}),
            get_processing_msg: () => 'Navigating to E-Resep...',
            get_success_msg: () => 'Navigated to E-Resep',
            get_error_msg: () => 'Failed to navigate to E-Resep',
        },
        {
            id: 'goto_rujukan_internal',
            label: 'Goto "Rujukan Internal"',
            category: 'Navigation',
            get_secondary_badge: () => ({}),
            get_processing_msg: () => 'Navigating to Rujukan Internal...',
            get_success_msg: () => 'Navigated to Rujukan Internal',
            get_error_msg: () => 'Failed to navigate to Rujukan Internal',
        },
        {
            id: 'goto_rujukan_eksternal',
            label: 'Goto "Rujukan Eksternal"',
            category: 'Navigation',
            get_secondary_badge: () => ({}),
            get_processing_msg: () => 'Navigating to Rujukan Eksternal...',
            get_success_msg: () => 'Navigated to Rujukan Eksternal',
            get_error_msg: () => 'Failed to navigate to Rujukan Eksternal',
        },
        {
            id: 'goto_penunjang',
            label: 'Goto "Rekam Medis" > "Pemeriksaan" > "Penunjang"',
            category: 'Navigation',
            get_secondary_badge: () => ({}),
            get_processing_msg: () => 'Navigating to Rekam Medis > Pemeriksaan > Penunjang...',
            get_success_msg: () => 'Navigated to Penunjang',
            get_error_msg: () => 'Failed to navigate to Penunjang',
        },
        {
            id: 'goto_diagnosis',
            label: 'Goto "Rekam Medis" > "Penilaian" > "Diagnosis"',
            category: 'Navigation',
            get_secondary_badge: () => ({}),
            get_processing_msg: () => 'Navigating to Rekam Medis > Penilaian > Diagnosis...',
            get_success_msg: () => 'Navigated to Diagnosis',
            get_error_msg: () => 'Failed to navigate to Diagnosis',
        },
        {
            id: 'goto_diagnosis_icd',
            label: 'Goto "Rekam Medis" > "Diagnosis (ICD)"',
            category: 'Navigation',
            get_secondary_badge: () => ({}),
            get_processing_msg: () => 'Navigating to Rekam Medis > Diagnosis (ICD)...',
            get_success_msg: () => 'Navigated to Diagnosis (ICD)',
            get_error_msg: () => 'Failed to navigate to Diagnosis (ICD)',
        },
        {
            id: 'goto_cppt',
            label: 'Goto "Rekam Medis" > "CPPT"',
            category: 'Navigation',
            get_secondary_badge: () => ({}),
            get_processing_msg: () => 'Navigating to Rekam Medis > CPPT...',
            get_success_msg: () => 'Navigated to CPPT',
            get_error_msg: () => 'Failed to navigate to CPPT',
        },
        {
            id: 'goto_resume_medis',
            label: 'Goto "Rekam Medis" > "Resume Medis"',
            category: 'Navigation',
            get_secondary_badge: () => ({}),
            get_processing_msg: () => 'Navigating to Rekam Medis > Resume Medis...',
            get_success_msg: () => 'Navigated to Resume Medis',
            get_error_msg: () => 'Failed to navigate to Resume Medis',
        },
        {
            id: 'open_quick_notes',
            label: 'Open "Quick Notes"',
            category: 'Modal',
            get_secondary_badge: (ctx) => ({
                label: `MRN: ${ctx?.mrn || '---'}`,
                raw_id: ctx?.mrn || '',
            }),
            get_processing_msg: () => 'Opening Quick Notes window...',
            get_success_msg: () => 'Quick Notes opened',
            get_error_msg: () => 'Failed to open Quick Notes',
        },
        {
            id: 'kirim_resep',
            label: 'Submit "Resep"',
            category: 'Resep',
            get_secondary_badge: (ctx) => ({
                label: `REG: ${ctx?.reg_id || '---'}`,
                raw_id: ctx?.reg_id || '',
            }),
            get_processing_msg: (ctx) => `Submitting Resep... (${ctx.name} - Reg: ${ctx.reg_id})`,
            get_success_msg: (ctx) => `Resep submitted! (${ctx.name} - Reg: ${ctx.reg_id})`,
            get_error_msg: (ctx) => `Failed to submit Resep (${ctx.name} - Reg: ${ctx.reg_id})`,
        },
    ]

    public async on_execute(): Promise<void> {
        this.inject_menu()
        this.update_trigger_state()
        this.update_badges_if_opened()
    }

    public bind_events(): void {
        if (this.is_events_bound) return
        this.is_events_bound = true

        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.altKey && e.code === 'Slash') {
                e.preventDefault()
                const trigger = document.querySelector(`.${this.menu_class} .satin-quick-actions-trigger`) as HTMLButtonElement
                if (trigger && !trigger.disabled) {
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
        this.last_trigger_context_id = null
        this.last_search_query = ''
        this.parent.reset_data()
    }

    inject_menu(): void {
        const parent_headers = document.querySelectorAll(this.parent.config.selectors.queries.layanan_workspace_header)
        const parent_header = parent_headers.item(0)

        if (parent_header) {
            const is_already_exists = parent_header.querySelector(`.${this.menu_class}`) !== null

            if (!is_already_exists) {
                const menu = this.create_menu()
                parent_header.append(menu)
                this.attach_destruction_listener(menu)
            }
        }
    }

    create_menu(): HTMLDivElement {
        const menu = document.createElement('div')
        menu.classList.add(this.menu_class)

        const trigger_btn = document.createElement('button')
        trigger_btn.type = 'button'
        trigger_btn.className = 'satin-quick-actions-trigger'

        trigger_btn.disabled = true
        trigger_btn.innerHTML = `<span>Loading patient context...</span><kbd>Alt+/</kbd>`

        trigger_btn.addEventListener('click', (e) => {
            e.stopPropagation()
            if (!trigger_btn.disabled) {
                this.toggle_palette(trigger_btn)
            }
        })

        menu.appendChild(trigger_btn)
        return menu
    }

    private attach_destruction_listener(element: HTMLElement): void {
        const observer = new MutationObserver(() => {
            if (!element.isConnected) {
                observer.disconnect()

                this.parent.reset_data()
                this.last_trigger_context_id = null
                this.close_palette()
            }
        })

        observer.observe(document.body, { childList: true, subtree: true })
    }

    private update_trigger_state(): void {
        const trigger_btn = document.querySelector(`.${this.menu_class} .satin-quick-actions-trigger`) as HTMLButtonElement
        if (!trigger_btn) return

        const trigger_label = trigger_btn.querySelector('span') as HTMLSpanElement
        if (!trigger_label) return

        const patient = this.parent.data.patient
        const patient_name = patient?.name?.trim()

        const current_context_key = patient_name || ''

        if (this.last_trigger_context_id === current_context_key && trigger_btn.disabled === false) {
            return
        }

        this.last_trigger_context_id = current_context_key

        if (patient_name) {
            trigger_btn.disabled = false
            trigger_label.textContent = `Search actions (${patient_name})`
        } else {
            trigger_btn.disabled = true
            trigger_label.textContent = 'Loading patient context...'
            if (this.active_palette) {
                this.close_palette()
            }
        }
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
        input.value = this.last_search_query

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
                const id_badge_html = secondary.label
                    ? `<span class="satin-item-badge satin-badge-id">${secondary.label}</span>`
                    : ''

                const li = document.createElement('li')
                li.className = `satin-quick-item ${index === 0 ? 'selected' : ''}`
                li.dataset.actionId = item.id
                li.dataset.contextId = secondary.raw_id || ''

                li.innerHTML = `
                    <span class="satin-item-label">${item.label}</span>
                    <div class="satin-item-badges">
                        ${id_badge_html}
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
            this.last_search_query = (e.target as HTMLInputElement).value
            render_items(this.last_search_query)
        })

        document.body.appendChild(palette)
        this.active_palette = palette

        render_items(this.last_search_query)
        input.focus()
        if (this.last_search_query) {
            input.select()
        }
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
            const raw_id = secondary.raw_id || ''

            if (li.dataset.contextId === raw_id) {
                return
            }

            li.dataset.contextId = raw_id
            const id_badge = li.querySelector('.satin-badge-id')
            if (id_badge && secondary.label) {
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

    private navigate_to(main: MainTabAlias, left?: RekamMedisLeftAlias, inner?: RekamMedisInnerAlias): Promise<boolean> {
        return new Promise((resolve) => {
            const request_id = `nav_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

            const timeout_id = setTimeout(() => {
                window.removeEventListener(SATIN_EXT_NAVIGATE_RESPONSE_EVENT, response_handler)
                Log.error(`Navigation request timed out for request ${request_id}`)
                resolve(false)
            }, 8000)

            const response_handler = (e: Event) => {
                const custom_event = e as CustomEvent<{
                    request_id: string
                    success: boolean
                    error?: string
                }>
                if (custom_event.detail?.request_id === request_id) {
                    clearTimeout(timeout_id)
                    window.removeEventListener(SATIN_EXT_NAVIGATE_RESPONSE_EVENT, response_handler)

                    if (!custom_event.detail.success) {
                        Log.error('Navigation failed:', custom_event.detail.error)
                    }

                    resolve(custom_event.detail.success)
                }
            }

            window.addEventListener(SATIN_EXT_NAVIGATE_RESPONSE_EVENT, response_handler)

            window.dispatchEvent(
                new CustomEvent(SATIN_EXT_NAVIGATE_REQUEST_EVENT, {
                    detail: {
                        request_id,
                        main,
                        left,
                        inner,
                    },
                })
            )
        })
    }

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

    private sign_document(
        doc_type: 'harian' | 'resume' | 'awal',
        passphrase?: string
    ): Promise<boolean> {
        return new Promise((resolve) => {
            const request_id = `sign_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

            const timeout_id = setTimeout(() => {
                window.removeEventListener(SATIN_EXT_AUTO_SIGN_RESPONSE_EVENT, response_handler)
                Log.error(`Auto-sign request timed out for request ${request_id}`)
                resolve(false)
            }, 10000)

            const response_handler = (e: Event) => {
                const custom_event = e as CustomEvent<{
                    request_id: string
                    success: boolean
                    error?: string
                }>
                if (custom_event.detail?.request_id === request_id) {
                    clearTimeout(timeout_id)
                    window.removeEventListener(SATIN_EXT_AUTO_SIGN_RESPONSE_EVENT, response_handler)

                    if (!custom_event.detail.success) {
                        Log.error('Sign failed:', custom_event.detail.error)
                    }

                    resolve(custom_event.detail.success)
                }
            }

            window.addEventListener(SATIN_EXT_AUTO_SIGN_RESPONSE_EVENT, response_handler)

            window.dispatchEvent(
                new CustomEvent(SATIN_EXT_AUTO_SIGN_REQUEST_EVENT, {
                    detail: {
                        request_id,
                        doc_type,
                        passphrase,
                    },
                })
            )
        })
    }

    private kirim_order_resep(passphrase?: string): Promise<boolean> {
        return new Promise((resolve) => {
            const request_id = `resep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

            const timeout_id = setTimeout(() => {
                window.removeEventListener(SATIN_EXT_KIRIM_ORDER_RESEP_RESPONSE_EVENT, response_handler)
                Log.error(`Kirim order resep request timed out for request ${request_id}`)
                resolve(false)
            }, 12000)

            const response_handler = (e: Event) => {
                const custom_event = e as CustomEvent<{
                    request_id: string
                    success: boolean
                    error?: string
                }>
                if (custom_event.detail?.request_id === request_id) {
                    clearTimeout(timeout_id)
                    window.removeEventListener(SATIN_EXT_KIRIM_ORDER_RESEP_RESPONSE_EVENT, response_handler)

                    if (!custom_event.detail.success) {
                        Log.error('Kirim order resep failed:', custom_event.detail.error)
                    }

                    resolve(custom_event.detail.success)
                }
            }

            window.addEventListener(SATIN_EXT_KIRIM_ORDER_RESEP_RESPONSE_EVENT, response_handler)

            window.dispatchEvent(
                new CustomEvent(SATIN_EXT_KIRIM_ORDER_RESEP_REQUEST_EVENT, {
                    detail: {
                        request_id,
                        passphrase,
                        auto_sign: false, // TODO: rn set to true doesnt work, consider-
                        // highlight button? so that user can press enter on sign button rightaway
                    },
                })
            )
        })
    }

    private async open_quick_notes(): Promise<boolean> {
        const parent_headers = document.querySelectorAll(this.parent.config.selectors.queries.layanan_workspace_header)
        const parent_header = parent_headers.item(0)
        if (!parent_header) return false

        const menu = parent_header.querySelector(`.${this.menu_class}`)
        if (!menu) return false

        const window_el = menu.closest<HTMLElement>('.x-window')
        const parent_el = window_el || document.body

        const modal_container = document.createElement('div')
        modal_container.className = 'sn-quick-notes-container'

        const qn_diagnosis_accordion = this.create_accordion_item('Diagnosis', true, this.render_qn_diagnosis_content())

        const cppt_content = document.createElement('div')
        cppt_content.style.fontSize = '12px'
        cppt_content.style.color = '#64748b'
        cppt_content.textContent = 'konsul pasien'
        const qn_cppt_accordion = this.create_accordion_item('Konsul Pasien', false, cppt_content)

        modal_container.appendChild(qn_diagnosis_accordion)
        modal_container.appendChild(qn_cppt_accordion)

        const target_width = 820
        const target_height = 600

        const min_xgap = Math.max(10, Math.min(50, window.innerWidth * 0.05))
        const min_ygap = Math.max(10, Math.min(50, window.innerHeight * 0.05))
        const w = Math.min(window.innerWidth - min_xgap * 2, target_width)
        const h = Math.min(window.innerHeight - min_ygap * 2, target_height)
        const x = Math.max(0, (window.innerWidth - w) / 2)
        const y = Math.max(0, (window.innerHeight - h) / 2)

        const { instance, is_existing } = ModalUI.fire({
            id: 'sn-quick-notes-modal-instance',
            title: `Quick Notes (${this.parent.data.patient.mrn})`,
            content: modal_container,
            parent_el: parent_el,
            options: {
                top: `${y}px`,
                left: `${x}px`,
                width: `${w}px`,
                height: `${h}px`,
            },
        })

        if (is_existing || !instance) return true

        instance.body.style.padding = '0'
        instance.body.style.height = 'calc(100% - 38px)'
        return true
    }

    private render_qn_diagnosis_content(): HTMLElement {
        const layout = document.createElement('div')
        layout.className = 'sn-diagnosis-layout'

        // Top Action Controls (Refresh & Save)
        const controls = document.createElement('div')
        controls.className = 'sn-diagnosis-controls'

        const refresh_btn = document.createElement('button')
        refresh_btn.type = 'button'
        refresh_btn.className = 'sn-btn sn-btn-secondary'
        refresh_btn.textContent = 'Refresh'

        const save_btn = document.createElement('button')
        save_btn.type = 'button'
        save_btn.className = 'sn-btn sn-btn-primary'
        save_btn.textContent = 'Simpan'
        save_btn.disabled = true

        controls.appendChild(refresh_btn)
        controls.appendChild(save_btn)
        layout.appendChild(controls)

        // Current Diagnosis Field Section
        const current_section = document.createElement('div')
        current_section.className = 'sn-diagnosis-current-section'

        const label = document.createElement('label')
        label.className = 'sn-diagnosis-field-label'
        label.textContent = 'Diagnosis Saat Ini'

        const textarea = document.createElement('textarea')
        textarea.className = 'sn-diagnosis-textarea'
        textarea.rows = 3
        textarea.placeholder = 'Masukkan diagnosis...'
        textarea.disabled = true

        current_section.appendChild(label)
        current_section.appendChild(textarea)
        layout.appendChild(current_section)

        // History Section
        const history_section = document.createElement('div')
        history_section.className = 'sn-diagnosis-history-section'

        const history_title = document.createElement('div')
        history_title.className = 'sn-diagnosis-section-title'
        history_title.textContent = 'Riwayat Diagnosis'

        const history_list_container = document.createElement('div')
        history_list_container.className = 'sn-diagnosis-history-list'

        history_section.appendChild(history_title)
        history_section.appendChild(history_list_container)
        layout.appendChild(history_section)

        // Scope state variables
        let current_diagnosis_item: any = null
        let diagnosis_history_items: any[] = []
        let original_diagnosis_text = ''

        // Enable/Disable Save button based on text changes
        textarea.addEventListener('input', () => {
            const is_changed = textarea.value.trim() !== original_diagnosis_text
            save_btn.disabled = !is_changed
        })

        // Fetch / Reload Data Flow
        const load_data = async (force_refresh = false) => {
            const visit_id = this.parent.data.patient.visit_id
            const norm = this.parent.data.patient.mrn

            textarea.disabled = true
            refresh_btn.disabled = true
            save_btn.disabled = true
            history_list_container.innerHTML = `<div class="sn-diagnosis-loading">Memuat data...</div>`

            try {
                if (!force_refresh && this.diagnosis_cache.has(visit_id)) {
                    const cached = this.diagnosis_cache.get(visit_id)!
                    current_diagnosis_item = cached.current
                    diagnosis_history_items = cached.history
                } else {
                    // 1. Fetch Current Visit Diagnosis first
                    const current_res: any = await this.parent.api_client.api_request({
                        base_path: 'medicalrecord/penilaian/diagnosis',
                        payload: new RequestPayloadBuilder({
                            KUNJUNGAN: visit_id,
                            page: 1,
                            start: 0,
                            limit: 25,
                        }),
                    })

                    let current_item: any = null
                    let current_id: string | null = null

                    if (current_res && current_res.data && Array.isArray(current_res.data) && current_res.data.length > 0) {
                        current_item = current_res.data[0]
                        current_id = String(current_item.ID || '')
                    }

                    // 2. Fetch Diagnosis History AFTER current diagnosis request finishes
                    let history_items: any[] = []
                    if (norm) {
                        const history_payload: any = {
                            HISTORY: 1,
                            NORM: norm,
                            sort: JSON.stringify({ property: 'TANGGAL', direction: 'DESC' }),
                            page: 1,
                            start: 0,
                            limit: 25,
                        }

                        // Exclude current diagnosis ID if available
                        if (current_id) {
                            history_payload.NOT = JSON.stringify({ ID: current_id })
                        }

                        const history_res: any = await this.parent.api_client.api_request({
                            base_path: 'medicalrecord/penilaian/diagnosis',
                            payload: new RequestPayloadBuilder(history_payload),
                        })

                        if (history_res && history_res.data && Array.isArray(history_res.data)) {
                            history_items = history_res.data
                        }
                    }

                    current_diagnosis_item = current_item
                    diagnosis_history_items = history_items
                    this.diagnosis_cache.set(visit_id, { current: current_item, history: history_items })
                }

                // Populate Textarea with Current Diagnosis
                original_diagnosis_text = current_diagnosis_item?.DIAGNOSIS || ''
                textarea.value = original_diagnosis_text
                textarea.disabled = false
                refresh_btn.disabled = false

                // Render history list items with duplicate callback
                history_list_container.innerHTML = ''
                if (diagnosis_history_items.length === 0) {
                    history_list_container.innerHTML = `<div class="sn-diagnosis-empty">Tidak ada riwayat diagnosis.</div>`
                } else {
                    diagnosis_history_items.forEach((item) => {
                        const card = this.render_diagnosis_item(item, (dup_text: string) => {
                            textarea.value = dup_text
                            textarea.dispatchEvent(new Event('input')) // Trigger input listener to enable save button
                        })
                        history_list_container.appendChild(card)
                    })
                }
            } catch (err) {
                console.error('Error fetching diagnosis:', err)
                history_list_container.innerHTML = `<div class="sn-diagnosis-error">Gagal mengambil data diagnosis.</div>`
                refresh_btn.disabled = false
                textarea.disabled = false
            }
        }

        // Refresh Handler
        refresh_btn.addEventListener('click', () => {
            load_data(true)
        })

        // Save Handler with PUT for update and POST for create
        save_btn.addEventListener('click', async () => {
            const visit_id = this.parent.data.patient.visit_id
            const new_diagnosis = textarea.value.trim()
            if (!new_diagnosis) return

            textarea.disabled = true
            save_btn.disabled = true
            refresh_btn.disabled = true

            try {
                let save_res: any = null

                if (current_diagnosis_item && current_diagnosis_item.ID) {
                    // Update Existing Diagnosis (PUT)
                    const diagnosis_id = current_diagnosis_item.ID
                    const payload = {
                        DIAGNOSIS: new_diagnosis,
                        ID: diagnosis_id,
                    }

                    save_res = await this.parent.api_client.api_request({
                        base_path: `medicalrecord/penilaian/diagnosis/${diagnosis_id}`,
                        payload: new RequestPayloadBuilder(),
                    }, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    })
                } else {
                    // Create New Diagnosis Entry (POST)
                    const payload = {
                        KUNJUNGAN: visit_id,
                        ID: 'rekammedis.penilaian.diagnosis.Model-1',
                        DIAGNOSIS: new_diagnosis,
                        TANGGAL: null,
                        OLEH: 0,
                        STATUS: 1,
                    }

                    save_res = await this.parent.api_client.api_request({
                        base_path: 'medicalrecord/penilaian/diagnosis',
                        payload: new RequestPayloadBuilder(),
                    }, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    })
                }

                if (save_res && (save_res.success || save_res.status === 200)) {
                    Toast.pop('Diagnosis berhasil disimpan', 'success')
                    this.diagnosis_cache.delete(visit_id)
                    await load_data(true)
                } else {
                    Toast.pop('Gagal menyimpan diagnosis', 'error')
                    textarea.disabled = false
                    save_btn.disabled = false
                    refresh_btn.disabled = false
                }
            } catch (err) {
                console.error('Error saving diagnosis:', err)
                Toast.pop('Terjadi kesalahan saat menyimpan diagnosis', 'error')
                textarea.disabled = false
                save_btn.disabled = false
                refresh_btn.disabled = false
            }
        })

        // Initial Execution
        load_data(false)

        return layout
    }

    // Render Diagnosis Card Item with DUP & COPY buttons
    private render_diagnosis_item(item: any, on_duplicate: (text: string) => void): HTMLElement {
        const card = document.createElement('div')
        card.className = 'sn-diagnosis-card'

        const room = item.REFERENSI?.KUNJUNGAN?.REFERENSI?.RUANGAN?.DESKRIPSI || '-'
        const raw_date = item.TANGGAL || ''
        const formatted_date = this.format_date(raw_date)

        const doctor_info = item.REFERENSI?.PENGGUNA
        let doctor_name = '-'
        if (doctor_info) {
            const title_front = doctor_info.GELAR_DEPAN ? `${doctor_info.GELAR_DEPAN}. ` : ''
            const title_back = doctor_info.GELAR_BELAKANG ? `, ${doctor_info.GELAR_BELAKANG}` : ''
            doctor_name = `${title_front}${doctor_info.NAMA || ''}${title_back}`
        }

        const diagnosis_text = item.DIAGNOSIS || '-'

        // Card Header (Room & Action Buttons)
        const header_el = document.createElement('div')
        header_el.className = 'sn-diagnosis-card-header'

        const room_el = document.createElement('div')
        room_el.className = 'sn-diagnosis-room'
        room_el.textContent = room

        const card_actions = document.createElement('div')
        card_actions.className = 'sn-diagnosis-card-actions'

        // DUP Button
        const dup_btn = document.createElement('button')
        dup_btn.type = 'button'
        dup_btn.className = 'sn-btn-action sn-btn-dup'
        dup_btn.textContent = 'DUP'
        dup_btn.title = 'Duplikasi ke Diagnosis Saat Ini'
        dup_btn.addEventListener('click', (e) => {
            e.stopPropagation()
            on_duplicate(diagnosis_text)
        })

        // COPY Button
        const copy_btn = document.createElement('button')
        copy_btn.type = 'button'
        copy_btn.className = 'sn-btn-action sn-btn-copy'
        copy_btn.textContent = 'COPY'
        copy_btn.title = 'Salin Diagnosis ke Clipboard'
        copy_btn.addEventListener('click', async (e) => {
            e.stopPropagation()
            const copied = await copy_text(diagnosis_text)
            if (copied) {
                Toast.pop('Diagnosis tersalin ke clipboard', 'success')
            } else {
                Toast.pop('Gagal menyalin diagnosis', 'error')
            }
        })

        card_actions.appendChild(dup_btn)
        card_actions.appendChild(copy_btn)

        header_el.appendChild(room_el)
        header_el.appendChild(card_actions)

        // Meta (Date & Doctor)
        const meta_el = document.createElement('div')
        meta_el.className = 'sn-diagnosis-meta'
        meta_el.textContent = `${formatted_date} | ${doctor_name}`

        // Body (Diagnosis Text)
        const body_el = document.createElement('div')
        body_el.className = 'sn-diagnosis-body'
        body_el.innerHTML = `<span class="sn-diagnosis-label">Diagnosis : </span><span class="sn-diagnosis-value">${diagnosis_text}</span>`

        card.appendChild(header_el)
        card.appendChild(meta_el)
        card.appendChild(body_el)

        return card
    }

    private format_date(date_str: string): string {
        if (!date_str) return '-'
        const d = new Date(date_str.replace(/-/g, '/'))
        if (isNaN(d.getTime())) return date_str

        const pad = (n: number) => String(n).padStart(2, '0')
        return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    }

    private create_accordion_item(
        title_text: string,
        default_expanded: boolean,
        content_node: HTMLElement
    ): HTMLElement {
        const item = document.createElement('div')
        item.className = `sn-accordion-item ${default_expanded ? 'is-expanded' : ''}`

        const header = document.createElement('div')
        header.className = 'sn-accordion-header'

        const title = document.createElement('span')
        title.className = 'sn-accordion-title'
        title.textContent = title_text

        const icon = document.createElement('span')
        icon.className = 'sn-accordion-icon'
        icon.textContent = '▼'

        header.appendChild(title)
        header.appendChild(icon)

        const body = document.createElement('div')
        body.className = 'sn-accordion-body'
        body.appendChild(content_node)

        header.addEventListener('click', () => {
            item.classList.toggle('is-expanded')
        })

        item.appendChild(header)
        item.appendChild(body)

        return item
    }

    private async add_visite(visit_id: string): Promise<boolean> {
        return this.add_layanan(visit_id, 8393)
    }

    private async add_ekg(visit_id: string): Promise<boolean> {
        return this.add_layanan(visit_id, 4474)
    }

    private async execute_action(item: QuickActionItem): Promise<void> {
        const patient_context: PatientContext = {
            mrn: this.parent.data.patient.mrn || '??',
            name: this.parent.data.patient.name || '??',
            reg_id: this.parent.data.patient.reg_id || '??',
            visit_id: this.parent.data.patient.visit_id || '??',
        }

        Toast.pop(item.get_processing_msg(patient_context), Toast.type.info)

        try {
            let is_success = false

            if (item.id === 'goto_resep') {
                is_success = await this.navigate_to('resep')
            } else if (item.id === 'goto_cppt') {
                is_success = await this.navigate_to('rekammedis', 'cppt')
            } else if (item.id === 'goto_diagnosis') {
                is_success = await this.navigate_to('rekammedis', 'penilaian', 'diagnosis')
            } else if (item.id === 'goto_diagnosis_icd') {
                is_success = await this.navigate_to('rekammedis', 'diagnosis_icd')
            } else if (item.id === 'goto_resume_medis') {
                is_success = await this.navigate_to('rekammedis', 'resume_medis')
            } else if (item.id === 'goto_rujukan_internal') {
                is_success = await this.navigate_to('konsul')
            } else if (item.id === 'goto_rujukan_eksternal') {
                is_success = await this.navigate_to('rujukan')
            } else if (item.id === 'goto_lab_riwayat') {
                is_success = await this.navigate_to('lab', undefined, 'riwayat')
            } else if (item.id === 'goto_rad_riwayat') {
                is_success = await this.navigate_to('rad', undefined, 'riwayat')
            } else if (item.id === 'goto_penunjang') {
                is_success = await this.navigate_to('rekammedis', 'pemeriksaan', 'penunjang')
            } else if (item.id === 'visite') {
                is_success = await this.add_visite(patient_context.visit_id)
            } else if (item.id === 'ekg') {
                is_success = await this.add_ekg(patient_context.visit_id)
            } else if (item.id === 'sign_resume') {
                is_success = await this.sign_document('resume')
            } else if (item.id === 'sign_harian') {
                is_success = await this.sign_document('harian')
            } else if (item.id === 'sign_awal') {
                is_success = await this.sign_document('awal')
            } else if (item.id === 'kirim_resep') {
                is_success = await this.kirim_order_resep()
            } else if (item.id === 'open_quick_notes') {
                is_success = await this.open_quick_notes()
            } else {
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
