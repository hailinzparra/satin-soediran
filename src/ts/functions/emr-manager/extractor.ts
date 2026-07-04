import { SatinBaseFunctionExtractor } from '../../types/functions/base'
import { EMRManagerConfig } from '../../types/functions/emr-manager'
import { EMRManagerFunction } from './parent'

interface EMRManagerExtractorPanels {
    short_detail: NodeListOf<HTMLDivElement>
}

export class EMRManagerExtractor extends SatinBaseFunctionExtractor<EMRManagerFunction, EMRManagerConfig> {
    private static readonly MRN_REGEX = /^\d{2}\.\d{2}\.\d{2}\.\d{2}$/
    private static readonly DOT_REGEX = /\./g
    private static readonly PANEL_SHORT_MIN_HEIGHT = '150px'

    private get_panel_short_detail = () => document.querySelectorAll<HTMLDivElement>(this.parent.config.selectors.queries.panel_short_detail)

    private panels: EMRManagerExtractorPanels = {
        short_detail: [] as any
    }

    public async on_execute(): Promise<void> {
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

        this.extracted_data.active_panel_short_detail_id = match[1]

        const { body_wrap, body, inner_ct, target_el } = this.get_panel_short_detail_elements(
            active_panel,
            this.extracted_data.active_panel_short_detail_id,
        )

        if (!target_el) return

        this.ensure_panel_visible(active_panel, body_wrap, body, inner_ct, target_el)

        this.extracted_data.active_mrn = this.extract_mrn(target_el)

        this.new_data.active_mrn = this.extracted_data.active_mrn
        this.new_data.active_panel_short_detail_id = this.extracted_data.active_panel_short_detail_id
        this.has_new_data = true
    }

    private get_panel_short_detail_elements(panel: HTMLDivElement, panel_id: string) {
        return {
            body_wrap: panel.querySelector<HTMLDivElement>(`#pasien-short-detil-${panel_id}-bodyWrap`),
            body: panel.querySelector<HTMLDivElement>(`#pasien-short-detil-${panel_id}-body`),
            inner_ct: panel.querySelector<HTMLDivElement>(`#pasien-short-detil-${panel_id}-innerCt`),
            target_el: panel.querySelector<HTMLDivElement>(`#pasien-short-detil-${panel_id}-targetEl`),
        }
    }

    private ensure_panel_visible(
        active_panel: HTMLDivElement | null,
        body_wrap: HTMLDivElement | null,
        body: HTMLDivElement | null,
        inner_ct: HTMLDivElement | null,
        target_el: HTMLDivElement | null,
    ): void {
        if (!active_panel) return
        active_panel.style.overflow = 'visible'
        if (body_wrap) body_wrap.style.overflow = 'visible'
        if (body) body.style.overflow = 'visible'
        if (inner_ct) inner_ct.style.overflow = 'visible'
        if (target_el) target_el.style.overflow = 'visible'
        const parent_target_el = active_panel.parentElement
        if (parent_target_el && parent_target_el.id.includes('-targetEl')) {
            parent_target_el.style.overflow = 'visible'
            const parent_inner_ct = parent_target_el.parentElement
            if (parent_inner_ct && parent_inner_ct.id.includes('-innerCt')) {
                parent_inner_ct.style.overflow = 'visible'
                parent_inner_ct.style.height = EMRManagerExtractor.PANEL_SHORT_MIN_HEIGHT
                parent_inner_ct.style.minHeight = EMRManagerExtractor.PANEL_SHORT_MIN_HEIGHT
                parent_inner_ct.style.maxHeight = EMRManagerExtractor.PANEL_SHORT_MIN_HEIGHT
            }
        }
    }

    private extract_mrn(target_el: HTMLElement | null): string {
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
