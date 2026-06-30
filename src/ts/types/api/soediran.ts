export enum SoediranEvent {
    SessionRefreshed = 'SessionRefreshed',
    HistoryOrderResepFetched = 'HistoryOrderResepFetched',
}

export const SoediranUrlRouteFilters: Record<SoediranEvent, string[][]> = {
    [SoediranEvent.SessionRefreshed]: [
        // ['/isAuthenticate'],
        ['/isLockApp'],
    ],
    [SoediranEvent.HistoryOrderResepFetched]: [
        ['/kunjungan', 'JENIS_KUNJUNGAN=11'],
        ['/orderresep', 'HISTORY=1'],
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
