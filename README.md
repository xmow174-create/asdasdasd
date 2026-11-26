# EAT & BURN

> 먹은 만큼, 태우는 법까지

먹은 음식을 검색해 고르면 칼로리를 계산하고, 그 칼로리를 쓰려면 어떤 운동을 얼마나 해야 하는지 알려 주는 웹 앱입니다.

![EAT & BURN 소개](promo-poster.jpg)

## 주요 기능

| 기능 | 무료 | Pro |
|---|---|---|
| 음식 검색 · 칼로리 계산 (90가지 음식) | ✓ | ✓ |
| 📸 사진 칼로리 분석 (AI) | 하루 3회 | 무제한 |
| 유산소 9가지 운동 시간 환산 | ✓ | ✓ |
| 목표 칼로리 계산 (Mifflin-St Jeor) | ✓ | ✓ |
| 끼니 기록 | 하루 3회 | 무제한 |
| 맞춤 하루 식단 · 다음 끼니 추천 | | ✓ |
| 웨이트 기구별 추천 19가지 · 맞춤 루틴 | | ✓ |
| 주간 리포트 | | ✓ |

## 걷기 좋은 곳 (tour.html)

전국 17개 시·도의 공원·산책로 55곳을 지역·유형·난이도로 골라 볼 수 있고, 몸무게에 맞춰 걸을 때 소모 칼로리를 보여 줍니다.

## 수익 모델

- **Pro 구독**: 월간 4,900원 / 연간 39,000원 (런칭 할인: 첫 달 990원, 연간 9,900원)
- **단품 상품**: 4주 다이어트 식단·운동 플랜 PDF 2,900원
- **제휴 수익**: 쿠팡 파트너스 추천 상품 (식단·운동 탭)
- 결제: 계좌이체 · 카드 결제 링크 → 운영자 확인 후 Pro 코드 / PDF 발송
- 운영자 화면(`#admin`): 주문 처리, Pro 코드 발급, 매출 기록 · CSV 내보내기

## 파일 구성

```
index.html        사이트 첫 화면 (GitHub Pages가 이 파일을 엽니다)
tour.html         걷기 좋은 곳: 전국 공원·산책로 추천 (지역 선택)
server/worker.js  사진 칼로리 분석 서버 코드 (Cloudflare Workers에 붙여 넣어 사용)
promo.mp4         15초 소개 영상
promo-poster.jpg  영상 표지
README.md         이 설명
```

다섯 파일을 모두 저장소 맨 위(같은 위치)에 두어야 영상과 산책로 페이지가 연결됩니다.

서버나 외부 API 없이 브라우저에서만 동작합니다. 기록과 Pro 상태는 각 사용자의 브라우저에 저장됩니다.

## 📸 사진 인식 켜는 법

사진 분석은 AI가 필요해서, API 키를 숨겨 둘 작은 서버(Cloudflare Worker)를 하나 만들어야 합니다. 서버 주소를 넣기 전에는 사이트에서 사진 분석 버튼을 누르면 '곧 열려요' 안내가 나오고, 음식 검색은 그대로 쓸 수 있습니다.

1. **Anthropic API 키 만들기**: platform.claude.com(Claude 콘솔)에 가입 → 결제 정보·크레딧 등록 → API Keys에서 새 키 만들기 → 키를 복사해 둡니다. **월 사용 한도(Limits)를 꼭 정해 두세요.** 사진 1장마다 요금이 나갑니다.
2. **Cloudflare Worker 만들기**: dash.cloudflare.com 무료 가입 → Workers & Pages → Create → Worker 만들기(이름 예: `eatburn-photo`) → Deploy.
3. **코드 붙여 넣기**: 만든 Worker에서 Edit code → 기존 코드를 지우고 `server/worker.js` 내용을 통째로 붙여 넣기 → Deploy.
4. **키 넣기**: Worker의 Settings → Variables and Secrets → Add → 종류 **Secret**, 이름 `ANTHROPIC_API_KEY`, 값에 1번에서 복사한 키 → 저장(Deploy).
5. **주소 넣기**: Worker 주소(예: `https://eatburn-photo.아이디.workers.dev`)를 복사해서 `index.html`의 `사진 인식 설정` → `endpoint: ""` 따옴표 안에 붙여 넣고 저장 → GitHub에 다시 올리기.

- 다른 사이트가 이 서버를 쓰지 못하게 `server/worker.js`의 `ALLOWED_ORIGINS`에 이 홈페이지 주소만 들어 있어요. 주소가 바뀌면 같이 바꿔 주세요.
- API 키는 비밀번호와 같아요. GitHub나 index.html에는 절대 적지 마세요.

## 참고

- 칼로리는 일반적인 1인분 기준의 대략 값입니다.
- 운동 소모 칼로리는 `MET × 3.5 × 체중(kg) ÷ 200` 으로 계산합니다.
