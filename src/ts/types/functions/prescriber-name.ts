import { BaseApiResponse } from '../api/base'
import { SoediranDataKunjungan, SoediranDataOrderResep } from '../api/soediran/data'

export interface PrescriberNameItem {
    id: string
    date: string
    is_cito: boolean
    prescriber_name: string
}

export interface PrescriberNameData {
    [id: string]: PrescriberNameItem
}

export type PrescriberNameResponse = BaseApiResponse<Array<SoediranDataKunjungan> | Array<SoediranDataOrderResep>>
