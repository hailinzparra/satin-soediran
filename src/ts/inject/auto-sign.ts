import { Log } from '../utils/logger'
import {
    AutoSignRequestPayload,
    AutoSignResponsePayload,
    SATIN_EXT_AUTO_SIGN_RESPONSE_EVENT,
} from './types'

/**
 * Handles document auto-signing directly via ExtJS controller viewObj.cetak().
 */
export const auto_sign_document_in_main_world = (payload: AutoSignRequestPayload): void => {
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

        const visit_id = view_obj.kunjungan.get('NOMOR')
        const reg_id = view_obj.getReferensi(visit_data, 'PENDAFTARAN', 'NOMOR')
        const visit_type = view_obj.kunjungan.get('JENIS_KUNJUNGAN')
        const dpjp = view_obj.getReferensi(visit_data, 'DPJP') || {}
        const user_nip = view_obj.app?.pegawai?.get('NIP')
        const enable_sign = Boolean(user_nip && dpjp?.NIP && user_nip === dpjp.NIP)

        // Dynamic report name suffix for Pengkajian Awal (IGD / IRNA vs Rajal)
        const igd_irna_suffix = (visit_type === 2 || visit_type === 3) ? 'IgdIrna' : ''

        const configs: Record<string, any> = {
            resume: {
                title: `RESUME MEDIS - ${reg_id}`,
                name: 'mr.CetakMR2ResumeMedis',
                directoryId: 2,
                refId: reg_id,
                params: { PNOPEN: reg_id },
            },
            harian: {
                title: `PENGKAJIAN HARIAN - ${visit_id}`,
                name: 'mr.PengkajianHarian',
                directoryId: 13,
                refId: visit_id,
                params: { PNOPEN: reg_id, PKUNJUNGAN: visit_id, CETAK_HEADER: 1 },
            },
            awal: {
                title: `PENGKAJIAN AWAL - ${visit_id}`,
                name: `mr.PengkajianAwal${igd_irna_suffix}`,
                directoryId: 12,
                refId: visit_id,
                params: { PNOPEN: reg_id, PKUNJUNGAN: visit_id, CETAK_HEADER: 1 },
            },
        }

        const cfg = configs[doc_type]
        if (!cfg) {
            throw new Error(`Invalid document type: "${doc_type}". Choose 'resume', 'harian', or 'awal'.`)
        }

        const doc_storage: Record<string, any> = {
            REF_ID: cfg.refId,
            DOCUMENT_DIRECTORY_ID: cfg.directoryId,
            SIGN: 1,
        }
        if (passphrase) doc_storage.PIN = passphrase

        view_obj.cetak({
            TITLE: cfg.title,
            NAME: cfg.name,
            FINAL: view_obj.kunjungan.get('FINAL_HASIL') || 0,
            ENABLE_BUTTON_SIGN: enable_sign,
            DOCUMENT_STORAGE: doc_storage,
            PARAMETER: cfg.params,
            PRINT_NAME: 'CetakMR',
            TYPE: 'Pdf',
            EXT: 'pdf',
            REQUEST_FOR_PRINT: false,
        })

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
