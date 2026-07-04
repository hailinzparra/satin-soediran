export interface SoediranParamsHasilLab {
    NORM: string
    REFERENSI: {
        Kunjungan: {
            COLUMNS: string[]
            REFERENSI: boolean
        }
    }
    STATUS: string | number
    page: number
    start: number
    limit: number
}
