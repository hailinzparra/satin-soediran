import { create_element, sleep } from '../../utils'
import { ResultsMenuTabLab } from './tab-lab'

export class ResultsMenuLabToolbar {
    private tab_lab: ResultsMenuTabLab
    public el: HTMLDivElement
    private btn_load_next: HTMLButtonElement

    private current_loaded: number = -1
    private current_total: number = 0

    constructor(tab_lab: ResultsMenuTabLab) {
        this.tab_lab = tab_lab

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

    public async handle_load_next(): Promise<void> {
        this.btn_load_next.disabled = true
        this.btn_load_next.style.opacity = '0.6'
        this.btn_load_next.style.cursor = 'not-allowed'
        this.btn_load_next.textContent = 'Memuat...'

        try {
            await sleep(500)
            const result = await this.tab_lab.load_next_data()
            if (result.success) {
                this.current_total = this.tab_lab.current_total
                this.current_loaded = this.tab_lab.current_loaded
            }
        } catch (error) {
            console.error('Error loading next data batch:', error)
        } finally {
            this.update_counter_ui(this.current_loaded, this.current_total)
        }
    }

    public update_counter_ui(loaded: number, total: number): void {
        const counter_text = `(${Math.max(0, loaded)}/${Math.max(0, total)})`

        const btn = this.btn_load_next
        btn.textContent = `Muat Data ${counter_text}`
        btn.disabled = false
        btn.style.opacity = '1'
        btn.style.cursor = 'pointer'

        if (loaded === -1) {
            btn.textContent = 'Muat Data (...)'
        } else if (loaded >= total) {
            btn.textContent = `Data Termuat ${counter_text}`
            btn.disabled = true
            btn.style.opacity = '0.6'
            btn.style.cursor = 'not-allowed'
        }
    }
}
