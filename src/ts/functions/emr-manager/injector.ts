import { SatinBaseFunctionInjector, SatinBaseFunctionTargetNode } from '../../types/functions/base'
import { EMRManagerConfig } from '../../types/functions/emr-manager'
import { EMRManagerFunction } from './parent'

export class EMRManagerInjector extends SatinBaseFunctionInjector<EMRManagerFunction, EMRManagerConfig> {
    public async on_execute(): Promise<void> {
    }

    public reset(target_node?: SatinBaseFunctionTargetNode): void {
    }
}
