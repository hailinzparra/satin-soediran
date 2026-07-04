import { create_element } from '../../../../utils/dom'
import { Log } from '../../../../utils/logger'
import { sleep } from '../../../../utils/misc'
import { ResultsMenuLabRenderer } from '../lab'

export class ResultsMenuLabToolbar {
    el: HTMLDivElement
    private btn_load_next: HTMLButtonElement

    private current_loaded: number = -1
    private current_total: number = 0

    constructor(
        protected lab_renderer: ResultsMenuLabRenderer,
    ) {
        this.btn_load_next = create_element('button', {
            classes: ResultsMenuLabRenderer.classes.toolbar.btn_load_next,
            text: 'Muat Data (...)',
        })

        this.el = create_element('div', { classes: ResultsMenuLabRenderer.classes.toolbar.el }, [
            this.btn_load_next,
        ])

        this.btn_load_next.addEventListener('click', () => this.handle_load_next())
    }

    async handle_load_next(): Promise<void> {
        this.btn_load_next.disabled = true
        this.btn_load_next.style.opacity = '0.6'
        this.btn_load_next.style.cursor = 'not-allowed'
        this.btn_load_next.textContent = 'Memuat...'

        try {
            await sleep(500)
            const result = await this.lab_renderer.load_next_data()
            if (result.success) {
                this.current_total = this.lab_renderer.current_total
                this.current_loaded = this.lab_renderer.current_loaded
            }
        } catch (error) {
            Log.error('Error loading next data batch:', error)
        } finally {
            this.update_counter_ui(this.current_loaded, this.current_total)
        }
    }

    update_counter_ui(loaded: number, total: number): void {
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
