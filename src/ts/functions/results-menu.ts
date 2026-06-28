import { ExtensionFunction } from '../types'
import { open_results_menu_modal } from './results-menu/modal'

export class ResultsMenuFunction extends ExtensionFunction {
    bind_events() {
    }

    apply() {
        const settings = this.get_settings()
        const show_results_menu = settings.emr_show_results_menu

        if (show_results_menu) {
            this.inject_results_buttons()
        } else {
            this.remove_and_reset_layout()
        }
    }

    /**
     * Extracts and normalizes the Patient MRN (NORM) from ExtJS DOM structure.
     * Converts "00.17.08.45" -> "170845", returns '' if not found.
     * @param target_el The parent element (#pasien-short-detil-*-target_el)
     * @returns string
     */
    extract_mrn(target_el: HTMLElement | null): string {
        if (!target_el) return ''

        const components = target_el.querySelectorAll('.x-component')
        const mrn_element = Array.from(components).find(el => {
            const text = el.textContent?.trim() || ''
            return /^\d{2}\.\d{2}\.\d{2}\.\d{2}$/.test(text)
        })

        if (!mrn_element || !mrn_element.textContent) {
            return ''
        }

        const clean_string = mrn_element.textContent.trim().replace(/\./g, '')

        return String(parseInt(clean_string, 10))
    }

    inject_results_buttons() {
        const root_panels = document.querySelectorAll<HTMLElement>('.x-panel[id^="pasien-short-detil-"]')

        root_panels.forEach(root_panel => {
            const match = root_panel.id.match(/pasien-short-detil-(\d+)/)
            if (!match) return
            const panel_id = match[1]

            const body_wrap = root_panel.querySelector<HTMLElement>(`#pasien-short-detil-${panel_id}-bodyWrap`)
            const body_panel = root_panel.querySelector<HTMLElement>(`#pasien-short-detil-${panel_id}-body`)
            const inner_ct = root_panel.querySelector<HTMLElement>(`#pasien-short-detil-${panel_id}-innerCt`)
            const target_el = root_panel.querySelector<HTMLElement>(`#pasien-short-detil-${panel_id}-targetEl`)

            if (!target_el) return

            const mrn = this.extract_mrn(target_el)

            const unique_btn_id = `results-menu-hasil-btn-${panel_id}`
            if (document.getElementById(unique_btn_id)) return

            const btn_container = document.createElement('div')
            btn_container.id = unique_btn_id
            btn_container.className = 'results-menu-btn-container'
            btn_container.style.cssText = `
                position: absolute;
                left: 0px;
                top: 115px;
                width: 100px;
                height: 22px;
                display: block;
                cursor: pointer;
            `

            const normal_color = '#176bd3'
            const hover_color = '#1152a3'
            const active_color = '#0b3a75'

            btn_container.innerHTML = `
                <a class="x-tab x-unselectable x-box-item x-tab-header-tab x-top x-tab-top x-tab-header-tab-top" 
                   style="user-select: text !important; padding: 2px 8px; display: flex; align-items: center; background: ${normal_color}; border-radius: 4px; width: 100%; height: 100%; box-sizing: border-box; transition: background-color 0.15s ease;">
                    <span class="x-tab-wrap x-tab-wrap-header-tab" style="width: 100%;">
                        <span class="x-tab-button x-tab-button-header-tab x-tab-text x-tab-icon x-tab-icon-left x-tab-button-center" style="display: flex; align-items: center; gap: 6px; justify-content: center;">
                            <span class="icon-stack" style="position: relative; width: 16px; height: 14px; display: inline-block; flex-shrink: 0;">
                                <span class="x-fa fa-flask" style="position: absolute; top: 6px; left: -18px; font-size: 17px; transform: rotate(-15deg); z-index: 2; color: #fff;"></span>
                                <span class="x-fa fa-odnoklassniki-square" style="position: absolute; bottom: 7px; right: 4px; font-size: 17px; transform: rotate(15deg); z-index: 1; color: #fff;"></span>
                            </span>
                            <span class="x-tab-inner x-tab-inner-header-tab" style="font-size: 12px; line-height: 12px; font-weight: 550; white-space: nowrap; color: #fff;">Hasil</span>
                        </span>
                    </span>
                </a>
            `

            const link_anchor = btn_container.querySelector('a')
            if (link_anchor) {
                btn_container.addEventListener('mouseenter', () => link_anchor.style.backgroundColor = hover_color)
                btn_container.addEventListener('mouseleave', () => link_anchor.style.backgroundColor = normal_color)
                btn_container.addEventListener('mousedown', () => link_anchor.style.backgroundColor = active_color)
                btn_container.addEventListener('mouseup', () => link_anchor.style.backgroundColor = hover_color)
            }

            root_panel.style.overflow = 'visible'
            if (body_wrap) (body_wrap as HTMLElement).style.overflow = 'visible'
            if (body_panel) (body_panel as HTMLElement).style.overflow = 'visible'
            if (inner_ct) (inner_ct as HTMLElement).style.overflow = 'visible';
            (target_el as HTMLElement).style.overflow = 'visible'

            const parent_target_el = root_panel.parentElement
            if (parent_target_el && parent_target_el.id.includes('-targetEl')) {
                parent_target_el.style.overflow = 'visible'

                const parent_inner_ct = parent_target_el.parentElement
                if (parent_inner_ct && parent_inner_ct.id.includes('-innerCt')) {
                    parent_inner_ct.style.overflow = 'visible'
                    parent_inner_ct.style.height = '150px'
                    parent_inner_ct.style.minHeight = '150px'
                    parent_inner_ct.style.maxHeight = '150px'
                }
            }

            target_el.appendChild(btn_container)

            btn_container.addEventListener('click', (e) => {
                e.preventDefault()
                e.stopPropagation()
                const parent_window_el = target_el.closest<HTMLElement>('.x-window')
                const render_target = parent_window_el || document.body
                this.open_modal(panel_id, render_target, mrn)
            })
        })
    }

    remove_and_reset_layout() {
        document.querySelectorAll('.results-menu-btn-container').forEach(el => el.remove())

        const root_panels = document.querySelectorAll<HTMLElement>('[id^="pasien-short-detil-"]')
        root_panels.forEach(root_panel => {
            const match = root_panel.id.match(/pasien-short-detil-(\d+)/)
            if (!match) return
            const panel_id = match[1]

            const body_wrap = root_panel.querySelector<HTMLElement>(`#pasien-short-detil-${panel_id}-bodyWrap`)
            const body_panel = root_panel.querySelector<HTMLElement>(`#pasien-short-detil-${panel_id}-body`)
            const inner_ct = root_panel.querySelector<HTMLElement>(`#pasien-short-detil-${panel_id}-innerCt`)
            const target_el = root_panel.querySelector<HTMLElement>(`#pasien-short-detil-${panel_id}-targetEl`)

            // uncomment if needed, for now commented as we dont store the default value to actually reset it
            // and the value we are injecting (150px, visible..) is actually not visibly breaking the ui

            // root_panel.style.overflow = ''
            // if (body_wrap) body_wrap.style.overflow = ''
            // if (body_panel) body_panel.style.overflow = ''
            // if (inner_ct) inner_ct.style.overflow = ''
            // if (target_el) target_el.style.overflow = ''

            // const parent_target_el = root_panel.parentElement
            // if (parent_target_el && parent_target_el.id.includes('-targetEl')) {
            //     parent_target_el.style.overflow = ''

            //     const parent_inner_ct = parent_target_el.parentElement
            //     if (parent_inner_ct && parent_inner_ct.id.includes('-innerCt')) {
            //         parent_inner_ct.style.overflow = ''
            //         parent_inner_ct.style.height = ''
            //         parent_inner_ct.style.minHeight = ''
            //         parent_inner_ct.style.maxHeight = ''
            //     }
            // }
        })
    }

    open_modal(id: string, parent_el: HTMLElement, mrn: string) {
        open_results_menu_modal({
            id,
            title: 'Hasil',
            parent_el,
            engine: this.engine,
            mrn,
        })
    }
}
