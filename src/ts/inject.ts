import { ExtensionEvent, UrlRouteFilters } from './types'

const start_sencha_interceptor = (): void => {
    if (typeof Ext === 'undefined' || !Ext.Ajax) {
        setTimeout(start_sencha_interceptor, 100)
        return
    }

    console.log('Ext JS detected! Injecting interceptor...')

    Ext.Ajax.on('requestcomplete', (conn: any, response: { responseText: string }, options: { url?: string }) => {
        try {
            const url = options.url
            if (!url) return

            (Object.keys(UrlRouteFilters) as ExtensionEvent[]).forEach((event_key) => {
                const filter = UrlRouteFilters[event_key]
                if (url.includes(filter)) {
                    const data = JSON.parse(response.responseText)
                    const custom_event = new CustomEvent(event_key, { detail: data })
                    window.dispatchEvent(custom_event)
                }
            })
        } catch (err) {
            console.error('Error parsing Sencha AJAX response:', err)
        }
    })
}

start_sencha_interceptor()
