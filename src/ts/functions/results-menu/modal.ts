import { create_element, ModalUI } from '../../utils'
import { ResultsMenuModalTabManager } from './modal-tab'
import { ResultsMenuTabLab } from './tab-lab'

export const open_results_menu_modal = (options: {
    id: string,
    title: string,
    parent_el: HTMLElement,
}) => {
    const content_div = document.createElement('div')

    const modal_width = 760
    const modal_height = 490
    const modal_left = Math.max(0, (window.innerWidth - modal_width) / 2)
    const modal_top = Math.max(0, (window.innerHeight - modal_height) / 2)

    const { instance: modal_win, is_existing } = ModalUI.fire({
        id: options.id,
        title: options.title,
        top: `${modal_top}px`,
        left: `${modal_left}px`,
        width: `${modal_width}px`,
        height: `${modal_height}px`,
        content: content_div,
        parent_el: options.parent_el,
    })

    if (is_existing || !modal_win) return

    modal_win.el.style.maxWidth = 'calc(100vw - 20px)'
    modal_win.body.style.padding = '0'

    const manager = new ResultsMenuModalTabManager()

    const build_tab_content = (name: string, icon?: string): HTMLDivElement => {
        const el = create_element('div', {
            styles: {
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden',
            }
        })
        manager.add_tab(name.toLowerCase(), name, [el], icon)
        return el
    }

    const tab_content_lab = build_tab_content('Lab', 'fa-flask')
    const tab_content_radio = build_tab_content('Radio', 'fa-odnoklassniki-square')
    const tab_content_text = build_tab_content('Teks')

    const tab_lab = new ResultsMenuTabLab()

    tab_content_lab.append(...tab_lab.get_dom_contents())
    modal_win.body.append(manager.container)
}
