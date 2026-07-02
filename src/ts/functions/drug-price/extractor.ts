import { DrugPriceData } from '../../types/functions/drug-price'
import { DrugPriceFunction } from './parent'

interface ExtractedData {
    id: string
    name: string
    unit_price: number
}

export class DrugPriceExtractor {
    private has_new_data: boolean = false
    private new_price_data: DrugPriceData = {}
    private BRACKETED_ID_NAME_REGEXP = /^\[\s*(\d+)\s*\]\s*-\s*(.+)$/

    constructor(
        protected parent: DrugPriceFunction
    ) { }

    extract() {
        this.has_new_data = false
        this.new_price_data = this.parent.get_new_price_data()

        this.extract_from_active_pickers()

        if (this.has_new_data) {
            const driver = this.parent.get_new_price_driver()
            driver.data = this.new_price_data
            driver.save()
        }
    }

    private extract_from_active_pickers() {
        const active_pickers = document.querySelectorAll('ul[id^="barang-combo-"][id$="-picker-listEl"]')

        active_pickers.forEach(picker => {
            const product_cards = picker.querySelectorAll('.x-boundlist-item')

            product_cards.forEach(card => {
                const extracted_data: ExtractedData = {
                    id: '',
                    name: '',
                    unit_price: 0,
                }

                const inner_divs = card.querySelectorAll('div')

                const raw_name = inner_divs[0].textContent?.trim() || ''
                const match = raw_name.match(this.BRACKETED_ID_NAME_REGEXP)
                if (!match) return

                extracted_data.id = match[1].trim()
                extracted_data.name = match[2].trim()

                if (!extracted_data.name) return

                for (let i = inner_divs.length - 1; i > 0; i--) {
                    const raw_text = inner_divs[i].textContent?.trim() || ''
                    const sanitized_text = raw_text.replace(/\s+/g, '').toLowerCase()
                    if (sanitized_text.includes('harga')) {
                        const matched_price = sanitized_text.replace(/[^0-9.]/g, '')
                        extracted_data.unit_price = parseFloat(matched_price) || 0
                        break
                    }
                }

                if (extracted_data.unit_price <= 0) return

                const saved_new_price_data = this.new_price_data[extracted_data.name]
                const saved_default_price_data = this.parent.get_db_price_data()[extracted_data.name]
                const current_price_data = saved_new_price_data || saved_default_price_data
                const should_update = !current_price_data ||
                    current_price_data.price !== extracted_data.unit_price

                if (!should_update) return

                this.new_price_data[extracted_data.name] = {
                    ...(saved_new_price_data ?? saved_default_price_data ?? { id: '', capital: 0 }),
                    price: extracted_data.unit_price,
                    id: extracted_data.id,
                }

                this.has_new_data = true
            })
        })
    }
}
