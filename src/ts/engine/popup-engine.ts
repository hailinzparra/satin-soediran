import { PopupSidebar } from '../popup/sidebar'
import { PopupSwal } from '../popup/swal'
import { PopupTab } from '../popup/tab'
import { SatinEngine } from './base'

export class SatinPopupEngine extends SatinEngine {
    target_width: number = 360

    main_container: HTMLDivElement = document.getElementById('main-container-0000')! as HTMLDivElement
    sidebar: PopupSidebar = new PopupSidebar(this)
    tab: PopupTab = new PopupTab(this)

    swal: PopupSwal = new PopupSwal(this)

    async on_init() {
        await this.all_drivers_initialized()
        this.sidebar.init()
        this.tab.init()
        this.bind_events()
    }

    bind_events() {
        this.main_container.style.minWidth = `${this.target_width}px`
        const scale_main_container = () => {
            if (!this.main_container) return
            const scale = window.innerWidth < this.target_width ? window.innerWidth / this.target_width : 1
            this.main_container.style.scale = `${scale}`
            this.main_container.style.height = `${100 / scale}vh`
        }
        window.addEventListener('resize', scale_main_container)
        scale_main_container()
        this.sidebar.bind_events()
    }
}
