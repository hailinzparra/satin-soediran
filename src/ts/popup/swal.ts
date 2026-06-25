import { SatinPopupEngine } from '../popup'

export class PopupSwal {
    main: typeof Swal
    base_classes = {
        popup: 'rounded-xl bg-white p-6 shadow-xl border border-gray-100',
        actions: 'flex flex-wrap items-center justify-end w-full mt-6 gap-2 pt-4',
        denyButton: 'inline-flex justify-center rounded-md bg-red-600 px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-sm hover:bg-red-500 transition ease-in-out duration-150 order-1 sm:mr-auto cursor-pointer',
        confirmButton: 'inline-flex justify-center rounded-md bg-blue-600 px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition ease-in-out duration-150 order-2 cursor-pointer',
        cancelButton: 'inline-flex justify-center rounded-md bg-white px-2.5 py-1.5 text-[10px] font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition ease-in-out duration-150 order-3 cursor-pointer',
    }
    private engine: SatinPopupEngine
    constructor(engine: SatinPopupEngine) {
        this.engine = engine
        this.main = Swal.mixin({
            target: this.engine.main_container,
            cancelButtonText: 'Tutup',
            showCloseButton: true,
            buttonsStyling: false,
            customClass: this.base_classes,
        })
    }
    fire_success_short(title: string = 'Berhasil!') {
        this.main.fire({
            icon: 'success',
            title: title,
            showCloseButton: false,
            showConfirmButton: false,
            timer: 1000,
            timerProgressBar: true,
        })
    }
    fire_fatal_error(title: string, pre_message: string, err: any) {
        console.error(`${title}:`, err)
        let full_error_payload = ''
        if (err instanceof Error) {
            full_error_payload = err.stack || err.message
        } else if (typeof err === 'object' && err !== null) {
            try {
                full_error_payload = JSON.stringify(err, null, 2)
            } catch (_) {
                full_error_payload = String(err)
            }
        } else {
            full_error_payload = String(err)
        }
        const escape_html = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        return this.main.fire({
            icon: 'error',
            title: title,
            html: `<p class="mb-3 text-sm font-medium text-slate-700">${pre_message}</p>
                <div class="w-full max-h-60 overflow-y-auto overflow-x-auto bg-slate-900 text-rose-400 p-3 rounded-md border border-slate-800 font-mono text-[11px] leading-relaxed whitespace-pre">
                ${escape_html(full_error_payload)}</div>`,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showCloseButton: false,
        })
    }
}
