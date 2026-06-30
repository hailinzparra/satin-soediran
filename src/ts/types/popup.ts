import { SatinPopupEngine } from '../engine/popup-engine'

export enum PopupTabManagerName {
    Settings = 'tab-manager-settings',
    Tools = 'tab-manager-tools',
}

export enum PopupSidebarNav {
    Settings = 'settings',
    Tools = 'tools',
}

export enum PopupTabName {
    Home = 'home',
    Template = 'template',
}

export interface PopupContentElements {
    container: HTMLElement
}

export abstract class PopupContent<T extends PopupContentElements = PopupContentElements> {
    abstract el: T
    constructor(
        protected engine: SatinPopupEngine,
    ) { }
}

export interface PopupSidebarElements {
    container: HTMLElement
    brand_text: HTMLHeadingElement
    toggle_btn: HTMLButtonElement
    toggle_icon: SVGElement
    settings_btn: HTMLButtonElement
    tools_btn: HTMLButtonElement
    tools_accordion_btn: HTMLButtonElement
    tools_accordion_arrow: SVGElement
    tools_accordion_content: HTMLDivElement
    template_btn: HTMLButtonElement
    check_update_btn: HTMLButtonElement
}
