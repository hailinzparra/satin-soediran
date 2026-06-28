import { ExtensionDriver, ExtensionEvent } from '../types'
import { VaultDriver } from '../utils'
import { ApiDriver, DEFAULT_EXTENSION_API_SESSION, ApiSession } from './api-types'

export class ApiContextManager {
    session: VaultDriver<ApiSession>
    active_driver: ApiDriver

    constructor(starting_driver: ApiDriver) {
        this.session = new VaultDriver<ApiSession>(ExtensionDriver.Session, DEFAULT_EXTENSION_API_SESSION)
        this.active_driver = starting_driver
    }

    bind_events(): void {
        window.addEventListener(ExtensionEvent.SessionRefreshed, ev => {
            this.sync_session()
        })
    }

    async sync_session(): Promise<any> {
        try {
            const session = await this.active_driver.get_session()
            await this.session.update({ ...session })
        } catch (error) {
            console.error('Failed to sync session:', error)
            throw error
        }
    }
}
