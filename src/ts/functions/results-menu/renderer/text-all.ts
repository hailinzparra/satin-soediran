import { create_element } from '../../../utils/dom'
import { Log } from '../../../utils/logger'
import { ResultsMenuRenderer } from './main'

export type DividerOption = 'Kosong' | '===' | '--' | '.'

export class ResultsMenuTextAllRenderer {
    private lab_first: boolean = false
    private main_divider: DividerOption = '==='
    private lab_divider: DividerOption = 'Kosong'
    private radio_divider: DividerOption = '--'

    private el: {
        container: HTMLDivElement | null
        textarea: HTMLTextAreaElement | null
        btn_copy: HTMLButtonElement | null
        btn_lab_first: HTMLButtonElement | null
        btn_reset: HTMLButtonElement | null
        main_divider_buttons: Map<DividerOption, HTMLButtonElement>
        lab_divider_buttons: Map<DividerOption, HTMLButtonElement>
        radio_divider_buttons: Map<DividerOption, HTMLButtonElement>
    } = {
            container: null,
            textarea: null,
            btn_copy: null,
            btn_lab_first: null,
            btn_reset: null,
            main_divider_buttons: new Map(),
            lab_divider_buttons: new Map(),
            radio_divider_buttons: new Map(),
        }

    public static classes = {
        container: 'sn-results-menu-text-container',
        toolbar: 'sn-results-menu-text-toolbar',
        toolbar_row: 'sn-results-menu-text-toolbar-row',
        toolbar_group: 'sn-results-menu-text-toolbar-group',
        date_filter_row: 'sn-results-menu-text-date-filter-row',
        date_filter_label: 'sn-results-menu-text-date-filter-label',
        divider_group: 'sn-results-menu-text-divider-group',
        divider_label: 'sn-results-menu-text-divider-label',
        btn_toggle: 'sn-results-menu-text-btn-toggle',
        btn_toggle_active: 'sn-results-menu-text-btn-toggle-active',
        btn_macro: 'sn-results-menu-text-btn-macro',
        btn_action: 'sn-results-menu-text-btn-action',
        textarea_wrapper: 'sn-results-menu-text-textarea-wrapper',
        textarea_el: 'sn-results-menu-text-textarea-el',
    }

    constructor(public main_renderer: ResultsMenuRenderer) { }

    build_dom_elements(target_el: HTMLDivElement) {
        // 1. "Lab Dulu" toggle button
        this.el.btn_lab_first = create_element('button', {
            classes: ResultsMenuTextAllRenderer.classes.btn_toggle,
            text: 'Lab Dulu',
        })

        // 2. Red "Reset Filter" button
        this.el.btn_reset = create_element('button', {
            classes: `${ResultsMenuTextAllRenderer.classes.btn_macro} reset`,
            text: 'Reset Filter',
        })

        // 3. "SALIN TEKS" button
        this.el.btn_copy = create_element('button', {
            classes: ResultsMenuTextAllRenderer.classes.btn_action,
            text: 'SALIN TEKS',
        })

        // Top Toolbar Row
        const toolbar_row = create_element('div', { classes: ResultsMenuTextAllRenderer.classes.toolbar_row }, [
            create_element('div', { classes: ResultsMenuTextAllRenderer.classes.toolbar_group }, [
                this.el.btn_lab_first,
                this.el.btn_reset,
            ]),
            create_element('div', { classes: ResultsMenuTextAllRenderer.classes.toolbar_group }, [
                this.el.btn_copy,
            ]),
        ])

        // Filter Rows for Dividers
        const options: DividerOption[] = ['Kosong', '===', '--', '.']

        const main_divider_row = this.create_divider_group_row(
            'Pembatas:',
            options,
            this.main_divider,
            this.el.main_divider_buttons,
            (opt) => {
                this.main_divider = opt
                this.sync_text_output()
            }
        )

        const lab_divider_row = this.create_divider_group_row(
            'Pembatas Lab:',
            options,
            this.lab_divider,
            this.el.lab_divider_buttons,
            (opt) => {
                this.lab_divider = opt
                this.sync_text_output()
            }
        )

        const radio_divider_row = this.create_divider_group_row(
            'Pembatas Radio:',
            options,
            this.radio_divider,
            this.el.radio_divider_buttons,
            (opt) => {
                this.radio_divider = opt
                this.sync_text_output()
            }
        )

        const toolbar = create_element('div', { classes: ResultsMenuTextAllRenderer.classes.toolbar }, [
            toolbar_row,
            main_divider_row,
            lab_divider_row,
            radio_divider_row,
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

        this.bind_events()
    }

    private create_divider_group_row(
        label_text: string,
        options: DividerOption[],
        default_val: DividerOption,
        btn_map: Map<DividerOption, HTMLButtonElement>,
        on_select: (opt: DividerOption) => void
    ): HTMLDivElement {
        const buttons: HTMLButtonElement[] = options.map((opt) => {
            const is_active = opt === default_val
            const btn_cls = `${ResultsMenuTextAllRenderer.classes.btn_toggle} ${is_active ? ResultsMenuTextAllRenderer.classes.btn_toggle_active : ''}`

            const btn = create_element('button', {
                classes: btn_cls,
                text: opt,
            })

            btn_map.set(opt, btn)

            btn.addEventListener('click', () => {
                btn_map.forEach((b) => b.classList.remove(ResultsMenuTextAllRenderer.classes.btn_toggle_active))
                btn.classList.add(ResultsMenuTextAllRenderer.classes.btn_toggle_active)
                on_select(opt)
            })

            return btn
        })

        return create_element('div', { classes: ResultsMenuTextAllRenderer.classes.date_filter_row }, [
            create_element('div', { classes: ResultsMenuTextAllRenderer.classes.divider_label, text: label_text }),
            create_element('div', { classes: ResultsMenuTextAllRenderer.classes.divider_group }, buttons),
        ])
    }

    private bind_events() {
        this.el.btn_copy?.addEventListener('click', () => {
            if (this.el.textarea && this.el.textarea.value) {
                navigator.clipboard.writeText(this.el.textarea.value)
                    .catch(err => Log.error('Could not copy full text: ', err))
            }
        })

        this.el.btn_lab_first?.addEventListener('click', () => {
            this.lab_first = !this.lab_first
            if (this.lab_first) {
                this.el.btn_lab_first?.classList.add(ResultsMenuTextAllRenderer.classes.btn_toggle_active)
            } else {
                this.el.btn_lab_first?.classList.remove(ResultsMenuTextAllRenderer.classes.btn_toggle_active)
            }
            this.sync_text_output()
        })

        this.el.btn_reset?.addEventListener('click', () => {
            this.reset_filters()
        })
    }

    private reset_filters() {
        this.lab_first = false
        this.main_divider = '==='
        this.lab_divider = 'Kosong'
        this.radio_divider = '--'

        this.el.btn_lab_first?.classList.remove(ResultsMenuTextAllRenderer.classes.btn_toggle_active)

        this.update_radio_group_ui(this.el.main_divider_buttons, this.main_divider)
        this.update_radio_group_ui(this.el.lab_divider_buttons, this.lab_divider)
        this.update_radio_group_ui(this.el.radio_divider_buttons, this.radio_divider)

        this.sync_text_output()
    }

    private update_radio_group_ui(btn_map: Map<DividerOption, HTMLButtonElement>, active_val: DividerOption) {
        btn_map.forEach((btn, opt) => {
            if (opt === active_val) {
                btn.classList.add(ResultsMenuTextAllRenderer.classes.btn_toggle_active)
            } else {
                btn.classList.remove(ResultsMenuTextAllRenderer.classes.btn_toggle_active)
            }
        })
    }

    private apply_internal_divider(text: string, divider: DividerOption): string {
        const trimmed = text.trim()
        if (!trimmed) return ''

        // Standardize newlines replacing sequence of double-newlines
        if (divider === 'Kosong') {
            return trimmed.replace(/\n\s*\n+/g, '\n')
        }

        return trimmed.replace(/\n\s*\n+/g, `\n${divider}\n`)
    }

    public sync_text_output() {
        if (!this.el.textarea) return

        let lab_text = this.main_renderer.text_lab_renderer.get_text()
        let radio_text = this.main_renderer.text_radio_renderer.get_text()

        lab_text = this.apply_internal_divider(lab_text, this.lab_divider)
        radio_text = this.apply_internal_divider(radio_text, this.radio_divider)

        const first_part = this.lab_first ? lab_text : radio_text
        const second_part = this.lab_first ? radio_text : lab_text

        let output = ''

        if (first_part && second_part) {
            if (this.main_divider === 'Kosong') {
                output = `${first_part}\n${second_part}`
            } else {
                output = `${first_part}\n${this.main_divider}\n${second_part}`
            }
        } else {
            output = first_part || second_part || ''
        }

        this.el.textarea.value = output.trim()
    }
}
