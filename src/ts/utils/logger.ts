class Logger {
    private prefix: string
    private is_prod: boolean

    constructor(prefix = '[Satin]') {
        this.prefix = prefix
        this.is_prod = __PROD__
    }

    log(message: string, ...optional_params: any[]): void {
        if (this.is_prod) return
        console.log(this.prefix, message, ...optional_params)
    }

    warn(message: string, ...optional_params: any[]): void {
        if (this.is_prod) return
        console.warn(this.prefix, message, ...optional_params)
    }

    error(message: string, ...optional_params: any[]): void {
        console.error(this.prefix, message, ...optional_params)
    }

    table(tabular_data: any, properties?: string[]): void {
        if (this.is_prod) return
        console.table(tabular_data, properties)
    }
}

export const Log = new Logger()
