// 과목별·학년별 문제 은행을 하나로 합쳐요. 키: `과목-학년-학기-단원번호`
// import eng3 from './eng-3.js' // 영어 임시 비활성화
import kor1 from './kor-1.js'
import kor2 from './kor-2.js'
import kor3 from './kor-3.js'
import kor4 from './kor-4.js'
import kor5 from './kor-5.js'
import kor6 from './kor-6.js'
import mor1 from './mor-1.js'
import mor2 from './mor-2.js'
import mor3 from './mor-3.js'
import mor4 from './mor-4.js'
import mor5 from './mor-5.js'
import mor6 from './mor-6.js'

export const BANK = {
  // ...eng3,
  ...kor1,
  ...kor2,
  ...kor3,
  ...kor4,
  ...kor5,
  ...kor6,
  ...mor1,
  ...mor2,
  ...mor3,
  ...mor4,
  ...mor5,
  ...mor6,
}
