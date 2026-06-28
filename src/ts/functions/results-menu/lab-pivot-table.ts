import { create_element } from '../../utils'

export class ResultsMenuLabPivotTable {
    public el: HTMLDivElement
    constructor() {
        this.el = create_element('div', {
            classes: 'results-menu-lab-table-wrapper',
        })
    }
}
