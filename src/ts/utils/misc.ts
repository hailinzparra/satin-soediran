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
