'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import { useEffect, useRef, useCallback, useState } from 'react';
import { Trash2, GripVertical } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface KakaoMapOptions {
  // 확장을 위한 옵션 인터페이스 (현재 사용하지 않음)
}

export interface KakaoMapAttributes {
  timestamp: string;
  key: string;
  mapWidth: number;
  mapHeight: number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    kakaoMap: {
      setKakaoMap: (options: KakaoMapAttributes) => ReturnType;
    };
  }
}

// 카카오맵 스크립트가 로드되어 있는지 확인 (root layout에서 beforeInteractive로 로드)
function isKakaoMapScriptLoaded(): boolean {
  const daum = (window as unknown as { daum?: { roughmap?: { Lander?: unknown } } }).daum;
  return !!daum?.roughmap?.Lander;
}

// KakaoMapComponent - 에디터 내 미리보기
function KakaoMapComponent({ node, deleteNode, selected }: NodeViewProps) {
  const { timestamp, key, mapWidth, mapHeight } = node.attrs;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInitialized = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  const handleDelete = useCallback(() => {
    deleteNode();
  }, [deleteNode]);

  useEffect(() => {
    if (!timestamp || !key || mapInitialized.current) return;

    const initMap = () => {
      // 스크립트가 로드되어 있는지 확인 (root layout에서 beforeInteractive로 로드됨)
      if (!isKakaoMapScriptLoaded()) {
        // 에디터에서는 placeholder로 표시 (실제 지도는 공개 페이지에서 렌더링)
        setShowPlaceholder(true);
        setIsLoading(false);
        return;
      }

      try {
        const daum = (window as unknown as { daum?: { roughmap?: { Lander?: unknown } } }).daum;

        if (containerRef.current && !mapInitialized.current) {
          const containerId = `daumRoughmapContainer${timestamp}`;
          containerRef.current.id = containerId;
          containerRef.current.className = 'root_daum_roughmap root_daum_roughmap_landing';

          // Lander 생성자 타입 정의
          const LanderClass = daum!.roughmap!.Lander as new (options: {
            timestamp: string;
            key: string;
            mapWidth: string;
            mapHeight: string;
          }) => { render: () => void };

          new LanderClass({
            timestamp,
            key,
            mapWidth: String(mapWidth),
            mapHeight: String(mapHeight),
          }).render();

          mapInitialized.current = true;
          setIsLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '지도를 로드하지 못했습니다.');
        setIsLoading(false);
      }
    };

    initMap();
  }, [timestamp, key, mapWidth, mapHeight]);

  return (
    <NodeViewWrapper className="kakao-map-wrapper my-4">
      <div
        className={`relative ${selected ? 'ring-2 ring-blue-500 ring-offset-2 rounded' : ''}`}
        style={{ width: mapWidth, maxWidth: '100%' }}
      >
        {/* 툴바 - 선택 시에만 표시 */}
        {selected && (
          <div className="absolute -top-10 left-0 flex items-center gap-1 bg-black/80 rounded px-1 py-1 z-20">
            {/* 드래그 핸들 */}
            <div
              data-drag-handle
              className="w-6 h-6 cursor-grab flex items-center justify-center hover:bg-white/20 rounded"
              title="드래그하여 이동"
            >
              <GripVertical className="w-4 h-4 text-white" />
            </div>
            <div className="w-px h-4 bg-white/30" />
            {/* 삭제 버튼 */}
            <button
              type="button"
              onClick={handleDelete}
              className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded"
              title="삭제"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* 로딩 상태 */}
        {isLoading && (
          <div
            className="flex items-center justify-center bg-gray-100 rounded"
            style={{ width: mapWidth, height: mapHeight, maxWidth: '100%' }}
          >
            <span className="text-gray-500">지도 로딩 중...</span>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div
            className="flex items-center justify-center bg-red-50 border border-red-200 rounded"
            style={{ width: mapWidth, height: mapHeight, maxWidth: '100%' }}
          >
            <span className="text-red-500">{error}</span>
          </div>
        )}

        {/* Placeholder - 스크립트 미로드 시 */}
        {showPlaceholder && (
          <div
            className="flex flex-col items-center justify-center bg-blue-50 border border-blue-200 rounded"
            style={{ width: mapWidth, height: mapHeight, maxWidth: '100%' }}
          >
            <span className="text-blue-600 font-medium">📍 카카오맵</span>
            <span className="text-blue-500 text-sm mt-1">{mapWidth} × {mapHeight}</span>
            <span className="text-blue-400 text-xs mt-2">발행 시 지도가 표시됩니다</span>
          </div>
        )}

        {/* 지도 컨테이너 */}
        <div
          ref={containerRef}
          style={{
            width: mapWidth,
            height: mapHeight,
            maxWidth: '100%',
            display: isLoading || error ? 'none' : 'block',
          }}
        />

        {/* 사이즈 표시 */}
        {selected && !isLoading && !error && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
            {mapWidth} × {mapHeight}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// KakaoMap Tiptap Node Extension
export const KakaoMap = Node.create<KakaoMapOptions>({
  name: 'kakaoMap',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      timestamp: {
        default: null,
      },
      key: {
        default: null,
      },
      mapWidth: {
        default: 640,
      },
      mapHeight: {
        default: 360,
      },
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
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-kakao-map': '',
        'data-timestamp': HTMLAttributes.timestamp,
        'data-key': HTMLAttributes.key,
        'data-map-width': HTMLAttributes.mapWidth,
        'data-map-height': HTMLAttributes.mapHeight,
      }),
    ];
  },

  addCommands() {
    return {
      setKakaoMap:
        (options) =>
        ({ commands }) => {
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
