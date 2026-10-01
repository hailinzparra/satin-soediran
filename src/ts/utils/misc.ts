export const sleep = (ms: number): Promise<any> => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function get_current_date_time(): string {
    const now = new Date()
    const pad = (num: number) => String(num).padStart(2, '0')

    const year = now.getFullYear()
    const month = pad(now.getMonth() + 1)
    const day = pad(now.getDate())
    const hours = pad(now.getHours())
    const minutes = pad(now.getMinutes())
    const seconds = pad(now.getSeconds())

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function irandom(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function copy_text(text: string): Promise<boolean> {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text)
            return true
        } catch (err) {
            // Fall back if writeText fails/permission denied
        }
    }

    // Fallback for HTTP / non-secure contexts
    const text_area = document.createElement('textarea')
    text_area.value = text
    text_area.style.position = 'fixed'
    text_area.style.left = '-999999px'
    text_area.style.top = '-999999px'
    document.body.appendChild(text_area)

    text_area.focus()
    text_area.select()

    let success = false
    try {
        success = document.execCommand('copy')
    } catch (err) {
        success = false
    }

    document.body.removeChild(text_area)
    return success
}
