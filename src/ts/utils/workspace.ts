import {
    SATIN_EXT_PATIENT_DATA_EVENT,
    SATIN_EXT_PATIENT_REQUEST_EVENT,
    PatientSummaryData
} from '../inject'

let cached_patient_summary: PatientSummaryData | null = null
let is_initialized = false

export const init_workspace_listener = (): void => {
    if (is_initialized) return
    is_initialized = true

    window.addEventListener(SATIN_EXT_PATIENT_DATA_EVENT, (event: Event) => {
        const custom_event = event as CustomEvent<PatientSummaryData>
        if (custom_event.detail) {
            cached_patient_summary = custom_event.detail
        }
    })
}

export const get_current_patient_summary = (): PatientSummaryData | null => {
    init_workspace_listener()

    window.dispatchEvent(new CustomEvent(SATIN_EXT_PATIENT_REQUEST_EVENT))

    return cached_patient_summary
}
