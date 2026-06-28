import { RequestPayloadBuilder } from '../utils'

export interface ApiSession {
    raw_token: string
    auth_token: string
    is_encrypted: boolean
}

export const DEFAULT_EXTENSION_API_SESSION: ApiSession = {
    raw_token: '',
    auth_token: '',
    is_encrypted: false,
}

export interface ApiDatabase {
    users: { [id: string]: { name: string } }
    rooms: { [id: string]: { name: string } }
}

export interface ApiConfig {
    id: number
    name: string
    sys_name: string
    domains: string[]
    paths: {
        api: string
        web_app: string
    }
    database: ApiDatabase
}

export interface ApiResponseWrapper<T> {
    success: boolean
    data: T | null
    total?: number
    error?: {
        message: string
        code?: string | number
    }
}

export abstract class ApiDriver {
    config: ApiConfig
    constructor(config: ApiConfig) { this.config = config }
    abstract api_request<T = any>(
        session: ApiSession,
        url: string,
        init?: RequestInit,
    ): Promise<ApiResponseWrapper<T>>
    abstract get_session(): Promise<ApiSession>
}

export type ApiRequestOptions = {
    base_path: string
    payload: RequestPayloadBuilder<any>
    domain?: string
}
