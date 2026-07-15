export interface SoediranParamsHasilLab {
    NORM: string
    REFERENSI: {
        Kunjungan: {
            COLUMNS: string[]
            REFERENSI: boolean
        }
    }
    STATUS: string | number | (string | number)[]
    page: number
    start: number
    limit: number
}

export interface SoediranParamsKunjungan {
    NORM: string
    STATUS: string | number | (string | number)[]
    page: number
    start: number
    limit: number
}

export interface SoediranParamsTindakanMedis {
    KUNJUNGAN: string
    REFERENSI: {
        Kunjungan: boolean
    }
    NORM: string
    JENIS_TINDAKAN: string
    STATUS: string | number | (string | number)[]
    page: number
    start: number
    limit: number
}
