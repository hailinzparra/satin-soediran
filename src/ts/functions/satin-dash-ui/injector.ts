import { SatinBaseFunctionInjector, SatinBaseFunctionTargetNode } from '../../types/functions/base'
import { SatinDashUIConfig } from '../../types/functions/satin-dash-ui'
import { SatinDashUIFunction } from './parent'

export class SatinDashUIInjector extends SatinBaseFunctionInjector<SatinDashUIFunction, SatinDashUIConfig> {
    public async on_execute(): Promise<void> {
    }

    public reset(target_node?: SatinBaseFunctionTargetNode): void {
    }
}
