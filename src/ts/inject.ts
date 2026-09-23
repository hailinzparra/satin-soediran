import { start_workspace_bridge } from './inject/bridge'
import { attach_sencha_ajax_interceptor } from './inject/interceptor'
import { Log } from './utils/logger'

// Re-export constants & types so external modules can import from inject cleanly
export * from './inject/types'
export { extract_workspace_patient_summary } from './inject/extractors'

/**
 * Bootstraps ExtJS injection when runtime is ready.
 */
const init = (): void => {
    if (typeof Ext === 'undefined' || !Ext.Ajax) {
        setTimeout(init, 100)
        return
    }

    Log.log('Ext JS detected! Injecting interceptors and workspace bridges...')

    start_workspace_bridge()
    attach_sencha_ajax_interceptor()
}

init()
