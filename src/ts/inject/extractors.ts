import { PatientSummaryData } from './types'

/**
 * Extracts patient data from the current ExtJS workspace component.
 */
export const extract_workspace_patient_summary = (): PatientSummaryData | null => {
    if (typeof Ext === 'undefined' || !Ext.ComponentQuery) return null

    const workspace = Ext.ComponentQuery.query('rekammedis-workspace')[0]
    if (!workspace) return null

    const view_obj = workspace.getController?.()?.getView?.()
    const visit = view_obj?.kunjungan
    if (!visit) return null

    const visit_data = visit.getData()
    const ref = visit.get('REFERENSI') || {}
    const pendaftaran = ref.PENDAFTARAN || {}
    const pasien = pendaftaran.REFERENSI?.PASIEN || {}
    const dpjp = ref.DPJP || {}

    const reg_id = view_obj.getReferensi(visit_data, 'PENDAFTARAN', 'NOMOR') || pendaftaran.NOMOR || visit.get('NOPEN') || ''
    const mrn = view_obj.getReferensi(visit_data, 'PENDAFTARAN', 'NORM') || pendaftaran.NORM || ''
    const visit_id = visit.get('NOMOR') || ''
    const name = pasien.NAMA || ''

    return {
        mrn,
        name,
        reg_id,
        visit_id,
        dob: pasien.TANGGAL_LAHIR,
        gender: pasien.JENIS_KELAMIN == 1 ? 'Laki-laki' : 'Perempuan',
        dpjp_name: dpjp.NAMA,
        dpjp_nip: dpjp.NIP,
        is_final: visit.get('FINAL_HASIL') === 1,
    }
}
