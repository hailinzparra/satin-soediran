import { BaseApiResponse, ExtensionDriver, ExtensionEvent, ExtensionFunction, HistoryOrderResepCache } from '../types'
import { title_case_name } from '../utils'

interface PetugasInfo {
    ID?: string
    NAMA?: string
    GELAR_DEPAN?: string
    GELAR_BELAKANG?: string
    REFERENSI?: {
        PROFESI?: {
            ID?: string
            DESKRIPSI?: string
            [key: string]: any
        }
        [key: string]: any
    }
    [key: string]: any
}

interface OrderResepItem {
    NOMOR?: string
    TANGGAL?: string
    PEMBERI_RESEP?: string
    REFERENSI?: {
        PETUGAS?: PetugasInfo
        [key: string]: any
    }
    [key: string]: any
}

interface KunjunganItem {
    NOMOR: string
    REF?: string
    MASUK?: string
    REFERENSI?: {
        ASAL?: OrderResepItem
        PETUGAS?: PetugasInfo
        [key: string]: any
    }
    [key: string]: any
}

class KunjunganFilterResponse extends BaseApiResponse<KunjunganItem> {
    data!: KunjunganItem[]
}

class OrderResepFilterResponse extends BaseApiResponse<OrderResepItem> {
    data!: OrderResepItem[]
}

type HistoryOrderResepResponse = KunjunganFilterResponse | OrderResepFilterResponse

export class PrescriberNameFunction extends ExtensionFunction {
    bind_events() {
        window.addEventListener(ExtensionEvent.HistoryOrderResepFetched, (event) => {
            const custom_event = event as CustomEvent<HistoryOrderResepResponse>
            const data = custom_event.detail.data
            if (!data) return

            const drivers = this.get_drivers()
            const driver = drivers[ExtensionDriver.Temp]
            if (!driver) return

            data.forEach(item => {
                let order_resep: OrderResepItem | undefined
                let tanggal: string = ''

                if ('REFERENSI' in item && item.REFERENSI?.ASAL) {
                    order_resep = item.REFERENSI.ASAL
                    if (item.MASUK) tanggal = item.MASUK
                } else if ('PEMBERI_RESEP' in item || 'TANGGAL' in item) {
                    order_resep = item as OrderResepItem
                    if (order_resep.TANGGAL) tanggal = order_resep.TANGGAL
                }

                if (!order_resep) return

                const name = title_case_name(order_resep.PEMBERI_RESEP)
                const cache: HistoryOrderResepCache = {
                    id: order_resep.NOMOR || '',
                    date: tanggal,
                    prescriber_name: name,
                }

                const old_cache = driver.data.history_order_resep_cache
                driver.update({
                    history_order_resep_cache: { ...old_cache, [cache.id]: cache }
                })
            })
        })
    }

    apply() {
        const settings = this.get_settings()
        const show_drug_prescriber_name = settings.emr_show_drug_prescriber_name
        if (show_drug_prescriber_name) {
            this.inject_name_badges()
        } else {
            document.querySelectorAll('.ext-prescriber-badge').forEach(el => el.remove())
        }
    }

    inject_name_badges() {
        const panels = document.querySelectorAll('.x-panel-bodyWrap')
        if (!panels.length) {
            return
        }

        const drivers = this.get_drivers()
        const driver = drivers[ExtensionDriver.Temp]
        if (!driver) return

        const current_cache = driver.data?.history_order_resep_cache || {}

        panels.forEach(panel => {
            const rows = panel.querySelectorAll('div[id^="tableview-"] table.x-grid-item tr.x-grid-row')
            const local_header_container = panel.querySelector('.x-grid-header-ct')

            if (!rows.length || !local_header_container) return

            let resep_column_id: string | null = null

            const local_headers = local_header_container.querySelectorAll('.x-column-header')
            local_headers.forEach(header => {
                const text_el = header.querySelector('.x-column-header-text-inner')
                if (!text_el) return

                const sanitized_text = text_el.textContent?.trim().replace(/\s+/g, '').toLowerCase()
                const component_id = header.getAttribute('data-componentid')

                if (sanitized_text === 'no.resep' || sanitized_text === 'noresep') {
                    resep_column_id = component_id
                }
            })

            const resep_selector = resep_column_id ? `td[data-columnid="${resep_column_id}"]` : 'td:nth-child(2)'

            rows.forEach(row => {
                const cell_inner = row.querySelector(`${resep_selector} .x-grid-cell-inner`) as HTMLElement | null
                if (!cell_inner) return

                let prescription_id = ''
                Array.from(cell_inner.childNodes).forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        prescription_id += node.textContent
                    } else if (node.nodeType === Node.ELEMENT_NODE && !(node as HTMLElement).classList.contains('ext-prescriber-badge')) {
                        prescription_id += node.textContent
                    }
                })
                prescription_id = prescription_id.trim()

                if (!prescription_id) return

                const cached_data = current_cache[prescription_id]
                if (!cached_data || !cached_data.prescriber_name) {
                    cell_inner.querySelector('.ext-prescriber-badge')?.remove()
                    return
                }

                const fullname = cached_data.prescriber_name
                const existing_badge = cell_inner.querySelector('.ext-prescriber-badge') as HTMLElement | null

                if (existing_badge && existing_badge.dataset.prescriberState === fullname) {
                    return
                }

                existing_badge?.remove()

                const badge = document.createElement('div')
                badge.className = 'ext-prescriber-badge'
                badge.dataset.prescriberState = fullname
                badge.style.cssText = `
                    display: inline-block !important; 
                    margin-top: 4px !important; 
                    padding: 2px 6px !important; 
                    font-size: 11px !important; 
                    font-weight: bold !important; 
                    color: #1565c0 !important; 
                    background-color: #e3f2fd !important; 
                    border: 1px solid #bbdefb !important; 
                    border-radius: 4px !important;
                    pointer-events: none !important;
                    white-space: nowrap !important;
                `
                badge.textContent = `${fullname}`

                cell_inner.style.cssText += '; display: flex !important; flex-direction: column !important; align-items: flex-start !important;'
                cell_inner.appendChild(badge)
            })
        })
    }
}
