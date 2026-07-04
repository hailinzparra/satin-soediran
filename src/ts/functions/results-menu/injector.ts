import { SatinBaseFunctionInjector, SatinBaseFunctionTargetNode } from '../../types/functions/base'
import { ResultsMenuConfig } from '../../types/functions/results-menu'
import { create_element } from '../../utils/dom'
import { ResultsMenuFunction, ResultsMenuOpenModalData } from './parent'

export class ResultsMenuInjector extends SatinBaseFunctionInjector<ResultsMenuFunction, ResultsMenuConfig> {
    public async on_execute(): Promise<void> {
        this.inject_results_menu_button()
    }

    public reset(target_node?: SatinBaseFunctionTargetNode): void {
    }

    private inject_results_menu_button() {
        const saved_mrn = this.saved_data.active_mrn
        if (!saved_mrn) return

        const saved_panel_id = this.saved_data.active_panel_short_detail_id
        if (!saved_panel_id) return

        const active_panel = document.querySelector<HTMLDivElement>(`#${this.parent.config.selectors.ids.panel_short_detail(saved_panel_id)}`)
        if (!active_panel) return

        const target_el = active_panel.querySelector<HTMLDivElement>(`#${this.parent.config.selectors.ids.panel_short_detail_target_el(saved_panel_id)}`)
        if (!target_el) return

        const btn_id = this.parent.config.selectors.ids.btn(saved_panel_id)

        const existing_btn = document.querySelector(`#${btn_id}`)
        if (existing_btn) {
            if (existing_btn.parentElement === target_el) {
                return
            }
        }

        const c = create_element

        const link_anchor = c('a', { classes: 'x-tab x-unselectable x-box-item x-tab-header-tab x-top x-tab-top x-tab-header-tab-top' }, [
            c('span', { classes: 'x-tab-wrap x-tab-wrap-header-tab' }, [
                c('span', { classes: 'x-tab-button x-tab-button-header-tab x-tab-text x-tab-icon x-tab-icon-left x-tab-button-center' }, [
                    c('span', { classes: 'icon-stack' }, [
                        c('span', { classes: 'x-fa fa-flask' }),
                        c('span', { classes: 'x-fa fa-odnoklassniki-square' }),
                    ]),
                    c('span', { classes: 'title-text x-tab-inner x-tab-inner-header-tab', text: 'Hasil' })
                ]),
            ]),
        ])

        const btn_container = c('div', {
            id: btn_id,
            classes: this.parent.config.selectors.classes.btn,
        }, [link_anchor])

        const normal_color = '#176bd3'
        const hover_color = '#1152a3'
        const active_color = '#0b3a75'

        btn_container.addEventListener('mouseenter', () => link_anchor.style.backgroundColor = hover_color)
        btn_container.addEventListener('mouseleave', () => link_anchor.style.backgroundColor = normal_color)
        btn_container.addEventListener('mousedown', () => link_anchor.style.backgroundColor = active_color)
        btn_container.addEventListener('mouseup', () => link_anchor.style.backgroundColor = hover_color)
        btn_container.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            this.on_btn_click({
                mrn: saved_mrn,
                panel_id: saved_panel_id,
                target_el: target_el,
            })
        })

        target_el.append(btn_container)
    }

    private on_btn_click(data: ResultsMenuOpenModalData) {
        this.parent.on_btn_click(data)
    }
}
