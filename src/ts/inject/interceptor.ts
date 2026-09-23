import { SoediranEvent, SoediranUrlRouteFilters } from '../types/api/soediran/base'
import { Log } from '../utils/logger'

/**
 * Extracts payload options from Ext.Ajax request configuration.
 */
export const extract_payload = (options: any): any => {
    if (!options) return null

    if (options.jsonData) {
        return typeof options.jsonData === 'string'
            ? JSON.parse(options.jsonData)
            : options.jsonData
    }

    if (options.rawData) {
        if (typeof options.rawData === 'string') {
            try {
                return JSON.parse(options.rawData)
            } catch {
                return options.rawData
            }
        }
        return options.rawData
    }

    if (options.xmlData) {
        return options.xmlData
    }

    if (options.params) {
        if (typeof options.params === 'string') {
            const parsed_params: Record<string, string> = {}
            new URLSearchParams(options.params).forEach((val, key) => {
                parsed_params[key] = val
            })
            return parsed_params
        }
        return options.params
    }

    return null
}

/**
 * Attaches the global Ext.Ajax requestcomplete listener to broadcast routed API events.
 */
export const attach_sencha_ajax_interceptor = (): void => {
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

            const payload = extract_payload(options);

            (Object.keys(SoediranUrlRouteFilters) as SoediranEvent[]).forEach((event_key) => {
                try {
                    const filter = SoediranUrlRouteFilters[event_key]
                    const is_matched = filter.some((and_group) =>
                        and_group.every((condition) => url.includes(condition))
                    )
                    if (is_matched) {
                        const data = JSON.parse(response.responseText)?.data ?? null
                        const custom_event = new CustomEvent(event_key, { detail: { data, payload } })
                        window.dispatchEvent(custom_event)
                    }
                } catch (err) {
                    Log.error(`Error dispatching event ${event_key}:`, err)
                }
            })
        } catch (err) {
            Log.error('Error parsing Sencha AJAX response:', err)
        }
    })
}
