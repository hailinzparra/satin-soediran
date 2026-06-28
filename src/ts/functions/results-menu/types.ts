interface TableReference {
    TABEL_ID: string
    JENIS: string
    ID: string
    DESKRIPSI: string
    REF_ID: string
    TEKS: string
    CONFIG: null | any
    SCORING: string
    STATUS: string
    LAST_UPDATE: null | string
}

interface KunjunganRuangan {
    ID: string
    JENIS_KUNJUNGAN: string
    DESKRIPSI: string
    TANGGAL: string
    REFERENSI: {
        JENIS_KUNJUNGAN: {
            ID: string
            DESKRIPSI: string
        }
    }
}

interface PendaftaranTujuan {
    NOPEN: string
    RUANGAN: string
    DOKTER: string
    REFERENSI: {
        RUANGAN: {
            ID: string
            DESKRIPSI: string
            TANGGAL: string
        }
        DOKTER: {
            ID: string
            NAMA: string
        }
    }
}

interface Perujuk {
    NOMOR: string
    KUNJUNGAN: string
    TANGGAL: string
    DOKTER_ASAL: string
    TUJUAN: string
    ALASAN: string
    REFERENSI: {
        DOKTER_ASAL: {
            ID: string
            NAMA: string
        }
    }
}

interface Kunjungan {
    NOMOR: string
    NOPEN: string
    RUANGAN: string
    REFERENSI: {
        RUANGAN: KunjunganRuangan
        PENDAFTARAN: {
            NOMOR: string
            NORM: string
            TANGGAL: string
            TUJUAN: PendaftaranTujuan
            REFERENSI: {
                PASIEN: {
                    NORM: string
                    NAMA: string
                    TANGGAL_LAHIR: string // "1987-02-25 00:00:00"
                    JENIS_KELAMIN: string // "1" = Laki-laki, "2" = Perempuan
                }
            }
        }
        PERUJUK: Perujuk
    }
}

interface ParameterTindakanRef {
    ID: string
    TINDAKAN: string
    PARAMETER: string
    NILAI_RUJUKAN: string
    SATUAN: string
    INDEKS: string
    TANGGAL: string
    STATUS: string
    REFERENSI: {
        TINDAKAN: {
            ID: string
            JENIS: string
            NAMA: string
            PRIVACY: string
            KPTL_NO: string
            KPTL_STATUS: string
            KATEGORI: string
            STATUS: string
            LASTUPDATE: string
            REFERENSI: {
                JENIS: TableReference
            }
        }
        SATUAN: TableReference
    }
}

interface TindakanMedisRef {
    ID: string
    KUNJUNGAN: string
    TINDAKAN: string
    TANGGAL: string
    REFERENSI: {
        KUNJUNGAN: Kunjungan
        JENIS_TINDAKAN: {
            DESKRIPSI: string
        }
    }
    TINDAKAN_DESKRIPSI: string
}

export interface HasilLabResponseData {
    ID: string
    TINDAKAN_MEDIS: string
    PARAMETER_TINDAKAN: string
    TANGGAL: string
    HASIL: string
    NILAI_NORMAL: string
    SATUAN: string
    KETERANGAN: string
    REFERENSI: {
        PARAMETER_TINDAKAN: ParameterTindakanRef
        TINDAKAN_MEDIS: TindakanMedisRef
    }
}

export interface HasilLabParams {
    NORM: string
    REFERENSI?: {
        Kunjungan: {
            COLUMNS: string[]
            REFERENSI: boolean
        }
    }
    STATUS: string | number
    page: number
    start: number
    limit: number
}

export interface LabParamContext {
    id: string
    name: string
    reference_values: string
    panel_id: string
}

export interface LabOrderContext {
    order_id: string
    order_date: string
    panel_id: string
    panel_desc: string
}

export interface LabReferrerContext {
    id: string
    name: string
    reason: string
}

export interface LabResult {
    id: string
    date: string
    parameter: LabParamContext
    value: string
    unit: string
    normal_values: string
    order: LabOrderContext
    referrer: LabReferrerContext
}
