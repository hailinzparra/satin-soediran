import { SatinApiContext } from '../../../api/context'
import { RequestPayloadBuilder } from '../../../utils/api'
import { create_element } from '../../../utils/dom'
import { Log } from '../../../utils/logger'

// State interface for Recipe tab management
interface RecipeOrder {
    nomor: string
    prescriber: string
    depo: string
    ward: string
}

interface RecipeDetail {
    drug_name: string
    amount: number | string
    frequency: string
    dose: string
    route: string
}

const c = create_element

export class RecipesTabController {
    private is_loaded = false
    private orders: RecipeOrder[] = []
    private expanded_order_id: string | null = null
    private details_cache: Map<string, RecipeDetail[]> = new Map()
    private loading_details: Set<string> = new Set()
    private copy_timers: Map<string, number> = new Map()

    public pane_el: HTMLElement

    constructor(
        private visit_id: string,
        private api_client: SatinApiContext,
    ) {
        this.pane_el = c('div', { classes: 'tab-pane hidden' })
        this.render_skeleton()
    }

    /**
     * Called by update_tab_visibility when user switches to 'recipes'
     */
    public async activate(force_refresh = false): Promise<void> {
        if (this.is_loaded && !force_refresh) return
        await this.fetch_orders()
    }

    private render_skeleton(): void {
        const refresh_btn = c('button', {
            classes: 'btn-refresh-pane',
        }, [
            c('span', { text: 'Refresh' })
        ])

        refresh_btn.addEventListener('click', () => this.activate(true))

        this.pane_el.replaceChildren(
            c('div', { classes: 'pane-header flex justify-between items-center mb-4' }, [
                c('span', { classes: 'pane-subheading text-emerald', text: 'Resep Obat' }),
                refresh_btn,
            ]),
            c('div', { classes: 'pane-body' }, [
                c('p', { classes: 'text-muted', text: 'Memuat data resep...' })
            ])
        )
    }

    private async fetch_orders(): Promise<void> {
        const body_container = this.pane_el.querySelector('.pane-body')
        if (body_container) {
            body_container.replaceChildren(c('p', { classes: 'text-muted', text: 'Memuat data resep...' }))
        }

        try {
            const result = await this.api_client.api_request<any>({
                base_path: 'layanan/orderresep',
                payload: new RequestPayloadBuilder({
                    KUNJUNGAN: this.visit_id,
                    HISTORY: 1,
                    page: 1,
                    start: 0,
                    limit: 25
                })
            })

            if (!result?.data?.length) {
                this.orders = []
                this.is_loaded = true
                this.render_ui()
                return
            }

            this.orders = result.data.map((raw: any) => ({
                nomor: raw.NOMOR || '',
                prescriber: raw.PEMBERI_RESEP || '-',
                depo: raw.REFERENSI?.TUJUAN?.DESKRIPSI || '-',
                ward: raw.REFERENSI?.KUNJUNGAN?.REFERENSI?.RUANGAN?.DESKRIPSI || '-'
            }))

            this.is_loaded = true
            this.render_ui()
        } catch (err) {
            Log.error('Failed to load recipe orders:', err)
            if (body_container) {
                body_container.replaceChildren(c('p', { classes: 'text-red-500', text: 'Gagal memuat resep.' }))
            }
        }
    }

    private async fetch_order_details(order_id: string): Promise<void> {
        if (this.details_cache.has(order_id)) return

        this.loading_details.add(order_id)
        this.render_ui() // show spinner / loading state on item

        try {
            const result = await this.api_client.api_request<any>({
                base_path: 'layanan/orderdetilresep',
                payload: new RequestPayloadBuilder({
                    ORDER_ID: order_id,
                    ALL: 1,
                    page: 1,
                    start: 0,
                    limit: 1000
                })
            })

            const details: RecipeDetail[] = (result?.data || []).map((raw: any) => ({
                drug_name: raw.REFERENSI?.FARMASI?.NAMA || 'Obat Tidak Diketahui',
                amount: raw.JUMLAH ?? 0,
                frequency: raw.REFERENSI?.FREKUENSI?.FREKUENSI || '-',
                dose: raw.DOSIS || '-',
                route: raw.REFERENSI?.RUTE_PEMBERIAN?.DESKRIPSI || '-'
            }))

            this.details_cache.set(order_id, details)
        } catch (err) {
            Log.error(`Failed to fetch details for order ${order_id}:`, err)
        } finally {
            this.loading_details.delete(order_id)
            this.render_ui()
        }
    }

    private handle_copy(order: RecipeOrder, button_el: HTMLButtonElement): void {
        const details = this.details_cache.get(order.nomor)
        if (!details || details.length === 0) return

        // 1. Map raw route description to short code
        const map_route = (raw_route: string): string => {
            const cleaned = raw_route.trim().toLowerCase()
            switch (cleaned) {
                case 'oral': return 'PO'
                case 'parenteral': return 'PAR'
                case 'topikal': return 'TOP'
                case 'supositoria (rektal)':
                case 'supositoria': return 'SUPP'
                case 'alkes': return 'AL'
                case 'intravena': return 'IV'
                case 'subkutan': return 'SC'
                case 'intramuskular': return 'IM'
                case '-':
                default: return ''
            }
        }

        // 2. Define priority order for sorting
        const route_priority: Record<string, number> = {
            'PAR': 1,
            'IV': 2,
            'IM': 3,
            'SC': 4,
            'PO': 5,
            'TOP': 6,
            'SUPP': 7,
            'AL': 8,
            '': 9
        }

        // 3. Clone and sort details by priority index
        const sorted_details = [...details].sort((a, b) => {
            const code_a = map_route(a.route)
            const code_b = map_route(b.route)
            const priority_a = route_priority[code_a] ?? 99
            const priority_b = route_priority[code_b] ?? 99

            return priority_a - priority_b
        })

        // 4. Format line items with conditional route prefix
        const lines = sorted_details.map(item => {
            const route_code = map_route(item.route)
            const route_prefix = route_code ? `${route_code}. ` : ''
            return `${route_prefix}${item.drug_name}: ${item.frequency} | ${item.dose}`
        })

        const formatted_text = `Terapi ${order.ward}:\n` + lines.join('\n')

        navigator.clipboard.writeText(formatted_text).then(() => {
            button_el.innerText = 'COPIED!'
            button_el.classList.add('is-copied')

            // Reset 2-second timer if user clicks repeatedly
            if (this.copy_timers.has(order.nomor)) {
                window.clearTimeout(this.copy_timers.get(order.nomor))
            }

            const timer_id = window.setTimeout(() => {
                button_el.innerText = 'COPY'
                button_el.classList.remove('is-copied')
                this.copy_timers.delete(order.nomor)
            }, 2000)

            this.copy_timers.set(order.nomor, timer_id)
        }).catch(err => {
            Log.error('Failed to copy therapy details:', err)
        })
    }

    private toggle_expand(order_id: string): void {
        if (this.expanded_order_id === order_id) {
            this.expanded_order_id = null
        } else {
            this.expanded_order_id = order_id
            this.fetch_order_details(order_id)
        }
        this.render_ui()
    }

    private render_ui(): void {
        const body = c('div', { classes: 'recipe-list flex flex-col gap-3' },
            this.orders.length === 0
                ? [c('p', { text: 'Tidak ada order resep.' })]
                : this.orders.map(order => this.render_order_card(order))
        )

        const refresh_btn = c('button', {
            classes: 'btn-refresh-pane',
        }, [
            c('span', { text: 'Refresh' })
        ])

        refresh_btn.addEventListener('click', () => this.activate(true))

        const header = c('div', { classes: 'pane-header flex justify-between items-center mb-4' }, [
            c('span', { classes: 'pane-subheading text-emerald', text: `${this.orders.length} Order Resep` }),
            refresh_btn,
        ])

        this.pane_el.replaceChildren(header, body)
    }

    private render_order_card(order: RecipeOrder): HTMLElement {
        const is_expanded = this.expanded_order_id === order.nomor
        const is_loading = this.loading_details.has(order.nomor)
        const details = this.details_cache.get(order.nomor)
        const has_details = details !== undefined && details.length > 0
        const is_copied = this.copy_timers.has(order.nomor)

        const copy_btn = c('button', {
            classes: `btn-copy-recipe ${is_copied ? 'is-copied' : ''}`,
            attrs: has_details ? {} : { disabled: 'true' },
            text: is_copied ? 'COPIED!' : 'COPY',
        })

        copy_btn.addEventListener('click', (e: Event) => {
            e.stopPropagation() // Prevents header click toggle
            this.handle_copy(order, e.currentTarget as HTMLButtonElement)
        })

        const header_el = c('div', {
            classes: 'recipe-card-header',
        }, [
            c('div', { classes: 'recipe-title' }, [
                c('span', { text: `No. Order: ${order.nomor}` }),
                c('span', { classes: 'text-xs text-slate-400', text: is_expanded ? '▲' : '▼' })
            ]),
            c('div', { /* classes: 'recipe-grid' */ }, [
                c('div', {}, [c('strong', { text: 'Oleh: ' }), c('span', { text: order.prescriber })]),
                c('div', {}, [c('strong', { text: 'Depo: ' }), c('span', { text: order.depo })]),
                c('div', {}, [c('strong', { text: 'Ruangan: ' }), c('span', { text: order.ward })])
            ]),
            copy_btn
        ])

        header_el.addEventListener('click', () => this.toggle_expand(order.nomor))

        const children: HTMLElement[] = [header_el]

        if (is_expanded) {
            let details_content: HTMLElement

            if (is_loading) {
                details_content = c('div', { classes: 'details-state' }, [c('span', { text: 'Memuat rincian obat...' })])
            } else if (details && details.length > 0) {
                details_content = c('table', { classes: 'details-table' }, [
                    c('thead', {}, [
                        c('tr', {}, [
                            c('th', { text: 'Nama Obat' }),
                            c('th', { text: 'Jumlah' }),
                            c('th', { text: 'Dosis' }),
                            c('th', { text: 'Frekuensi' }),
                            c('th', { text: 'Rute' })
                        ])
                    ]),
                    c('tbody', {}, details.map(item =>
                        c('tr', {}, [
                            c('td', { classes: 'drug-name', text: item.drug_name }),
                            c('td', { text: `${item.amount}` }),
                            c('td', { text: item.dose }),
                            c('td', { text: item.frequency }),
                            c('td', { text: item.route })
                        ])
                    ))
                ])
            } else {
                details_content = c('div', { classes: 'details-state' }, [c('span', { text: 'Rincian obat kosong.' })])
            }

            children.push(c('div', { classes: 'recipe-card-details' }, [details_content]))
        }

        return c('div', { classes: 'recipe-card' }, children)
    }
}
