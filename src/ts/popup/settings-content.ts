import { DEFAULT_SATIN_SETTINGS } from '../data/defaults'
import { SatinPopupEngine } from '../engine/popup-engine'
import { PopupContent, PopupContentElements } from '../types/popup'
import { SatinSettingsData } from '../types/settings'
import { create_element } from '../utils/dom'
import { Log } from '../utils/logger'

interface ToggleConfig {
    key: keyof SatinSettingsData
    title: string
    sub: string
    ind?: number
}

export class PopupSettingsContent extends PopupContent {
    el: PopupContentElements
    private checkboxes: Map<keyof SatinSettingsData, HTMLInputElement> = new Map()
    private reset_btn!: HTMLButtonElement
    private cancel_btn!: HTMLButtonElement
    private save_btn!: HTMLButtonElement

    constructor(engine: SatinPopupEngine) {
        super(engine)

        const settings: SatinSettingsData = this.engine.get_settings()
        const c = create_element

        const create_sub_header = (text: string, first_header: boolean = false) => c('div', {
            classes: `text-[10px] font-bold text-slate-400 uppercase tracking-wider ${first_header ? 'mt-4' : 'mt-6'} mb-2 border-b border-slate-100 pb-1`
        }, [c('span', { text })])

        const create_toggle_row = (key: keyof SatinSettingsData, title: string, subtitle: string, indent: number = 0) => {
            const initial_value = settings[key] === true

            const checkbox = c('input', {
                attrs: { id: key, type: 'checkbox' },
                classes: 'w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer'
            }) as HTMLInputElement

            checkbox.checked = initial_value
            this.checkboxes.set(key, checkbox)

            indent = Math.round(Math.min(4, Math.max(0, indent)))

            const fs = {
                title: 11 - indent,
                subtitle: 9 - indent,
            }

            const label_container = c('label', {
                classes: `flex items-center justify-between border-b border-slate-100 pb-2 mb-2 transition-colors duration-150 p-1 rounded${indent > 0 ? ` ps-${indent * 4}` : ''}`,
                attrs: { for: key }
            }, [
                c('div', { classes: 'flex flex-col' }, [
                    c('span', { classes: `text-[${fs.title}px] font-bold text-slate-700 label-title`, html: title }),
                    c('span', { classes: `text-[${fs.subtitle}px] font-medium text-slate-400`, html: subtitle }),
                ]),
                checkbox,
            ])

            checkbox.addEventListener('change', () => {
                const current_baseline = this.engine.get_settings()[key] === true
                if (checkbox.checked !== current_baseline) {
                    label_container.classList.add('bg-orange-50', 'border-orange-200', 'is-changed')
                    label_container.querySelector('.label-title')?.classList.add('text-orange-700')
                } else {
                    label_container.classList.remove('bg-orange-50', 'border-orange-200', 'is-changed')
                    label_container.querySelector('.label-title')?.classList.remove('text-orange-700')
                }
                this.update_button_states()
            })

            return label_container
        }

        const global_configs: ToggleConfig[] = [
            {
                key: 'global_allow_copy',
                title: '<span class="text-slate-500">Bisa</span> (Salin Teks)',
                sub: 'Bebas blok dan copy teks di halaman dengan mudah.',
            }
        ]

        const dash_configs: ToggleConfig[] = [
            {
                key: 'dash_show_openinnewtab_button',
                title: '<span class="text-slate-500">Tampilkan</span> (Tombol Tab Baru)',
                sub: 'Munculkan tombol untuk buka detil kunjungan di tab baru browser.',
            }
        ]

        const emr_configs: ToggleConfig[] = [
            {
                key: 'emr_show_results_menu',
                title: '<span class="text-slate-500">Tampilkan</span> (Menu "Hasil")',
                sub: 'Munculkan tombol menu "Hasil" untuk meninjau hasil lab dan radiologi dengan mudah.',
            },
            {
                key: 'emr_show_drug_price',
                title: '<span class="text-slate-500">Tampilkan</span> (Harga Obat)',
                sub: 'Munculkan estimasi harga obat di halaman rekam medis.',
            },
            {
                key: 'emr_show_drug_price_full_display',
                title: '<span class="text-slate-500">(Harga Obat)</span>: Tampilan Penuh',
                sub: 'Tampilkan lebih banyak rincian harga obat.',
                ind: 1,
            },
            {
                key: 'emr_show_drug_price_show_unit_summary',
                title: '<span class="text-slate-500">(Harga Obat)</span>: Total Harga Satuan',
                sub: 'Munculkan total harga obat jika masing-masing diambil satu.',
                ind: 1,
            },
            {
                key: 'emr_show_drug_prescriber_name',
                title: '<span class="text-slate-500">Tampilkan</span> (Nama Pembuat Resep)',
                sub: 'Munculkan nama pembuat resep di daftar order resep.',
            },
        ]

        const global_toggles = global_configs.map(t => create_toggle_row(t.key, t.title, t.sub, t.ind))
        const dash_toggles = dash_configs.map(t => create_toggle_row(t.key, t.title, t.sub, t.ind))
        const emr_toggles = emr_configs.map(t => create_toggle_row(t.key, t.title, t.sub, t.ind))

        this.reset_btn = c('button', {
            attrs: { type: 'button' },
            classes: 'swal2-deny inline-flex justify-center rounded-md bg-red-600 px-2.5 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-red-500 transition ease-in-out duration-150 order-1 sm:mr-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600',
            text: 'Atur Ulang Default',
        }) as HTMLButtonElement

        this.cancel_btn = c('button', {
            attrs: { type: 'button' },
            classes: 'swal2-cancel inline-flex justify-center rounded-md bg-white px-2.5 py-1.5 text-[12px] font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition ease-in-out duration-150 order-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white',
            text: 'Batal',
        }) as HTMLButtonElement

        this.save_btn = c('button', {
            attrs: { type: 'button' },
            classes: 'swal2-confirm inline-flex justify-center rounded-md bg-blue-600 px-2.5 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition ease-in-out duration-150 order-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600',
            text: 'Simpan Perubahan',
        }) as HTMLButtonElement

        this.reset_btn.addEventListener('click', () => {
            if (this.reset_btn.disabled) return
            this.checkboxes.forEach((checkbox, key) => {
                const default_value = DEFAULT_SATIN_SETTINGS[key] === true
                if (checkbox.checked !== default_value) {
                    checkbox.checked = default_value
                    checkbox.dispatchEvent(new Event('change'))
                }
            })
        })

        this.cancel_btn.addEventListener('click', () => {
            if (this.cancel_btn.disabled) return
            const current_saved_settings = this.engine.get_settings()

            this.checkboxes.forEach((checkbox, key) => {
                const last_saved_value = current_saved_settings[key] === true
                if (checkbox.checked !== last_saved_value) {
                    checkbox.checked = last_saved_value
                    checkbox.dispatchEvent(new Event('change'))
                }
            })
        })

        this.save_btn.addEventListener('click', () => {
            if (this.save_btn.disabled) return
            const changed_settings: Partial<SatinSettingsData> = {}
            const current_saved_settings = this.engine.get_settings()

            this.checkboxes.forEach((checkbox, key) => {
                const last_saved_value = current_saved_settings[key] === true
                if (checkbox.checked !== last_saved_value) {
                    (changed_settings as any)[key] = checkbox.checked
                }
            })

            if (Object.keys(changed_settings).length === 0) {
                Log.log('No modifications detected.')
                return
            }

            this.engine.get_settings_driver().update(changed_settings)
            Log.log('Saved successfully:', changed_settings)

            this.checkboxes.forEach((checkbox) => {
                checkbox.dispatchEvent(new Event('change'))
            })

            this.engine.swal.fire_success_short('Berhasil tersimpan!')
        })

        this.update_button_states()

        const action_wrapper = c('div', {
            classes: 'swal2-actions flex flex-wrap items-center justify-end w-full mt-6 gap-2',
        }, [
            this.reset_btn,
            this.cancel_btn,
            this.save_btn,
        ])

        const wrapper_title = c('div', {
            classes: 'text-[16px] font-bold text-slate-700 mt-4 mb-2 pb-1'
        }, [c('span', { html: '<span class="text-slate-500">Pengaturan Ekstensi</span> (Satin Soediran)' })])

        const global_header = create_sub_header('Fitur Umum', true)
        const dash_header = create_sub_header('Fitur Khusus (Dashboard)')
        const emr_header = create_sub_header('Fitur Khusus (Rekam Medis)')

        const wrapper = c('div', { classes: 'bg-white border border-slate-200 rounded-2xl shadow-sm p-6 max-w-xl mx-auto pt-2 overflow-hidden' }, [
            wrapper_title,

            global_header,
            ...global_toggles,

            // dash_header,
            // ...dash_toggles,

            emr_header,
            ...emr_toggles,

            action_wrapper,
        ])

        const container = c('div', { classes: 'tab-content-container' }, [wrapper])

        this.el = {
            container,
        }
    }

    private update_button_states() {
        const saved_settings = this.engine.get_settings()
        let holds_unsaved_changes = false
        let diverges_from_default = false

        this.checkboxes.forEach((checkbox, key) => {
            const is_checked = checkbox.checked
            const saved_val = saved_settings[key] === true
            const default_val = DEFAULT_SATIN_SETTINGS[key] === true

            if (is_checked !== saved_val) {
                holds_unsaved_changes = true
            }
            if (is_checked !== default_val) {
                diverges_from_default = true
            }
        })

        this.cancel_btn.disabled = !holds_unsaved_changes
        this.save_btn.disabled = !holds_unsaved_changes
        this.reset_btn.disabled = !diverges_from_default
    }
}
