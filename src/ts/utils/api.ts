export class RequestPayloadBuilder<T extends Record<string, any>> {
    private initial_state: Partial<T>
    public current_params: Partial<T>

    constructor(default_params: Partial<T> = {}) {
        this.initial_state = { ...default_params }
        this.current_params = { ...default_params }
    }

    update(fields: Partial<T>): this {
        Object.assign(this.current_params, fields)
        return this
    }

    reset(): this {
        this.current_params = { ...this.initial_state }
        return this
    }

    to_query_string(include_cache_buster: boolean = true): string {
        let params_to_send: Record<string, any> = {}

        if (include_cache_buster) {
            params_to_send._dc = Date.now()
        }

        const { _dc, ...rest_params } = this.current_params
        params_to_send = { ...params_to_send, ...rest_params }

        const search_params = new URLSearchParams()

        for (const [key, value] of Object.entries(params_to_send)) {
            if (value === null || value === undefined || value === '') {
                continue
            }
            if (typeof value === 'object') {
                search_params.append(key, JSON.stringify(value))
            } else {
                search_params.append(key, String(value))
            }
        }

        return search_params.toString()
    }
}
