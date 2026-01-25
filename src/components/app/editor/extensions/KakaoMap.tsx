'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import { useCallback, useState } from 'react';
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

// KakaoMapComponent - 에디터 내 미리보기 (iframe 방식)
function KakaoMapComponent({ node, deleteNode, selected }: NodeViewProps) {
  const { timestamp, key, mapWidth, mapHeight } = node.attrs;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = useCallback(() => {
    deleteNode();
  }, [deleteNode]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setError('지도를 로드하지 못했습니다.');
    setIsLoading(false);
  }, []);

  // iframe URL 생성
  const iframeSrc = timestamp && key
    ? `/kakaomap.html?timestamp=${timestamp}&key=${key}&width=${mapWidth}&height=${mapHeight}`
    : null;

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
        {isLoading && !error && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded"
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

        {/* 지도 iframe */}
        {iframeSrc && !error && (
          <iframe
            src={iframeSrc}
            width={mapWidth}
            height={mapHeight}
            style={{ border: 0, maxWidth: '100%', display: 'block' }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="카카오맵"
          />
        )}

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
