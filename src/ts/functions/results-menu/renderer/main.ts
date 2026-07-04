import { create_element } from '../../../utils/dom'
import { ResultsMenuFunction } from '../parent'
import { ResultsMenuLabRenderer } from './lab'
import { ResultsMenuTabManager } from './tab'

export class ResultsMenuRenderer {
    public manager: ResultsMenuTabManager
    lab_renderer: ResultsMenuLabRenderer

    constructor(
        public parent: ResultsMenuFunction,
        public mrn: string,
    ) {
        this.manager = new ResultsMenuTabManager(this.parent)

        const tab_lab = this.add_tab('Lab', 'fa-flask')
        const tab_rad = this.add_tab('Radio', 'fa-odnoklassniki-square')
        const tab_text = this.add_tab('Teks')

        this.lab_renderer = new ResultsMenuLabRenderer(this)
        this.lab_renderer.build_dom_elements(tab_lab)
    }

    start() {
        this.lab_renderer.toolbar.handle_load_next()
    }

    add_tab(name: string, icon?: string): HTMLDivElement {
        const el = create_element('div')
        this.manager.add_tab(name.toLowerCase(), name, [el], icon)
        return el
    }
}
