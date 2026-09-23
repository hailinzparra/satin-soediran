// Custom Event Constants
export const SATIN_EXT_PATIENT_REQUEST_EVENT = 'SATIN_EXT_PATIENT_REQUEST_EVENT'
export const SATIN_EXT_PATIENT_DATA_EVENT = 'SATIN_EXT_PATIENT_DATA_EVENT'
export const SATIN_EXT_AUTO_SIGN_REQUEST_EVENT = 'SATIN_EXT_AUTO_SIGN_REQUEST_EVENT'
export const SATIN_EXT_AUTO_SIGN_RESPONSE_EVENT = 'SATIN_EXT_AUTO_SIGN_RESPONSE_EVENT'
export const SATIN_EXT_KIRIM_ORDER_RESEP_REQUEST_EVENT = 'SATIN_EXT_KIRIM_ORDER_RESEP_REQUEST_EVENT'
export const SATIN_EXT_KIRIM_ORDER_RESEP_RESPONSE_EVENT = 'SATIN_EXT_KIRIM_ORDER_RESEP_RESPONSE_EVENT'

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

export interface KirimOrderResepRequestPayload {
    request_id: string
    passphrase?: string
    auto_sign?: boolean
}

export interface KirimOrderResepResponsePayload {
    request_id: string
    success: boolean
    order_nomor?: string
    error?: string
}
