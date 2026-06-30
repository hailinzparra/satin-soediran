export interface DrugPriceItem {
    id: string
    price: number
    capital?: number
}

export interface DrugPriceData {
    [drug_name: string]: DrugPriceItem
}
