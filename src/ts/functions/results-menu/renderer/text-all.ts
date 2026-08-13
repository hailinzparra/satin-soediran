import { create_element } from '../../../utils/dom'
import { Log } from '../../../utils/logger'
import { ResultsMenuRenderer } from './main'

export class ResultsMenuTextAllRenderer {
    private el: {
        container: HTMLDivElement | null
        textarea: HTMLTextAreaElement | null
        btn_copy: HTMLButtonElement | null
    } = {
            container: null,
            textarea: null,
            btn_copy: null,
        }

    public static classes = {
        container: 'sn-results-menu-text-container',
        toolbar: 'sn-results-menu-text-toolbar',
        toolbar_row: 'sn-results-menu-text-toolbar-row',
        toolbar_group: 'sn-results-menu-text-toolbar-group',
        btn_action: 'sn-results-menu-text-btn-action',
        textarea_wrapper: 'sn-results-menu-text-textarea-wrapper',
        textarea_el: 'sn-results-menu-text-textarea-el',
    }

    constructor(public main_renderer: ResultsMenuRenderer) { }

    build_dom_elements(target_el: HTMLDivElement) {
        this.el.btn_copy = create_element('button', {
            classes: ResultsMenuTextAllRenderer.classes.btn_action,
            text: 'SALIN TEKS',
        })

        const toolbar_row = create_element('div', { classes: ResultsMenuTextAllRenderer.classes.toolbar_row }, [
            create_element('div', { classes: ResultsMenuTextAllRenderer.classes.toolbar_group }, [
                this.el.btn_copy,
            ]),
        ])

        const toolbar = create_element('div', { classes: ResultsMenuTextAllRenderer.classes.toolbar }, [
            toolbar_row,
        ])

        this.el.textarea = create_element('textarea', {
            classes: ResultsMenuTextAllRenderer.classes.textarea_el,
            attrs: { readonly: true },
        })

        const textarea_wrapper = create_element('div', { classes: ResultsMenuTextAllRenderer.classes.textarea_wrapper }, [
            this.el.textarea,
        ])

        this.el.container = create_element('div', { classes: ResultsMenuTextAllRenderer.classes.container }, [
            toolbar,
            textarea_wrapper,
        ])

        target_el.append(this.el.container)

        this.el.btn_copy.addEventListener('click', () => {
            if (this.el.textarea && this.el.textarea.value) {
                navigator.clipboard.writeText(this.el.textarea.value)
                    .catch(err => Log.error('Could not copy full text: ', err))
            }
        })
    }

    sync_text_output() {
        if (!this.el.textarea) return

        const lab_text = this.main_renderer.text_lab_renderer.get_text()
        const radio_text = this.main_renderer.text_radio_renderer.get_text()

        const parts: string[] = []

        if (radio_text.trim()) {
            parts.push(radio_text.trim())
        }

        if (lab_text.trim()) {
            parts.push(lab_text.trim())
        }

        this.el.textarea.value = parts.join('\n\n').trim()
    }
}
