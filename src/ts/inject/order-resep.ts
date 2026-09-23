import { Log } from '../utils/logger'
import {
    KirimOrderResepRequestPayload,
    KirimOrderResepResponsePayload,
    SATIN_EXT_KIRIM_ORDER_RESEP_RESPONSE_EVENT,
} from './types'

/**
 * Executes prescription auto-signing using the parameters and logic from layanan.resep.WorkspaceController
 */
export const sign_prescription_document = (
    orderNomor: string,
    passphrase?: string,
    orderRecord?: any
): boolean => {
    try {
        // 1. Locate the workspace via component query
        const order_workspace = Ext.ComponentQuery.query('component[xtype*="order-resep-workspace"]')[0]
            || Ext.ComponentQuery.query('component[xtype*="resep-workspace"]')[0]

        if (!order_workspace) {
            Log.error('Order Resep Workspace component not found for auto-signing.')
            return false
        }

        const view_obj = order_workspace.getController?.()?.getView?.() || order_workspace
        if (!view_obj || typeof view_obj.cetak !== 'function') {
            Log.error('View object with cetak() method not available on order workspace.')
            return false
        }

        // 2. Resolve Doctor/DPJP signing authorization matching onKirim logic
        let enable_sign = true
        if (view_obj.app?.pegawai) {
            const is_doctor = view_obj.app.pegawai.get('PROFESI') == 4
            if (is_doctor && orderRecord) {
                const dpjp = view_obj.getReferensi?.(orderRecord.getData?.() || orderRecord, 'DOKTER_DPJP')
                if (dpjp?.NIP) {
                    enable_sign = view_obj.app.pegawai.get('NIP') == dpjp.NIP
                }
            }
        }

        // 3. Build DOCUMENT_STORAGE object with PIN
        const doc_storage: Record<string, any> = {
            REF_ID: orderNomor,
            DOCUMENT_DIRECTORY_ID: 15,
            SIGN: 1,
        }
        if (passphrase) {
            doc_storage.PIN = passphrase
        }

        // Attach order record to view context as required by onKirim signed task listener
        if (orderRecord) {
            view_obj.order = orderRecord
        }

        // 4. Trigger cetak matching layanan.resep.WorkspaceController's onKirim payload
        view_obj.cetak({
            TITLE: `RESEP DOKTER - ${orderNomor}`,
            NAME: 'layanan.farmasi.CetakCopyResep',
            FINAL: 0,
            DOCUMENT_STORAGE: doc_storage,
            ENABLE_BUTTON_SIGN: enable_sign,
            TYPE: 'Pdf',
            EXT: 'pdf',
            PARAMETER: { PNOMOR: orderNomor, CETAK_HEADER: 1 },
            REQUEST_FOR_PRINT: false,
            PRINT_NAME: 'CetakResep',
        })

        Log.log(`Auto-sign successfully executed via cetak() for order №: ${orderNomor}`)
        return true
    } catch (e) {
        Log.error('Failed to trigger prescription auto-sign:', e)
        return false
    }
}

/**
 * Handles ordering prescription + immediate auto-signing
 */
export const execute_kirim_order_resep = (payload: KirimOrderResepRequestPayload): void => {
    const { request_id, passphrase, auto_sign = true } = payload

    try {
        if (typeof Ext === 'undefined' || !Ext.ComponentQuery) {
            throw new Error('Ext JS runtime not available in main world.')
        }

        const order_workspace = Ext.ComponentQuery.query('component[xtype*="order-resep-workspace"]')[0]
            || Ext.ComponentQuery.query('component[xtype*="resep-workspace"]')[0]

        if (!order_workspace) {
            throw new Error('Prescription Workspace component not found in DOM.')
        }

        const controller = order_workspace.getController?.()
        if (!controller) {
            throw new Error('WorkspaceController not found on order workspace.')
        }

        const kirim_btn = Ext.ComponentQuery.query('button').find((btn: any) => {
            const text = btn.getText?.() || btn.text || ''
            return text.includes('Kirim Order')
        })

        let is_handled = false

        const ajax_interceptor = (conn: any, response: { responseText: string }, options: any) => {
            try {
                if (is_handled) return

                const url = options?.url || ''
                if (options.method === 'POST' || options.method === 'PUT' || url.includes('resep') || url.includes('order')) {
                    const res_data = JSON.parse(response.responseText)
                    const saved_order_data = res_data?.data || res_data

                    if (saved_order_data && (saved_order_data.NOMOR || saved_order_data.ID)) {
                        is_handled = true
                        Ext.Ajax.un('requestcomplete', ajax_interceptor)

                        const orderNomor = saved_order_data.NOMOR || saved_order_data.ID
                        Log.log(`Prescription order saved successfully. Order №: ${orderNomor}`)

                        // Construct minimal record object if raw model record isn't available
                        const orderRecord = controller.getView?.()?.order || {
                            getData: () => saved_order_data,
                            get: (key: string) => saved_order_data[key],
                            set: (key: string, val: any) => { saved_order_data[key] = val },
                        }

                        let sign_success = true
                        if (auto_sign) {
                            // If controller has native onKirim, pass record to it or use direct cetak
                            if (typeof controller.onKirim === 'function' && passphrase) {
                                controller.onKirim(orderRecord)
                                sign_success = true
                            } else {
                                sign_success = sign_prescription_document(orderNomor, passphrase, orderRecord)
                            }
                        }

                        window.dispatchEvent(
                            new CustomEvent<KirimOrderResepResponsePayload>(
                                SATIN_EXT_KIRIM_ORDER_RESEP_RESPONSE_EVENT,
                                {
                                    detail: {
                                        request_id,
                                        success: sign_success,
                                        order_nomor: orderNomor,
                                    },
                                }
                            )
                        )
                    }
                }
            } catch (err) {
                // Ignore non-json responses
            }
        }

        Ext.Ajax.on('requestcomplete', ajax_interceptor)

        setTimeout(() => {
            if (!is_handled) {
                Ext.Ajax.un('requestcomplete', ajax_interceptor)
            }
        }, 10000)

        // Execute submit via controller handler or button click
        if (typeof controller.onKirimOrderResep === 'function') {
            controller.onKirimOrderResep(kirim_btn)
        } else if (kirim_btn && typeof kirim_btn.handler === 'function') {
            kirim_btn.handler.call(controller, kirim_btn)
        } else if (kirim_btn) {
            kirim_btn.fireEvent('click', kirim_btn)
        } else {
            throw new Error('Could not invoke prescription send action.')
        }

    } catch (err: any) {
        Log.error('Kirim order resep execution failed:', err)
        window.dispatchEvent(
            new CustomEvent<KirimOrderResepResponsePayload>(
                SATIN_EXT_KIRIM_ORDER_RESEP_RESPONSE_EVENT,
                {
                    detail: {
                        request_id,
                        success: false,
                        error: err.message || String(err),
                    },
                }
            )
        )
    }
}
