# 피의 결투 · 인수인계 문서 (2026-10-22)

이 문서는 다른 AI(ChatGPT 등)나 사람이 이 게임 작업을 이어받을 때 **기존 파일을 망가뜨리지 않고** 이어서 작업할 수 있도록 정리한 것이다. 작업을 시작하기 전에 끝까지 읽을 것.

---

## 0. 가장 먼저 지킬 규칙 (파일 손상 방지)

1. **`index.html`을 통째로 다시 쓰지 말 것.** 약 4,400줄, 470KB짜리 단일 파일이다. AI가 전체를 다시 출력하면 중간이 잘리거나 "...기존 코드..." 같은 생략이 들어가서 게임이 통째로 망가진다. **반드시 바꿀 부분만 찾아서 고치는 방식**(검색 후 치환, 패치)으로 수정한다.
2. 수정 전후로 **파일 크기와 줄 수를 비교**한다. 갑자기 크게 줄었다면 무언가 잘린 것이니 커밋하지 말고 되돌린다.
   ```bash
   wc -l index.html online.js scenes.js; ls -l index.html
   ```
3. 수정한 뒤에는 **문법 검사**를 한다 (Node.js 필요).
   ```bash
   node -e "new Function(require('fs').readFileSync('online.js','utf8'));console.log('online ok')"
   node -e "new Function(require('fs').readFileSync('scenes.js','utf8'));console.log('scenes ok')"
   node -e "const s=require('fs').readFileSync('index.html','utf8');[...s.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach(m=>new Function(m[1]));console.log('index ok')"
   ```
4. **안전 복구 지점**: 이 문서를 만든 시점의 상태를 브랜치 `backup-2026-10-22`로 남겨 두었다. **이 브랜치는 절대 수정하지 말 것.** 망가지면 이렇게 되돌린다.
   ```bash
   git fetch origin backup-2026-10-22
   git checkout origin/backup-2026-10-22 -- index.html online.js scenes.js   # 파일만 되돌리기
   ```
   GitHub 웹에서도 저장소 → 브랜치 선택 → `backup-2026-10-22`에서 그때 파일을 볼 수 있다.
5. 한글 문자열이 많다. 파일 인코딩은 **UTF-8**을 유지할 것 (BOM 없이).
6. `firestore.rules`를 바꾸면 `rules.txt`도 **똑같이** 맞출 것 (운영자가 rules.txt를 복사해 Firebase 콘솔에 붙여넣는다).

---

## 1. 저장소와 주소

| 항목 | 위치 |
|---|---|
| 게임 저장소 | https://github.com/dewur-dot/blood-duel (브랜치 `main`) |
| 게임 주소 (GitHub Pages) | https://dewur-dot.github.io/blood-duel/ |
| 규칙 복사용 | https://dewur-dot.github.io/blood-duel/rules.txt |
| 후원 페이지 | https://dewur-dot.github.io/blood-duel/support.html (운영자용: `support.html?admin`) |
| 주소 보정용 저장소 | https://github.com/dewur-dot/dewur-dot.github.io — `index.html`과 `404.html`이 잘못된 경로를 전부 `/blood-duel/`로 넘겨준다 (`?invite=`와 `#duel-id=`를 그대로 유지). **건드릴 필요 없음.** |
| Firebase 프로젝트 | `blood-duel` (Cloud Firestore + 익명 로그인) |
| 카카오 JavaScript 키 | `363a5ec461b3de7d399600c177f25fdf` (카카오 개발자 콘솔에 `https://dewur-dot.github.io`가 "JavaScript SDK 도메인"과 "제품 링크 관리 웹 도메인" 둘 다에 등록돼 있어야 함) |

**배포 방식**: `main` 브랜치에 push하면 GitHub Pages가 1~2분 안에 자동 배포한다. 빌드 과정 없음, 순수 HTML/JS.

---

## 2. 파일 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 게임 본체. CSS, UI, 전투 엔진, 3D 렌더러(WebGL 직접 구현), 저장, 모든 화면이 한 파일에 있다. |
| `online.js` | Firebase 연동: 결투장 보내기/받기, 실시간 결과 감시, 랭킹, 쿠폰, 자비 결정, 사망 처리, 카카오 공유. `window.DuelOnline`으로 내보냄. |
| `scenes.js` | 2D 캔버스 장면: 전쟁터(`War`), 발할라(`Valhalla`, 부활의 제단 화산 장면 포함). `window.BDScenes`로 내보냄. 사람 그리기는 index.html의 3D 함수에 위임(`opt.render3d`). |
| `support.html` | 후원(공물) 신청 페이지와 운영자 페이지(입금 확인 → 쿠폰 코드 발급, 선물 쿠폰 만들기). |
| `support-config.js` | 계좌 정보, 골드 환산, **운영자 ID 목록** (`admins`). |
| `firebase-config.js` | Firebase 웹 설정 (공개해도 되는 값). |
| `firestore.rules` / `rules.txt` | Firestore 보안 규칙. 두 파일은 내용이 같아야 한다. |
| `README.md` | 예전 설명 (일부 낡음). |
| `.nojekyll` | GitHub Pages가 파일을 가공하지 않게 함. 지우지 말 것. |

### 캐시 무효화 (중요)
`index.html`이 스크립트를 `online.js?v=10221039`처럼 버전 번호를 붙여 부른다. `online.js`나 `scenes.js`를 고치면 **반드시 버전 번호도 올려야** 사용자 휴대폰이 새 파일을 받는다.
```bash
V=$(TZ=Asia/Seoul date +%m%d%H%M)
sed -i "s#online.js?v=[0-9]*#online.js?v=$V#; s#scenes.js?v=[0-9]*#scenes.js?v=$V#" index.html
```
(`support-config.js?v=`도 같은 방식, 해당 파일을 고쳤을 때만.)

---

## 3. 데이터 구조

### 개인 진행 상황: 브라우저 localStorage
- 키: `piui-gyeoldu-v4`, 전역 객체 `S`에 담겨 `saveState()`로 저장.
- 주요 필드: `hero`(현재 전사), `yard`(묘지/발할라, 최대 60), `gold`, `owned`, `renameT`(이름변경 쿠폰 수), `pendingDuel`(내가 보낸 대기 중 결투장 id), `duels`, `handledDuels`, `pendingReplay`, `offer`(부활 제물 수), `noInvite`, `blocked`, `flag`, `board`.
- 화면 상태는 전역 `view`(문자열)와 `ui` 객체. `render()`가 전체를 다시 그린다.

### 서버: Cloud Firestore 컬렉션
| 컬렉션 | 용도 |
|---|---|
| `duels` | 결투장. `status`: pending/accepted/declined/cancelled. `ownerUid`, `ownerHeroId`, `targetUid`(랭킹에서 직접 보낸 경우), `challenger`, `recipient`, `result`, `spared`(자비). |
| `heroes2` | 랭킹(시즌2). 문서 id = 전사 id. `alive`, `kills`, `uid`, `hero`(압축 데이터). 이긴 쪽이 결투 증거로 `alive:false` 처리 가능. |
| `heroes` | 시즌1 랭킹 (읽기 전용 보관). |
| `codes` | 쿠폰 코드. 운영자만 생성. `uid`(받을 사람), `to`(게임 안에서 선물한 경우), `gold`, `rename`, `redeemedBy`(한 번만 사용). |
| `donations` / `contacts` | 후원 신청과 연락처 (운영자만 열람). |
| `prefs` | 결투장 받기 거부/차단 설정 (`prefs/{uid}`). |

**운영자 ID** (Firebase 익명 로그인 uid): `W8sKysNV3Whf4WXSzkocqIvYSdg2`(휴대폰), `56b5mfSkMIfsefIvXC5UEeHyHPp2`(PC 브라우저). `support-config.js`의 `admins`와 `firestore.rules`의 `isAdmin()` **두 곳 모두**에 있어야 한다.

---

## 4. index.html 주요 함수 지도 (줄 번호는 대략, 검색해서 찾을 것)

| 함수 | 내용 |
|---|---|
| `fight(A,B)` (~612) | 전투 엔진. 날씨(맑음/흐림/비/폭풍/눈/폭염/봄), 번개, 미끄러짐, 출혈, 골절, 도주, 낭심 차기, 무승부 등. 한 결투 최대 30라운드. |
| `calcStats`, `newHero`, `grow` (~1067~1137) | 능력치 계산, 새 전사 생성, 승리 후 성장. |
| `build3`, `g3render`, `pose3` (~2567~2760) | 자체 WebGL 3D 사람 렌더러. **GL 버퍼 캐시를 지우면 "거대한 살덩이" 버그가 생긴다** — 캐시에서 참조만 빼고 버퍼는 삭제하지 말 것. |
| `loadState`/`saveState` (~2788) | 저장. |
| `settingsHtml` (~2991) | '오딘에게 청원' 탭: 후원, 쿠폰 입력, 받은 쿠폰, 결투장 받기 설정, 초기화. |
| `rankView`, `detailView` (~3048) | 명예의 전당(시즌, 현생/발할라, 국가 전쟁), 전사 상세(결투장 던지기, 운영자 쿠폰 내리기). |
| `baseUrl` (~3078) | 결투장 링크 기준 주소. github.io에서는 항상 `https://dewur-dot.github.io/blood-duel/`. |
| `render` (~3174) | 전체 화면 그리기 + 상단 배너(쿠폰 도착, 받은 결투장, 대기 중 결투장). |
| `warpIn`, `roll` | '생명을 얻는다' 연출과 새 전사 만들기. |
| `practiceFoe`, `newWar`, `warRun`, `war3d` | 연습 결투(하/중/상), 전쟁터(배 → 상륙 → 난전 → 적장 1:1). |
| `vhPose`, `vh3dRender`, `altarDrop`, `valhallaView`, `valhallaRun` | 발할라와 부활의 제단 (제물 3명 → 1명 부활). |
| `startFight`, `bury`, `reviveYard` | 결투 시작, 사망 처리(묘지로), 부활. `bury()`는 보낸 결투장을 자동 회수(`DuelOnline.dropPending`)한다. |
| `mercyAsk` | 이긴 쪽이 살려줄지 결정 (1분 지나면 자동 처형). |
| `sendDuel` | 결투장 던지기 (카카오톡 / 다른 앱 / 복사 선택). |
| 클릭 처리 | `data-act="..."` 속성으로 분기. `else if(a==='액션이름')` 형태. 클릭한 요소 변수 이름은 **`b`** (`b.dataset...`). |

---

## 5. 게임 규칙 요약 (기획 의도, 바꾸지 말 것)

- **체력 비례 피해 금지.** 한 방 피해 상한은 공격자 힘 기준: `(14+str*0.32)*(치명타?1.4:1)+무기`. 번개, 전쟁 피해는 고정 범위.
- 키는 **미터 단위로 표시** (예: 1.75m). 최대 5m. 거인은 느리지만 파괴력과 사거리가 크고, 작은 전사는 민첩하다. 무적은 없다.
- 연승 보상: 1승 투구, 3승 갑옷, 5승 바지, 10승 무기 뽑기. 5승마다 무작위 능력치 +2. 이름 색은 5/10/20/30/50승에서 바뀐다.
- 연습 결투는 죽지 않고 보상도 없다.
- 전쟁 보상은 지금 입은 등급의 장비, 30% 확률로 +2.
- 부활의 제단: 제물 3명을 바치면 1명 부활. 제물로 바친 전사는 영원히 사라진다.
- 문체: **야만적이고 사실적인 바이킹 말투** (유치한 표현 금지). 예: "놔라!! 이 비겁한 놈!!"

---

## 6. 작업 방식 (운영자 = 사용자 선호)

- 사용자는 **"자동으로 만들면 업로드"** 방식을 원한다: 수정이 끝나면 commit 후 `main`에 push. (사용자가 "업로드하지 마"라고 하면 멈춤.)
- 빨리 끝내기보다 **완성도**를 원한다.
- Firestore 규칙은 **부분 수정 안내 말고 전체를 줄 것**. `rules.txt`를 갱신하고 사용자에게 https://dewur-dot.github.io/blood-duel/rules.txt 를 복사해 Firebase 콘솔 → Firestore → 규칙에 붙여넣고 '게시'하라고 안내.
- 사용자는 한국어를 쓰고, 비개발자다. 단계별로 쉽게 설명할 것.

### 커밋/배포 순서
```bash
cd blood-duel
# 1) 수정 (부분 치환만)
# 2) 문법 검사 (0번의 명령)
# 3) online.js/scenes.js를 고쳤으면 캐시 버전 올리기 (2번의 명령)
git add -A && git commit -m "무엇을 바꿨는지" && git push
```

### 테스트 방법 (Claude가 쓰던 방식)
- Playwright + Chromium으로 `index.html`을 로컬에서 열고, Firebase는 가짜 모듈(mock)로 바꿔 끼워 두세 개의 브라우저를 동시에 띄워 결투 흐름을 확인했다. (이 테스트 스크립트들은 저장소에 없다.)
- 간단히는 GitHub Pages에 올린 뒤 **PC 브라우저 한 개 + 휴대폰 한 개**로 결투장 주고받기를 직접 해보면 된다.
- 콘솔에서 바로 상태 보기: 개발자도구에서 `view`, `S`, `ui` 전역 변수 확인 가능.

---

## 7. 최근 작업 (2026-10-21 ~ 22)

1. **부활의 제단**을 별도 화산 장면으로: 화산 폭발, 용암, 불덩이 비, 번개. 왼쪽 '제물의 제단'(0/3), 오른쪽 '부활의 제단'(빛기둥). 전사들은 위쪽에 두 줄로 모여 불규칙하게 함성, 머리 위에 이름. 끌어다 제단에 놓는다.
2. **운영자 쿠폰을 게임 안에서 지급**: 명예의 전당 → 전사 상세 → "운영자 · 쿠폰 내리기". 받은 사람은 실시간 배너 + '오딘에게 청원'의 "받은 쿠폰"에서 "사용하기".
3. **결투 먹통 버그 수정** (B가 보낸 결투장이 대기 중인데 B 전사가 죽어서 '생명을 얻는다'가 잠김, A가 남의 결투장을 받으면 A가 보낸 결투장이 취소됨):
   - 전사가 죽으면 보낸 결투장을 서버에서도 자동 취소.
   - 전사가 없으면 잠금 없음, "결투장 거두기" 항상 표시.
   - 시작할 때 묶인 결투장 자동 정리.
   - 결투장을 받아도 내가 보낸 결투장은 유지.
   - 죽은 전사가 보낸 결투장은 열면 "결투장을 보낸 전사는 이미 죽었다".
   - 공유창이 안 닫혀도 20초 뒤 보내기 잠금 해제.
4. **결투장 링크 404 수정**: 링크를 항상 정확한 주소로 만들고, `dewur-dot.github.io` 저장소의 넘겨주기 페이지로 잘린 주소도 게임으로 연결.

## 8. 남은 일 / 확인할 것

- 사용자가 `rules.txt`의 최신 규칙을 Firebase 콘솔에 게시했는지 확인 필요 (prefs, 직접 결투장, spared, heroes2 사망 처리, 운영자 2명). 게시 안 됐으면 결투장 직접 보내기 등에서 "권한 없음" 오류가 난다.
- 테스트하다 랭킹에 올라간 테스트 전사 "핫토리 히로시", "이반 소콜로프"가 있다. 지우려면 Firebase 콘솔 → Firestore → `heroes2`에서 직접 삭제.
- 랭킹은 `heroes2`를 통째로 읽는다(현재 약 260개). 사용자가 많아지면 Firestore 무료 한도(하루 읽기 5만)에 걸릴 수 있다 → 상위 N개만 읽도록 바꾸는 것을 고려.
- 카카오톡 안 브라우저에서 서버 응답이 멈추는 경우를 대비한 시간 초과 안내(예: "연결이 끊겼다, 다시 눌러라")는 아직 넣지 않았다.
