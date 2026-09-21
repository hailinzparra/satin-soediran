export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info'

interface ToastConfig {
    variant_class: string
    icon: string
}

class ToastManager {
    public readonly type: Record<ToastType, ToastType> = {
        default: 'default',
        success: 'success',
        error: 'error',
        warning: 'warning',
        info: 'info',
    }

    private readonly configs: Record<ToastType, ToastConfig> = {
        default: {
            variant_class: 'satin-toast--default',
            icon: '',
        },
        success: {
            variant_class: 'satin-toast--success',
            icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
        },
        error: {
            variant_class: 'satin-toast--error',
            icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
        },
        warning: {
            variant_class: 'satin-toast--warning',
            icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
        },
        info: {
            variant_class: 'satin-toast--info',
            icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>',
        },
    }

    public pop(message: string, type: ToastType = 'default'): void {
        let container = document.getElementById('satin-toast-container')
        if (!container) {
            container = document.createElement('div')
            container.id = 'satin-toast-container'
            document.body.appendChild(container)
        }

        const config = this.configs[type] || this.configs.default
        const toast = document.createElement('div')

        toast.setAttribute('role', 'alert')
        toast.setAttribute('aria-live', 'polite')
        toast.className = `satin-toast ${config.variant_class}`

        toast.style.transform = 'translateX(-100%)'
        toast.style.opacity = '0'

        const icon_html = config.icon ? config.icon : ''
        toast.innerHTML = `${icon_html}<span>${message}</span>`

        container.appendChild(toast)

        setTimeout(() => {
            toast.style.transform = 'translateX(0)'
            toast.style.opacity = '1'
        }, 50)

        setTimeout(() => {
            toast.style.transitionDuration = '500ms'
            toast.style.opacity = '0'
            toast.addEventListener(
                'transitionend',
                () => {
                    toast.remove()
                    if (container && container.children.length === 0) {
                        container.remove()
                    }
                },
                { once: true }
            )
        }, 3000)
    }
}

export const Toast = new ToastManager()
