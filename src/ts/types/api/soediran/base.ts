export enum SoediranEvent {
    SessionRefreshed = 'SessionRefreshed',
    KunjunganFetched = 'KunjunganFetched',
    HistoryOrderResepFetched = 'HistoryOrderResepFetched',
    TagihanPendaftaranFetched = 'TagihanPendaftaranFetched',
    AdmisiFetched = 'AdmisiFetched',
    IsAuthenticate = 'IsAuthenticate',
}

export const SoediranUrlRouteFilters: Record<SoediranEvent, string[][]> = {
    [SoediranEvent.SessionRefreshed]: [
        // ['/isAuthenticate'],
        ['/isLockApp'],
    ],
    [SoediranEvent.KunjunganFetched]: [
        ['/kunjungan', 'REFERENSI=%7B%22Ruangan%22'],
    ],
    [SoediranEvent.HistoryOrderResepFetched]: [
        ['/kunjungan', 'JENIS_KUNJUNGAN=11'],
        ['/orderresep', 'HISTORY=1'],
    ],
    [SoediranEvent.TagihanPendaftaranFetched]: [
        ['/tagihanpendaftaran'],
    ],
    [SoediranEvent.AdmisiFetched]: [
        ['/admisi', 'KUNJUNGAN='],
    ],
    [SoediranEvent.IsAuthenticate]: [
        ['/isAuthenticate'],
    ],
}

export interface SoediranApiResponse<T = any> {
    status?: number | boolean
    success?: boolean
    message?: string
    detail?: string
    data?: T
    total?: number
}
