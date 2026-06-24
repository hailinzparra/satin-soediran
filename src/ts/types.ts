export interface ExtensionSettings {
    // global
    global_allow_copy: boolean

    // reg
    reg_show_openinnewtab_button: boolean

    // emr
    emr_show_drug_price: boolean
}

export enum ExtensionEvent {
    KunjunganFetched = 'KUNJUNGAN_FETCHED',
}

export const UrlRouteFilters: Record<ExtensionEvent, string> = {
    [ExtensionEvent.KunjunganFetched]: '/kunjungan',
}

export interface KunjunganResponse {
    data: {
        NOMOR: string | number
        MASUK?: string | null
        KELUAR?: string | null
        DIAGNOSAMASUK?: {
            REFERENSI?: {
                DIAGNOSA?: {
                    CODE?: string | number | null
                    STR?: string | null
                } | null
            } | null
        } | null
        REFERENSI?: {
            PENDAFTARAN?: {
                TUJUAN?: {
                    REFERENSI?: {
                        ANTRIAN?: {
                            NOMOR?: string | number | null
                        } | null
                    } | null
                } | null
            } | null
            RUANG_KAMAR_TIDUR?: {
                TEMPAT_TIDUR?: string | null
            } | null
            DPJP?: {
                ID?: string | number | null
            } | null
        } | null
    }[]
    detail: string
    status: number
    success: boolean
    total: number
}
