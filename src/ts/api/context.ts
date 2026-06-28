import { ExtensionDriver, ExtensionEvent } from '../types'
import { VaultDriver } from '../utils'
import { ApiDriver, DEFAULT_EXTENSION_API_SESSION, ApiSession, ApiResponseWrapper, ApiRequestOptions } from './api-types'

export class ApiContextManager {
    session: VaultDriver<ApiSession>
    active_driver: ApiDriver

    constructor(starting_driver: ApiDriver) {
        this.session = new VaultDriver<ApiSession>(ExtensionDriver.Session, DEFAULT_EXTENSION_API_SESSION)
        this.active_driver = starting_driver
    }

    get_origin_domain(): string {
        return location.origin
    }

    bind_events(): void {
        window.addEventListener(ExtensionEvent.SessionRefreshed, ev => {
            this.sync_session()
        })
    }

    async sync_session(): Promise<any> {
        try {
            const session = await this.active_driver.get_session()
            await this.session.update({ ...session }, true)
        } catch (error) {
            console.error('Failed to sync session:', error)
            throw error
        }
    }

    build_url(options: ApiRequestOptions): string {
        const domain = options.domain || this.get_origin_domain()
        const query_string = options.payload.to_query_string()
        return `${domain}${this.active_driver.config.paths.api}${options.base_path}?${query_string}`
    }

    prepare_request(options: ApiRequestOptions) {
        const driver = this.active_driver
        const session = this.session.data
        const url = this.build_url(options)
        return { driver, session, url }
    }

    async api_request<T = any>(options: ApiRequestOptions): Promise<ApiResponseWrapper<T>> {
        const { driver, session, url } = this.prepare_request(options)
        try {
            const result = await driver.api_request<T>(session, url)
            return result
        } catch (err) {
            console.error(`Failed to request data:`, err)
            throw err
        }
    }
}
