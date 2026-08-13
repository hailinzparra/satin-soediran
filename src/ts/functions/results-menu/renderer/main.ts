import { create_element } from '../../../utils/dom'
import { ResultsMenuFunction } from '../parent'
import { ResultsMenuLabRenderer } from './lab'
import { ResultsMenuTabManager } from './tab'
import { ResultsMenuTextLabRenderer } from './text-lab'

export class ResultsMenuRenderer {
    public manager: ResultsMenuTabManager
    lab_renderer: ResultsMenuLabRenderer
    text_lab_renderer: ResultsMenuTextLabRenderer

    constructor(
        public parent: ResultsMenuFunction,
        public mrn: string,
    ) {
        this.manager = new ResultsMenuTabManager(this.parent)

        const tab_lab = this.add_tab('Lab', 'fa-flask')
        // const tab_rad = this.add_tab('Radio', 'fa-odnoklassniki-square')
        const tab_text_lab = this.add_tab('Teks Lab')
        // const tab_text_rad = this.add_tab('Teks Radio')
        // const tab_text_all = this.add_tab('Teks Lengkap')

        this.lab_renderer = new ResultsMenuLabRenderer(this)
        this.lab_renderer.build_dom_elements(tab_lab)

        this.text_lab_renderer = new ResultsMenuTextLabRenderer(this)
        this.text_lab_renderer.build_dom_elements(tab_text_lab)
    }

    async start() {
        await this.lab_renderer.start()
    }

    add_tab(name: string, icon?: string): HTMLDivElement {
        const el = create_element('div')
        this.manager.add_tab(name.toLowerCase(), name, [el], icon)
        return el
    }

    sync_tab_text() {
        if (this.text_lab_renderer) {
            this.text_lab_renderer.sync_text_output()
        }
    }
}
