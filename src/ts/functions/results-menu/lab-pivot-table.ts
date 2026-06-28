import { create_element } from '../../utils'
import { ResultsMenuTabLab } from './tab-lab'

export class ResultsMenuLabPivotTable {
    private tab_lab: ResultsMenuTabLab
    public el: HTMLDivElement
    constructor(tab_lab: ResultsMenuTabLab) {
        this.tab_lab = tab_lab

        this.el = create_element('div', {
            classes: 'results-menu-lab-table-wrapper',
        })
    }
}
