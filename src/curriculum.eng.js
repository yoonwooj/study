// 영어 교과서 데이터. 출판사(BOOKS) → 학년별 판(EDITIONS).
// 판마다 단원 목록과 문제(bank/eng-*.js, 키 `eng-판ID-단원번호`)가 따로 있어서,
// 나중에 로그인 후 학교 교과서를 고르면 해당 판의 단원·문제만 보여줄 수 있어요.
// 다른 출판사/저자를 추가할 때는 BOOKS에 출판사를, EDITIONS에 판을 한 줄씩 추가하세요.
export const BOOKS = [{ id: 'cj', name: '천재교육' }]

export const EDITIONS = [
  { id: 'cj3', book: 'cj', author: '', grade: 3, units: [
    'Lesson 1. Hello, ABC!', 'Lesson 2. Oh, It\'s a ball!', 'Lesson 3. Sit down, please.', 'Lesson 4. How many apples?',
    'Lesson 5. I have a pencil.', 'Lesson 6. What color is it?', 'Lesson 7. I like chicken.', 'Lesson 8. It\'s very tall.',
    'Lesson 9. I can swim.', 'Lesson 10. She\'s my mom.', 'Lesson 11. Look! It\'s snowing.',
  ] },
  { id: 'cj4h', book: 'cj', author: '함순애', grade: 4, units: [
    'Lesson 1. My Name Is Eric', 'Lesson 2. I\'m Happy', 'Lesson 3. Let\'s Play Soccer', 'Lesson 4. Don\'t Run!',
    'Lesson 5. Where Is My Bag?', 'Lesson 6. Is This Your Watch?', 'Lesson 7. What Time Is It?', 'Lesson 8. Can I Come In?',
    'Lesson 9. I\'m a Pilot', 'Lesson 10. Do You Want Some Pizza?', 'Lesson 11. I Get Up Early', 'Lesson 12. How Much Is It?',
  ] },
  { id: 'cj4k', book: 'cj', author: '김태은', grade: 4, units: [
    'Lesson 1. How Are You?', 'Lesson 2. Let\'s Play Baseball', 'Lesson 3. Where Is My Bag?', 'Lesson 4. Are You Happy?',
    'Lesson 5. Don\'t Touch, Please', 'Lesson 6. Is This Your Watch?',
  ] },
  // 5학년은 목차에 단원 제목이 없어 주제로 이름을 붙였어요. (정확한 제목 확인 필요)
  { id: 'cj5h', book: 'cj', author: '함순애', grade: 5, units: [
    'Lesson 1. 출신 국가 묻기', 'Lesson 2. 주말 활동', 'Lesson 3. 정중하게 허락 요청하기', 'Lesson 4. 물건 주인 찾기',
    'Lesson 5. 음식 주문하기', 'Lesson 6. 방학 계획', 'Lesson 7. 과거 경험 묻고 답하기', 'Lesson 8. 물건 가격',
    'Lesson 9. 좋아하는 과목', 'Lesson 10. 집 안 소개하기', 'Lesson 11. 장래 희망 표현하기',
  ] },
  { id: 'cj5k', book: 'cj', author: '김태은', grade: 5, units: [
    'Lesson 1. 출신 국가 묻기', 'Lesson 2. 음식 권하기', 'Lesson 3. 허락 요청하기', 'Lesson 4. 소유 묻기',
    'Lesson 5. 캠핑 제안하기', 'Lesson 6. 하루 일과 시각 묻고 답하기',
  ] },
  { id: 'cj6', book: 'cj', author: '', grade: 6, units: [
    'Lesson 1. What Grade Are You In?', 'Lesson 2. I Have a Headache', 'Lesson 3. Why Are You Happy?', 'Lesson 4. When Is Your Birthday?',
    'Lesson 5. What Does He Look Like?', 'Lesson 6. Where Is the Post Office?', 'Lesson 7. What Did You Do Yesterday?',
    'Lesson 8. How About Going to the Museum?', 'Lesson 9. Which Is Bigger?', 'Lesson 10. What Are You Going to Do?',
    'Lesson 11. How Often Do You Exercise?',
  ] },
]
