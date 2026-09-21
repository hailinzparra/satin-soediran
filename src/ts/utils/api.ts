export class RequestPayloadBuilder<T extends Record<string, any>> {
    private default_params: Partial<T>
    public params: Partial<T>
    public include_cache_buster: boolean

    constructor(default_params: Partial<T> = {}, include_cache_buster: boolean = true) {
        this.default_params = { ...default_params }
        this.params = { ...default_params }
        this.include_cache_buster = include_cache_buster
    }

    update(fields: Partial<T>): this {
        Object.assign(this.params, fields)
        return this
    }

    reset(): this {
        this.params = { ...this.default_params }
        return this
    }

    to_query_string(include_cache_buster: boolean = this.include_cache_buster): string {
        let params_to_send: Record<string, any> = {}

        if (include_cache_buster) {
            params_to_send._dc = Date.now()
        }

        const { _dc, ...rest_params } = this.params
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
