import { DEFAULT_EXTENSION_SETTINGS, ExtensionDriver, ExtensionSettings, PopupTabContent, PopupTabContentElements } from '../types'
import { create_element } from '../utils'
import { SatinPopupEngine } from '../popup'

interface ToggleConfig {
    key: keyof ExtensionSettings
    title: string
    sub: string
}

export class TabSettingsContent extends PopupTabContent {
    el: PopupTabContentElements
    private checkboxes: Map<keyof ExtensionSettings, HTMLInputElement> = new Map()
    private reset_btn!: HTMLButtonElement
    private cancel_btn!: HTMLButtonElement
    private save_btn!: HTMLButtonElement

    constructor(engine: SatinPopupEngine, get_settings: () => ExtensionSettings) {
        super(engine, get_settings)

        const settings: ExtensionSettings = this.get_settings()
        const c = create_element

        const create_sub_header = (text: string) => c('div', {
            classes: 'text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-4 mb-2 border-b border-slate-100 pb-1'
        }, [c('span', { text })])

        const create_toggle_row = (key: keyof ExtensionSettings, title: string, subtitle: string) => {
            const initial_value = settings[key] === true

            const checkbox = c('input', {
                attrs: { id: key, type: 'checkbox' },
                classes: 'w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer'
            }) as HTMLInputElement

            checkbox.checked = initial_value
            this.checkboxes.set(key, checkbox)

            const label_container = c('label', {
                classes: 'flex items-center justify-between border-b border-slate-100 pb-2 mb-2 transition-colors duration-150 p-1 rounded',
                attrs: { for: key }
            }, [
                c('div', { classes: 'flex flex-col' }, [
                    c('span', { classes: 'text-[12px] font-bold text-slate-700 label-title', text: title }),
                    c('span', { classes: 'text-[10px] font-medium text-slate-400', text: subtitle }),
                ]),
                checkbox,
            ])

            checkbox.addEventListener('change', () => {
                const current_baseline = this.get_settings()[key] === true
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

        const global_header = create_sub_header('Pengaturan Global')
        const reg_header = create_sub_header('Pengaturan Dashboard')
        const emr_header = create_sub_header('Pengaturan Rekam Medis')

        const global_configs: ToggleConfig[] = [
            {
                key: 'global_allow_copy',
                title: 'Bisa Salin Teks',
                sub: 'Bebas blok dan copy teks di halaman dengan mudah.',
            }
        ]

        const reg_configs: ToggleConfig[] = [
            {
                key: 'reg_show_openinnewtab_button',
                title: 'Tombol Buka di Tab Baru',
                sub: 'Munculkan tombol untuk buka detil kunjungan di tab baru browser.',
            }
        ]

        const emr_configs: ToggleConfig[] = [
            {
                key: 'emr_show_drug_price',
                title: 'Tampilkan Harga Obat',
                sub: 'Munculkan estimasi harga obat di halaman rekam medis.',
            },
            {
                key: 'emr_show_drug_price_minimal_display',
                title: 'Tampilan Harga Obat Ringkas',
                sub: 'Sembunyikan detail rincian harga obat agar tidak makan tempat di layar.',
            },
            {
                key: 'emr_show_drug_price_show_unit_summary',
                title: 'Tampilkan Total Harga Satuan Obat',
                sub: 'Munculkan total harga obat jika masing-masing diambil satu.',
            },
            {
                key: 'emr_show_drug_prescriber_name',
                title: 'Tampilkan Nama Pembuat Resep',
                sub: 'Munculkan nama pembuat resep di daftar order resep.',
            },
        ]

        const global_toggles = global_configs.map(t => create_toggle_row(t.key, t.title, t.sub))
        const reg_toggles = reg_configs.map(t => create_toggle_row(t.key, t.title, t.sub))
        const emr_toggles = emr_configs.map(t => create_toggle_row(t.key, t.title, t.sub))

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
                const default_value = DEFAULT_EXTENSION_SETTINGS[key] === true
                if (checkbox.checked !== default_value) {
                    checkbox.checked = default_value
                    checkbox.dispatchEvent(new Event('change'))
                }
            })
        })

        this.cancel_btn.addEventListener('click', () => {
            if (this.cancel_btn.disabled) return
            const current_saved_settings = this.get_settings()

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
            const changed_settings: Partial<ExtensionSettings> = {}
            const current_saved_settings = this.get_settings()

            this.checkboxes.forEach((checkbox, key) => {
                const last_saved_value = current_saved_settings[key] === true
                if (checkbox.checked !== last_saved_value) {
                    (changed_settings as any)[key] = checkbox.checked
                }
            })

            if (Object.keys(changed_settings).length === 0) {
                console.log('No modifications detected.')
                return
            }

            this.engine.drivers[ExtensionDriver.Settings]?.update(changed_settings)
            console.log('Saved successfully:', changed_settings)

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

        const wrapper = c('div', { classes: 'bg-white border border-slate-200 rounded-2xl shadow-sm p-6 max-w-xl mx-auto pt-2' }, [
            global_header,
            ...global_toggles,

            reg_header,
            ...reg_toggles,

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
        const saved_settings = this.get_settings()
        let holds_unsaved_changes = false
        let diverges_from_default = false

        this.checkboxes.forEach((checkbox, key) => {
            const is_checked = checkbox.checked
            const saved_val = saved_settings[key] === true
            const default_val = DEFAULT_EXTENSION_SETTINGS[key] === true

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
