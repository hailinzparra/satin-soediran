export const inject_script = (file_path: string): void => {
    try {
        const script = document.createElement('script')
        script.src = chrome.runtime.getURL(file_path)
        script.type = 'text/javascript'
        script.onload = (event: Event) => {
            const target_script = event.target as HTMLScriptElement
            target_script.remove()
        }
        const target = document.head || document.documentElement
        if (target) {
            target.append(script)
        } else {
            console.error('inject script: neither document.head nor document.documentElement found.')
        }
    } catch (error) {
        console.error('script injection failed:', error)
    }
}

export class VaultDriver<T extends Record<string, any> = Record<string, any>> {
    public key: string
    public data: T
    constructor(key: string, default_data: T = {} as T) {
        this.key = key
        this.data = default_data
    }
    async update(new_data: Partial<T>): Promise<void> {
        this.data = { ...this.data, ...new_data }
        await this.save()
    }
    async save(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            chrome.storage.local.set({ [this.key]: this.data }, () => {
                if (chrome.runtime.lastError) {
                    console.error(`Failed to save ${this.key}:`, chrome.runtime.lastError)
                    reject(chrome.runtime.lastError)
                } else {
                    resolve()
                }
            })
        })
    }
    async load(): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            chrome.storage.local.get(this.key, (result) => {
                if (chrome.runtime.lastError) {
                    console.error(`Failed to load ${this.key}:`, chrome.runtime.lastError)
                    reject(chrome.runtime.lastError)
                } else {
                    if (result && result[this.key]) {
                        this.data = { ...this.data, ...(result[this.key] as Record<string, any>) }
                    }
                    resolve(this.data)
                }
            })
        })
    }
}
