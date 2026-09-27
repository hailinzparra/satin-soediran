import { Log } from '../utils/logger'
import {
    MainTabAlias,
    NavigateRequestPayload,
    NavigateResponsePayload,
    RekamMedisInnerAlias,
    RekamMedisLeftAlias,
    SATIN_EXT_NAVIGATE_RESPONSE_EVENT
} from './types'

const main_xtype_map: Record<MainTabAlias, string> = {
    rekammedis: 'rekammedis-workspace',
    history_tindakan: 'tindakan-medis-workspace',
    layanan_farmasi: 'layanan-farmasi-workspace',
    retur_farmasi: 'retur-layanan-farmasi-workspace',
    layanan: 'tindakan-medis-workspace',
    hasil_lab: 'workspace-input-hasil-lab',
    riwayat_lab: 'riwayat-lab-workspace',
    evaluasi_sst: 'layanan-laboratorium-evaluasisst-workspace',
    pa: 'layanan-laboratorium-pa-hasil-workspace',
    mikro: 'layanan-laboratorium-mikro-hasil-workspace',
    hasil_rad: 'workspace-hasil-rad',
    riwayat_rad: 'riwayat-rad-workspace',
    lab: 'laboratorium-workspace',
    rad: 'radiologi-workspace',
    resep: 'resep-workspace',
    kpo: 'layanan-kpo-tab',
    konsul: 'konsultasi-workspace',
    operasi: 'workspace-list-lap-operasi',
    o2: 'pemakaian-o2-workspace',
    mutasi: 'mutasi-workspace',
    pulang: 'pasien-pulang-workspace',
    rujukan: 'pendaftaran-rujukan-keluar-workspace',
    bhp: 'layanan-bhp-workspace',
    bon: 'layanan-bonsisa-workspace',
    shk: 'layanan-laboratorium-shk-workspace',
    antimikroba: 'layanan-formulirantimikroba-workspace',
    protokol: 'layanan-resep-order-protokol-pengobatan-workspace'
}

const left_menu_map: Record<RekamMedisLeftAlias, string> = {
    rekonsiliasi_obat: 'Rekonsiliasi Obat',
    anamnesis: 'Anamnesis',
    pemeriksaan: 'Pemeriksaan',
    penilaian: 'Penilaian',
    diagnosis_icd: 'Diagnosis (ICD)',
    penandaan_gambar: 'Penandaan Gambar',
    upload_dokumen: 'Upload Dokumen',
    perencanaan: 'Perencanaan',
    cppt: 'CPPT',
    resume_medis: 'Resume Medis',
    penerbitan_surat: 'Penerbitan Surat',
}

const inner_tab_map: Record<RekamMedisInnerAlias, string> = {
    fisik: 'Fisik',
    nyeri: 'Nyeri',
    status_pediatrik: 'Status Pediatrik',
    diagnosis: 'Diagnosis',
    risiko_jatuh: 'Risiko Jatuh',
    dekubitus: 'Dekubitus',
    barthel_index: 'Barthel Index',
    balance_cairan: 'Balance Cairan',
    kanker: 'Kanker',
    jantung: 'Jantung',
    anastesi: 'Anastesi',
    order: 'Order',
    daftar_order: 'Daftar Order',
    riwayat: 'Riwayat',
    penunjang: 'Penunjang',
}

const wait_ms = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const switch_main_tab = (target: MainTabAlias): boolean => {
    const target_xtype = main_xtype_map[target]
    if (!target_xtype) return false

    const main_links_panel = Ext.ComponentQuery.query('layanan-links')[0]
    if (!main_links_panel) return false

    const active_tab = main_links_panel.getActiveTab?.()
    if (active_tab?.xtype?.toLowerCase() === target_xtype.toLowerCase()) {
        return true
    }

    const tab_item = main_links_panel.items?.items?.find((item: any) => {
        return item.xtype && item.xtype.toLowerCase() === target_xtype.toLowerCase()
    })

    if (tab_item) {
        main_links_panel.setActiveTab(tab_item)
        return true
    }

    return false
}

const select_left_sidebar_item = async (target_text: string, max_retries = 10): Promise<boolean> => {
    for (let i = 0; i < max_retries; i++) {
        const tree_list = Ext.ComponentQuery.query('rekammedis-workspace treelist')[0]
            || Ext.ComponentQuery.query('treelist')[0]

        if (tree_list) {
            const store = tree_list.getStore()
            if (store && store.getRoot()) {
                let target_node: any = null
                store.getRoot().cascade((node: any) => {
                    const text = node.get('text') || node.get('title')
                    if (text && text.toLowerCase().trim() === target_text.toLowerCase().trim()) {
                        target_node = node
                        return false
                    }
                })

                if (target_node) {
                    tree_list.setSelection(target_node)
                    tree_list.fireEvent('itemclick', tree_list, target_node)
                    return true
                }
            }
        }
        await wait_ms(100)
    }
    return false
}

const select_inner_tab = async (
    target_title: string,
    main_alias: MainTabAlias,
    max_retries = 10
): Promise<boolean> => {
    const parent_xtype = main_xtype_map[main_alias]

    for (let i = 0; i < max_retries; i++) {
        const candidate_panels: any[] = []

        if (parent_xtype) {
            // Pattern 1: Nested tabpanels inside a parent container (e.g. 'rekammedis-workspace tabpanel')
            const nested_panels = Ext.ComponentQuery.query(`${parent_xtype} tabpanel`)
            candidate_panels.push(...nested_panels)

            // Pattern 2: The workspace itself IS the tabpanel (e.g. 'laboratorium-workspace')
            const workspace_panel = Ext.ComponentQuery.query(parent_xtype)[0]
            if (workspace_panel) {
                candidate_panels.push(workspace_panel)
            }
        }

        // Fallback Pattern 3: Currently active tab on main layout
        const active_workspace = Ext.ComponentQuery.query('layanan-links')[0]?.getActiveTab?.()
        if (active_workspace) {
            candidate_panels.push(active_workspace)
        }

        // Search through collected candidate tab panels
        for (const panel of candidate_panels) {
            if (!panel?.items?.items) continue

            const matching_tab = panel.items.items.find((item: any) => {
                const title = item.title || item.getTitle?.()
                return title && title.toLowerCase().trim() === target_title.toLowerCase().trim()
            })

            if (matching_tab) {
                if (typeof panel.setActiveTab === 'function') {
                    panel.setActiveTab(matching_tab)
                    return true
                }
            }
        }

        await wait_ms(100)
    }

    return false
}

const focus_diagnosis_textarea = async (max_retries = 15): Promise<void> => {
    for (let i = 0; i < max_retries; i++) {
        const form_container = document.querySelector('[id^="rekammedis-penilaian-diagnosis-form-"]')
        if (form_container) {
            const textarea = form_container.querySelector<HTMLTextAreaElement>('textarea[name="DIAGNOSIS"]')
            if (textarea) {
                textarea.focus()
                textarea.select()
                return
            }
        }
        await wait_ms(100)
    }
}

export const execute_navigation_in_main_world = async (payload: NavigateRequestPayload): Promise<void> => {
    const { request_id, main, left, inner } = payload

    try {
        if (typeof Ext === 'undefined' || !Ext.ComponentQuery) {
            throw new Error('Ext JS runtime not detected in main world.')
        }

        // Step 1: Main Tab Switch
        const main_success = switch_main_tab(main)
        if (!main_success) {
            throw new Error(`Failed to activate main tab: "${main}"`)
        }

        // Step 2: Left Tree Sidebar Selection (if applicable)
        if (left) {
            const target_left_text = left_menu_map[left]
            if (!target_left_text || !(await select_left_sidebar_item(target_left_text))) {
                throw new Error(`Failed to select left menu item: "${left}"`)
            }
        }

        // Step 3: Inner/Horizontal Sub-tab Bar Selection (dengan scope parent workspace)
        if (inner) {
            const target_inner_title = inner_tab_map[inner]
            if (!target_inner_title || !(await select_inner_tab(target_inner_title, main))) {
                throw new Error(`Failed to select inner tab: "${inner}" in workspace "${main}"`)
            }
        }

        // Auto-focus target input for Diagnosis
        if (inner === 'diagnosis' || left === 'penilaian') {
            focus_diagnosis_textarea()
        }

        window.dispatchEvent(
            new CustomEvent<NavigateResponsePayload>(SATIN_EXT_NAVIGATE_RESPONSE_EVENT, {
                detail: { request_id, success: true }
            })
        )
    } catch (err: any) {
        Log.error('Navigation execution failed:', err)
        window.dispatchEvent(
            new CustomEvent<NavigateResponsePayload>(SATIN_EXT_NAVIGATE_RESPONSE_EVENT, {
                detail: { request_id, success: false, error: err.message || String(err) }
            })
        )
    }
}
