import { Log } from './logger'

export type StorageType = 'local' | 'session'

export class VaultDriver<T extends Record<string, any> = Record<string, any>> {
    public key: string
    public data: T
    private default_data: T
    private storage: chrome.storage.StorageArea
    public is_session: boolean = false
    public is_initialized: Promise<void>

    constructor(key: string, default_data: T = {} as T, storage_type: StorageType = 'local') {
        this.key = key
        this.data = { ...default_data }
        this.default_data = default_data
        this.storage = /* storage_type === 'session' ? chrome.storage.session : */ chrome.storage.local

        if (storage_type === 'session') {
            this.is_session = true
            this.is_initialized = this.save().then(() => {
                Log.log(`Session vault reset successfully: ${key}`)
            })
        } else {
            this.is_initialized = this.load().then(() => {
                Log.log(`Local vault initialized successfully: ${key}`)
            })
        }
    }

    async update(new_data: Partial<T>, check_duplicate = false): Promise<void> {
        if (check_duplicate) {
            const is_duplicate = Object.keys(new_data).every(
                (key) => this.data[key as keyof T] === new_data[key as keyof T]
            )
            if (is_duplicate) return
        }
        this.data = { ...this.data, ...new_data }
        await this.save()
    }

    async save(): Promise<void> {
        try {
            await this.storage.set({ [this.key]: this.data })
        } catch (err) {
            Log.error(`Failed to save ${this.key}:`, err)
            throw err
        }
    }

    async load(): Promise<T> {
        try {
            const result = await this.storage.get(this.key)
            if (result && result[this.key]) {
                this.data = { ...this.default_data, ...(result[this.key] as Record<string, any>) }
            }
            return this.data
        } catch (err) {
            Log.error(`Failed to load ${this.key}:`, err)
            throw err
        }
    }

    async reset(): Promise<void> {
        this.data = { ...this.default_data }
        await this.save()
    }
}
