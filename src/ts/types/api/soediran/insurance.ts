import { RawDictKelas, RawDictKenakanTarif, RawDictPegawai, RawDictJenisPenjamin, RawDataDictionary } from './dictionary'

interface RawDataTarifFarmasi {
    ID?: string //"37",
    KELAS?: string //"0",
    FARMASI?: string //"0.00",
    TANGGAL?: string //"2023-04-08 19:54:33",
    OLEH?: string //"5",
    STATUS?: string //"1"
}

interface RawDataKap {
    JENIS?: string //"7",
    NORM?: string //"236290",
    NOMOR?: string //"0000089530277",
    REFERENSI?: {
        PENJAMIN?: RawDictJenisPenjamin
    }
}

interface RawDataPPK {
    ID?: string //"17923",
    KODE?: string //"11280301",
    BPJS?: string //"11280301",
    JENIS?: string //"2",
    KEPEMILIKAN?: string | null
    JPK?: string | null
    NAMA?: string //"PUSKESMAS NGADIROJO",
    KELAS?: string //"",
    ALAMAT?: string //"Jl. Raya Ngadirojo",
    RT?: string //"00",
    RW?: string //"00",
    KODEPOS?: string //"57681",
    TELEPON?: string //"0273 321878",
    FAX?: string //"00",
    WILAYAH?: string | null
    DESWILAYAH?: string //"KAB. WONOGIRI",
    MULAI?: string //"2013-01-01 00:00:00",
    BERAKHIR?: string //"2013-12-31 00:00:00",
    TANGGAL?: string //"2025-04-28 10:34:38",
    OLEH?: string //"0",
    STATUS?: string //"1",
    REFERENSI?: {
        JENIS?: RawDataDictionary
        KEPEMILIKAN?: RawDataDictionary
        JPK?: RawDataDictionary
    }
}

export interface RawDataPenjamin {
    ID?: string //"451366",
    JENIS?: string //"7",
    NOPEN?: string //"2606300369",
    NOMOR?: string //"PENANGGUHN AKTVS PBI 1 JL",
    KELAS?: string //"0",
    JENIS_PESERTA?: string //"0",
    COB?: string //"0",
    KATARAK?: string //"0",
    NO_SURAT?: string //"",
    DPJP?: string //"",
    CATATAN?: string //"",
    NAIK_KELAS?: string //"",
    PEMBIAYAAN?: string //"",
    PENANGGUNGJAWAB?: string | null
    TUJUAN_KUNJUNGAN?: string //"0",
    PROCEDURE?: string //"",
    PENUNJANG?: string //"",
    ASSESMENT_PELAYANAN?: string //"",
    DPJP_LAYANAN?: string //"",
    SATU_EPISODE?: string //"0",
    PEGAWAI_JENIS?: string //"1",
    PEGAWAI_NIP?: string //"",
    KENAKAN_TARIF?: string //"1",
    REFERENSI?: {
        KELAS?: RawDictKelas
        TARIF_FARMASI?: RawDataTarifFarmasi
        KAP?: RawDataKap
        JENIS_PENJAMIN?: RawDictJenisPenjamin
        PEGAWAI_JENIS?: RawDictPegawai
        KENAKAN_TARIF?: RawDictKenakanTarif
    }
}

export interface RawDataKartuAsuransiItem {
    JENIS?: string //"1",
    NORM?: string //"236290",
    NOMOR?: string //"0000089530277",
    REFERENSI?: {
        PENJAMIN?: RawDictJenisPenjamin
        PPK?: RawDataPPK
    }
}
