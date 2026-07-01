import { RawDictStatus } from './dictionary'
import { RawDataOrderResep } from './prescription'
import { RawDataPendaftaran } from './registration'
import { RawDataRuangan, RawDataRuangKamarTidur } from './room'
import { RawDataDokter } from './user'

export interface RawDataKunjungan {
    NOMOR?: string //"1010401022606300057"
    NOPEN?: string //"2606300369",
    RUANGAN?: string //"101040102",
    MASUK?: string //"2026-06-30 17:33:38",
    KELUAR?: string //"2026-06-30 17:34:13",
    RUANG_KAMAR_TIDUR?: string //"0",
    REF?: string //"141010202012606300037",
    DITERIMA_OLEH?: string //"626",
    BARU?: string //"0",
    TITIPAN?: string //"0",
    TITIPAN_KELAS?: string //"0",
    STATUS?: string //"2",
    FINAL_HASIL?: string //"0",
    FINAL_HASIL_OLEH?: string //"0",
    FINAL_HASIL_TANGGAL?: string | null
    DPJP?: string //"0",
    OTOMATIS?: string //"0",
    TGL_MASUK?: string //"2026-06-30",
    TGL_KELUAR?: string | null
    JENIS_KUNJUNGAN?: string //"11",
    REFERENSI?: {
        RUANGAN?: RawDataRuangan
        STATUS?: RawDictStatus
        PENDAFTARAN?: RawDataPendaftaran
        ASAL?: RawDataOrderResep
        RUANG_KAMAR_TIDUR?: RawDataRuangKamarTidur
        DPJP?: RawDataDokter
        DPJP_PENJAMIN_RS?: {
            ID?: string //"21",
            PENJAMIN?: string //"2",
            DPJP_PENJAMIN?: string //"31217",
            DPJP_RS?: string //"14",
            TANGGAL?: string //"2023-01-16 09:10:57",
            STATUS?: string //"1",
            REFERENSI?: {
                DOKTER?: RawDataDokter
            }
        }
    }
}
