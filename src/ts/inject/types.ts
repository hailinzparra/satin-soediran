export const SATIN_EXT_PATIENT_REQUEST_EVENT = 'SATIN_EXT_PATIENT_REQUEST_EVENT'
export const SATIN_EXT_PATIENT_DATA_EVENT = 'SATIN_EXT_PATIENT_DATA_EVENT'
export const SATIN_EXT_AUTO_SIGN_REQUEST_EVENT = 'SATIN_EXT_AUTO_SIGN_REQUEST_EVENT'
export const SATIN_EXT_AUTO_SIGN_RESPONSE_EVENT = 'SATIN_EXT_AUTO_SIGN_RESPONSE_EVENT'
export const SATIN_EXT_KIRIM_ORDER_RESEP_REQUEST_EVENT = 'SATIN_EXT_KIRIM_ORDER_RESEP_REQUEST_EVENT'
export const SATIN_EXT_KIRIM_ORDER_RESEP_RESPONSE_EVENT = 'SATIN_EXT_KIRIM_ORDER_RESEP_RESPONSE_EVENT'
export const SATIN_EXT_NAVIGATE_REQUEST_EVENT = 'SATIN_EXT_NAVIGATE_REQUEST_EVENT'
export const SATIN_EXT_NAVIGATE_RESPONSE_EVENT = 'SATIN_EXT_NAVIGATE_RESPONSE_EVENT'

export type MainTabAlias =
    | 'rekammedis'
    | 'history_tindakan'
    | 'layanan_farmasi'
    | 'retur_farmasi'
    | 'layanan'
    | 'hasil_lab'
    | 'riwayat_lab'
    | 'evaluasi_sst'
    | 'pa'
    | 'mikro'
    | 'hasil_rad'
    | 'riwayat_rad'
    | 'lab'
    | 'rad'
    | 'resep'
    | 'kpo'
    | 'konsul'
    | 'operasi'
    | 'o2'
    | 'mutasi'
    | 'pulang'
    | 'rujukan'
    | 'bhp'
    | 'bon'
    | 'shk'
    | 'antimikroba'
    | 'protokol'

export type RekamMedisLeftAlias =
    | 'rekonsiliasi_obat'
    | 'anamnesis'
    | 'pemeriksaan'
    | 'penilaian'
    | 'diagnosis_icd'
    | 'penandaan_gambar'
    | 'upload_dokumen'
    | 'perencanaan'
    | 'cppt'
    | 'resume_medis'
    | 'penerbitan_surat'

export type RekamMedisInnerAlias =
    | 'fisik'
    | 'nyeri'
    | 'status_pediatrik'
    | 'diagnosis'
    | 'risiko_jatuh'
    | 'dekubitus'
    | 'barthel_index'
    | 'balance_cairan'
    | 'kanker'
    | 'jantung'
    | 'anastesi'
    | 'order'
    | 'daftar_order'
    | 'riwayat'
    | 'penunjang'

export interface NavigateRequestPayload {
    request_id: string
    main: MainTabAlias
    left?: RekamMedisLeftAlias
    inner?: RekamMedisInnerAlias
}

export interface NavigateResponsePayload {
    request_id: string
    success: boolean
    error?: string
}

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
