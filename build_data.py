# data/*.json 을 js/data.js 로 합치는 스크립트 (python3 build_data.py)
import json
d='data/'
L=lambda f: json.load(open(d+f,encoding='utf-8'))
RP={'facts':L('facts.json'),'sim':L('sim_results.json'),'demo':L('demo_timeseries.json'),'schema':L('record_schema.json'),'esg':L('esg_kpi.json'),
 'geo':L('legacy/seoul8_dong_geo.json'),'dongStats':L('legacy/seoul8_dong_stats.json'),'pts':L('legacy/seoul8_facility_points.json')['points'],'rain':L('legacy/seoul_monthly_rain_mm.json')['월별_mm']}
open('js/data.js','w',encoding='utf-8').write('window.RP='+json.dumps(RP,ensure_ascii=False,separators=(',',':'))+';\n')
