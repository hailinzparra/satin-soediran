import { create_element } from '../../../utils/dom'
import { ResultsMenuFunction } from '../parent'
import { ResultsMenuLabRenderer } from './lab'
import { ResultsMenuRadioRenderer } from './radio'
import { ResultsMenuTabManager } from './tab'
import { ResultsMenuTextAllRenderer } from './text-all'
import { ResultsMenuTextLabRenderer } from './text-lab'
import { ResultsMenuTextRadioRenderer } from './text-radio'

export class ResultsMenuRenderer {
    public manager: ResultsMenuTabManager
    lab_renderer: ResultsMenuLabRenderer
    radio_renderer: ResultsMenuRadioRenderer
    text_lab_renderer: ResultsMenuTextLabRenderer
    text_radio_renderer: ResultsMenuTextRadioRenderer
    text_all_renderer: ResultsMenuTextAllRenderer

    constructor(
        public parent: ResultsMenuFunction,
        public mrn: string,
    ) {
        this.manager = new ResultsMenuTabManager(this.parent)

        const tab_lab = this.add_tab('Lab', 'fa-flask')
        const tab_rad = this.add_tab('Radio', 'fa-odnoklassniki-square')
        const tab_text_lab = this.add_tab('Teks Lab')
        const tab_text_rad = this.add_tab('Teks Radio')
        const tab_text_all = this.add_tab('Teks Lengkap')

        this.lab_renderer = new ResultsMenuLabRenderer(this)
        this.lab_renderer.build_dom_elements(tab_lab)

        this.radio_renderer = new ResultsMenuRadioRenderer(this)
        this.radio_renderer.build_dom_elements(tab_rad)

        this.text_lab_renderer = new ResultsMenuTextLabRenderer(this)
        this.text_lab_renderer.build_dom_elements(tab_text_lab)

        this.text_radio_renderer = new ResultsMenuTextRadioRenderer(this)
        this.text_radio_renderer.build_dom_elements(tab_text_rad)

        this.text_all_renderer = new ResultsMenuTextAllRenderer(this)
        this.text_all_renderer.build_dom_elements(tab_text_all)

        if (this.text_lab_renderer) {
            this.text_lab_renderer.on_change = () => {
                this.text_all_renderer.sync_text_output()
            }
        }

        if (this.text_radio_renderer) {
            this.text_radio_renderer.on_change = () => {
                this.text_all_renderer.sync_text_output()
            }
        }
    }

    async start() {
        await Promise.all([
            this.lab_renderer.start(),
            this.radio_renderer.start(),
        ])
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
        if (this.text_radio_renderer) {
            this.text_radio_renderer.sync_text_output()
        }
        if (this.text_all_renderer) {
            this.text_all_renderer.sync_text_output()
        }
    }
}
