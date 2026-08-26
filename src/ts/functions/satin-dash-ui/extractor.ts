import { SatinBaseFunctionExtractor } from '../../types/functions/base'
import { SatinDashUIConfig } from '../../types/functions/satin-dash-ui'
import { SatinDashUIFunction } from './parent'

export class SatinDashUIExtractor extends SatinBaseFunctionExtractor<SatinDashUIFunction, SatinDashUIConfig> {
    public async on_execute(): Promise<void> {
    }
}
