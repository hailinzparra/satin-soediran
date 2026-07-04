import { SatinDriver, SatinDriversContainer } from '../driver'
import { SatinSettingsData } from '../settings'
import { SatinCoreFunction } from './core'

export type SatinBaseFunctionTargetNode = HTMLElement | Document

export interface SatinBaseFunctionConfigSelectors {
    ids?: Record<string, ((...args: any[]) => string)>
    classes?: Record<string, string>
    queries?: Record<string, string>
}

export interface SatinBaseFunctionConfigData {
    extracted_data: Record<string, any>
    values_to_render: Record<string, any>
    new_data: Record<string, any>
}

export interface SatinBaseFunctionConfig {
    primary_settings_key: keyof SatinSettingsData
    primary_driver_key: SatinDriver
    selectors: SatinBaseFunctionConfigSelectors
    data: SatinBaseFunctionConfigData
}

export abstract class SatinBaseFunctionProcessor<P extends SatinBaseFunction<any, any, any>, C extends SatinBaseFunctionConfig> {
    public has_new_data: boolean = false
    public extracted_data: C['data']['new_data'] = {} as any
    public values_to_render: C['data']['new_data'] = {} as any
    public new_data: C['data']['new_data'] = {} as any
    public saved_data: SatinDriversContainer[C['primary_driver_key']]['data'] = {} as any

    constructor(protected parent: P) { }

    abstract on_execute(): Promise<void>

    public async execute(): Promise<void> {
        this.has_new_data = false

        const default_data = this.parent.get_default_data()
        this.extracted_data = default_data.extracted_data
        this.values_to_render = default_data.values_to_render
        this.new_data = default_data.new_data
        this.saved_data = this.parent.get_saved_data()

        await this.on_execute()

        if (this.has_new_data) {
            await this.parent.update_driver_data(this.new_data)
        }
    }
}

export abstract class SatinBaseFunctionExtractor<P extends SatinBaseFunction<any, any, any>, C extends SatinBaseFunctionConfig> extends SatinBaseFunctionProcessor<P, C> {
    public abstract override on_execute(): Promise<void>
}

export abstract class SatinBaseFunctionInjector<P extends SatinBaseFunction<any, any, any>, C extends SatinBaseFunctionConfig> extends SatinBaseFunctionProcessor<P, C> {
    public abstract override on_execute(): Promise<void>
    public abstract reset(target_node?: SatinBaseFunctionTargetNode): void
}

export abstract class SatinBaseFunction<
    C extends SatinBaseFunctionConfig,
    ExtractorType extends SatinBaseFunctionExtractor<any, C> = SatinBaseFunctionExtractor<any, C>,
    InjectorType extends SatinBaseFunctionInjector<any, C> = SatinBaseFunctionInjector<any, C>
> extends SatinCoreFunction {
    public abstract extractor: ExtractorType
    public abstract injector: InjectorType
    public abstract config: C

    public get_driver(): SatinDriversContainer[C['primary_driver_key']] {
        const driver_key = this.config.primary_driver_key
        return this.engine.drivers[driver_key] as SatinDriversContainer[C['primary_driver_key']]
    }

    public async update_driver_data(new_data: C['data']['new_data']): Promise<void> {
        const driver = this.get_driver()
        if (driver) {
            await driver.update(new_data)
        }
    }

    abstract get_default_data(): C['data']

    public get_saved_data(): SatinDriversContainer[C['primary_driver_key']]['data'] {
        return this.get_driver().data
    }

    public get_is_feature_enabled(): boolean {
        return this.engine.get_settings()[this.config.primary_settings_key] === true
    }

    apply() {
        if (this.get_is_feature_enabled()) {
            this.execute()
        } else {
            this.reset()
        }
    }

    execute() {
        this.extractor.execute()
        this.injector.execute()
    }

    reset() {
        this.injector.reset()
    }
}
