import { ResultsMenuLabResult } from '../../../../types/functions/results-menu'
import { create_element } from '../../../../utils/dom'
import { ResultsMenuLabRenderer } from '../lab'

export class ResultsMenuLabTable {
    el: HTMLDivElement

    constructor(
        protected lab_renderer: ResultsMenuLabRenderer,
    ) {
        this.el = create_element('div', { classes: ResultsMenuLabRenderer.classes.table.el })
    }

    rebuild_table(lab_results: Map<string, ResultsMenuLabResult>) {
        lab_results.forEach(item => {
            console.log(item)
        })
    }
}
