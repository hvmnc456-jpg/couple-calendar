# 우리캘린더 하단 탭바 위치 수정 기록

**날짜:** 2026-06-01  
**증상:** 모바일 화면에서 하단 탭바가 뷰포트 최하단이 아닌 위로 떠 있는 상태

---

## 근본 원인

iOS Safari에서 `body { overflow: hidden }`이 있으면 `position: fixed` 요소가 뷰포트 기준이 아닌 **body 기준**으로 동작하는 버그.  
`body`의 `height: 100%`가 실제 화면 높이보다 작을 경우 `fixed; bottom: 0`이 화면 최하단이 아닌 body 바닥에 붙어 탭바가 떠 보이는 현상 발생.

---

## 최종 수정 내용

### 1. CSS — `overflow: hidden` 제거 (핵심 수정)

```css
/* 수정 전 */
html, body { height: 100%; overflow: hidden; background: #F9F9F9; }

/* 수정 후 */
html, body { height: 100%; overscroll-behavior: none; background: #F9F9F9; }
```

- `overflow: hidden` → `overscroll-behavior: none` 으로 교체
- 스크롤 방지 기능은 유지하면서 iOS Safari fixed 버그 해결

---

### 2. App 최상위 컨테이너 — `position: fixed; inset: 0`

```jsx
/* 수정 전 */
<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', ... }}>

/* 수정 후 */
<div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', ... }}>
```

- `height: 100%` 체인 대신 `position: fixed; inset: 0` 으로 항상 정확히 뷰포트 전체를 덮음
- 동적 주소창(iOS Safari, Android Chrome) 표시/숨김에도 영향받지 않음

---

### 3. BTBar — `position: fixed; bottom: 0` + 나.시.단 패턴 적용

```jsx
<div style={{
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  boxSizing: 'content-box',   // 나.시.단 패턴
  height: 51,                  // 버튼 영역 고정 높이
  paddingTop: 8,
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',  // iOS safe area
  background: V.surf,
  borderTop: `1px solid ${V.ol}`,
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'flex-start',
  zIndex: 100,
}}>
```

- `box-sizing: content-box` + `height: 51px` → 버튼 영역은 고정
- `padding-bottom: env(safe-area-inset-bottom)` → iOS 홈 인디케이터 아래까지 배경색 연장
- 총 높이 = `paddingTop(8) + height(51) + env(sab)` = `59px + safe-area-inset-bottom`

---

### 4. Spacer — BTBar 높이만큼 flex 공간 확보

```jsx
/* BTBar 바로 앞에 추가 */
<div style={{ height: 'calc(59px + env(safe-area-inset-bottom, 0px))', flexShrink: 0 }} />
<BTBar active={tab} setActive={setTab} />
```

- `position: fixed` BTBar는 flex flow에서 빠지므로 콘텐츠가 탭바 아래로 가려지지 않도록 동일 높이의 spacer 삽입

---

## 참고: 나.시.단 프로젝트에서 가져온 패턴

나.시.단(`C:\Users\user\fitness-tracker\src\index.css`)에서 동일 문제를 해결한 방식:

```css
html, body {
  height: 100%;
  overscroll-behavior: none;  /* overflow: hidden 사용 안 함 */
}

.nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: var(--nav-h);          /* 56px — 버튼 영역 고정 */
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-sizing: content-box;       /* padding이 height에 포함되지 않음 */
  align-items: flex-start;
  z-index: 50;
}

.content {
  padding-bottom: calc(var(--nav-h) + env(safe-area-inset-bottom, 0px));
}
```

---

## 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `C:\Users\user\Couple Calendar.html` | CSS + BTBar JSX + App container JSX |
| `C:\Users\user\couple-calendar\index.html` | 위 파일 동기화 |
| `C:\Users\user\couple-calendar\version.json` | 배포 타임스탬프 갱신 |

**배포 URL:** https://couple-calendar-amber.vercel.app  
**GitHub commit:** `7e58a1d` — fix: remove overflow:hidden from body (iOS Safari fixed bug), BTBar content-box height
