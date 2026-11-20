import { useState } from 'react'
import { searchSchools } from '../lib/auth.js'

const REGIONS = [
  ['B10','서울특별시'],['C10','부산광역시'],['D10','대구광역시'],['E10','인천광역시'],['F10','광주광역시'],['G10','대전광역시'],['H10','울산광역시'],['I10','세종특별자치시'],['J10','경기도'],['K10','강원특별자치도'],['M10','충청북도'],['N10','충청남도'],['P10','전북특별자치도'],['Q10','전라남도'],['R10','경상북도'],['S10','경상남도'],['T10','제주특별자치도'],
]

export default function SchoolPicker({ value, onChange }) {
  const [region, setRegion] = useState('B10')
  const [query, setQuery] = useState('')
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const search = async (event) => {
    event?.preventDefault()
    if (query.trim().length < 2) { setError('학교명을 2자 이상 입력해 주세요.'); return }
    setLoading(true); setError(''); setSearched(false); setSchools([]); onChange(null)
    try {
      const rows = await searchSchools(query.trim(), region)
      setSchools(rows); setSearched(true)
      if (!rows.length) setError('선택한 지역에서 학교를 찾지 못했습니다. 학교명을 정확히 입력해 주세요.')
    } catch (e) { setError(e.message || '학교 검색 중 오류가 발생했습니다.') }
    finally { setLoading(false) }
  }

  return <div className="school-picker">
    <label htmlFor="school-region">학교 소재 지역</label>
    <select id="school-region" value={region} onChange={e => { setRegion(e.target.value); setSchools([]); setSearched(false); setError(''); onChange(null) }}>
      {REGIONS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
    </select>
    <label htmlFor="school-search">학교 이름</label>
    <div className="school-search-row">
      <input id="school-search" type="text" value={query} onChange={e => { setQuery(e.target.value.slice(0,50)); setSchools([]); setSearched(false); setError(''); onChange(null) }} onKeyDown={e => { if (e.key === 'Enter') search(e) }} placeholder="학교 이름을 정확히 입력" maxLength={50} autoComplete="off" />
      <button type="button" className="school-search-button" onClick={search} disabled={loading || query.trim().length < 2}>{loading ? '검색 중' : '학교 검색'}</button>
    </div>
    {schools.length > 0 && <div className="school-search-results" role="listbox" aria-label="검색된 학교 목록">
      {schools.map(s => <button type="button" className={value?.sd_schul_code === s.sd_schul_code ? 'selected' : ''} key={s.atpt_ofcdc_sc_code + s.sd_schul_code} onClick={() => { onChange(s); setSchools([]); setError('') }}>
        <strong>{s.school_name}</strong><span>{s.atpt_ofcdc_sc_nm} · {s.address || '주소 정보 없음'}</span>
      </button>)}
    </div>}
    {value ? <p className="school-selected" role="status">✓ NEIS 등록 학교 확인: {value.school_name} ({value.atpt_ofcdc_sc_nm})</p> : null}
    {error && <small className="school-picker-message" role="status">{error}</small>}
    {searched && !schools.length && !value && !error && <small className="school-picker-message">검색 결과를 확인해 주세요.</small>}
    <small className="school-picker-help">교육부 NEIS에 등록된 초등학교만 선택할 수 있습니다.</small>
  </div>
}
