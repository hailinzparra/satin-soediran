import { SatinBaseFunctionInjector, SatinBaseFunctionTargetNode } from '../../types/functions/base'
import { SatinDashUIConfig, SatinDashUIVisit, SatinDashUIWorkspace } from '../../types/functions/satin-dash-ui'
import { create_element } from '../../utils/dom'
import { Log } from '../../utils/logger'
import { ActionsModalController } from './actions'
import { SatinDashUIFunction } from './parent'
import { build_patient_card } from './ui'

export class SatinDashUIInjector extends SatinBaseFunctionInjector<SatinDashUIFunction, SatinDashUIConfig> {
    public async on_execute(): Promise<void> {
        // if feature enabled, what happen on each tick?
        // do it here
        const workspaces = this.parent.data.extracted_workspaces
        workspaces.forEach(ws => {
            const wpanel = ws.els.wpanel
            if (!wpanel) return

            const is_hidden = wpanel.classList.contains('x-hidden-offsets')
            if (is_hidden) {
                this.hide_workspace(ws)
                return
            }

            this.inject_toggle_button(ws)
            this.toggle_toggle_btn(ws, true)

            if (ws.is_mode_enabled) {
                const show_actions = Boolean(this.parent.engine.get_settings().dash_enable_satin_dash_ui_show_actions_button)
                this.actions_btn(ws, show_actions)
                this.inject_satin_dash_ui(ws)
                this.toggle_satin_dash_ui(ws, true)
            }
            else {
                this.actions_btn(ws, false)
                this.toggle_satin_dash_ui(ws, false)
            }
        })
    }

    public reset(target_node?: SatinBaseFunctionTargetNode): void {
        // if feature disabled, what happen on each tick?
        // do it here
        this.hide_all_workspaces()
    }

    hide_workspace(ws: SatinDashUIWorkspace) {
        this.toggle_toggle_btn(ws, false)
        this.actions_btn(ws, false)
        this.toggle_satin_dash_ui(ws, false)
    }

    hide_all_workspaces() {
        const workspaces = this.parent.data.extracted_workspaces
        workspaces.forEach(ws => {
            this.hide_workspace(ws)
        })
    }

    inject_toggle_button(ws: SatinDashUIWorkspace) {
        // already injected? do nothing
        if (ws.is_button_injected) {
            return
        }

        if (ws.els.lpanel_head) {
            ws.els.lpanel_head.style.position = 'relative'

            const wrapper = create_element('div', { classes: 'custom-toggle-wrapper' })

            const actions_controller = new ActionsModalController(this.parent, ws)

            // Check settings visibility condition
            const show_actions = Boolean(this.parent.engine.get_settings().dash_enable_satin_dash_ui_show_actions_button)
            if (!show_actions) {
                actions_controller.btn_el.classList.add('hidden')
            }

            const toggle_input: HTMLInputElement = create_element('input', {
                classes: 'custom-toggle-input',
                attrs: { type: 'checkbox' }
            })

            toggle_input.checked = Boolean(ws.is_mode_enabled)
            toggle_input.addEventListener('change', (e: Event) => {
                const target = e.target as HTMLInputElement
                ws.is_mode_enabled = target.checked
                Log.log(`${ws.id} mode updated:`, ws.is_mode_enabled ? 'Satin' : 'Normal')
            })

            const input_group: HTMLLabelElement = create_element('label', { classes: 'custom-toggle' }, [
                toggle_input,
                create_element('span', { classes: 'custom-toggle-slider' }),
                create_element('span', {
                    classes: 'custom-toggle-label lbl-normal',
                    text: 'Standard',
                }),
                create_element('span', {
                    classes: 'custom-toggle-label lbl-satin',
                    text: 'Satin',
                }),
            ])

            wrapper.append(actions_controller.btn_el, input_group)
            ws.els.lpanel_head.append(wrapper)

            // button injected!
            ws.is_button_injected = true
            ws.els.toggle_btn_wrapper = wrapper
            ws.els.actions_controller = actions_controller
        }
    }

    inject_satin_dash_ui(ws: SatinDashUIWorkspace) {
        // already injected? do nothing

        if (!ws.els.lpanel_body) return

        const tableview_div = ws.els.lpanel_body.querySelector<HTMLElement>('[id^="tableview-"]')

        if (tableview_div) {
            const tables = tableview_div.querySelectorAll<HTMLTableElement>('table.x-grid-item')

            let table_has_been_updated = false
            const new_visit_ids: string[] = []
            tables.forEach((table) => {
                const target_td = table.querySelectorAll<HTMLTableCellElement>('td')[1]

                if (!target_td) return

                const existing_modern_ui = target_td.querySelector<HTMLElement>('.my-modern-ui-container')
                if (existing_modern_ui) return

                table_has_been_updated = true

                const text_content = table.innerText || table.textContent || ''
                const id_match = text_content.match(/(\d+)\s*Masuk/i)
                const clean_table_id = id_match ? id_match[1] : text_content.replace(/\D/g, '')

                target_td.style.position = 'relative'

                const modern_ui = document.createElement('div')
                modern_ui.className = 'my-modern-ui-container'
                modern_ui.dataset.tableId = clean_table_id

                const scale_rect = () => {
                    // const rect = target_td.getBoundingClientRect()
                    Object.assign(modern_ui.style, {
                        position: 'absolute',
                        top: '0px',
                        left: '0px',
                        width: '100%',
                        height: '100%',
                        zIndex: '10',
                        boxSizing: 'border-box',
                        overflow: 'hidden'
                    })
                }
                scale_rect()

                // window.addEventListener('resize', scale_rect)

                let visit_id: string | null = null
                for (const extracted_visit_id of this.parent.data.extracted_visits.keys()) {
                    if (clean_table_id.includes(extracted_visit_id)) {
                        visit_id = extracted_visit_id
                        break
                    }
                }

                if (visit_id) {
                    const visit: SatinDashUIVisit | null = this.parent.data.extracted_visits.get(visit_id) ?? null
                    if (visit) {
                        const card = build_patient_card(this.parent.engine, visit)
                        card.style.height = '100%'
                        card.style.width = '100%'
                        card.style.boxSizing = 'border-box'

                        modern_ui.append(card)
                        new_visit_ids.push(visit_id)
                    }
                }

                const old_inner = target_td.querySelector<HTMLElement>('.x-grid-cell-inner')
                if (old_inner) {
                    old_inner.style.opacity = '0'
                }

                target_td.style.position = 'relative'
                target_td.style.height = '100%'
                target_td.style.padding = '0'
                target_td.style.boxSizing = 'border-box'
                target_td.appendChild(modern_ui)
            })

            if (table_has_been_updated) {
                ws.visit_ids = new_visit_ids
                this.trigger_on_inject_update()
            }
        }
    }

    toggle_toggle_btn(ws: SatinDashUIWorkspace, is_showed: boolean) {
        const is_btn_hidden = ws.els.toggle_btn_wrapper?.classList.contains('hidden') ? true : false
        if (is_btn_hidden) {
            // already hidden and want to be showed?
            if (is_showed) {
                ws.els.toggle_btn_wrapper?.classList.remove('hidden')
            }
        }
        // is showed and want to be hidden?
        else if (!is_showed) {
            ws.els.toggle_btn_wrapper?.classList.add('hidden')
        }
    }

    actions_btn(ws: SatinDashUIWorkspace, is_showed: boolean) {
        const is_btn_hidden = ws.els.actions_controller?.btn_el.classList.contains('hidden') ? true : false
        if (is_btn_hidden) {
            // already hidden and want to be showed?
            if (is_showed) {
                ws.els.actions_controller?.btn_el.classList.remove('hidden')
            }
        }
        // is showed and want to be hidden?
        else if (!is_showed) {
            ws.els.actions_controller?.btn_el.classList.add('hidden')
        }
    }

    toggle_satin_dash_ui(ws: SatinDashUIWorkspace, is_showed: boolean) {
        // already hidden? do nothing
        const tableview_div = ws.els.lpanel_body?.querySelector<HTMLElement>('[id^="tableview-"]')
        if (!tableview_div) return

        const modern_containers = tableview_div.querySelectorAll<HTMLElement>('.my-modern-ui-container')
        modern_containers.forEach((modern_ui) => {
            const target_td = modern_ui.parentElement
            if (!target_td) return

            const old_inner = target_td.querySelector<HTMLElement>('.x-grid-cell-inner')

            if (is_showed) {
                modern_ui.style.display = 'flex'
                if (old_inner) old_inner.style.opacity = '0'
            } else {
                modern_ui.style.display = 'none'
                if (old_inner) old_inner.style.opacity = '1'
            }
        })
    }

    trigger_on_inject_update() {
        const workspaces = this.parent.data.extracted_workspaces
        workspaces.forEach(ws => {
            ws.els.actions_controller?.on_inject_update()
        })
    }
}
