import { SatinContentEngine } from '../../engine/content-engine'
import { BaseApiResponse } from '../../types/api/base'
import { SoediranDataKunjungan } from '../../types/api/soediran/data'
import { SoediranParamsKunjungan } from '../../types/api/soediran/params'
import { SatinBaseFunction } from '../../types/functions/base'
import { DEFAULT_EMR_MANAGER_CONFIG, EMRManagerConfig, EMRManagerConfigData, EMRManagerSession, EMRManagerSessionVisit } from '../../types/functions/emr-manager'
import { RequestPayloadBuilder } from '../../utils/api'
import { format_medical_name } from '../../utils/formatter'
import { Log } from '../../utils/logger'
import { EMRManagerExtractor } from './extractor'
import { EMRManagerInjector } from './injector'

export class EMRManagerFunction extends SatinBaseFunction<EMRManagerConfig, EMRManagerExtractor, EMRManagerInjector> {
    public extractor = new EMRManagerExtractor(this)
    public injector = new EMRManagerInjector(this)
    public config = DEFAULT_EMR_MANAGER_CONFIG

    private emr_session_map: Map<string, EMRManagerSession> = new Map()
    private active_requests_map: Map<string, Promise<EMRManagerSession | null>> = new Map()

    private static instance: EMRManagerFunction | null = null
    public static get_instance(engine: SatinContentEngine): EMRManagerFunction {
        if (!EMRManagerFunction.instance) {
            EMRManagerFunction.instance = new EMRManagerFunction(engine)
        }
        return EMRManagerFunction.instance
    }

    get_default_data(): EMRManagerConfigData {
        return structuredClone(DEFAULT_EMR_MANAGER_CONFIG.data)
    }

    // empty apply() to defer auto execute of extractor/injector by default
    apply(): void { }

    // set the feature's main function entrypoint from on_debounce() instead of apply()
    on_debounce(): void {
        if (this.get_is_feature_enabled()) {
            // just extractor at work
            this.extractor.execute()
        } else {
            // do nothing if disabled
            // no reset no nothing
        }
    }

    public async get_emr_session(force_refresh: boolean = false): Promise<{ from_cache: boolean, session: EMRManagerSession | null }> {
        try {
            const active_mrn = this.get_saved_data()?.active_mrn
            if (!active_mrn) throw new Error('no saved mrn')

            // return sync cache if available and not forced
            if (!force_refresh) {
                const cached_session = this.emr_session_map.get(active_mrn)
                if (cached_session) {
                    return { from_cache: true, session: cached_session }
                }
            }

            // prevent concurrent duplicate API calls (race condition safety)
            let pending_promise = this.active_requests_map.get(active_mrn)
            if (!pending_promise || force_refresh) {
                pending_promise = this.fetch_emr_session_from_api(active_mrn)
                this.active_requests_map.set(active_mrn, pending_promise)
            } else {
                // if there's an active query in-flight, return it
                const session = await pending_promise
                return { from_cache: true, session }
            }

            const session = await pending_promise
            return { from_cache: false, session }
        } catch (err) {
            Log.error(`Failed to get emr session:`, err)
            return { from_cache: false, session: null }
        }
    }

    private async fetch_emr_session_from_api(mrn: string): Promise<EMRManagerSession | null> {
        try {
            const ctx = this.engine.api
            const result = await ctx.api_request<SoediranDataKunjungan[]>({
                base_path: 'pendaftaran/kunjungan',
                payload: new RequestPayloadBuilder<SoediranParamsKunjungan>({
                    NORM: mrn,
                    STATUS: [1, 2],
                    page: 1,
                    start: 0,
                    limit: 10, // get 10 most recent kunjungan
                }),
            })

            this.emr_session_map.delete(mrn)
            const new_session = this.process_emr_session_result(mrn, result)

            if (new_session) {
                this.emr_session_map.set(mrn, new_session)
            }
            return new_session
        } finally {
            this.active_requests_map.delete(mrn)
        }
    }

    process_emr_session_result(mrn: string, result: BaseApiResponse<SoediranDataKunjungan[]>): EMRManagerSession | null {
        if (!result || !Array.isArray(result.data)) return null
        const visits = result.data
            .map(raw => this.extract_emr_session_visit(raw))
            .filter(visit => !!(visit && visit.id))

        return { mrn, visits }
    }

    private extract_emr_session_visit(raw?: SoediranDataKunjungan): EMRManagerSessionVisit {
        const discharge_str = raw?.KELUAR
        const is_active = !discharge_str || isNaN(Date.parse(discharge_str))
        const queue_num = raw?.REFERENSI?.PENDAFTARAN?.TUJUAN?.REFERENSI?.ANTRIAN?.NOMOR ?? ''
        const queue_pos = raw?.REFERENSI?.PENDAFTARAN?.TUJUAN?.REFERENSI?.ANTRIAN?.POS ?? ''
        const queue_str = queue_num ? `(${queue_pos ? `${queue_pos}-` : ''}${queue_num})` : ''
        return {
            id: raw?.NOMOR ?? '',
            reg_id: raw?.NOPEN ?? '',
            dpjp: {
                id: raw?.REFERENSI?.DPJP?.ID ?? raw?.DPJP ?? '',
                name: format_medical_name(raw?.REFERENSI?.DPJP?.NAMA ?? ''),
            },
            room: {
                id: raw?.REFERENSI?.RUANGAN?.ID ?? raw?.RUANGAN ?? '',
                name: raw?.REFERENSI?.RUANGAN?.DESKRIPSI ?? '',
                bed_name: raw?.REFERENSI?.RUANG_KAMAR_TIDUR?.TEMPAT_TIDUR ?? queue_str,
            },
            admission_date: raw?.MASUK ?? null,
            discharge_date: discharge_str ?? null,
            is_active,
        }
    }
}
