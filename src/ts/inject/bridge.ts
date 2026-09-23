import { auto_sign_document_in_main_world } from './auto-sign'
import { extract_workspace_patient_summary } from './extractors'
import { execute_kirim_order_resep } from './order-resep'
import {
    AutoSignRequestPayload,
    KirimOrderResepRequestPayload,
    SATIN_EXT_AUTO_SIGN_REQUEST_EVENT,
    SATIN_EXT_KIRIM_ORDER_RESEP_REQUEST_EVENT,
    SATIN_EXT_PATIENT_DATA_EVENT,
    SATIN_EXT_PATIENT_REQUEST_EVENT,
} from './types'
import { Log } from '../utils/logger'

/**
 * Event Listener Bridges between Extension Isolated World & Main World
 */
export const start_workspace_bridge = (): void => {
    Log.log('starting bridges..')

    window.addEventListener(SATIN_EXT_PATIENT_REQUEST_EVENT, () => {
        const summary = extract_workspace_patient_summary()
        if (summary) {
            window.dispatchEvent(new CustomEvent(SATIN_EXT_PATIENT_DATA_EVENT, { detail: summary }))
        }
    })

    window.addEventListener(SATIN_EXT_AUTO_SIGN_REQUEST_EVENT, (e: Event) => {
        const custom_event = e as CustomEvent<AutoSignRequestPayload>
        if (custom_event.detail) {
            auto_sign_document_in_main_world(custom_event.detail)
        }
    })

    window.addEventListener(SATIN_EXT_KIRIM_ORDER_RESEP_REQUEST_EVENT, (e: Event) => {
        const custom_event = e as CustomEvent<KirimOrderResepRequestPayload>
        if (custom_event.detail) {
            execute_kirim_order_resep(custom_event.detail)
        }
    })
}
