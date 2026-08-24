import { SatinBaseFunction } from '../../types/functions/base'
import { DEFAULT_RESULTS_MENU_CONFIG, ResultsMenuConfig, ResultsMenuData } from '../../types/functions/results-menu'
import { ModalInstance, ModalUI } from '../../ui/modal'
import { ResultsMenuExtractor } from './extractor'
import { ResultsMenuInjector } from './injector'
import { ResultsMenuRenderer } from './renderer/main'

export interface ResultsMenuOpenModalData {
    mrn: string
    panel_id: string
    target_el: HTMLDivElement
}

export class ResultsMenuFunction extends SatinBaseFunction<ResultsMenuConfig, ResultsMenuExtractor, ResultsMenuInjector> {
    public extractor = new ResultsMenuExtractor(this)
    public injector = new ResultsMenuInjector(this)
    public config = DEFAULT_RESULTS_MENU_CONFIG

    private static MODAL = {
        // WIDTH: 760,
        // HEIGHT: 490,
        // WIDTH: 600,
        // HEIGHT: 760,
        WIDTH: 1200,
        HEIGHT: 800,
    }

    public modal_instance: ModalInstance | null = null

    get_default_data(): ResultsMenuData {
        return structuredClone(DEFAULT_RESULTS_MENU_CONFIG.data)
    }

    apply(): void {
        if (this.get_is_feature_enabled()) {
            // just injector at work
            this.injector.execute()
        } else {
            // reset injection (if any) if disabled
            this.injector.reset()
        }
    }

    on_btn_click(data: ResultsMenuOpenModalData) {
        this.open_modal(data)
    }

    open_modal(data: ResultsMenuOpenModalData) {
        const window_el = data.target_el.closest<HTMLElement>('.x-window')
        const parent_el = window_el || document.body

        const min_xgap = Math.max(10, Math.min(50, window.innerWidth * 0.05))
        const min_ygap = Math.max(10, Math.min(50, window.innerHeight * 0.05))
        const w = Math.min(window.innerWidth - min_xgap * 2, ResultsMenuFunction.MODAL.WIDTH)
        const h = Math.min(window.innerHeight - min_ygap * 2, ResultsMenuFunction.MODAL.HEIGHT)
        const x = Math.max(0, (window.innerWidth - w) / 2)
        const y = Math.max(0, (window.innerHeight - h) / 2)

        const { instance, is_existing } = ModalUI.fire({
            id: this.config.selectors.ids.modal(data.mrn, data.panel_id),
            title: `Hasil (${data.mrn})`,
            content: document.createElement('div'),
            parent_el: parent_el,
            options: {
                top: `${y}px`,
                left: `${x}px`,
                width: `${w}px`,
                height: `${h}px`,
            },
        })

        if (is_existing || !instance) return

        this.modal_instance = instance

        // a new modal opened! lets build the content
        const renderer = new ResultsMenuRenderer(this, data.mrn)
        this.modal_instance.el.style.maxWidth = 'calc(100vw - 20px)'
        this.modal_instance.body.style.padding = '0'
        this.modal_instance.body.append(renderer.manager.container)

        // start the first data loading
        renderer.start()
    }
}
