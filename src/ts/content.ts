import { ExtensionEvent, KunjunganResponse } from './types'
import { inject_script } from './utils'

inject_script('assets/js/inject.js')

window.addEventListener(ExtensionEvent.KunjunganFetched, (event) => {
    const custom_event = event as CustomEvent<KunjunganResponse>
    const item = custom_event.detail.data[0]

    console.log(item.NOMOR)
})

console.log('Satin initialized.')
