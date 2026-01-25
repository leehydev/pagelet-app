# [FE] Tiptap 에디터 카카오맵 지도 퍼가기 기능

## GitHub 이슈
- **이슈 번호**: #92
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/92
- **생성일**: 2025-01-25
- **우선순위**: 중간
- **관련 태스크**: 없음 (프론트엔드 단독 작업)

## 개요

Tiptap 에디터에 카카오맵 "지도 퍼가기" 기능을 추가합니다. 사용자가 카카오맵에서 복사한 HTML 코드를 에디터에 삽입하고, 공개 블로그에서 실제 지도로 렌더링되도록 구현합니다.

### 사용자 시나리오
1. 사용자가 카카오맵에서 "지도 퍼가기"로 HTML 코드를 복사
2. Tiptap 에디터의 "카카오맵 삽입" 버튼 클릭
3. 모달에서 복사한 HTML 붙여넣기
4. 에디터에서 지도 미리보기 확인
5. 저장 후 공개 블로그에서 실제 지도 렌더링

### 카카오맵 퍼가기 HTML 구조
```html
<!-- 1. 지도 노드 -->
<div id="daumRoughmapContainer1769349732965" class="root_daum_roughmap root_daum_roughmap_landing"></div>
<!-- 2. 설치 스크립트 -->
<script charset="UTF-8" class="daum_roughmap_loader_script" src="https://ssl.daumcdn.net/dmaps/map_js_init/roughmapLoader.js"></script>
<!-- 3. 실행 스크립트 -->
<script charset="UTF-8">
    new daum.roughmap.Lander({
        "timestamp" : "1769349732965",
        "key" : "g9d53kwr3s9",
        "mapWidth" : "640",
        "mapHeight" : "360"
    }).render();
</script>
```

## 작업 범위

### 포함
- KakaoMap Tiptap Node Extension 구현
- KakaoMapComponent (에디터 내 미리보기)
- KakaoMapInsertButton (HTML 붙여넣기 모달)
- HTML 파서 유틸리티
- PostContent 렌더링 업데이트 (공개 페이지)
- MediaMenu 업데이트
- DOMPurify 설정 업데이트 (카카오맵 관련 태그/속성 허용)

### 제외
- 백엔드 API 변경 (프론트엔드만 작업)
- 카카오맵 API 키 관리 (퍼가기 HTML 자체에 포함됨)
- 지도 위치/마커 편집 기능 (퍼가기 HTML 그대로 사용)

## 기술 명세

### 영향받는 파일

#### 신규 생성
- `src/components/app/editor/extensions/KakaoMap.tsx` - KakaoMap Node Extension
- `src/components/app/editor/menu/media/KakaoMapInsertButton.tsx` - 삽입 버튼 + 모달
- `src/lib/kakaomap-parser.ts` - HTML 파싱 유틸리티

#### 수정 필요
- `src/components/app/editor/extensions.ts` - KakaoMap Extension 등록
- `src/components/app/editor/menu/media/MediaMenu.tsx` - KakaoMap 버튼 추가
- `src/components/app/post/PostContent.tsx` - 카카오맵 렌더링 로직 추가
- `src/lib/sanitize.ts` - 카카오맵 관련 태그/속성 허용

### KakaoMap Node Extension 설계

```typescript
// src/components/app/editor/extensions/KakaoMap.tsx
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';

export interface KakaoMapOptions {
  // 기본 옵션
}

export interface KakaoMapAttributes {
  timestamp: string;  // 카카오맵 고유 ID
  key: string;        // 카카오맵 키
  mapWidth: number;   // 지도 너비
  mapHeight: number;  // 지도 높이
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    kakaoMap: {
      setKakaoMap: (options: KakaoMapAttributes) => ReturnType;
    };
  }
}

// KakaoMapComponent - 에디터 내 미리보기
function KakaoMapComponent({ node, deleteNode, selected }: NodeViewProps) {
  // roughmapLoader.js 동적 로드
  // daum.roughmap.Lander 초기화
  // 리사이즈, 삭제 기능
}

export const KakaoMap = Node.create<KakaoMapOptions>({
  name: 'kakaoMap',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      timestamp: { default: null },
      key: { default: null },
      mapWidth: { default: 640 },
      mapHeight: { default: 360 },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-kakao-map]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-kakao-map': '',
      'data-timestamp': HTMLAttributes.timestamp,
      'data-key': HTMLAttributes.key,
      'data-map-width': HTMLAttributes.mapWidth,
      'data-map-height': HTMLAttributes.mapHeight,
    })];
  },

  addCommands() {
    return {
      setKakaoMap: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(KakaoMapComponent);
  },
});
```

### HTML 파서 유틸리티

```typescript
// src/lib/kakaomap-parser.ts
export interface KakaoMapParams {
  timestamp: string;
  key: string;
  mapWidth: number;
  mapHeight: number;
}

/**
 * 카카오맵 퍼가기 HTML에서 파라미터 추출
 * @param html 카카오맵 퍼가기 HTML
 * @returns 파싱된 파라미터 또는 null (파싱 실패 시)
 */
export function parseKakaoMapHtml(html: string): KakaoMapParams | null {
  // 1. new daum.roughmap.Lander({...}).render() 패턴 찾기
  // 2. JSON 파라미터 추출
  // 3. timestamp, key, mapWidth, mapHeight 반환
}

/**
 * 유효한 카카오맵 HTML인지 검증
 */
export function isValidKakaoMapHtml(html: string): boolean {
  // roughmapLoader.js 스크립트 포함 확인
  // daum.roughmap.Lander 호출 확인
}
```

### KakaoMapInsertButton 설계

```typescript
// src/components/app/editor/menu/media/KakaoMapInsertButton.tsx
// YoutubeInsertButton 패턴 참고

export function KakaoMapInsertButton({ editor }: { editor: Editor }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [htmlInput, setHtmlInput] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  const handleInsert = useCallback(() => {
    const params = parseKakaoMapHtml(htmlInput);
    if (!params) {
      setParseError('올바른 카카오맵 HTML이 아닙니다.');
      return;
    }

    editor?.commands.setKakaoMap(params);
    setHtmlInput('');
    setIsModalOpen(false);
  }, [editor, htmlInput]);

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} title="카카오맵 추가">
        <MapPin className="h-4 w-4" />
      </Button>

      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {/* 모달 내용 */}
        <Textarea
          placeholder="카카오맵 퍼가기 HTML을 붙여넣으세요"
          value={htmlInput}
          onChange={(e) => setHtmlInput(e.target.value)}
        />
        {parseError && <p className="text-red-500">{parseError}</p>}
      </AlertDialog>
    </>
  );
}
```

### PostContent 렌더링 업데이트

```typescript
// src/components/app/post/PostContent.tsx
// 카카오맵 노드를 감지하고 실제 지도로 렌더링

export function PostContent({ html, className = '' }: PostContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // data-kakao-map 요소 찾기
    const kakaoMapElements = containerRef.current.querySelectorAll('[data-kakao-map]');
    if (kakaoMapElements.length === 0) return;

    // roughmapLoader.js 로드 (한 번만)
    loadKakaoMapScript().then(() => {
      kakaoMapElements.forEach((element) => {
        const timestamp = element.getAttribute('data-timestamp');
        const key = element.getAttribute('data-key');
        const mapWidth = element.getAttribute('data-map-width');
        const mapHeight = element.getAttribute('data-map-height');

        if (timestamp && key) {
          // 실제 지도 컨테이너 ID 생성
          const containerId = `daumRoughmapContainer${timestamp}`;
          element.id = containerId;
          element.className = 'root_daum_roughmap root_daum_roughmap_landing';

          // 지도 초기화
          new (window as any).daum.roughmap.Lander({
            timestamp,
            key,
            mapWidth: mapWidth || '640',
            mapHeight: mapHeight || '360',
          }).render();
        }
      });
    });
  }, [html]);

  // ... 기존 렌더링 로직
}

// 스크립트 로드 유틸리티
let kakaoMapScriptLoaded = false;
function loadKakaoMapScript(): Promise<void> {
  if (kakaoMapScriptLoaded) return Promise.resolve();

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://ssl.daumcdn.net/dmaps/map_js_init/roughmapLoader.js';
    script.charset = 'UTF-8';
    script.onload = () => {
      kakaoMapScriptLoaded = true;
      resolve();
    };
    document.head.appendChild(script);
  });
}
```

### sanitize.ts 업데이트

```typescript
// src/lib/sanitize.ts
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['iframe'], // YouTube embed 허용
    ADD_ATTR: [
      'allow', 'allowfullscreen', 'frameborder', 'scrolling',
      // 카카오맵 속성 추가
      'data-kakao-map',
      'data-timestamp',
      'data-key',
      'data-map-width',
      'data-map-height',
    ],
  });
}
```

## 구현 체크리스트

### 1. 기반 작업
- [ ] `src/lib/kakaomap-parser.ts` - HTML 파싱 유틸리티 구현
- [ ] `src/lib/kakaomap-parser.test.ts` - 파서 테스트

### 2. Tiptap Extension
- [ ] `src/components/app/editor/extensions/KakaoMap.tsx` - Node Extension 구현
- [ ] KakaoMapComponent - 에디터 내 미리보기 컴포넌트
- [ ] `src/components/app/editor/extensions.ts` - Extension 등록

### 3. UI 컴포넌트
- [ ] `src/components/app/editor/menu/media/KakaoMapInsertButton.tsx` - 삽입 모달
- [ ] `src/components/app/editor/menu/media/MediaMenu.tsx` - 버튼 추가

### 4. 공개 페이지 렌더링
- [ ] `src/components/app/post/PostContent.tsx` - 카카오맵 렌더링 로직
- [ ] `src/lib/sanitize.ts` - 카카오맵 속성 허용

### 5. 테스트 및 검증
- [ ] 에디터에서 카카오맵 삽입/미리보기 테스트
- [ ] 저장 후 HTML 출력 확인
- [ ] 공개 페이지에서 지도 렌더링 테스트
- [ ] 여러 개 지도 삽입 시 동작 확인
- [ ] 리사이즈/삭제 기능 테스트

## 테스트 계획

### 단위 테스트
- [ ] `kakaomap-parser.ts` - 다양한 HTML 입력에 대한 파싱 테스트
  - 정상 HTML 파싱
  - 잘못된 HTML 처리
  - 누락된 파라미터 처리

### 수동 테스트
- [ ] 카카오맵에서 실제 "지도 퍼가기" HTML 복사하여 테스트
- [ ] 다양한 지도 크기 테스트 (작은/큰 지도)
- [ ] 모바일 반응형 테스트
- [ ] 여러 지도 동시 렌더링 테스트

## 참고 자료

### 기존 코드 패턴
- 커스텀 Extension: `src/components/app/editor/extensions/ResizableImage.tsx`
- 외부 콘텐츠 삽입: `src/components/app/editor/menu/media/YoutubeInsertButton.tsx`
- Extension 등록: `src/components/app/editor/extensions.ts`
- HTML 렌더링: `src/components/app/post/PostContent.tsx`
- HTML Sanitization: `src/lib/sanitize.ts`

### 기술 고려사항
- roughmapLoader.js는 한 번만 로드 (전역 스크립트 관리)
- Next.js SSR/CSR 고려 (클라이언트에서만 지도 초기화)
- CSP 설정 확인 필요 (ssl.daumcdn.net 도메인 허용)
