import { DB_SOEDIRAN_DATABASE } from '../data/db-soediran'
import { SatinEngine } from '../engine/base'
import { BaseApiDriver, BaseApiResponse, SatinSessionData } from '../types/api/base'
import { SoediranApiResponse, SoediranEvent } from '../types/api/soediran/base'
import { Log } from '../utils/logger'
import { decrypt_data } from '../utils/soediran-decrypt'

export class SoediranApiDriver extends BaseApiDriver {
    constructor(engine: SatinEngine) {
        super(engine, {
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
        this.bind_events()
    }

    bind_events(): void {
        window.addEventListener(SoediranEvent.SessionRefreshed, () => {
            this.sync_session()
        })
    }

    async sync_session(): Promise<any> {
        try {
            const new_session = await this.get_session()
            await this.engine.get_session_driver().update({ ...new_session }, true)
        } catch (err) {
            Log.error('Failed to sync session:', err)
            throw err
        }
    }

    async api_request<T = any>(session: SatinSessionData | null, url: string, init?: RequestInit): Promise<BaseApiResponse<T>> {
        const merged_headers = new Headers(init?.headers)

        if (session?.auth_token && !merged_headers.has('Authorization')) {
            merged_headers.set('Authorization', `Bearer ${session.auth_token}`)
        }

        if (!merged_headers.has('Accept')) {
            merged_headers.set('Accept', '*/*')
            // merged_headers.set('Accept', 'application/json')
        }

        // if (!merged_headers.has('Content-Type')) {
        //     merged_headers.set('Content-Type', 'application/json')
        // }

        let response: Response
        try {
            response = await fetch(url, { ...init, headers: merged_headers })
        } catch (error) {
            Log.error('API Request failed:', error)
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
            Log.error('The server returned an invalid data format:', json_error)
            throw json_error
        }

        if (result.success === false) {
            return {
                success: false,
                data: null,
                status: result.status,
                error: {
                    message: result.message || result.detail || 'The API returned an unsuccessful status.'
                }
            }
        }

        let finalized_data: T = result.data as T

        if (session?.is_encrypted && typeof result.data === 'string' && result.data.length > 0) {
            try {
                const decrypted_string = await decrypt_data(result.data, session.raw_token)
                finalized_data = JSON.parse(decrypted_string) as T
            } catch (decrypt_error) {
                Log.error('Decryption failed:', decrypt_error)
                throw decrypt_error
            }
        }

        return {
            success: true,
            data: finalized_data ?? null,
            total: result.total,
        }
    }

    async get_session(): Promise<SatinSessionData | null> {
        const token = localStorage.getItem('_lapp-access_token')
        const is_encrypted = localStorage.getItem('_lapp-https_encrypt') === 'true'

        if (!token) {
            return null
        }

        return {
            raw_token: token,
            auth_token: atob(token),
            is_encrypted: is_encrypted,
        }
    }
}
