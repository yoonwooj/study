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
    unit: '물체와 물질',
    q: '연필을 이루는 물질에 대한 설명으로 알맞은 것은 무엇일까요?',
    o: ['연필은 나무와 흑연 등 여러 물질로 이루어져 있다', '연필은 물만으로 이루어져 있다', '연필은 공기만으로 이루어져 있다', '연필은 유리만으로 이루어져 있다'],
    a: 0,
    e: '연필은 나무로 된 부분과 흑연으로 된 심처럼 여러 물질로 이루어져 있어요.'
  }
}

function SubjectQuestionPreview({ code, item }) {
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const question = { t: 'c', q: item.q, o: item.o, a: item.a, e: item.e, unit: item.unit }
  const run = {
    qs: [question], i: 0, ans: selected,
    ok: answered ? selected === item.a : null,
    score: answered && selected === item.a ? 1 : 0,
    wrongs: answered && selected !== item.a ? [question] : [],
    finished: false, retry: false
  }

  return (
    <section className={`homepage-subject homepage-subject-${code}`}>
      <header className="homepage-subject-hero">
        <span className="homepage-subject-eyebrow">SUBJECT PREVIEW</span>
        <h2>{item.subject}</h2>
        <p>초등 3학년 · 실제 문제 풀이 화면</p>
      </header>
      <QuizScreen
        run={run}
        subj={code}
        text=""
        onText={() => {}}
        onSubmit={(value) => { setSelected(value); setAnswered(true) }}
        onNext={() => { setSelected(null); setAnswered(false) }}
        onQuit={() => { setSelected(null); setAnswered(false) }}
      />
    </section>
  )
}

export default function HomepageQuestionPreview() {
  return (
    <main className="homepage-demo">
      {Object.entries(DEMO_QUESTIONS).map(([code, item]) => (
        <SubjectQuestionPreview key={code} code={code} item={item} />
      ))}
    </main>
  )
}
