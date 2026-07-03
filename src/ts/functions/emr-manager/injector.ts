import { SatinBaseFunctionInjector, SatinBaseFunctionTargetNode } from '../../types/functions/base'
import { EMRManagerConfig } from '../../types/functions/emr-manager'

export class EMRManagerInjector extends SatinBaseFunctionInjector<EMRManagerConfig> {
    public async on_execute(): Promise<void> {
    }

    public reset(target_node?: SatinBaseFunctionTargetNode): void {
    }
}
