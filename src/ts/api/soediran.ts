import { DB_SOEDIRAN_DATABASE } from '../databases/db-soediran'
import { ApiDriver, ApiResponseWrapper, ApiSession } from './api-types'
import { decrypt_data } from './soediran-decrypt'

export interface SoediranApiResponse<T = any> {
    success?: boolean
    message?: string
    detail?: string
    data?: T
}

export class ApiSoediranDriver extends ApiDriver {
    constructor() {
        super({
            id: 0,
            name: 'RSUD Soediran',
            sys_name: 'Soediran',
            domains: [
                "https://api.rsudsoediranms.com",
                "http://192.168.13.3",
                "http://192.168.13.4",
                "http://192.168.13.5",
                "http://192.168.13.6",
                "http://192.168.13.7",
                "http://192.168.13.8",
                "http://192.168.13.9",
                "http://192.168.13.10",
            ],
            paths: {
                api: '/webservice/',
                web_app: '/apps/SIMpel/',
            },
            database: DB_SOEDIRAN_DATABASE,
        })
    }

    async api_request<T = any>(
        session: ApiSession,
        url: string,
        init?: RequestInit,
    ): Promise<ApiResponseWrapper<T>> {
        if (!session || !session.auth_token) {
            throw new Error('Session not found.')
        }

        const merged_headers = new Headers(init?.headers)

        if (!merged_headers.has('Authorization')) {
            merged_headers.set('Authorization', `Bearer ${session.auth_token}`)
        }
        if (!merged_headers.has('Accept')) {
            merged_headers.set('Accept', 'application/json')
        }
        if (!merged_headers.has('Content-Type')) {
            merged_headers.set('Content-Type', 'application/json')
        }

        let response: Response
        try {
            response = await fetch(url, { ...init, headers: merged_headers })
        } catch (error) {
            console.error('API Request failed:', error)
            throw error
        }

        if (!response.ok) {
            let error_msg = `HTTP Error ${response.status}`
            try {
                const error_data = await response.json()
                error_msg = error_data?.message || error_data?.detail || error_msg
            } catch { }
            throw new Error(error_msg)
        }

        let result: SoediranApiResponse<T>
        try {
            result = await response.json()
        } catch (json_error) {
            console.error('The server returned an invalid data format:', json_error)
            throw json_error
        }

        if (result.success === false) {
            return {
                success: false,
                data: null,
                error: {
                    message: result.message || result.detail || 'The API returned an unsuccessful status.'
                }
            }
        }

        let finalized_data: T = result.data as T
        if (session.is_encrypted && typeof result.data === 'string' && result.data.length > 0) {
            try {
                const decrypted_string = await decrypt_data(result.data, session.raw_token)
                finalized_data = JSON.parse(decrypted_string) as T
            } catch (decrypt_error) {
                console.error('Decryption failed:', decrypt_error)
                throw decrypt_error
            }
        }

        return {
            success: true,
            data: finalized_data ?? null,
        }
    }

    async get_session(): Promise<ApiSession> {
        const token = localStorage.getItem('_lapp-access_token')
        const isEncrypted = localStorage.getItem('_lapp-https_encrypt') === 'true'

        if (!token) {
            throw new Error('Session token not found.')
        }

        return {
            raw_token: token,
            auth_token: atob(token),
            is_encrypted: isEncrypted,
        }
    }
}
