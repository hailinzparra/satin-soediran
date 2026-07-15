import { RawDataKunjungan } from './admission'
import { RawDictJenis, RawDictSatuan } from './dictionary'
import { RawDataDokter, RawDataPetugas } from './user'

export interface RawDataTindakan {
    ID?: string //"8054",
    JENIS?: string //"8",
    NAMA?: string //"DR 3 (DR dengan 5 diff)",
    PRIVACY?: string //"0",
    KPTL_NO?: string //"",
    KPTL_STATUS?: string //"0",
    KATEGORI?: string //"0",
    STATUS?: string //"1",
    LASTUPDATE?: string //"2025-06-17 08:10:28",
    REFERENSI?: {
        JENIS?: RawDictJenis
    }
}

export interface RawDataParameterTindakan {
    ID?: string //"8054010",
    TINDAKAN?: string //"8054",
    PARAMETER?: string //"MCV",
    NILAI_RUJUKAN?: string //"80-97",
    SATUAN?: string //"0",
    INDEKS?: string //"1013",
    TANGGAL?: string //"2024-02-27 11:03:48",
    STATUS?: string //"1",
    REFERENSI?: {
        TINDAKAN?: RawDataTindakan
        SATUAN?: RawDictSatuan
    }
}

export interface RawDataTindakanMedis {
    ID?: string //"26063001753",
    KUNJUNGAN?: string //"1010502022606300108",
    TINDAKAN?: string //"8054",
    TANGGAL?: string //"2026-06-30 11:29:51",
    VERIFIKASI?: string //"0",
    VERIFIKASI_OLEH?: string | null
    VERIFIKASI_TANGGAL?: string | null
    OLEH?: string //"87",
    STATUS?: string //"1",
    OTOMATIS?: string //"0",
    REFERENSI?: {
        KUNJUNGAN?: RawDataKunjungan
        JENIS_TINDAKAN?: {
            DESKRIPSI?: string //"Laboratorium"
        }
        PENGGUNA?: {
            NAMA?: string //"Staff Layanan Laboratorium",
            GELAR_DEPAN?: string //"",
            GELAR_BELAKANG?: string //""
        }
        VERIFIKASI?: {
            NAMA?: string | null
        }
    }
    TINDAKAN_DESKRIPSI?: string //"DR 3 (DR dengan 5 diff)"
}

export interface RawDataPerujukLab {
    NOMOR?: string //"121010202012606300003",
    KUNJUNGAN?: string //"1010202012606300009",
    TANGGAL?: string //"2026-06-30 11:08:56",
    DOKTER_ASAL?: string //"107",
    TUJUAN?: string //"101050202",
    CITO?: string //"0",
    OLEH?: string //"715",
    ALASAN?: string //"penkes susp cva",
    KETERANGAN?: string //"",
    ADA_PENGANTAR_PA?: string //"0",
    PERMINTAAN_DARAH?: string //"0",
    NOMOR_SPESIMEN?: string //"",
    SPESIMEN_KLINIS_ASAL_SUMBER?: string //"0",
    SPESIMEN_KLINIS_CARA_PENGAMBILAN?: string //"0",
    SPESIMEN_KLINIS_WAKTU_PENGAMBILAN?: string | null
    SPESIMEN_KLINIS_KONDISI_PENGAMBILAN?: string //"",
    SPESIMEN_KLINIS_JUMLAH?: string //"0",
    SPESIMEN_KLINIS_VOLUME?: string //"0",
    FIKSASI_WAKTU?: string | null
    FIKSASI_CAIRAN?: string //"",
    FIKSASI_VOLUME_CAIRAN?: string //"0",
    SPESIMEN_KLINIS_PETUGAS_PENGAMBIL?: string //"0",
    SPESIMEN_KLINIS_PETUGAS_PENGANTAR?: string //"0",
    PERNAH_TRANSFUSI_DARAH?: string //"0",
    SIFAT_PERMINTAAN?: string //"0",
    GOLONGAN_DARAH?: string //"0",
    RESUS?: string //"0",
    STATUS_PUASA_PASIEN?: string //"0",
    STATUS?: string //"2",
    REFERENSI?: {
        DOKTER_ASAL?: RawDataDokter
        PETUGAS?: RawDataPetugas
    }
}

export interface RawDataHasilLab {
    ID?: string //"260630000541",
    TINDAKAN_MEDIS?: string //"26063001753",
    PARAMETER_TINDAKAN?: string //"8054010",
    TANGGAL?: string //"2026-06-30 19:05:56",
    HASIL?: string //"84.1",
    NILAI_NORMAL?: string //"80 - 100",
    SATUAN?: string //"fL",
    KETERANGAN?: string //"-",
    OLEH?: string //"1",
    OTOMATIS?: string //"1",
    STATUS?: string //"1",
    REFERENSI?: {
        PARAMETER_TINDAKAN?: RawDataParameterTindakan
        TINDAKAN_MEDIS?: RawDataTindakanMedis
    }
}

export interface RawDataTindakanMedisLab {
    ID?: string //"26071502306",
    KUNJUNGAN?: string //"1010502022607150116",
    TINDAKAN?: string //"8047",
    TANGGAL?: string //"2026-07-15 12:42:31",
    VERIFIKASI?: string //"0",
    VERIFIKASI_OLEH?: string | null
    VERIFIKASI_TANGGAL?: string | null
    OLEH?: string //"663",
    STATUS?: string //"1",
    OTOMATIS?: string //"0",
    REFERENSI?: {
        JENIS_TINDAKAN?: {
            DESKRIPSI?: string //"Laboratorium"
        }
        PENGGUNA?: {
            NAMA?: string //"Magendi Indra Mukti",
            GELAR_DEPAN?: string //"dr",
            GELAR_BELAKANG?: string //"Sp.PK"
        }
        VERIFIKASI?: {
            NAMA?: string | null
        }
    }
    NOPEN?: string //"2607150415",
    HARI_KE?: string //"1",
    TINDAKAN_DESKRIPSI?: string //"Golongan Darah ABO"
}
