const WORD_CAPITALIZATION_REGEXP = /(?:^|[\s\-\.])\S/g
const TOKEN_SPLIT_REGEXP = /([\s\-\.,]+)/
const SPECIALIST_SUFFIX_REGEXP = /Sp\.([a-zA-Z\-\.]+)/g

export const format_medical_name = (name?: string): string => {
    if (!name) return ''

    const clean_name = name.trim().replace(/\s+/g, ' ')

    // Initial title casing (handles spaces, hyphens, and dots)
    let result = clean_name
        .toLowerCase()
        .replace(WORD_CAPITALIZATION_REGEXP, (match) => match.toUpperCase())

    // Tokenize to handle specific word rules ("dr" and "IGD")
    const tokens = result.split(TOKEN_SPLIT_REGEXP)
    const raw_tokens = clean_name.split(TOKEN_SPLIT_REGEXP) // Pre-split raw for 1:1 index matching

    const formatted_tokens = tokens.map((token, index) => {
        const lower_token = token.toLowerCase()

        if (lower_token === 'igd') {
            return 'IGD'
        }

        if (lower_token === 'dr') {
            const original_token = raw_tokens[index]
            if (original_token === 'dr' || original_token === 'dr.') {
                return 'dr'
            }
            return 'Dr'
        }

        return token
    })

    result = formatted_tokens.join('')

    // Force uppercase on everything following "Sp."
    return result.replace(SPECIALIST_SUFFIX_REGEXP, (match, suffix) => {
        return 'Sp.' + suffix.toUpperCase()
    })
}
