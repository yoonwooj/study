export default function NoticeModal({ onHideToday, onClose }) {
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="noticeTitle">
      <div className="modal-card">
        <h2 id="noticeTitle">📢 안내</h2>
        <p>교육과정 개정(2022 개정)에 따라 단원과 순서가 달라, 실제 교과서와 다를 수 있습니다.</p>
        <p className="sub">이 앱의 문제는 학습 주제를 바탕으로 직접 만든 문제예요.</p>
        <div className="modal-btns">
          <button className="btn ghost" onClick={onHideToday}>오늘 하루 안 보기</button>
          <button className="btn" onClick={onClose}>확인</button>
        </div>
      </div>
    </div>
  )
}
