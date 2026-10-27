import { SatinBaseFunctionInjector, SatinBaseFunctionTargetNode } from '../../types/functions/base'
import { FilterCategory, NotesFilterConfig } from '../../types/functions/notes-filter'
import { ModalInstance, ModalUI } from '../../ui/modal'
import { NotesFilterFunction } from './parent'

export interface KunjunganItem {
    visit_id: string
    room_name: string
    bed_name: string
    ago_text: string
    admission_time: string
    discharged_time: string
    doctor_in_charge: string
    subjective?: string
    objective?: string
    assessment?: string
    planning?: string
    instruction?: string
    is_loaded?: boolean
}

export interface TemplateOption {
    id: string
    label: string
    subjective?: string
    objective?: string
    assessment?: string
    planning?: string
    instruction?: string
}

export interface DepartmentTemplate {
    dept_id: string
    dept_name: string
    options: TemplateOption[]
}

/* ==========================================================================
   DUMMY DATABASE
   ========================================================================== */
const DUMMY_DATABASE = {
    visits: Array.from({ length: 20 }, (_, i) => {
        const idx = i + 1
        const pad = idx < 10 ? `00${idx}` : `0${idx}`
        const rooms = ['Bangsal Melati', 'Bangsal Mawar', 'IGD', 'Poliklinik Interna', 'ICU', 'Poliklinik THT']
        const doctors = ['dr. Ahmad Sp.PD', 'dr. Maya Sp.B', 'dr. Budi Sp.THT', 'dr. Siti Sp.A', 'dr. Rian Sp.N']

        const r_idx = i % rooms.length
        const d_idx = i % doctors.length

        return {
            visit_id: `V-2026-${pad}`,
            room_name: rooms[r_idx],
            bed_name: `Bed 0${(i % 5) + 1}`,
            ago_text: `${i + 1} jam lalu`,
            admission_time: `2026-10-25 ${String(8 + (i % 10)).padStart(2, '0')}:30`,
            discharged_time: i % 3 === 0 ? `2026-10-25 ${String(14 + (i % 5)).padStart(2, '0')}:00` : '-',
            doctor_in_charge: doctors[d_idx],
            subjective: `Pasien mengeluh nyeri & lemas subyektif pada kunjungan ke-${idx}.`,
            objective: `TD 120/80, N 82, S 36.6, RR 18, SpO2 98% (Kunjungan ${idx})`,
            assessment: `Diagnosa Evaluasi Klinis #${idx}`,
            planning: `Lanjut terapi maintenance oral, observasi TTV berkala.`,
            instruction: i % 2 === 0 ? 'Bila sesak berikan O2 3 lpm' : '',
            is_loaded: false,
        } as KunjunganItem
    }),

    templates: [
        {
            dept_id: 'tht',
            dept_name: 'THT',
            options: [
                {
                    id: 'umum',
                    label: 'Umum',
                    assessment: 'Evaluasi THT Umum',
                    planning: 'Terapi simptomatis oral.',
                },
                {
                    id: 'abses_leher',
                    label: 'Abses Leher',
                    subjective: 'Nyeri leher disertai bengkak dan sukar menelan sejak 3 hari.',
                    objective: 'Edema submandibula dextra (+), fluktuasi (+), trismus 2 cm.',
                    assessment: 'Abses Leher / Abses Submandibula Dextra',
                    planning: 'Inj. Ceftriaxone 1g/12j, Inj. Metronidazole 500mg/8j, Analgetik iv.',
                },
                {
                    id: 'abses_pro_op',
                    label: 'Abses Leher Pro OP Insisi',
                    subjective: 'Persiapan tindakan insisi drainase abses leher.',
                    objective: 'Fluktuasi jelas (+), airway paten, Ro Thorax normal, Lab DL/GDS/Coagulation normal.',
                    assessment: 'Abses Leher Pro Insisi Drainase',
                    planning: 'Puasa 6 jam pre-op, Informed consent (+), Edukasi prosedur & risiko operasi.',
                },
                {
                    id: 'abses_post_op',
                    label: 'Abses Leher Post OP',
                    subjective: 'Nyeri bekas luka operasi berkurang, perdarahan (-).',
                    objective: 'Tampak drain terpasang (+), produksi serosanguinos minimal, TTV stabil.',
                    assessment: 'Post Insisi Drainase Abses Leher H+1',
                    planning: 'Lanjut antibiotik iv, rawat luka & ganti verband harian, observasi drain.',
                },
            ],
        },
        {
            dept_id: 'interna',
            dept_name: 'Interna',
            options: [
                {
                    id: 'umum',
                    label: 'Umum',
                    subjective: 'Keluhan badan lemas dan mual.',
                    objective: 'TD 120/80, N 80, S 36.5. Abdomen supel.',
                    assessment: 'Observasi Febris / Dyspepsia',
                    planning: 'Antasida syr 3x1 C, Parasetamol 3x500mg kp.',
                },
                {
                    id: 'cad',
                    label: 'CAD CCS II',
                    subjective: 'Nyeri dada substernal saat aktivitas sedang, membaik saat istirahat.',
                    objective: 'EKG: Sinus rhythm, ST depresi minimal di V4-V6.',
                    assessment: 'Coronary Artery Disease (CAD) CCS II',
                    planning: 'Aspirin 1x80mg, Clopidogrel 1x75mg, Isosorbide Dinitrate 3x5mg.',
                },
            ],
        },
        {
            dept_id: 'bedah',
            dept_name: 'Bedah',
            options: [
                {
                    id: 'umum',
                    label: 'Umum',
                    subjective: 'Evaluasi keluhan pasca bedah / luka.',
                    objective: 'Luka operasi kering, inflamasi (-).',
                    assessment: 'Post-Op Routine Checklist',
                    planning: 'Lanjut perawatan luka.',
                },
                {
                    id: 'app_akut',
                    label: 'Appendicitis Akut',
                    subjective: 'Nyeri perut kanan bawah mendadak, mual (+), muntah 1x.',
                    objective: 'Nyeri tekan McBurney (+), Rovsing sign (+), Leukosit 14.500.',
                    assessment: 'Appendicitis Akut',
                    planning: 'Pro Appendektomi, Puasa, Inj. Ceftriaxone 1g, Inj. Ketorolac 30mg.',
                },
            ],
        },
        {
            dept_id: 'jiwa',
            dept_name: 'Jiwa',
            options: [
                {
                    id: 'umum',
                    label: 'Umum',
                    subjective: 'Pasien tenang, tidur cukup 6-7 jam semalam.',
                    objective: 'Kontak mata (+), afek tumpul, ilusi/halusinasi (-).',
                    assessment: 'Skizofrenia Terkontrol',
                    planning: 'Lanjut Risperidone 2x2mg, Trihexyphenidyl 2x2mg.',
                },
            ],
        },
        {
            dept_id: 'anak',
            dept_name: 'Anak',
            options: [
                {
                    id: 'umum',
                    label: 'Umum',
                    subjective: 'Batuk pilek 2 hari, nafsu makan baik.',
                    objective: 'Suhu 37.0 C, ronkhi (-/-), wheezing (-/-).',
                    assessment: 'ISPA / Common Cold',
                    planning: 'Puyer batuk 3x1, edukasi hidrasi hangat.',
                },
            ],
        },
        {
            dept_id: 'neurologi',
            dept_name: 'Neurologi',
            options: [
                {
                    id: 'umum',
                    label: 'Umum',
                    subjective: 'Sakit kepala berputar / pusing sepintas.',
                    objective: 'GCS E4V5M6, Nystagmus (-), Romberg test (-).',
                    assessment: 'BPPV / Vertigo Perifer',
                    planning: 'Betahistine 3x6mg, Flunarizine 1x5mg.',
                },
            ],
        },
    ] as DepartmentTemplate[],
}

export class NotesFilterInjector extends SatinBaseFunctionInjector<NotesFilterFunction, NotesFilterConfig> {
    private container_class = 'satin-notes-filter-menu'

    private dates_row_element: HTMLElement | null = null
    private active_date_buttons: Map<string, HTMLButtonElement> = new Map()
    private current_dates_signature = ''
    private is_collapsed = true

    public async on_execute(): Promise<void> {
        const cppt_list = document.querySelector<HTMLElement>(this.parent.config.selectors.queries.rm_cppt_list)
        if (!cppt_list) return

        this.ensure_ui_mounted(cppt_list)
        this.apply_filters()
    }

    public reset(target_node?: SatinBaseFunctionTargetNode): void {
        const container = document.querySelector(`.${this.container_class}`)
        if (container) container.remove()

        const records = this.parent.data.extracted_data.records || []
        records.forEach((record) => {
            record.element.style.display = ''
        })

        this.dates_row_element = null
        this.active_date_buttons.clear()
        this.current_dates_signature = ''
        this.is_collapsed = true

        this.parent.reset_data()
    }

    private ensure_ui_mounted(parent_node: HTMLElement): void {
        if (parent_node.querySelector(`.${this.container_class}`)) return

        if (getComputedStyle(parent_node).position === 'static') {
            parent_node.style.position = 'relative'
        }

        const container = document.createElement('div')
        container.className = this.container_class
        if (this.is_collapsed) {
            container.classList.add('collapsed')
        }

        const toggle_row = document.createElement('div')
        toggle_row.className = 'satin-notes-filter-toggles'

        const toggles_left = document.createElement('div')
        toggles_left.className = 'satin-notes-toggles-left'

        const toggle_group = document.createElement('div')
        toggle_group.className = 'satin-notes-toggle-group'

        const categories: FilterCategory[] = ['ALL', 'MINE', 'DOCTORS', 'SEARCH']
        categories.forEach((cat) => {
            const btn = document.createElement('button')
            btn.type = 'button'
            btn.textContent = cat
            btn.dataset.category = cat
            btn.className = `satin-notes-filter-btn ${this.parent.data.values_to_render.active_category === cat ? 'active' : ''
                }`

            btn.addEventListener('click', () => this.set_category(cat))
            toggle_group.appendChild(btn)
        })

        toggles_left.appendChild(toggle_group)

        const search_input = document.createElement('input')
        search_input.type = 'text'
        search_input.placeholder = 'e.g. imad...'
        search_input.className = 'satin-notes-search-input'
        search_input.style.display =
            this.parent.data.values_to_render.active_category === 'SEARCH' ? 'inline-block' : 'none'
        search_input.value = this.parent.data.values_to_render.search_query || ''

        search_input.addEventListener('input', (e) => {
            this.parent.data.values_to_render.search_query = (e.target as HTMLInputElement).value
            this.apply_filters()
        })

        toggles_left.appendChild(search_input)
        toggle_row.appendChild(toggles_left)

        const action_btn = document.createElement('button')
        action_btn.type = 'button'
        action_btn.textContent = 'AKSI'
        action_btn.className = 'satin-notes-action-btn'
        action_btn.addEventListener('click', (e) => {
            this.open_actions_modal(e.currentTarget as HTMLElement)
        })

        toggle_row.appendChild(action_btn)

        const dates_row = document.createElement('div')
        dates_row.className = 'satin-notes-dates-row'
        this.dates_row_element = dates_row

        const collapsed_controls = document.createElement('div')
        collapsed_controls.className = 'satin-notes-collapsed-controls'

        const collapse_btn = document.createElement('button')
        collapse_btn.type = 'button'
        collapse_btn.className = 'satin-notes-collapse-btn'
        collapse_btn.title = 'Toggle Menu "Filter & Aksi CPPT"'
        collapse_btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>`

        const mine_shortcut_btn = document.createElement('button')
        mine_shortcut_btn.type = 'button'
        mine_shortcut_btn.textContent = 'MINE'
        mine_shortcut_btn.className = `satin-notes-mine-shortcut ${this.parent.data.values_to_render.active_category === 'MINE' ? 'active' : ''
            }`
        mine_shortcut_btn.addEventListener('click', (e) => {
            e.stopPropagation()
            const current_cat = this.parent.data.values_to_render.active_category
            const next_cat: FilterCategory = current_cat === 'MINE' ? 'ALL' : 'MINE'
            this.set_category(next_cat)
        })

        const action_shortcut_btn = document.createElement('button')
        action_shortcut_btn.type = 'button'
        action_shortcut_btn.textContent = 'AKSI'
        action_shortcut_btn.className = 'satin-notes-action-shortcut'
        action_shortcut_btn.addEventListener('click', (e) => {
            e.stopPropagation()
            this.open_actions_modal(e.currentTarget as HTMLElement)
        })

        collapsed_controls.appendChild(collapse_btn)
        collapsed_controls.appendChild(mine_shortcut_btn)
        collapsed_controls.appendChild(action_shortcut_btn)

        const scroller =
            parent_node.querySelector<HTMLElement>('.x-scroller') ||
            parent_node.querySelector<HTMLElement>('.x-grid-view') ||
            parent_node

        if (scroller) {
            scroller.style.transition = 'padding-top 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }

        const update_scroller_padding = () => {
            if (!scroller) return
            if (this.is_collapsed) {
                scroller.style.paddingTop = '0px'
            } else {
                const height = container.getBoundingClientRect().height
                scroller.style.paddingTop = `${height}px`
            }
        }

        collapse_btn.addEventListener('click', () => {
            this.is_collapsed = !this.is_collapsed
            container.classList.toggle('collapsed', this.is_collapsed)
            update_scroller_padding()
        })

        container.appendChild(toggle_row)
        container.appendChild(dates_row)
        container.appendChild(collapsed_controls)

        parent_node.appendChild(container)

        this.attach_destruction_listener(container)

        const resize_observer = new ResizeObserver(() => {
            update_scroller_padding()
        })
        resize_observer.observe(container)

        update_scroller_padding()
    }

    public open_actions_modal(target_btn: HTMLElement): ModalInstance | null {
        const window_el = target_btn.closest<HTMLElement>('.x-window')
        const parent_el = window_el || document.body

        const modal_container = document.createElement('div')
        modal_container.className = 'sn-actions-container'

        const draft_accordion = this.create_accordion_item('Draft CPPT', true, this.render_draft_cppt_content())

        const konsul_content = document.createElement('div')
        konsul_content.style.fontSize = '12px'
        konsul_content.style.color = '#64748b'
        konsul_content.textContent = 'konsul pasien'
        const konsul_accordion = this.create_accordion_item('Konsul Pasien', false, konsul_content)

        modal_container.appendChild(draft_accordion)
        modal_container.appendChild(konsul_accordion)

        const target_width = 820
        const target_height = 600

        const min_xgap = Math.max(10, Math.min(50, window.innerWidth * 0.05))
        const min_ygap = Math.max(10, Math.min(50, window.innerHeight * 0.05))
        const w = Math.min(window.innerWidth - min_xgap * 2, target_width)
        const h = Math.min(window.innerHeight - min_ygap * 2, target_height)
        const x = Math.max(0, (window.innerWidth - w) / 2)
        const y = Math.max(0, (window.innerHeight - h) / 2)

        const { instance, is_existing } = ModalUI.fire({
            id: 'sn-actions-modal-instance',
            title: 'Aksi (CPPT)',
            content: modal_container,
            parent_el: parent_el,
            options: {
                top: `${y}px`,
                left: `${x}px`,
                width: `${w}px`,
                height: `${h}px`,
            },
        })

        if (is_existing || !instance) return instance

        instance.body.style.padding = '0'
        instance.body.style.height = 'calc(100% - 38px)'
        return instance
    }

    private create_accordion_item(
        title_text: string,
        default_expanded: boolean,
        content_node: HTMLElement
    ): HTMLElement {
        const item = document.createElement('div')
        item.className = `sn-accordion-item ${default_expanded ? 'is-expanded' : ''}`

        const header = document.createElement('div')
        header.className = 'sn-accordion-header'

        const title = document.createElement('span')
        title.className = 'sn-accordion-title'
        title.textContent = title_text

        const icon = document.createElement('span')
        icon.className = 'sn-accordion-icon'
        icon.textContent = '▼'

        header.appendChild(title)
        header.appendChild(icon)

        const body = document.createElement('div')
        body.className = 'sn-accordion-body'
        body.appendChild(content_node)

        header.addEventListener('click', () => {
            item.classList.toggle('is-expanded')
        })

        item.appendChild(header)
        item.appendChild(body)

        return item
    }

    private render_draft_cppt_content(): HTMLElement {
        const layout = document.createElement('div')
        layout.className = 'sn-kunjungan-layout'

        const left_panel = document.createElement('div')
        left_panel.className = 'sn-kunjungan-left'

        const right_panel = document.createElement('div')
        right_panel.className = 'sn-kunjungan-right'

        const source_label = document.createElement('div')
        source_label.className = 'sn-source-label'
        source_label.textContent = 'Sumber Dari:'

        const radio_group = document.createElement('div')
        radio_group.className = 'sn-radio-tab-group'

        const opt_kunjungan = document.createElement('label')
        opt_kunjungan.className = 'active'
        opt_kunjungan.innerHTML = `<input type="radio" name="draft_source" value="kunjungan" checked /> KUNJUNGAN`

        const opt_template = document.createElement('label')
        opt_template.innerHTML = `<input type="radio" name="draft_source" value="template" /> TEMPLAT`

        radio_group.appendChild(opt_kunjungan)
        radio_group.appendChild(opt_template)

        left_panel.appendChild(source_label)
        left_panel.appendChild(radio_group)

        const cards_scroll_container = document.createElement('div')
        cards_scroll_container.className = 'sn-cards-list-scroll'
        left_panel.appendChild(cards_scroll_container)

        const output_label = document.createElement('div')
        output_label.className = 'sn-output-label'
        output_label.textContent = 'Draft CPPT (SOAPI)'

        const merged_textarea = document.createElement('textarea')
        merged_textarea.className = 'sn-merged-textarea'
        merged_textarea.value = 'Pilih sumber...'

        const salin_btn = document.createElement('button')
        salin_btn.type = 'button'
        salin_btn.className = 'btn-salin-cppt'
        salin_btn.textContent = 'SALIN CPPT'

        salin_btn.addEventListener('click', async () => {
            const val = merged_textarea.value.trim()
            if (!val || val === 'Pilih sumber...' || val === 'Memuat data...') return

            try {
                await navigator.clipboard.writeText(val)
                salin_btn.textContent = 'TERSALIN!'
                salin_btn.classList.add('copied')
                setTimeout(() => {
                    salin_btn.textContent = 'SALIN CPPT'
                    salin_btn.classList.remove('copied')
                }, 2000)
            } catch (err) {
                console.error('Failed to copy text: ', err)
            }
        })

        right_panel.appendChild(output_label)
        right_panel.appendChild(merged_textarea)
        right_panel.appendChild(salin_btn)

        // Local State Trackers & Race-Condition Prevention
        let active_source: 'kunjungan' | 'template' = 'kunjungan'
        let visits_loaded = false
        let active_visit_id: string | null = null
        let active_template_file_id: string | null = null
        let current_request_id = 0

        const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

        // Format SOAPI Output for KUNJUNGAN (with Path Subtext)
        const format_soapi_kunjungan = (v: KunjunganItem): string => {
            const parts: string[] = []
            parts.push(`S ("Anamnesis" > "Riwayat Penyakit Sekarang (Umum)"):\n${v.subjective?.trim() || '-'}`)
            parts.push(`O ("Pemeriksaan" > "Umum" & "Fisik"):\n${v.objective?.trim() || '-'}`)
            parts.push(`A ("Penilaian" > "Diagnosis"):\n${v.assessment?.trim() || '-'}`)
            parts.push(`P ("Perencanaan" > "Terapi"):\n${v.planning?.trim() || '-'}`)
            parts.push(`I:\n-`)
            return parts.join('\n\n')
        }

        // Format SOAPI Output for TEMPLAT (Plain SOAPI Labels without Subtexts)
        const format_soapi_template = (opt: TemplateOption): string => {
            const parts: string[] = []
            parts.push(`S:\n${opt.subjective?.trim() || '-'}`)
            parts.push(`O:\n${opt.objective?.trim() || '-'}`)
            parts.push(`A:\n${opt.assessment?.trim() || '-'}`)
            parts.push(`P:\n${opt.planning?.trim() || '-'}`)
            parts.push(`I:\n${opt.instruction?.trim() || '-'}`)
            return parts.join('\n\n')
        }

        const render_kunjungan_cards = async () => {
            if (!visits_loaded) {
                cards_scroll_container.innerHTML = `
                    <div class="sn-loading-state-left">
                        <span class="sn-loading-spinner"></span>
                        <span>Memuat data kunjungan...</span>
                    </div>
                `
                await sleep(2000)
                visits_loaded = true
            }

            if (active_source !== 'kunjungan') return

            cards_scroll_container.innerHTML = ''
            const card_elements: Map<string, HTMLElement> = new Map()

            DUMMY_DATABASE.visits.forEach((v) => {
                const card = document.createElement('div')
                const is_selected = v.visit_id === active_visit_id
                card.className = `sn-kunjungan-card ${is_selected ? 'selected' : ''}`

                const status_text = v.is_loaded ? 'Sudah dimuat' : 'Belum dimuat'
                const status_class = v.is_loaded ? 'is-loaded' : ''

                card.innerHTML = `
                    <div class="sn-card-header">
                        <span class="sn-card-title">${v.room_name} (${v.bed_name})</span>
                        <span class="sn-card-ago">${v.ago_text}</span>
                    </div>
                    <div class="sn-card-detail">Masuk: ${v.admission_time}</div>
                    <div class="sn-card-detail">DPJP: ${v.doctor_in_charge}</div>
                    <div class="sn-card-detail">No. Kunjungan: ${v.visit_id}</div>
                    <div class="sn-card-load-status ${status_class}">${status_text}</div>
                `

                const handle_card_click = async () => {
                    active_visit_id = v.visit_id

                    card_elements.forEach((c) => c.classList.remove('selected'))
                    card.classList.add('selected')

                    const status_el = card.querySelector<HTMLElement>('.sn-card-load-status')

                    if (!v.is_loaded) {
                        const req_id = ++current_request_id
                        merged_textarea.value = 'Memuat data...'

                        if (status_el) {
                            status_el.textContent = 'Memuat data...'
                            status_el.className = 'sn-card-load-status is-loading'
                        }

                        await sleep(2000)

                        if (active_source !== 'kunjungan' || req_id !== current_request_id) {
                            return
                        }

                        v.is_loaded = true
                        if (status_el) {
                            status_el.textContent = 'Sudah dimuat'
                            status_el.className = 'sn-card-load-status is-loaded'
                        }

                        merged_textarea.value = format_soapi_kunjungan(v)
                    } else {
                        current_request_id++
                        merged_textarea.value = format_soapi_kunjungan(v)
                    }
                }

                card.addEventListener('click', handle_card_click)
                card_elements.set(v.visit_id, card)
                cards_scroll_container.appendChild(card)
            })
        }

        const render_template_cards = () => {
            cards_scroll_container.innerHTML = ''

            const tmpl_container = document.createElement('div')
            tmpl_container.className = 'sn-template-container'

            const search_input = document.createElement('input')
            search_input.type = 'text'
            search_input.placeholder = 'Cari templat...'
            search_input.className = 'sn-template-search-input'

            const tree_el = document.createElement('div')
            tree_el.className = 'sn-template-tree'

            tmpl_container.appendChild(search_input)
            tmpl_container.appendChild(tree_el)
            cards_scroll_container.appendChild(tmpl_container)

            const folder_nodes: { folder_el: HTMLElement; title: string; files: { file_el: HTMLElement; label: string }[] }[] = []

            DUMMY_DATABASE.templates.forEach((dept) => {
                const folder_el = document.createElement('div')
                folder_el.className = 'sn-template-folder'

                const header_el = document.createElement('div')
                header_el.className = 'sn-template-folder-header'
                header_el.innerHTML = `<span class="sn-folder-chevron">▶</span> <span>${dept.dept_name}</span>`

                const files_list_el = document.createElement('div')
                files_list_el.className = 'sn-template-files-list'

                const files_nodes: { file_el: HTMLElement; label: string }[] = []

                dept.options.forEach((opt) => {
                    const file_id = `${dept.dept_id}-${opt.id}`
                    const file_el = document.createElement('div')
                    file_el.className = `sn-template-file-item ${file_id === active_template_file_id ? 'is-selected' : ''}`
                    file_el.textContent = opt.label

                    file_el.addEventListener('click', (e) => {
                        e.stopPropagation()
                        current_request_id++

                        tree_el.querySelectorAll('.sn-template-file-item').forEach((el) => el.classList.remove('is-selected'))
                        file_el.classList.add('is-selected')
                        active_template_file_id = file_id

                        merged_textarea.value = format_soapi_template(opt)
                    })

                    files_list_el.appendChild(file_el)
                    files_nodes.push({ file_el, label: opt.label })
                })

                header_el.addEventListener('click', () => {
                    folder_el.classList.toggle('is-open')
                })

                folder_el.appendChild(header_el)
                folder_el.appendChild(files_list_el)
                tree_el.appendChild(folder_el)

                folder_nodes.push({
                    folder_el,
                    title: dept.dept_name,
                    files: files_nodes,
                })
            })

            const empty_msg_el = document.createElement('div')
            empty_msg_el.className = 'sn-template-empty-msg'
            empty_msg_el.style.display = 'none'
            tree_el.appendChild(empty_msg_el)

            const filter_templates = (query: string) => {
                const raw_query = query.trim()
                const q = raw_query.toLowerCase()
                let total_matches = 0

                folder_nodes.forEach((folder) => {
                    let folder_matched_count = 0

                    folder.files.forEach((file) => {
                        const matches = q === '' || file.label.toLowerCase().includes(q) || folder.title.toLowerCase().includes(q)
                        file.file_el.style.display = matches ? '' : 'none'
                        if (matches) folder_matched_count++
                    })

                    if (q === '') {
                        folder.folder_el.style.display = ''
                        folder.folder_el.classList.remove('is-open')
                    } else if (folder_matched_count > 0) {
                        folder.folder_el.style.display = ''
                        folder.folder_el.classList.add('is-open')
                    } else {
                        folder.folder_el.style.display = 'none'
                        folder.folder_el.classList.remove('is-open')
                    }

                    total_matches += folder_matched_count
                })

                if (q !== '' && total_matches === 0) {
                    const truncated_query = raw_query.length > 6 ? `${raw_query.substring(0, 5)}...` : raw_query
                    empty_msg_el.textContent = `Templat "${truncated_query}" tidak ditemukan.`
                    empty_msg_el.style.display = 'block'
                } else {
                    empty_msg_el.style.display = 'none'
                }
            }

            search_input.addEventListener('input', (e) => {
                filter_templates((e.target as HTMLInputElement).value)
            })
        }

        opt_kunjungan.addEventListener('click', () => {
            if (active_source === 'kunjungan') return
            current_request_id++

            active_source = 'kunjungan'
            opt_kunjungan.classList.add('active')
            opt_template.classList.remove('active')

            merged_textarea.value = 'Pilih sumber...'
            active_visit_id = null
            render_kunjungan_cards()
        })

        opt_template.addEventListener('click', () => {
            if (active_source === 'template') return
            current_request_id++

            active_source = 'template'
            opt_template.classList.add('active')
            opt_kunjungan.classList.remove('active')

            merged_textarea.value = 'Pilih sumber...'
            active_template_file_id = null
            render_template_cards()
        })

        // Initial View Trigger (KUNJUNGAN selected by default)
        render_kunjungan_cards()

        layout.appendChild(left_panel)
        layout.appendChild(right_panel)

        return layout
    }

    private set_category(cat: FilterCategory): void {
        this.parent.data.values_to_render.active_category = cat

        const container = document.querySelector(`.${this.container_class}`)
        if (!container) return

        const buttons = container.querySelectorAll<HTMLButtonElement>('.satin-notes-filter-btn')
        buttons.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.category === cat)
        })

        const mine_shortcut = container.querySelector<HTMLButtonElement>('.satin-notes-mine-shortcut')
        if (mine_shortcut) {
            mine_shortcut.classList.toggle('active', cat === 'MINE')
        }

        const search_input = container.querySelector<HTMLInputElement>('.satin-notes-search-input')
        if (search_input) {
            search_input.style.display = cat === 'SEARCH' ? 'inline-block' : 'none'
            if (cat === 'SEARCH') search_input.focus()
        }

        this.apply_filters()
    }

    private set_date(date: string): void {
        this.parent.data.values_to_render.active_date = date
        this.apply_filters()
    }

    private render_date_buttons(): void {
        if (!this.dates_row_element) {
            const container = document.querySelector(`.${this.container_class}`)
            this.dates_row_element = container?.querySelector<HTMLDivElement>('.satin-notes-dates-row') || null
            if (!this.dates_row_element) return
        }

        const available_dates = this.parent.data.extracted_data.available_dates || []
        const records = this.parent.data.extracted_data.records || []
        const user_name = (this.parent.data.extracted_data.user_name || '').toLowerCase()
        const { active_category, active_date, search_query } = this.parent.data.values_to_render

        const now = new Date()
        const local_year = now.getFullYear()
        const local_month = String(now.getMonth() + 1).padStart(2, '0')
        const local_day = String(now.getDate()).padStart(2, '0')
        const today_str = `${local_year}-${local_month}-${local_day}`

        const matches_category_fn = (rec: (typeof records)[0]) => {
            const author_lower = rec.author.toLowerCase()

            if (active_category === 'MINE') {
                return user_name !== '' && author_lower.includes(user_name)
            }
            if (active_category === 'DOCTORS') {
                return author_lower.includes('dr.') || author_lower.includes('drg.')
            }
            if (active_category === 'SEARCH' && search_query.trim() !== '') {
                return author_lower.includes(search_query.toLowerCase())
            }
            return true
        }

        const category_matching_records = records.filter(matches_category_fn)
        const date_items: { key: string; label: string }[] = []

        date_items.push({
            key: 'ALL',
            label: `ALL (${category_matching_records.length}/${records.length})`,
        })

        available_dates.forEach((date_key) => {
            const records_on_date = records.filter((r) => r.date === date_key)
            const total_on_date = records_on_date.length
            const category_matches_on_date = records_on_date.filter(matches_category_fn).length

            const date_parts = date_key.split('-')
            const formatted_dd_mm = date_parts.length === 3 ? `${date_parts[2]}-${date_parts[1]}` : date_key

            const is_today = date_key === today_str
            const has_matches = total_on_date > 0
            const star_prefix = is_today && has_matches ? '★' : ''

            date_items.push({
                key: date_key,
                label: `${star_prefix}${formatted_dd_mm} (${category_matches_on_date}/${total_on_date})`,
            })
        })

        const new_signature = date_items.map((item) => item.key).join('|')

        if (this.current_dates_signature === new_signature && this.active_date_buttons.size > 0) {
            date_items.forEach((item) => {
                const btn = this.active_date_buttons.get(item.key)
                if (btn) {
                    if (btn.textContent !== item.label) btn.textContent = item.label
                    btn.classList.toggle('active', item.key === active_date)
                }
            })
            return
        }

        this.dates_row_element.innerHTML = ''
        this.active_date_buttons.clear()
        this.current_dates_signature = new_signature

        date_items.forEach((item) => {
            const btn = document.createElement('button')
            btn.type = 'button'
            btn.textContent = item.label
            btn.className = `satin-notes-date-btn ${active_date === item.key ? 'active' : ''}`
            btn.addEventListener('click', () => this.set_date(item.key))

            this.dates_row_element!.appendChild(btn)
            this.active_date_buttons.set(item.key, btn)
        })
    }

    public apply_filters(): void {
        const { active_category, active_date, search_query } = this.parent.data.values_to_render
        const records = this.parent.data.extracted_data.records || []
        const user_name = (this.parent.data.extracted_data.user_name || '').toLowerCase()

        records.forEach((rec) => {
            let matches_category = true
            let matches_date = true

            const author_lower = rec.author.toLowerCase()
            if (active_category === 'MINE') {
                matches_category = user_name !== '' && author_lower.includes(user_name)
            } else if (active_category === 'DOCTORS') {
                matches_category = author_lower.includes('dr.') || author_lower.includes('drg.')
            } else if (active_category === 'SEARCH' && search_query.trim() !== '') {
                matches_category = author_lower.includes(search_query.toLowerCase())
            }

            if (active_date !== 'ALL') {
                matches_date = rec.date === active_date
            }

            rec.element.style.display = matches_category && matches_date ? '' : 'none'
        })

        this.render_date_buttons()
    }

    private attach_destruction_listener(element: HTMLElement): void {
        const observer = new MutationObserver(() => {
            if (!element.isConnected) {
                observer.disconnect()
                this.reset()
            }
        })

        observer.observe(document.body, { childList: true, subtree: true })
    }
}
