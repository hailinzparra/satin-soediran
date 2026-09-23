import { SoediranEvent, SoediranUrlRouteFilters } from './types/api/soediran/base'
import { Log } from './utils/logger'

export const SATIN_EXT_PATIENT_REQUEST_EVENT = 'SATIN_EXT_PATIENT_REQUEST_EVENT'
export const SATIN_EXT_PATIENT_DATA_EVENT = 'SATIN_EXT_PATIENT_DATA_EVENT'

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
    const pasien = pendaftaran.REFERENSI.PASIEN || {}
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

const start_workspace_bridge = (): void => {
    console.log('starting bridges..')
    window.addEventListener(SATIN_EXT_PATIENT_REQUEST_EVENT, () => {
        const summary = extract_workspace_patient_summary()
        if (summary) {
            window.dispatchEvent(new CustomEvent(SATIN_EXT_PATIENT_DATA_EVENT, { detail: summary }))
        }
    })
}

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
                }
                catch (err) {
                    Log.error(`Error dispatching event ${event_key}:`, err)
                }
            })
        } catch (err) {
            Log.error('Error parsing Sencha AJAX response:', err)
        }
    })
}

start_sencha_interceptor()
