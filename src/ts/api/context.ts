import { SatinEngine } from '../engine/base'
import { BaseApiDriver, BaseApiRequestOptions, BaseApiResponse } from '../types/api/base'
import { Log } from '../utils/logger'

export class SatinApiContext {
    engine: SatinEngine
    active_driver: BaseApiDriver

    constructor(engine: SatinEngine, starting_driver: BaseApiDriver) {
        this.engine = engine
        this.active_driver = starting_driver
    }

    get_origin_domain(): string {
        return location.origin
    }

    build_url(options: BaseApiRequestOptions): string {
        const domain = options.domain || this.get_origin_domain()
        const query_string = options.payload.to_query_string()
        return `${domain}${this.active_driver.config.paths.api}${options.base_path}?${query_string}`
    }

    prepare_request(options: BaseApiRequestOptions) {
        const driver = this.active_driver
        const session = this.engine.get_session()
        const url = this.build_url(options)
        return { driver, session, url }
    }

    async api_request<T = any>(options: BaseApiRequestOptions): Promise<BaseApiResponse<T>> {
        const { driver, session, url } = this.prepare_request(options)
        try {
            const result = await driver.api_request<T>(session, url)
            return result
        } catch (err) {
            Log.error(`Failed to request data:`, err)
            throw err
        }
    }
}
