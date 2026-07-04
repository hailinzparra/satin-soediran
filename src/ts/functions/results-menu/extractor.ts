import { SatinBaseFunctionExtractor } from '../../types/functions/base'
import { ResultsMenuConfig } from '../../types/functions/results-menu'
import { ResultsMenuFunction } from './parent'

export class ResultsMenuExtractor extends SatinBaseFunctionExtractor<ResultsMenuFunction, ResultsMenuConfig> {
    public async on_execute(): Promise<void> {
    }
}
