export const sleep = (ms: number): Promise<any> => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export const title_case_name = (name: string | undefined): string => {
    if (!name) return ''
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/(?:^|[\s\-])\S/g, (match) => match.toUpperCase())
}

export const clean_and_format_gelar = (title: string | undefined, is_gelar_depan: boolean): string => {
    if (!title) return ''

    let cleaned = title
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\.+/g, '.')
        .replace(/,+$/, '')

    let result = ''

    if (is_gelar_depan) {
        const tokens = cleaned.split(' ')
        const formatted_tokens = tokens.map(token => {
            const lower_token = token.toLowerCase()
            if (lower_token === 'dr' || lower_token === 'dr.') {
                return 'dr.'
            }
            return token.toLowerCase().replace(/(?:^|[\s\-])\S/g, (match) => match.toUpperCase())
        })
        result = formatted_tokens.join(' ')
        if (result && !result.endsWith('.')) result += '.'
        result = result.replace(/\.+$/, '.')
    } else {
        result = cleaned
        result = result.replace(/,(?!\s)/g, ', ')
        result = result.replace(/\s+/g, ' ')
    }

    return result.replace(/\.+/g, '.')
}

export const format_fullname = (
    raw_name: string | undefined,
    gelar_depan: string | undefined,
    gelar_belakang: string | undefined,
): string => {
    const clean_name = title_case_name(raw_name)
    if (!clean_name) return ''

    const depan = clean_and_format_gelar(gelar_depan, true)
    const belakang = clean_and_format_gelar(gelar_belakang, false)

    const name_parts: string[] = []
    if (depan) name_parts.push(depan)
    name_parts.push(clean_name)

    let fullname = name_parts.join(' ')
    if (belakang) {
        fullname += `, ${belakang}`
    }

    return fullname
}
