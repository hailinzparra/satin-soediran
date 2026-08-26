import { SatinBaseFunctionInjector, SatinBaseFunctionTargetNode } from '../../types/functions/base'
import { SatinDashUIConfig, SatinDashUIWorkspace } from '../../types/functions/satin-dash-ui'
import { create_element } from '../../utils/dom'
import { Log } from '../../utils/logger'
import { SatinDashUIFunction } from './parent'

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

            if (ws.is_mode_enabled) {
                this.inject_satin_dash_ui(ws)
            }
            else {
                this.hide_satin_dash_ui(ws)
            }
        })
    }

    public reset(target_node?: SatinBaseFunctionTargetNode): void {
        // if feature disabled, what happen on each tick?
        // do it here
        this.hide_all_workspaces()
    }

    hide_workspace(ws: SatinDashUIWorkspace) {
        // already hidden? do nothing
        const is_btn_hidden = ws.els.toggle_btn_wrapper?.classList.contains('hidden') ? true : false
        if (is_btn_hidden) {
            return
        }

        // lets hide in the woods
        ws.els.toggle_btn_wrapper?.classList.add('hidden')
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
            const is_btn_hidden = ws.els.toggle_btn_wrapper?.classList.contains('hidden') ? true : false
            if (is_btn_hidden) {
                ws.els.toggle_btn_wrapper?.classList.remove('hidden')
            }
            return
        }

        if (ws.els.lpanel_head) {
            ws.els.lpanel_head.style.position = 'relative'

            const wrapper = create_element('div', { classes: 'custom-toggle-wrapper' })
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
                    text: 'NORMAL',
                }),
                create_element('span', {
                    classes: 'custom-toggle-label lbl-satin',
                    text: 'SATIN',
                }),
            ])

            wrapper.append(input_group)
            ws.els.lpanel_head.append(wrapper)

            // button injected!
            ws.is_button_injected = true
            ws.els.toggle_btn_wrapper = wrapper
        }
    }

    inject_satin_dash_ui(ws: SatinDashUIWorkspace) {
        // already injected? do nothing

    }

    hide_satin_dash_ui(ws: SatinDashUIWorkspace) {
        // already hidden? do nothing

    }
}
