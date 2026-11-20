import { useEffect, useState } from 'react'
import { dayIndex, todayLabel } from '../lib/date.js'
import { fetchDailyWisdom } from '../lib/supabase.js'

export default function DailyWisdomPage({ grade = 1 }) {
  const isYoung = Number(grade) <= 2
  const category = isYoung ? 'proverb' : 'quote'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    fetchDailyWisdom(category, Number(grade))
      .then((rows) => { if (alive) setItems(rows) })
      .catch((e) => { if (alive) setError(e.message || '오늘의 콘텐츠를 불러오지 못했습니다.') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [category, grade])

  const day = dayIndex()
  const item = items.length ? items[day % items.length] : null
  const dayNumber = (day % 100) + 1

  return (
    <main className="page daily-wisdom-page">
      <section className="hero daily-wisdom-hero">
        <small>{todayLabel()}</small>
        <b>{isYoung ? '💬 오늘의 하루속담' : '🌍 오늘의 영어명언'}</b>
        <p>매일 하나씩, 하루에 한 가지 좋은 생각을 만나요.</p>
      </section>
      {loading ? (
        <section className="card daily-wisdom-loading">오늘의 내용을 준비하고 있어요…</section>
      ) : error ? (
        <section className="card daily-wisdom-error" role="alert">{error}</section>
      ) : !item ? (
        <section className="card daily-wisdom-error">등록된 콘텐츠가 없습니다.</section>
      ) : (
        <section className="card daily-wisdom-card">
          <span className="daily-wisdom-day">DAY {String(dayNumber).padStart(2, '0')} · 100일 콘텐츠</span>
          {isYoung ? (
            <>
              <h2 className="daily-wisdom-title">{item.title}</h2>
              <p className="daily-wisdom-meaning">{item.meaning}</p>
              <p className="daily-wisdom-example">💡 예시: {item.content}</p>
            </>
          ) : (
            <>
              <p className="daily-wisdom-original">“{item.content}”</p>
              <p className="daily-wisdom-meaning">{item.meaning}</p>
              <p className="daily-wisdom-author">— {item.attribution || item.title}</p>
            </>
          )}
        </section>
      )}
    </main>
  )
}
