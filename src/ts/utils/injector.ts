import { Log } from './logger'

export const inject_css = (file_path: string, element_id?: string) => {
    try {
        if (element_id && document.getElementById(element_id)) {
            return
        }

        const link = document.createElement('link')
        if (element_id) link.id = element_id

        link.rel = 'stylesheet'
        link.type = 'text/css'
        link.href = chrome.runtime.getURL(file_path)

        link.onload = () => {
            Log.log(`css successfully injected: ${file_path}`)
        }

        link.onerror = (err) => {
            Log.error(`failed to load css file: ${file_path}`, err)
        }

        const target = document.head || document.documentElement
        if (target) {
            target.append(link)
        } else {
            Log.error('inject css: neither document.head nor document.documentElement found.')
        }
    } catch (err) {
        Log.error('css injection failed:', err)
    }
}

export const inject_script = (file_path: string, element_id?: string) => {
    try {
        if (element_id && document.getElementById(element_id)) {
            return
        }

        const script = document.createElement('script')
        if (element_id) script.id = element_id

        script.src = chrome.runtime.getURL(file_path)
        script.type = 'text/javascript'

        script.onload = (event: Event) => {
            Log.log(`script successfully injected: ${file_path}`)
            const target_script = event.target as HTMLScriptElement
            target_script.remove()
        }

        const target = document.head || document.documentElement
        if (target) {
            target.append(script)
        } else {
            Log.error('inject script: neither document.head nor document.documentElement found.')
        }
    } catch (err) {
        Log.error('script injection failed:', err)
    }
}
