import { useMemo, useState } from 'react'
import QuizScreen from './QuizScreen.jsx'
import { isRight, prep } from '../lib/quiz.js'

const DEMO_QUESTIONS = {
  kor: {
    subject: '국어',
    unit: '경험과 관련지으며 이해해요',
    questions: [
      {
        t: 'c',
        q: '다음 글을 읽고 알 수 있는 민지의 마음으로 가장 알맞은 것은? “민지는 처음으로 반 친구들 앞에서 책을 읽었다. 목소리가 조금 떨렸지만, 친구들이 끝까지 들어 주고 박수를 보내자 환하게 웃었다.”',
        o: ['친구들이 자신을 놀릴까 봐 화가 났다', '책 읽기가 지루해서 빨리 끝내고 싶었다', '친구들의 응원에 뿌듯하고 기뻤다', '다시는 책을 읽지 않겠다고 생각했다'],
        a: 2,
        e: '친구들이 끝까지 들어 주고 박수를 보내자 민지가 환하게 웃었어요. 응원받은 기쁨과 뿌듯함을 느꼈다고 볼 수 있어요.'
      },
      {
        t: 'ox',
        q: '글을 읽으며 자신의 경험을 떠올리면 인물의 마음과 글의 내용을 더 잘 이해할 수 있어요.',
        a: true,
        e: '자신의 경험과 글의 내용을 연결하면 인물의 마음과 상황을 더 깊이 이해할 수 있어요.'
      },
      {
        t: 's',
        q: '글의 내용과 관련 있는 자신의 경험을 떠올리며 읽는 방법을 무엇이라고 할까요?',
        a: ['경험과 관련지어 읽기', '경험과 관련지으며 읽기', '경험을 떠올리며 읽기'],
        e: '글의 내용과 자신의 경험을 연결하여 읽는 것을 경험과 관련지어 읽기라고 해요.'
      }
    ]
  },
  soc: {
    subject: '사회',
    unit: '우리가 생각하는 고장의 모습',
    questions: [
      {
        t: 'c',
        q: '지도에서 학교, 병원, 공원처럼 장소를 간단한 그림이나 기호로 나타내는 까닭은 무엇일까요?',
        o: ['지도에 색깔을 많이 넣기 위해서', '장소의 위치와 정보를 한눈에 알아보기 위해서', '실제 건물의 크기를 똑같이 그리기 위해서', '지도에 글자를 쓰지 않기 위해서'],
        a: 1,
        e: '지도 기호를 사용하면 여러 장소의 위치와 정보를 간단하고 알아보기 쉽게 나타낼 수 있어요.'
      },
      {
        t: 'ox',
        q: '지도에 표시된 기호와 범례를 살펴보면 장소가 무엇을 나타내는지 알 수 있어요.',
        a: true,
        e: '범례는 지도에 사용된 기호가 무엇을 뜻하는지 알려 줍니다.'
      },
      {
        t: 's',
        q: '지도에서 사용하는 기호의 뜻을 설명해 놓은 것을 무엇이라고 할까요?',
        a: ['범례'],
        e: '지도에 쓰인 기호의 뜻을 모아 설명한 것을 범례라고 해요.'
      }
    ]
  },
  sci: {
    subject: '과학',
    unit: '물체와 물질',
    questions: [
      {
        t: 'c',
        q: '연필을 이루는 물질에 대한 설명으로 알맞은 것은 무엇일까요?',
        o: ['연필은 나무와 흑연 등 여러 물질로 이루어져 있다', '연필은 물만으로 이루어져 있다', '연필은 공기만으로 이루어져 있다', '연필은 유리만으로 이루어져 있다'],
        a: 0,
        e: '연필은 나무로 된 부분과 흑연으로 된 심처럼 여러 물질로 이루어져 있어요.'
      },
      {
        t: 'ox',
        q: '물체는 한 가지 물질만으로 이루어질 수도 있고, 여러 가지 물질로 이루어질 수도 있어요.',
        a: true,
        e: '물체에 따라 한 가지 물질 또는 여러 가지 물질로 이루어질 수 있어요.'
      },
      {
        t: 's',
        q: '연필의 몸통을 만드는 대표적인 물질 한 가지를 써 보세요.',
        a: ['나무'],
        e: '연필의 몸통은 보통 나무로 만들어요. 제품에 따라 다른 재료를 사용하기도 합니다.'
      }
    ]
  }
}

function SubjectQuestionPreview({ code, item }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [text, setText] = useState('')
  const questions = useMemo(() => item.questions.map((question) =>
    question.t === 'c' ? prep(question, item.unit) : { ...question, unit: item.unit }
  ), [item])
  const question = questions[index]
  const correct = answered ? isRight(question, selected) : null
  const run = {
    qs: questions,
    i: index,
    ans: selected,
    ok: correct,
    score: correct ? 1 : 0,
    wrongs: answered && !correct ? [question] : [],
    finished: false,
    retry: false,
    previewOnly: true
  }

  const resetQuestion = () => {
    setSelected(null)
    setAnswered(false)
    setText('')
  }
  const nextQuestion = () => {
    setIndex((current) => (current + 1) % questions.length)
    resetQuestion()
  }
  const submitAnswer = (value) => {
    if (answered) return
    setSelected(value)
    setAnswered(true)
  }

  return (
    <section className={`homepage-subject homepage-subject-${code}`}>
      <header className="homepage-subject-hero">
        <span className="homepage-subject-eyebrow">SUBJECT PREVIEW</span>
        <h2>{item.subject}</h2>
        <p>초등 3학년 · 오늘의 학습 미리보기</p>
      </header>
      <QuizScreen
        run={run}
        subj={code}
        text={text}
        onText={setText}
        onSubmit={submitAnswer}
        onNext={nextQuestion}
        onQuit={() => { setIndex(0); resetQuestion() }}
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
