import { create_element } from '../../utils'
import { ResultsMenuLabPivotTable } from './lab-pivot-table'
import { ResultsMenuLabToolbar } from './lab-toolbar'

export class ResultsMenuTabLab {
    pivot_table: ResultsMenuLabPivotTable
    toolbar: ResultsMenuLabToolbar

    constructor() {
        this.pivot_table = new ResultsMenuLabPivotTable()
        this.toolbar = new ResultsMenuLabToolbar(this.pivot_table)
    }

    get_dom_contents(): HTMLDivElement[] {
        return [
            this.toolbar.el,
            create_element('div', {
                styles: {
                    flex: '1',
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '4px'
                }
            }, [
                this.pivot_table.el,
            ]),
        ]
    }
}
