import { ExtensionSettings } from '../types'
import { TabManager } from '../utils'
import { SatinPopupEngine } from '../popup'
import { TabSettingsContent } from './tab-settings'

export enum PopupTabManager {
    Settings = 'tab-manager-settings',
    Tools = 'tab-manager-tools',
}

export enum PopupTabName {
    Home = 'home',
    Template = 'template'
}

export class PopupTab {
    public tab_manager: Record<PopupTabManager, TabManager>
    constructor(
        protected engine: SatinPopupEngine,
        protected get_settings: () => ExtensionSettings,
    ) {
        this.tab_manager = {
            [PopupTabManager.Settings]: new TabManager(PopupTabManager.Settings),
            [PopupTabManager.Tools]: new TabManager(PopupTabManager.Tools),
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
        this.tab_manager[PopupTabManager.Settings].add_tab(PopupTabName.Home, 'Pengaturan', [
            new TabSettingsContent(this.engine, this.get_settings).el.container
        ], true)
        this.tab_manager[PopupTabManager.Tools].add_tab(PopupTabName.Home, 'Lain-lain', [], true)
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
