import { SatinPopupEngine } from '../engine/popup-engine'
import { PopupTabManagerName, PopupTabName } from '../types/popup'
import { TabManager } from '../ui/tab'
import { PopupSettingsContent } from './settings-content'

export class PopupTab {
    public tab_manager: Record<PopupTabManagerName, TabManager>
    constructor(
        protected engine: SatinPopupEngine,
    ) {
        this.tab_manager = {
            [PopupTabManagerName.Settings]: new TabManager(PopupTabManagerName.Settings),
            [PopupTabManagerName.Tools]: new TabManager(PopupTabManagerName.Tools),
        }
        try {
            const el_content_container = document.getElementById('content-container-0000')! as HTMLDivElement
            el_content_container.append(...Object.values(this.tab_manager).map(n => n.container))
        }
        catch (err) {
            this.engine.swal.fire_fatal_error(
                'Error',
                'Gagal menampilkan konten.',
                err,
            )
        }
    }

    init() {
        this.tab_manager[PopupTabManagerName.Settings].add_tab(PopupTabName.Home, 'Pengaturan', [
            new PopupSettingsContent(this.engine).el.container
        ], true)
        this.tab_manager[PopupTabManagerName.Tools].add_tab(PopupTabName.Home, 'Lain-lain', [], true)
    }

    open_tab(manager_name: PopupTabManagerName, name: PopupTabName) {
        const manager = this.tab_manager[manager_name]
        switch (name) {
            case PopupTabName.Template:
                manager.add_tab(PopupTabName.Template, 'Templat', [])
                break
            default:
                break
        }
    }
}
