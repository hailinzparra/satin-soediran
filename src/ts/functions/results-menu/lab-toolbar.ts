import { create_element, sleep } from '../../utils'
import { ResultsMenuLabPivotTable } from './lab-pivot-table'

export class ResultsMenuLabToolbar {
    public el: HTMLDivElement
    private btn_load_next: HTMLButtonElement
    private table_instance: ResultsMenuLabPivotTable

    private current_loaded: number = 0
    private current_total: number = 0

    constructor(table_instance: ResultsMenuLabPivotTable) {
        this.table_instance = table_instance

        this.btn_load_next = create_element('button', {
            text: 'Muat Data (...)',
            styles: {
                background: '#157fcc',
                border: '1px solid #157fcc',
                padding: '2px 8px',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: '600',
                color: '#fff',
                cursor: 'pointer',
                height: '22px',
            }
        })

        this.btn_load_next.addEventListener('click', () => this.handle_load_next())

        this.el = create_element('div', {
            styles: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                padding: '4px 12px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
            }
        }, [
            this.btn_load_next,
        ])
    }

    private async handle_load_next(): Promise<void> {
        this.btn_load_next.disabled = true
        this.btn_load_next.style.opacity = '0.6'
        this.btn_load_next.style.cursor = 'not-allowed'
        this.btn_load_next.textContent = 'Memuat...'

        try {
            await sleep(1000)

            // TODO: Place api_request(...) logic here
            // const response = await api_request(...)
            this.current_total = 10
            this.current_loaded += 3

        } catch (error) {
            console.error('Error loading next data batch:', error)
        } finally {
            this.update_counter(this.current_loaded, this.current_total)
        }
    }

    public update_counter(loaded: number, total: number): void {
        this.current_loaded = loaded
        this.current_total = total

        this.btn_load_next.textContent = `Muat Data (${loaded}/${total})`

        if (loaded >= total) {
            this.btn_load_next.disabled = true
            this.btn_load_next.style.opacity = '0.6'
            this.btn_load_next.style.cursor = 'not-allowed'
            this.btn_load_next.textContent = `Data Termuat (${loaded}/${total})`
        } else {
            this.btn_load_next.disabled = false
            this.btn_load_next.style.opacity = '1'
            this.btn_load_next.style.cursor = 'pointer'
        }
    }
}
