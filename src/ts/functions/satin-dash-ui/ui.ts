import { SatinDashUIVisit } from '../../types/functions/satin-dash-ui'
import { create_element } from '../../utils/dom'

const c = create_element

const create_svg_icon = (path_d: string, view_box = '0 0 24 24', stroke_width = '2.5') => {
    return c('svg', {
        classes: 'icon',
        attrs: { fill: 'none', stroke: 'currentColor', viewBox: view_box }
    }, [
        c('path', {
            attrs: {
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
                'stroke-width': stroke_width,
                d: path_d
            }
        })
    ])
}

export const get_age_metrics = (dob: string) => {
    if (!dob) return null
    try {
        const birthDate = new Date(dob)
        const today = new Date()
        if (isNaN(birthDate.getTime())) return null

        let years = today.getFullYear() - birthDate.getFullYear()
        let months = today.getMonth() - birthDate.getMonth()
        let days = today.getDate() - birthDate.getDate()

        if (days < 0) {
            const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
            days += prevMonth.getDate()
            months--
        }
        if (months < 0) {
            months += 12
            years--
        }

        return { y: Math.max(0, years), m: Math.max(0, months), d: Math.max(0, days) }
    } catch (e) {
        return null
    }
}

export const get_los_metrics = (adm_date?: string | null, dis_date?: string | null) => {
    if (!adm_date) return null
    try {
        const start = new Date(adm_date)
        const is_discharged = !!dis_date
        const end = is_discharged ? new Date(dis_date) : new Date()

        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null

        const total_milliseconds = end.getTime() - start.getTime()

        if (total_milliseconds < 0) return { d: 0, h: 0, is_discharged }

        const total_hours = Math.floor(total_milliseconds / (1000 * 60 * 60))
        const days = Math.floor(total_hours / 24)
        const hours = total_hours % 24

        return { d: days, h: hours, is_discharged }
    } catch (e) {
        return null
    }
}

export const format_date_variants = (date_input: Date | string) => {
    if (!date_input) {
        return { short: '--', long: '--', time: '--', longtime: '--' }
    }
    const date = date_input instanceof Date ? date_input : new Date(date_input)
    if (isNaN(date.getTime())) {
        return { short: '--', long: '--', time: '--', longtime: '--' }
    }
    const long = date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
    const short = long.replace(/\s\d{4}$/, '')
    const time = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })
    const longtime = (long && time) ? `${long} ${time}` : '--'
    return { short, long, time, longtime }
}

export const build_patient_card = (visit: SatinDashUIVisit) => {
    let age = '??y'
    const age_obj = get_age_metrics(visit.patient.birthdate)
    if (age_obj) {
        age = `${age_obj.y}y, ${age_obj.m}m, ${age_obj.d}d`
    }

    let los = { text: '??', is_fresh: false }
    const los_obj = get_los_metrics(visit.admission_date, visit.discharge_date)
    if (los_obj) {
        const text = `${los_obj.d}d ${los_obj.h}h`
        const hours_total = (los_obj.d * 24) + los_obj.h
        const is_fresh = hours_total < 24 && !los_obj.is_discharged
        los = { text, is_fresh }
    }

    // Bed Info Box
    const bed_info = c('div', { classes: `bed-info${los.is_fresh ? ' is-fresh' : ''}` }, [
        c('span', { classes: 'bed-info__label', text: 'Bed' }),
        c('span', { classes: 'bed-info__code', text: visit.room.bed_name }),
        c('div', { classes: 'bed-info__divider' }, [
            c('span', { classes: 'los-text', text: los.text })
        ])
    ])

    // Patient Info Box
    const patient_info = c('div', { classes: 'patient-info' }, [
        c('h5', { classes: 'patient-info__name' }, [
            c('span', { classes: 'mrn', text: `${visit.patient.mrn ? `${visit.patient.mrn} / ` : ''}` }),
            c('span', { classes: visit.patient.gender_id === '2' ? 'gender-female' : 'gender-male', text: `(${visit.patient.gender_id === '2' ? 'P' : 'L'}) ` }),
            // c('span', { classes: 'separator', text: ' | ' }),
            visit.patient.name,
            c('span', { classes: 'mrn', text: ` / ${age}` }),
        ]),
        c('p', { classes: 'patient-info__meta', text: `Ruangan: ${visit.room.name} / Bed: ${visit.room.bed_name} / NOREG: ${visit.registration.id} / NOPEN: ${visit.id}` }),
        c('p', { classes: 'patient-info__meta', text: `Alamat: ${visit.patient.address ?? '??'} / TTL: ${visit.patient.birthplace}, ${format_date_variants(visit.patient.birthdate).long} / ABO: ${visit.patient.blood_type}` }),
        c('p', { classes: 'patient-info__meta', text: `Penjamin: ${visit.patient.insurance.type ?? '??'} / ${visit.patient.insurance.membership.id ?? '??'} [Kls. ${visit.patient.insurance.class ?? '??'} - SEP. ${visit.patient.insurance.sep_id ?? '??'}]` }),
        c('p', { classes: 'patient-info__meta', text: `PRB: ${visit.patient.insurance.membership.prb_desc ?? '??'} [${visit.patient.insurance.membership.provider ?? '??'}]` }),
        c('p', { classes: 'patient-info__doctor', text: `DPJP: ${visit.dpjp.name}` }),
        c('p', { classes: 'patient-info__diagnosis', text: 'Dx: ' + (visit.diagnosis.main_dx ?? '??') + ` / Oleh: ${(visit.diagnosis.diagnosticians.join(', ') ?? '??')}` }),
        c('p', { classes: 'patient-info__meta', text: `Masuk: ${format_date_variants(visit.admission_date ?? '').long} / Keluar: ${format_date_variants(visit.discharge_date ?? '').long}` }),
    ])

    // Action Buttons Group
    const patient_actions = c('div', { classes: 'patient-actions' }, [
        c('div', { classes: 'patient-actions__group' }, [
            c('button', { classes: 'patient-services-btn' }, [
                c('span', { text: 'Visite' })
            ]),
            c('div', { classes: 'patient-actions__row' }, [
                c('button', { classes: 'patient-open-details-btn' }, [
                    create_svg_icon('M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14')
                ]),
                c('button', { classes: 'patient-notes-btn' }, [
                    create_svg_icon('M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z')
                ]),
                c('button', { classes: 'patient-delete-btn' }, [
                    create_svg_icon('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16')
                ])
            ]),
            c('button', { classes: 'patient-verify-btn hidden' }, [
                c('span', { text: 'Verify' })
            ])
        ]),
        c('div', { classes: 'patient-reorder' }, [
            c('button', { classes: 'move-p-up' }, [
                c('svg', { classes: 'icon-sm', attrs: { fill: 'currentColor', viewBox: '0 0 20 20' } }, [
                    c('path', { attrs: { d: 'M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z' } })
                ])
            ]),
            c('button', { classes: 'move-p-down' }, [
            ])
        ])
    ])

    // Card Main Body
    const main_content = c('div', { classes: 'patient-card__main' }, [
        bed_info,
        patient_info,
        // patient_actions
    ])

    // Status Section
    const card_status = c('div', { classes: 'patient-card__status' }, [
        c('div', { classes: 'pill-container' }, [
            c('div', { classes: 'status-pill status-pill--active js-status-pill' }, [
                c('div', { classes: 'status-dot js-status-dot' }),
                c('span', { classes: 'status-label js-status-label', text: 'Active' })
            ]),
            c('div', { classes: 'date-pill date-pill--in' }, [
                c('span', { classes: 'label', text: 'In:' }),
                c('span', { classes: 'value js-adm-date', text: 'Tue, 25 Aug' })
            ]),
            c('div', { classes: 'date-pill date-pill--out' }, [
                c('span', { classes: 'label', text: 'Out:' }),
                c('span', { classes: 'value js-dis-date', text: '--' })
            ])
        ]),
        c('div', { classes: 'action-buttons' }, [
            c('button', { classes: 'btn-refresh-patient' }, [
                create_svg_icon('M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15')
            ]),
            c('button', { classes: 'btn-copy-patient' }, [
                c('svg', { classes: 'icon', attrs: { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' } }, [
                    c('path', { attrs: { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2.5', d: 'M8 7v1a3 3 0 01-3 3H4a2 2 0 00-2 2v7a2 2 0 002 2h7a2 2 0 002-2v-1M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M8 7h8' } }),
                    c('path', { attrs: { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2.5', d: 'M16 7a2 2 0 012 2v7a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h7z' } })
                ])
            ])
        ])
    ])

    // Footer Section
    const card_footer = c('div', { classes: 'patient-card__footer' }, [
        c('div', { classes: 'sync-info' }, [
            c('svg', { classes: 'icon-xs', attrs: { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' } }, [
                c('path', { attrs: { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2.5', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' } })
            ]),
            c('div', { classes: 'sync-text' }, [
                c('span', { classes: 'label', text: 'Last Sync' }),
                c('span', { classes: 'value js-last-sync', text: '27/08/2026 02:17:15.813' })
            ])
        ]),
        c('span', { classes: 'indicator-dot' })
    ])

    // Root Card Assembly
    return c('div', { classes: 'patient-card' }, [
        main_content,
        // card_status,
        // card_footer
    ])
}
