import { SatinContentEngine } from '../../engine/content-engine'

export abstract class SatinBaseFunction {
    constructor(
        public engine: SatinContentEngine,
    ) { }
    init?(): void
    bind_events?(): void
    on_debounce?(): void
    abstract apply(): void
}
