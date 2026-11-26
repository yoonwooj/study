# 한자 획순 데이터 출처 및 라이선스

- 데이터 출처: [Hanzi Writer Data](https://github.com/chanind/hanzi-writer-data)
- 원본 데이터 프로젝트: [Make Me a Hanzi](https://github.com/skishore/makemeahanzi)
- 포함 데이터: 한자별 획 SVG 경로(`strokes`) 및 획 중심선(`medians`)
- 적용 범위: Supabase `public.hanja_dictionary.stroke_paths`에 등록된 101자
- 라이선스: Arphic Public License (APL)
- 라이선스 전문: [public/licenses/ARPHICPL.TXT](../public/licenses/ARPHICPL.TXT)

이 데이터는 중국 본토 표준 획순을 기반으로 합니다. 한국 한자 교육에서 쓰는 자형·획순과 일부 차이가 있을 수 있으므로, 교육용으로 공개하기 전에 한국식 기준과 대조 검수가 필요합니다.

검수 대상에서 제외한 글자:
- `敎`: 공개 데이터에서 정확히 일치하는 자형을 찾지 못해 획순을 등록하지 않았습니다. `教`의 획순으로 대체하지 않았습니다.
- `萬`: 기존 사전 획수는 12획이나 공개 데이터의 획 경로는 13개여서, 획수 불일치 상태로 제공하지 않도록 사전 및 학습 목록에서 제외했습니다.
