export const inject_script = (file_path: string): void => {
    try {
        const script = document.createElement('script')
        script.src = chrome.runtime.getURL(file_path)
        script.type = 'text/javascript'
        script.onload = (event: Event) => {
            const target_script = event.target as HTMLScriptElement
            target_script.remove()
        }
        const target = document.head || document.documentElement
        if (target) {
            target.append(script)
        } else {
            console.error('inject script: neither document.head nor document.documentElement found.')
        }
    } catch (error) {
        console.error('script injection failed:', error)
    }
}
