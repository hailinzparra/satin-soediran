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

        if (lower_token === 'icu') {
            return 'ICU'
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

export const format_gender = (gender: 'Male' | 'Female') => {
    let long = '??'
    let short = '?'
    let color = ''
    if (gender === 'Male') {
        long = 'Laki-laki'
        short = 'L'
        color = '#157fcc'
    }
    else if (gender === 'Female') {
        long = 'Perempuan'
        short = 'P'
        color = '#dc2626'
    }
    return { long, short, color }
}

export const format_pt_name = (name: string): string => {
    return name
        .split(' ')
        .map(word => {
            if (!word) return ''

            let lowered = word.toLowerCase()
            let capitalized_word = ''
            let found_first_letter = false

            for (const char of lowered) {
                if (/[a-z]/.test(char) && !found_first_letter) {
                    capitalized_word += char.toUpperCase()
                    found_first_letter = true
                } else {
                    capitalized_word += char
                }
            }

            return capitalized_word.replace(/(-)([a-z])/g, (match, hyphen, letter) => {
                return hyphen + letter.toUpperCase()
            })
        })
        .join(' ')
}

export const format_pt_age = (birth_str: string, target_str?: string): string => {
    const birth = new Date(birth_str)
    const target = target_str ? new Date(target_str) : new Date()
    if (isNaN(birth.getTime()) || isNaN(target.getTime())) return '0th, 0bl, 0hr'

    let years = target.getFullYear() - birth.getFullYear()
    let months = target.getMonth() - birth.getMonth()
    let days = target.getDate() - birth.getDate()

    if (days < 0) {
        months--
        const prev_month = new Date(target.getFullYear(), target.getMonth(), 0)
        days += prev_month.getDate()
    }
    if (months < 0) {
        months += 12
        years--
    }
    return `${years}th, ${months}bl, ${days}hr`
}

export const get_fuzzy_time_yll = (date_str: string): { text: string; is_fresh: boolean } => {
    if (!date_str) return { text: '', is_fresh: false }

    const target_date = new Date(date_str)
    const now = new Date()
    const diff_ms = now.getTime() - target_date.getTime()

    // Fallback if date is invalid or in the future
    if (isNaN(target_date.getTime()) || diff_ms < 0) {
        return { text: '', is_fresh: false }
    }

    const diff_sec = Math.floor(diff_ms / 1000)
    const diff_min = Math.floor(diff_sec / 60)
    const diff_hrs = Math.floor(diff_min / 60)
    const diff_days = Math.floor(diff_hrs / 24)

    // Check if entry is less than 24 hours old
    const is_fresh = diff_hrs < 24

    // Calculate largest unit above 0
    if (diff_days >= 365) {
        const years = Math.floor(diff_days / 365)
        return { text: `${years} tahun yll`, is_fresh }
    }

    if (diff_days >= 30) {
        const months = Math.floor(diff_days / 30)
        return { text: `${months} bulan yll`, is_fresh }
    }

    if (diff_days >= 1) {
        return { text: `${diff_days} hari yll`, is_fresh }
    }

    if (diff_hrs >= 1) {
        return { text: `${diff_hrs} jam yll`, is_fresh }
    }

    if (diff_min >= 1) {
        return { text: `${diff_min} menit yll`, is_fresh }
    }

    const sec = Math.max(1, diff_sec)
    return { text: `${sec} detik yll`, is_fresh }
}
