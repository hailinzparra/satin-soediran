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

interface RawDataKepesertaan {
    noKartu?: string //"0002900407871",
    nik?: string //"3312210801540003",
    norm?: string //"648793",
    nama?: string //"PAIDI ",
    pisa?: string //"1",
    sex?: string //"L",
    tglLahir?: string //"1954-01-08 00:00:00",
    tglCetakKartu?: string //"2022-07-08 00:00:00",
    kdProvider?: string //"0152B020",
    nmProvider?: string //"KLINIK DR IDA",
    kdCabang?: string | null //null,
    nmCabang?: string | null //null,
    kdJenisPeserta?: string //"14",
    nmJenisPeserta?: string //"PEKERJA MANDIRI",
    kdKelas?: string //"1",
    nmKelas?: string //"KELAS I",
    tglTAT?: string //"2050-01-01",
    tglTMT?: string //"2019-10-21",
    umurSaatPelayanan?: string //"72 tahun, 7 bulan, 18 hari",
    umurSekarang?: string //"72 tahun, 7 bulan, 18 hari",
    dinsos?: string | null //null,
    iuran?: string | null //null,
    noSKTM?: string | null //null,
    prolanisPRB?: string //"Potensi PRB",
    kdStatusPeserta?: string //"0",
    ketStatusPeserta?: string //"AKTIF",
    noTelepon?: string | null //null,
    noAsuransi?: string | null //null,
    nmAsuransi?: string | null //null,
    cobTglTAT?: string | null //null,
    cobTglTMT?: string | null //null,
    tanggal?: string //"2026-08-26 18:03:05"
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
        KEPESERTAAN?: RawDataKepesertaan,
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
