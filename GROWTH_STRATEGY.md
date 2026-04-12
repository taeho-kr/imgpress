# ImgPress 트래픽 성장 전략

> 목표: 수익화 이전 단계로, 오가닉 트래픽을 최대한 확보한다.
> 작성일: 2026-04-12

---

## 현재 상태 분석

### 강점
- **프라이버시 퍼스트**: 서버 업로드 없이 100% 브라우저에서 처리 → 강력한 차별점
- **10개 언어 지원**: 글로벌 SEO 기반 이미 확보
- **PWA/오프라인**: 설치 가능, 오프라인 동작
- **가벼운 기술 스택**: WASM 없이 Canvas API + Web Worker로 빠른 처리

### 약점
- 단일 기능(압축/변환)만 존재 → 검색 유입 키워드 제한적
- 콘텐츠 페이지 부재 → 롱테일 SEO 기회 미활용
- 소셜 공유/바이럴 요소 없음

---

## Phase 1: SEO 확장 (1~2개월)

### 1-1. 변환 전용 랜딩 페이지

각 포맷 조합별 전용 페이지를 만들어 롱테일 검색을 잡는다.

| 페이지 | 타겟 키워드 예시 |
|--------|------------------|
| `/jpg-to-webp` | "jpg to webp converter online free" |
| `/png-to-webp` | "png to webp online" |
| `/png-to-jpg` | "png to jpg converter" |
| `/webp-to-jpg` | "webp to jpg online" |
| `/webp-to-png` | "convert webp to png" |
| `/bmp-to-jpg` | "bmp to jpg online" |
| `/gif-to-webp` | "gif to webp converter" |
| `/heic-to-jpg` | "heic to jpg online free" |

**구현 방식:**
- 각 페이지는 동일한 압축 컴포넌트를 재사용하되, 기본 입력/출력 포맷이 프리셋됨
- 포맷별 설명, FAQ, 용량 비교 차트 등 고유 콘텐츠 포함
- 10개 언어 × N개 포맷 조합 = 대량 인덱싱 가능 페이지
- 각 페이지에 JSON-LD 구조화 데이터 (HowTo, FAQPage) 추가

**예상 효과:** 월 검색량 높은 "X to Y converter" 키워드 직접 타겟팅

### 1-2. 가이드/비교 콘텐츠 페이지

`/blog` 또는 `/guide` 경로에 SEO 콘텐츠 추가:

- "WebP vs JPEG vs PNG: 어떤 포맷을 써야 할까?"
- "웹사이트 이미지 최적화 완전 가이드"
- "이미지 품질 손실 없이 용량 줄이는 방법"
- "HEIC 파일이란? iPhone 사진을 JPG로 변환하는 법"
- "AVIF vs WebP: 차세대 이미지 포맷 비교"

이 콘텐츠는 정보성 검색 쿼리를 잡고, 자연스럽게 도구 사용으로 유도한다.

### 1-3. 기술적 SEO 강화

- [ ] Google Search Console 등록 및 모니터링
- [ ] 각 언어별 sitemap 분리 (`sitemap-en.xml`, `sitemap-ko.xml` 등)
- [ ] Core Web Vitals 최적화 (LCP, CLS, FID)
- [ ] 이미지 포맷별 페이지에 BreadcrumbList 구조화 데이터 추가
- [ ] 각 페이지에 canonical URL 명시

---

## Phase 2: 기능 확장으로 검색 표면 넓히기 (2~3개월)

사용자가 많이 검색하는 이미지 관련 기능을 추가하여 유입 키워드를 넓힌다.

### 2-1. 높은 검색량 기능 (우선순위 높음)

| 기능 | 이유 |
|------|------|
| **이미지 리사이즈** | "resize image online" 월 검색량 매우 높음 |
| **HEIC → JPG 변환** | iPhone 사용자 대부분이 검색하는 키워드 |
| **이미지 자르기 (Crop)** | "crop image online" 높은 검색량 |
| **EXIF 데이터 제거** | 프라이버시 관심 사용자 유입 + 기존 브랜드 일관성 |

### 2-2. 차별화 기능 (중간 우선순위)

| 기능 | 이유 |
|------|------|
| **AVIF 포맷 지원** | 차세대 포맷, 경쟁자 대비 선점 가능 |
| **워터마크 추가** | 크리에이터/블로거 유입 |
| **이미지 메타데이터 뷰어** | SEO/개발자 도구로서 검색 유입 |
| **배경 제거 (AI)** | "remove background online" 엄청난 검색량. 단, 기술 난이도 높음 |

### 2-3. 개발자 타겟 기능 (낮은 우선순위)

| 기능 | 이유 |
|------|------|
| **브라우저 확장 프로그램** | 우클릭 → 바로 압축/변환. GitHub 별도 배포 |
| **npm 패키지** | 개발자 커뮤니티 침투 + GitHub 스타 |
| **API 엔드포인트** | 개발자 도구 디렉토리 등재 가능 (수익화 단계에서도 유용) |

---

## Phase 3: 바이럴 & 커뮤니티 (지속적)

### 3-1. Product Hunt 런칭

- 제목 예시: "ImgPress – Compress images in your browser. No upload. No server. 100% private."
- 프라이버시 앵글이 Product Hunt에서 강력한 훅
- 런칭 전 준비: 메이커 코멘트, GIF 데모, 비교 벤치마크

### 3-2. 커뮤니티 & 백링크

| 채널 | 액션 |
|------|------|
| **Reddit** | r/webdev, r/selfhosted, r/privacytools에 소개 |
| **Hacker News** | "Show HN" 포스트 (기술적 차별점 강조) |
| **dev.to / Medium** | "Canvas API로 브라우저에서 이미지 압축하기" 기술 블로그 |
| **GitHub Awesome 리스트** | awesome-privacy, awesome-web-tools 등에 PR |
| **alternativeto.net** | TinyPNG, Squoosh 대안으로 등록 |
| **디자이너 커뮤니티** | Dribbble, Behance 도구 공유 |

### 3-3. 소셜 공유 기능 추가

- 압축 결과 공유 카드: "이미지 78% 줄였어요! 🎉" (압축률 포함 OG 이미지)
- 결과 페이지에 Twitter/X 공유 버튼
- 누적 압축 통계 배지 ("이 도구로 10만 장이 압축되었습니다")

---

## Phase 4: 크로스 프로모션 (random-korea와 연계)

- imgpress에서 random-korea 배너: "여행 어디 갈지 고민? 랜덤으로 정해보세요"
- random-korea의 여행 이미지 공유 시 imgpress로 최적화 제안
- 두 서비스 공통 "taeho.world 도구 모음" 허브 페이지 구축 가능

---

## 핵심 KPI

| 지표 | 측정 방법 | 목표 (6개월) |
|------|-----------|-------------|
| 월간 오가닉 방문자 | Google Analytics | 10,000+ |
| 인덱싱된 페이지 수 | Google Search Console | 100+ |
| 평균 세션 시간 | Google Analytics | 2분+ |
| GitHub 스타 | GitHub | 100+ |
| 백링크 도메인 수 | Ahrefs/Search Console | 30+ |

---

## 실행 우선순위 요약

```
즉시 실행 가능 (1~2주)
├── 포맷 변환 전용 랜딩 페이지 (jpg-to-webp 등)
├── Google Search Console 등록
└── Product Hunt 준비

단기 (1~2개월)
├── HEIC → JPG 변환 기능
├── 이미지 리사이즈 기능
├── 가이드 콘텐츠 3~5편
└── Reddit/HN 소개 포스트

중기 (3~4개월)
├── 이미지 자르기, EXIF 제거
├── AVIF 지원
├── 브라우저 확장 프로그램
└── 소셜 공유 카드 기능

장기 (5~6개월)
├── 배경 제거 (AI)
├── npm 패키지 / API
└── taeho.world 통합 허브
```
