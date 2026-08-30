import { ModalInstance, ModalUI } from '../../ui/modal'
import { create_element } from '../../utils/dom'

export class ActionsModalController {
    public container_el: HTMLElement
    public btn_el: HTMLButtonElement

    public static MODAL = {
        ID: 'sn-actions-modal-instance',
        WIDTH: 600,
        HEIGHT: 490,
    }

    constructor() {
        this.container_el = create_element('div')
        this.btn_el = this.create_actions_btn()
    }

    open_actions_modal(): ModalInstance | null {
        const parent_el = document.body

        const min_xgap = Math.max(10, Math.min(50, window.innerWidth * 0.05))
        const min_ygap = Math.max(10, Math.min(50, window.innerHeight * 0.05))
        const w = Math.min(window.innerWidth - min_xgap * 2, ActionsModalController.MODAL.WIDTH)
        const h = Math.min(window.innerHeight - min_ygap * 2, ActionsModalController.MODAL.HEIGHT)
        const x = Math.max(0, (window.innerWidth - w) / 2)
        const y = Math.max(0, (window.innerHeight - h) / 2)

        const { instance, is_existing } = ModalUI.fire({
            id: ActionsModalController.MODAL.ID,
            title: 'Aksi (Satin Dash UI)',
            content: this.container_el,
            parent_el: parent_el,
            options: {
                top: `${y}px`,
                left: `${x}px`,
                width: `${w}px`,
                height: `${h}px`,
            },
        })

        if (is_existing || !instance) return instance

        instance.body.style.padding = '0'
        instance.body.style.height = 'calc(100% - 38px)'
        return instance
    }

    create_actions_btn(): HTMLButtonElement {
        const actions_btn = create_element('button', {
            classes: 'btn-actions',
            text: 'Aksi',
        })

        actions_btn.addEventListener('click', (e: Event) => {
            e.stopPropagation()
            this.open_actions_modal()
        })

        return actions_btn
    }
}
