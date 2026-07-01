import { RawDictAgama, RawDictCara, RawDictGolonganDarah, RawDictJenisKelamin, RawDictKeadaan, RawDictPekerjaan, RawDictPendidikan, RawDictStatus, RawDictStatusPerkawinan, RawDictTempatLahir } from './dictionary'
import { RawDataKartuAsuransiItem } from './insurance'
import { RawDataDokter, RawDataKartuIdentitasItem, RawDataKontakItem, RawDataWilayah } from './user'

export interface RawDataPasienPulang {
    ID?: string //"93657",
    KUNJUNGAN?: string //"1010202012606300025",
    NOPEN?: string //"2606300369",
    TANGGAL?: string //"2026-06-30 18:24:57",
    CARA?: string //"8",
    KEADAAN?: string //"8",
    DIAGNOSA?: string //"obs seizure dd status epileptikus riwayat epilepsi pengobatan rutin migraine berat",
    DOKTER?: string //"14",
    OLEH?: string //"594",
    STATUS?: string //"1",
    REFERENSI?: {
        DOKTER?: RawDataDokter
        CARA?: RawDictCara
        KEADAAN?: RawDictKeadaan
    }
}

export interface RawDataPasien {
    NORM?: string //"236290",
    NAMA?: string //"IBNU...",
    PANGGILAN?: string //"",
    GELAR_DEPAN?: string //"",
    GELAR_BELAKANG?: string //"",
    TEMPAT_LAHIR?: string //"3312",
    TANGGAL_LAHIR?: string //"1997-11-30 00:00:00",
    JENIS_KELAMIN?: string //"1",
    ALAMAT?: string //"GAYAM",
    RT?: string //"002",
    RW?: string //"001",
    KODEPOS?: string //"57681",
    WILAYAH?: string //"3312132004",
    AGAMA?: string //"1",
    PENDIDIKAN?: string //"3",
    PEKERJAAN?: string //"19",
    STATUS_PERKAWINAN?: string //"2",
    GOLONGAN_DARAH?: string //"0",
    KEWARGANEGARAAN?: string //"71",
    SUKU?: string //"0",
    TIDAK_DIKENAL?: string //"0",
    BAHASA?: string //"1",
    LOCK_AKSES?: string //"0",
    TANGGAL?: string //"2019-08-18 15:33:00",
    OLEH?: string //"550",
    STATUS?: string //"1",
    UMUR?: string //"28",
    UMUR_INFO?: string //"28 Th/ 7 bl/ 1 hr",
    KARTUIDENTITAS?: Array<RawDataKartuIdentitasItem>
    KARTUASURANSI?: Array<RawDataKartuAsuransiItem>
    KONTAK?: Array<RawDataKontakItem>
    REFERENSI?: {
        TEMPATLAHIR?: RawDictTempatLahir
        AGAMA?: RawDictAgama
        JENIS_KELAMIN?: RawDictJenisKelamin
        PENDIDIKAN?: RawDictPendidikan
        PEKERJAAN?: RawDictPekerjaan
        STATUS_PERKAWINAN?: RawDictStatusPerkawinan
        GOLONGAN_DARAH?: RawDictGolonganDarah
        STATUS?: RawDictStatus
        WILAYAH?: RawDataWilayah
        PATIENT?: RawDataPasienPatient
    }
}

interface RawDataPasienPatient {
    id?: string //"P01672321957"
}
