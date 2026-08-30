import { SatinApiContext } from '../../../api/context'
import { SoediranDataOrderResep } from '../../../types/api/soediran/data'
import { RequestPayloadBuilder } from '../../../utils/api'
import { create_element } from '../../../utils/dom'
import { format_medical_name } from '../../../utils/formatter'
import { Log } from '../../../utils/logger'
import { format_date_variants } from '../ui'

// State interface for Recipe tab management
interface RecipeOrder {
    nomor: string
    prescriber: string
    depo: string
    ward: string
    date: string
    status: string
}

interface RecipeDetail {
    drug_name: string
    amount: number | string
    frequency: string
    dose: string
    route: string
    additional_info: string
}

const c = create_element

export class RecipesTabController {
    private is_loaded = false
    private orders: RecipeOrder[] = []
    private total_orders_count = 0
    private expanded_order_id: string | null = null
    private details_cache: Map<string, RecipeDetail[]> = new Map()
    private loading_details: Set<string> = new Set()
    private copy_timers: Map<string, number> = new Map()

    // Per-order toggle states
    private orders_with_amount: Set<string> = new Set()
    private orders_lowercase: Set<string> = new Set()

    public pane_el: HTMLElement

    constructor(
        private visit_id: string,
        private api_client: SatinApiContext,
        private on_loaded?: (count: number) => void // <-- Added callback optional parameter
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
            const result = await this.api_client.api_request<SoediranDataOrderResep[] | null>({
                base_path: 'layanan/orderresep',
                payload: new RequestPayloadBuilder({
                    KUNJUNGAN: this.visit_id,
                    HISTORY: 1,
                    page: 1,
                    start: 0,
                    limit: 25
                })
            })

            const loaded_count = result?.data?.length || 0
            this.total_orders_count = typeof result?.total === 'number' ? result.total : loaded_count

            if (!result?.data?.length) {
                this.orders = []
                this.orders_with_amount.clear()
                this.orders_lowercase.clear()
                this.is_loaded = true
                this.render_ui()
                this.on_loaded?.(0) // Notify callback with 0
                return
            }

            this.orders = result.data.map(raw => ({
                nomor: raw.NOMOR || '',
                prescriber: raw.PEMBERI_RESEP || '-',
                depo: raw.REFERENSI?.TUJUAN?.DESKRIPSI || '-',
                ward: raw.REFERENSI?.KUNJUNGAN?.REFERENSI?.RUANGAN?.DESKRIPSI || '-',
                date: raw.TANGGAL || '-',
                status: raw.REFERENSI?.STATUS?.DESKRIPSI || '-',
            }))

            this.orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

            this.orders_with_amount.clear()
            this.orders_lowercase.clear()

            this.orders.forEach(order => {
                // "Jumlah" active by default for outpatient ("jalan")
                if (order.depo.toLowerCase().includes('jalan')) {
                    this.orders_with_amount.add(order.nomor)
                }
                // "Huruf Kecil" active by default for all depos
                this.orders_lowercase.add(order.nomor)
            })

            this.is_loaded = true
            this.render_ui()
            this.on_loaded?.(this.orders.length) // Notify callback with exact count
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
        this.render_ui()

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
                route: raw.REFERENSI?.RUTE_PEMBERIAN?.DESKRIPSI || '-',
                additional_info: raw.KETERANGAN || ''
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

        const map_route = (raw_route: string): string => {
            const cleaned = raw_route.trim().toLowerCase()
            switch (cleaned) {
                case 'oral': return 'PO'
                case 'parenteral': return 'Inf'
                case 'topikal': return 'UE'
                case 'supositoria (rektal)':
                case 'supositoria': return 'Supp'
                case 'alkes': return ''
                case 'intravena': return 'Inj'
                case 'subkutan': return 'Inj (SC)'
                case 'intramuskular': return 'Inj (IM)'
                case '-':
                default: return ''
            }
        }

        const route_priority: Record<string, number> = {
            'Inf': 1,
            'Inj': 2,
            'Inj (IM)': 3,
            'Inj (SC)': 4,
            'PO': 5,
            'UE': 6,
            'Supp': 7,
            '': 8,
        }

        const sorted_details = [...details].sort((a, b) => {
            const code_a = map_route(a.route)
            const code_b = map_route(b.route)
            const priority_a = route_priority[code_a] ?? 99
            const priority_b = route_priority[code_b] ?? 99

            return priority_a - priority_b
        })

        const include_amount = this.orders_with_amount.has(order.nomor)
        const is_lowercase = this.orders_lowercase.has(order.nomor)

        const lines = sorted_details.map(item => {
            const route_code = map_route(item.route)
            const route_prefix = route_code ? `${route_code} ` : ''
            const additional_info = item.additional_info ? ` ${item.additional_info}` : ''

            const amount = (include_amount && item.amount !== undefined && item.amount !== '')
                ? ` (${item.amount})`
                : ''

            const raw_line = `${route_prefix}${item.drug_name} ${item.frequency} ${item.dose}${additional_info}${amount}`

            return is_lowercase ? raw_line.toLowerCase() : raw_line
        })

        const formatted_text = `Terapi ${order.ward}:\n` + lines.join('\n')

        navigator.clipboard.writeText(formatted_text).then(() => {
            button_el.innerText = 'COPIED!'
            button_el.classList.add('is-copied')

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

        // Conditional label logic:
        // Only show X/Y if total > loaded count (e.g. 25/40)
        // Otherwise just show count (e.g. 7 Order Resep, 0 Order Resep, 9 Order Resep)
        const loaded_count = this.orders.length
        const count_str = this.total_orders_count > loaded_count
            ? `${loaded_count}/${this.total_orders_count}`
            : `${loaded_count}`

        const count_title = `${count_str} Order Resep`

        const header = c('div', { classes: 'pane-header flex justify-between items-center mb-4' }, [
            c('span', { classes: 'pane-subheading text-emerald', text: count_title }),
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

        const include_amount = this.orders_with_amount.has(order.nomor)
        const is_lowercase = this.orders_lowercase.has(order.nomor)

        // Helper to format string values based on lowercasing toggle
        const fmt = (text: string): string => is_lowercase ? text.toLowerCase() : text

        // 1. Copy button
        const copy_btn = c('button', {
            classes: `btn-copy-recipe ${is_copied ? 'is-copied' : ''}`,
            attrs: has_details ? {} : { disabled: 'true' },
            text: is_copied ? 'COPIED!' : 'COPY',
        })

        copy_btn.addEventListener('click', (e: Event) => {
            e.stopPropagation()
            this.handle_copy(order, e.currentTarget as HTMLButtonElement)
        })

        // 2. Toggle button for 'Jumlah'
        const toggle_amount_btn = c('button', {
            classes: `btn-toggle-option ${include_amount ? 'is-active' : ''}`,
            text: 'Jumlah',
            attrs: {
                title: 'Sertakan jumlah obat'
            }
        })

        toggle_amount_btn.addEventListener('click', (e: Event) => {
            e.stopPropagation()
            if (this.orders_with_amount.has(order.nomor)) {
                this.orders_with_amount.delete(order.nomor)
            } else {
                this.orders_with_amount.add(order.nomor)
            }
            this.render_ui()
        })

        // 3. Toggle button for 'Huruf Kecil'
        const toggle_lowercase_btn = c('button', {
            classes: `btn-toggle-option ${is_lowercase ? 'is-active' : ''}`,
            text: 'Huruf Kecil',
            attrs: {
                title: 'Ubah seluruh teks menjadi huruf kecil'
            }
        })

        toggle_lowercase_btn.addEventListener('click', (e: Event) => {
            e.stopPropagation()
            if (this.orders_lowercase.has(order.nomor)) {
                this.orders_lowercase.delete(order.nomor)
            } else {
                this.orders_lowercase.add(order.nomor)
            }
            this.render_ui()
        })

        // Wrapper for buttons: COPY, Jumlah, Huruf Kecil
        const recipe_actions = c('div', { classes: 'recipe-actions' }, [
            copy_btn,
            toggle_amount_btn,
            toggle_lowercase_btn
        ])

        const formatted_date = order.date ? format_date_variants(order.date).longtime : '--'
        const header_el = c('div', {
            classes: 'recipe-card-header',
        }, [
            c('div', { classes: 'recipe-title' }, [
                c('span', { text: formatted_date }),
                // c('span', { text: `${formatted_date} (${order.status})` }),
                c('span', { classes: 'text-xs text-slate-400', text: is_expanded ? '▲' : '▼' })
            ]),
            c('div', { /* classes: 'recipe-grid' */ }, [
                // c('div', {}, [c('strong', { text: 'Status: ' }), c('span', { text: order.status })]),
                // c('div', {}, [c('strong', { text: 'Tanggal: ' }), c('span', { text: formatted_date })]),
                // c('div', {}, [c('strong', { text: 'No. Order: ' }), c('span', { text: order.nomor })]),
                c('div', {}, [c('strong', { text: 'Oleh (No. Order): ' }), c('span', { text: `${format_medical_name(order.prescriber)} (${order.nomor})` })]),
                // c('div', {}, [c('strong', { text: 'Depo: ' }), c('span', { text: order.depo })]),
                c('div', {}, [c('strong', { text: 'Depo (Ruangan): ' }), c('span', { text: `${order.depo} (${order.ward.replace('Bangsal ', '')})` })]),
            ]),
            recipe_actions,
        ])

        header_el.addEventListener('click', () => this.toggle_expand(order.nomor))

        const children: HTMLElement[] = [header_el]

        if (is_expanded) {
            let details_content: HTMLElement

            if (is_loading) {
                details_content = c('div', { classes: 'details-state' }, [c('span', { text: 'Memuat rincian obat...' })])
            } else if (details && details.length > 0) {
                const table_headers = [c('th', { text: 'Nama Obat' })]
                if (include_amount) {
                    table_headers.push(c('th', { text: 'Jumlah' }))
                }
                table_headers.push(
                    c('th', { text: 'Dosis' }),
                    c('th', { text: 'Freq.' }),
                    c('th', { text: 'Rute' }),
                    c('th', { text: 'Ket.' })
                )

                details_content = c('table', { classes: 'details-table' }, [
                    c('thead', {}, [c('tr', {}, table_headers)]),
                    c('tbody', {}, details.map(item => {
                        const row_cells = [c('td', { classes: 'drug-name', text: fmt(item.drug_name) })]
                        if (include_amount) {
                            row_cells.push(c('td', { text: `${item.amount}` }))
                        }
                        row_cells.push(
                            c('td', { text: fmt(item.dose) }),
                            c('td', { text: fmt(item.frequency) }),
                            c('td', { text: fmt(item.route) }),
                            c('td', { text: item.additional_info ? fmt(item.additional_info) : '-' })
                        )
                        return c('tr', {}, row_cells)
                    }))
                ])
            } else {
                details_content = c('div', { classes: 'details-state' }, [c('span', { text: 'Rincian obat kosong.' })])
            }

            children.push(c('div', { classes: 'recipe-card-details' }, [details_content]))
        }

        return c('div', { classes: 'recipe-card' }, children)
    }
}
