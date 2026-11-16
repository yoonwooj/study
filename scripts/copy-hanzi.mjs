// 사용법:  npm i -D hanzi-writer-data  →  node scripts/copy-hanzi.mjs
// hanzi-writer-data 패키지에서 하루한자에 쓰는 글자의 획순 데이터를 public/hanzi/ 로 복사해요.
// (데이터 출처: Make Me a Hanzi, Arphic Public License — 라이선스를 확인하세요)
import fs from 'fs'
import path from 'path'
import { HANJA } from '../src/data/hanja.js'

const src = 'node_modules/hanzi-writer-data'
const out = 'public/hanzi'
if (!fs.existsSync(src)) {
  console.error('먼저 `npm i -D hanzi-writer-data` 를 실행하세요.')
  process.exit(1)
}
fs.mkdirSync(out, { recursive: true })
const missing = []
let n = 0
for (const h of HANJA) {
  const f = path.join(src, `${h.c}.json`)
  if (fs.existsSync(f)) { fs.copyFileSync(f, path.join(out, `${h.c.codePointAt(0).toString(16)}.json`)); n++ } else missing.push(h.c)
}
console.log(`복사 ${n}자 / 없는 글자 ${missing.length}자 ${missing.join(' ')}`)
console.log('없는 글자는 앱이 내장 획순이나 반투명 글자로 대신 보여줘요.')
