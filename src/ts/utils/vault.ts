import { Log } from './logger'

export type StorageType = 'local' | 'session' | 'memory'

export class VaultDriver<T extends Record<string, any> = Record<string, any>> {
    public key: string
    public data: T
    private default_data: T
    private storage: chrome.storage.StorageArea | null = null
    public is_session: boolean = false
    public is_memory: boolean = false
    public is_initialized: Promise<void>

    constructor(key: string, default_data: T = {} as T, storage_type: StorageType = 'local') {
        this.key = key
        this.data = { ...default_data }
        this.default_data = default_data

        if (storage_type === 'session') {
            this.storage = chrome.storage.local //chrome.storage.session doesnt work somehow
            this.is_session = true
            this.is_initialized = this.save().then(() => {
                Log.log(`Session vault reset successfully: ${key}`)
            })
        } else if (storage_type === 'memory') {
            this.storage = null
            this.is_memory = true
            this.is_initialized = Promise.resolve().then(() => {
                Log.log(`Memory vault initialized successfully (runtime only): ${key}`)
            })
        } else {
            this.storage = chrome.storage.local
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

        if (!this.is_memory) {
            await this.save()
        }
    }

    async save(): Promise<void> {
        if (this.is_memory || !this.storage) return

        try {
            await this.storage.set({ [this.key]: this.data })
        } catch (err) {
            Log.error(`Failed to save ${this.key}:`, err)
            throw err
        }
    }

    async load(): Promise<T> {
        if (this.is_memory || !this.storage) return this.data

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

        if (!this.is_memory) {
            await this.save()
        }
    }
}
