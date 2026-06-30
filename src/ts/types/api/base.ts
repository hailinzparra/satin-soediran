import { SatinEngine } from '../../engine/base'
import { RequestPayloadBuilder } from '../../utils/api'

export interface SatinSessionData {
    raw_token: string
    auth_token: string
    is_encrypted: boolean
}

export interface BaseApiDatabase {
    users: { [id: string]: { name: string } }
    rooms: { [id: string]: { name: string } }
}

export interface BaseApiConfig {
    id: number
    name: string
    sys_name: string
    domains: string[]
    paths: {
        api: string
        web_app: string
    }
    database: BaseApiDatabase
}

export interface BaseApiResponse<T> {
    success: boolean
    data: T | null
    status?: number | boolean
    total?: number
    error?: {
        message: string
        code?: string | number
    }
}

export abstract class BaseApiDriver {
    engine: SatinEngine
    config: BaseApiConfig
    constructor(engine: SatinEngine, config: BaseApiConfig) {
        this.engine = engine
        this.config = config
    }

    abstract api_request<T = any>(
        session: SatinSessionData | null,
        url: string,
        init?: RequestInit,
    ): Promise<BaseApiResponse<T>>

    abstract get_session(): Promise<SatinSessionData | null>
}

export type BaseApiRequestOptions = {
    base_path: string
    payload: RequestPayloadBuilder<any>
    domain?: string
}
