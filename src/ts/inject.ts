import { SoediranEvent, SoediranUrlRouteFilters } from './types/api/soediran/base'
import { Log } from './utils/logger'

// Event Constant Identifiers
export const SATIN_EXT_PATIENT_REQUEST_EVENT = 'SATIN_EXT_PATIENT_REQUEST_EVENT'
export const SATIN_EXT_PATIENT_DATA_EVENT = 'SATIN_EXT_PATIENT_DATA_EVENT'
export const SATIN_EXT_AUTO_SIGN_REQUEST_EVENT = 'SATIN_EXT_AUTO_SIGN_REQUEST_EVENT'
export const SATIN_EXT_AUTO_SIGN_RESPONSE_EVENT = 'SATIN_EXT_AUTO_SIGN_RESPONSE_EVENT'

// Interfaces
export interface PatientSummaryData {
    mrn: string
    name: string
    reg_id: string
    visit_id: string
    dob?: string
    gender?: string
    dpjp_name?: string
    dpjp_nip?: string
    is_final?: boolean
}

export interface AutoSignRequestPayload {
    request_id: string
    doc_type: 'resume' | 'harian'
    passphrase?: string
}

export interface AutoSignResponsePayload {
    request_id: string
    success: boolean
    error?: string
}

/**
 * Extracts patient data from the current ExtJS workspace component.
 */
export const extract_workspace_patient_summary = (): PatientSummaryData | null => {
    if (typeof Ext === 'undefined' || !Ext.ComponentQuery) return null

    const workspace = Ext.ComponentQuery.query('rekammedis-workspace')[0]
    if (!workspace) return null

    const view_obj = workspace.getController?.()?.getView?.()
    const visit = view_obj?.kunjungan
    if (!visit) return null

    const visit_data = visit.getData()
    const ref = visit.get('REFERENSI') || {}
    const pendaftaran = ref.PENDAFTARAN || {}
    const pasien = pendaftaran.REFERENSI?.PASIEN || {}
    const dpjp = ref.DPJP || {}

    const reg_id = view_obj.getReferensi(visit_data, 'PENDAFTARAN', 'NOMOR') || pendaftaran.NOMOR || visit.get('NOPEN') || ''
    const mrn = view_obj.getReferensi(visit_data, 'PENDAFTARAN', 'NORM') || pendaftaran.NORM || ''
    const visit_id = visit.get('NOMOR') || ''
    const name = pasien.NAMA || ''

    return {
        mrn,
        name,
        reg_id,
        visit_id,
        dob: pasien.TANGGAL_LAHIR,
        gender: pasien.JENIS_KELAMIN == 1 ? 'Laki-laki' : 'Perempuan',
        dpjp_name: dpjp.NAMA,
        dpjp_nip: dpjp.NIP,
        is_final: visit.get('FINAL_HASIL') === 1,
    }
}

/**
 * Handles document auto-signing directly via ExtJS controller viewObj.cetak().
 */
const auto_sign_document_in_main_world = (payload: AutoSignRequestPayload): void => {
    const { request_id, doc_type, passphrase } = payload

    try {
        if (typeof Ext === 'undefined' || !Ext.ComponentQuery) {
            throw new Error('Ext JS runtime not detected in main world.')
        }

        const workspace = Ext.ComponentQuery.query('rekammedis-workspace')[0]
        if (!workspace) {
            throw new Error('Workspace component "rekammedis-workspace" not found!')
        }

        const controller = workspace.getController?.()
        const view_obj = controller?.getView?.()
        if (!view_obj) {
            throw new Error('View object not available on workspace controller.')
        }

        const visit_data = view_obj.kunjungan?.getData?.()
        if (!visit_data) {
            throw new Error('Visit data missing from view object.')
        }

        const nomor_kunjungan = view_obj.kunjungan.get('NOMOR')
        const nomor_pendaftaran = view_obj.getReferensi(visit_data, 'PENDAFTARAN', 'NOMOR')
        const dpjp = view_obj.getReferensi(visit_data, 'DPJP') || {}
        const user_nip = view_obj.app?.pegawai?.get('NIP')
        const enable_sign = user_nip && dpjp?.NIP ? user_nip === dpjp.NIP : false

        const configs: Record<string, any> = {
            resume: {
                title: `RESUME MEDIS - ${nomor_pendaftaran}`,
                name: 'mr.CetakMR2ResumeMedis',
                directoryId: 2,
                refId: nomor_pendaftaran,
                params: { PNOPEN: nomor_pendaftaran },
            },
            harian: {
                title: `PENGKAJIAN HARIAN - ${nomor_kunjungan}`,
                name: 'mr.PengkajianHarian',
                directoryId: 13,
                refId: nomor_kunjungan,
                params: { PNOPEN: nomor_pendaftaran, PKUNJUNGAN: nomor_kunjungan, CETAK_HEADER: 1 },
            },
        }

        const cfg = configs[doc_type]
        if (!cfg) {
            throw new Error(`Invalid document type: "${doc_type}". Choose 'resume' or 'harian'.`)
        }

        const doc_storage: Record<string, any> = {
            REF_ID: cfg.refId,
            DOCUMENT_DIRECTORY_ID: cfg.directoryId,
            SIGN: 1,
        }
        if (passphrase) doc_storage.PIN = passphrase

        // Call native ExtJS view function to initialize print/signing
        view_obj.cetak({
            TITLE: cfg.title,
            NAME: cfg.name,
            FINAL: view_obj.kunjungan.get('FINAL_HASIL'),
            ENABLE_BUTTON_SIGN: enable_sign,
            DOCUMENT_STORAGE: doc_storage,
            PARAMETER: cfg.params,
            PRINT_NAME: 'CetakMR',
            TYPE: 'Pdf',
            EXT: 'pdf',
            REQUEST_FOR_PRINT: false,
        })

        // Notify isolated world of successful trigger
        window.dispatchEvent(
            new CustomEvent<AutoSignResponsePayload>(SATIN_EXT_AUTO_SIGN_RESPONSE_EVENT, {
                detail: { request_id, success: true },
            })
        )
    } catch (err: any) {
        Log.error('Auto sign execution failed:', err)
        window.dispatchEvent(
            new CustomEvent<AutoSignResponsePayload>(SATIN_EXT_AUTO_SIGN_RESPONSE_EVENT, {
                detail: { request_id, success: false, error: err.message || String(err) },
            })
        )
    }
}

/**
 * Event Listener Bridges between Extension Isolated World & Main World
 */
const start_workspace_bridge = (): void => {
    Log.log('starting bridges..')

    // Handle patient context queries from isolated content script
    window.addEventListener(SATIN_EXT_PATIENT_REQUEST_EVENT, () => {
        const summary = extract_workspace_patient_summary()
        if (summary) {
            window.dispatchEvent(new CustomEvent(SATIN_EXT_PATIENT_DATA_EVENT, { detail: summary }))
        }
    })

    // Handle document auto-sign requests from isolated content script
    window.addEventListener(SATIN_EXT_AUTO_SIGN_REQUEST_EVENT, (e: Event) => {
        const customEvent = e as CustomEvent<AutoSignRequestPayload>
        if (customEvent.detail) {
            auto_sign_document_in_main_world(customEvent.detail)
        }
    })
}

/**
 * Extracts payload options from Ext.Ajax request configuration.
 */
export const extract_payload = (options: any): any => {
    if (!options) return null

    if (options.jsonData) {
        return typeof options.jsonData === 'string'
            ? JSON.parse(options.jsonData)
            : options.jsonData
    }

    if (options.rawData) {
        if (typeof options.rawData === 'string') {
            try {
                return JSON.parse(options.rawData)
            } catch {
                return options.rawData
            }
        }
        return options.rawData
    }

    if (options.xmlData) {
        return options.xmlData
    }

    if (options.params) {
        if (typeof options.params === 'string') {
            const parsed_params: Record<string, string> = {}
            new URLSearchParams(options.params).forEach((val, key) => {
                parsed_params[key] = val
            })
            return parsed_params
        }
        return options.params
    }

    return null
}

/**
 * Polls for ExtJS availability, attaches workspace bridges, and registers Ajax request interceptors.
 */
const start_sencha_interceptor = (): void => {
    if (typeof Ext === 'undefined' || !Ext.Ajax) {
        setTimeout(start_sencha_interceptor, 100)
        return
    }

    Log.log('Ext JS detected! Injecting interceptor & workspace bridge...')

    start_workspace_bridge()

    Ext.Ajax.on('requestcomplete', (conn: any, response: { responseText: string }, options: any) => {
        try {
            let url = options.url
            if (!url) return

            if (options.params) {
                const query_params = new URLSearchParams()
                if (typeof options.params === 'object') {
                    Object.entries(options.params).forEach(([key, value]) => {
                        query_params.append(key, String(value))
                    })
                } else if (typeof options.params === 'string') {
                    options.params.split('&').forEach((p: string) => {
                        const [k, v] = p.split('=')
                        if (k) query_params.append(k, v || '')
                    })
                }
                const query_string = query_params.toString()
                if (query_string) {
                    url += (url.includes('?') ? '&' : '?') + query_string
                }
            }

            const payload = extract_payload(options);

            (Object.keys(SoediranUrlRouteFilters) as SoediranEvent[]).forEach((event_key) => {
                try {
                    const filter = SoediranUrlRouteFilters[event_key]
                    const is_matched = filter.some(and_group =>
                        and_group.every(condition => url.includes(condition))
                    )
                    if (is_matched) {
                        const data = JSON.parse(response.responseText)?.data ?? null
                        const custom_event = new CustomEvent(event_key, { detail: { data, payload } })
                        window.dispatchEvent(custom_event)
                    }
                } catch (err) {
                    Log.error(`Error dispatching event ${event_key}:`, err)
                }
            })
        } catch (err) {
            Log.error('Error parsing Sencha AJAX response:', err)
        }
    })
}

// Start Interceptor Execution
start_sencha_interceptor()
