import { SatinPopupEngine } from '../popup'
import { TabManager } from '../utils'

export enum PopupTabManager {
    Settings = 'settings',
    Tools = 'tools',
}

export enum PopupTabName {
    Home = 'home',
    Template = 'template'
}

export class PopupTab {
    public tab_manager: Record<PopupTabManager, TabManager>
    private engine: SatinPopupEngine
    constructor(engine: SatinPopupEngine) {
        this.engine = engine
        this.tab_manager = {
            [PopupTabManager.Settings]: new TabManager(PopupTabManager.Settings),
            [PopupTabManager.Tools]: new TabManager(PopupTabManager.Tools),
        }
        const el_content_container = document.getElementById('content-container-0000')! as HTMLDivElement
        el_content_container.append(...Object.values(this.tab_manager).map(n => n.container))
        this.tab_manager[PopupTabManager.Settings].add_tab(PopupTabName.Home, 'Pengaturan', [], true)
        this.tab_manager[PopupTabManager.Tools].add_tab(PopupTabName.Home, 'Peralatan', [], true)
    }
    open_tab(manager_name: PopupTabManager, name: PopupTabName) {
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
