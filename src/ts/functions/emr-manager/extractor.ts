import { SatinBaseFunctionExtractor } from '../../types/functions/base'
import { EMRManagerConfig } from '../../types/functions/emr-manager'

interface EMRManagerExtractorPanels {
    short_detail: NodeListOf<HTMLDivElement>
}

export class EMRManagerExtractor extends SatinBaseFunctionExtractor<EMRManagerConfig> {
    private static readonly MRN_REGEX = /^\d{2}\.\d{2}\.\d{2}\.\d{2}$/
    private static readonly DOT_REGEX = /\./g

    private get_panel_short_detail = () => document.querySelectorAll<HTMLDivElement>(this.parent.config.selectors.queries.panel_short_detail)

    private panels: EMRManagerExtractorPanels = {
        short_detail: [] as any
    }

    public async on_execute(): Promise<void> {
        if (!this.parent.get_is_feature_enabled()) return

        this.prepare_extraction()
        this.extract_panel_short_detail()
    }

    prepare_extraction() {
        this.panels.short_detail = this.get_panel_short_detail()
    }

    extract_panel_short_detail() {
        if (!this.panels.short_detail.length) {
            return
        }

        const active_panel = this.panels.short_detail.item(0)
        if (!active_panel) return

        const match = active_panel.id.match(/pasien-short-detil-(\d+)/)
        if (!match) return

        const extracted_data = this.parent.get_default_extracted_data()
        extracted_data.active_panel_short_detail_id = match[1]

        const els = this.get_panel_short_detail_elements(active_panel, extracted_data.active_panel_short_detail_id)

        if (!els.target_el) return

        extracted_data.active_mrn = this.extract_mrn(els.target_el)

        if (extracted_data.active_mrn !== this.saved_data.active_mrn) {
            this.new_data.active_mrn = extracted_data.active_mrn
            this.has_new_data = true
        }

        if (extracted_data.active_panel_short_detail_id !== this.saved_data.active_panel_short_detail_id) {
            this.new_data.active_panel_short_detail_id = extracted_data.active_panel_short_detail_id
            this.has_new_data = true
        }
    }

    get_panel_short_detail_elements(panel: HTMLDivElement, panel_id: string) {
        return {
            body_wrap: panel.querySelector<HTMLElement>(`#pasien-short-detil-${panel_id}-bodyWrap`),
            body: panel.querySelector<HTMLElement>(`#pasien-short-detil-${panel_id}-body`),
            inner_ct: panel.querySelector<HTMLElement>(`#pasien-short-detil-${panel_id}-innerCt`),
            target_el: panel.querySelector<HTMLElement>(`#pasien-short-detil-${panel_id}-targetEl`),
        }
    }

    extract_mrn(target_el: HTMLElement | null): string {
        if (!target_el) return ''

        const components = target_el.querySelectorAll('.x-component')
        const mrn_element = Array.from(components).find(el => {
            const text = el.textContent?.trim() || ''
            return EMRManagerExtractor.MRN_REGEX.test(text)
        })

        if (!mrn_element || !mrn_element.textContent) {
            return ''
        }

        const clean_string = mrn_element.textContent.trim().replace(EMRManagerExtractor.DOT_REGEX, '')

        return String(parseInt(clean_string, 10))
    }
}
