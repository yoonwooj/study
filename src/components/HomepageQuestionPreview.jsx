import { useState } from 'react'
import QuizScreen from './QuizScreen.jsx'

const DEMO_QUESTIONS = {
  kor: {
    subject: '국어',
    unit: '경험과 관련지으며 이해해요',
    q: '다음 글을 읽고 알 수 있는 민지의 마음으로 가장 알맞은 것은?\n\n“민지는 처음으로 반 친구들 앞에서 책을 읽었다. 목소리가 조금 떨렸지만, 친구들이 끝까지 들어 주고 박수를 보내자 환하게 웃었다.”',
    o: ['친구들이 자신을 놀릴까 봐 화가 났다', '책 읽기가 지루해서 빨리 끝내고 싶었다', '친구들의 응원에 뿌듯하고 기뻤다', '다시는 책을 읽지 않겠다고 생각했다'],
    a: 2,
    e: '친구들이 끝까지 들어 주고 박수를 보내자 민지가 환하게 웃었다고 했어요. 응원받은 기쁨과 뿌듯함을 느꼈다고 볼 수 있어요.'
  },
  soc: {
    subject: '사회',
    unit: '우리가 생각하는 고장의 모습',
    q: '지도에서 학교, 병원, 공원처럼 장소를 간단한 그림이나 기호로 나타내는 까닭은 무엇일까요?',
    o: ['지도에 색깔을 많이 넣기 위해서', '장소의 위치와 정보를 한눈에 알아보기 위해서', '실제 건물의 크기를 똑같이 그리기 위해서', '지도에 글자를 쓰지 않기 위해서'],
    a: 1,
    e: '지도 기호를 사용하면 여러 장소의 위치와 정보를 간단하고 알아보기 쉽게 나타낼 수 있어요.'
  },
  sci: {
    subject: '과학',
    unit: '소리의 성질',
    q: '책상 끝에 자를 올려놓고 튕겼더니 소리가 났어요. 이때 소리가 나는 까닭으로 알맞은 것은 무엇일까요?',
    o: ['자가 빛을 내기 때문에', '자가 주변의 공기를 모두 없애기 때문에', '자가 빠르게 흔들리며 진동하기 때문에', '자가 책상에 붙어 움직이지 않기 때문에'],
    a: 2,
    e: '물체가 떨리는 움직임을 진동이라고 해요. 자가 진동하면서 주변 공기를 흔들어 소리가 전달돼요.'
  }
}

export default function HomepageQuestionPreview() {
  const [subject, setSubject] = useState('kor')
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const item = DEMO_QUESTIONS[subject]
  const question = { t: 'c', q: item.q, o: item.o, a: item.a, e: item.e, unit: item.unit }
  const run = {
    qs: [question], i: 0, ans: selected,
    ok: answered ? selected === item.a : null,
    score: answered && selected === item.a ? 1 : 0,
    wrongs: answered && selected !== item.a ? [question] : [],
    finished: false, retry: false
  }
  const changeSubject = (next) => {
    setSubject(next)
    setSelected(null)
    setAnswered(false)
  }
  return (
    <div className="homepage-demo">
      <div className="homepage-demo-head">
        <div className="homepage-demo-label">홈페이지 디자인용 실제 학습 UI 미리보기</div>
        <strong>초등 3학년 문제 풀이</strong>
        <div className="homepage-demo-tabs" aria-label="과목 선택">
          {Object.entries(DEMO_QUESTIONS).map(([key, value]) => (
            <button key={key} type="button" aria-pressed={subject === key} onClick={() => changeSubject(key)}>{value.subject}</button>
          ))}
        </div>
        <p>실제 서비스의 문제 풀이 컴포넌트를 사용한 시안 전용 화면입니다.</p>
      </div>
      <QuizScreen
        run={run}
        subj={subject}
        text=""
        onText={() => {}}
        onSubmit={(value) => { setSelected(value); setAnswered(true) }}
        onNext={() => { setSelected(null); setAnswered(false) }}
        onQuit={() => { window.location.href = '/' }}
      />
    </div>
  )
}
