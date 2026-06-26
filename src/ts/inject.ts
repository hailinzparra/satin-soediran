import { ExtensionEvent, UrlRouteFilters } from './types'

const start_sencha_interceptor = (): void => {
    if (typeof Ext === 'undefined' || !Ext.Ajax) {
        setTimeout(start_sencha_interceptor, 100)
        return
    }

    console.log('Ext JS detected! Injecting interceptor...')

    Ext.Ajax.on('requestcomplete', (conn: any, response: { responseText: string }, options: any) => {
        try {
            let url = options.url
            if (!url) return

            if (options.params) {
                const query_params = new URLSearchParams()
                if (typeof options.params === 'object') {
                    Object.entries(options.params).forEach(([key, value]) => {
                        query_params.append(key, String(value))
                    })
                } else if (typeof options.params === 'string') {
                    options.params.split('&').forEach((p: string) => {
                        const [k, v] = p.split('=')
                        if (k) query_params.append(k, v || '')
                    })
                }
                const query_string = query_params.toString()
                if (query_string) {
                    url += (url.includes('?') ? '&' : '?') + query_string
                }
            }

            (Object.keys(UrlRouteFilters) as ExtensionEvent[]).forEach((event_key) => {
                try {
                    const filter = UrlRouteFilters[event_key]
                    const is_matched = filter.some(and_group =>
                        and_group.every(condition => url.includes(condition))
                    )
                    if (is_matched) {
                        const data = JSON.parse(response.responseText)
                        const custom_event = new CustomEvent(event_key, { detail: data })
                        window.dispatchEvent(custom_event)
                    }
                }
                catch (err) {
                    console.error(`Error dispatching event ${event_key}:`, err)
                }
            })
        } catch (err) {
            console.error('Error parsing Sencha AJAX response:', err)
        }
    })
}

start_sencha_interceptor()
