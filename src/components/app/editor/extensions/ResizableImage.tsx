'use client';

import Image from '@tiptap/extension-image';
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { GripVertical, Square, LayoutGrid } from 'lucide-react';

// 이미지 리사이즈 컴포넌트
function ResizableImageComponent({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, width, height, displayMode, textAlign } = node.attrs;
  const isInline = displayMode === 'inline';
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 이미지 로드 시 사이즈 업데이트
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.offsetWidth,
        height: imageRef.current.offsetHeight,
      });
    }
  }, []);

  // 리사이즈 시작
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const img = imageRef.current;
    if (!img) return;

    setIsResizing(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ width: img.offsetWidth, height: img.offsetHeight });
  }, []);

  // 리사이즈 중
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.x;
      const newWidth = Math.max(100, startSize.width + deltaX);
      const aspectRatio = startSize.height / startSize.width;
      const newHeight = Math.round(newWidth * aspectRatio);

      updateAttributes({
        width: newWidth,
        height: newHeight,
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startPos, startSize, updateAttributes]);

  const alignClass = isInline ? '' : {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[textAlign as string] || '';

  const wrapperClass = isInline
    ? 'inline-block align-top'
    : `block ${alignClass}`;

  return (
    <NodeViewWrapper as={isInline ? 'span' : 'div'} className={wrapperClass}>
      <div
        ref={containerRef}
        className={`relative inline-block ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
      >
        {/* 이미지 툴바 - 선택 시에만 표시 */}
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
            {/* 블록/인라인 전환 */}
            <button
              type="button"
              onClick={() => updateAttributes({ displayMode: 'block' })}
              className={`w-6 h-6 flex items-center justify-center rounded ${!isInline ? 'bg-white/30' : 'hover:bg-white/20'}`}
              title="단독 배치 (블록)"
            >
              <Square className="w-4 h-4 text-white" />
            </button>
            <button
              type="button"
              onClick={() => updateAttributes({ displayMode: 'inline' })}
              className={`w-6 h-6 flex items-center justify-center rounded ${isInline ? 'bg-white/30' : 'hover:bg-white/20'}`}
              title="나란히 배치 (인라인)"
            >
              <LayoutGrid className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={src}
          alt={alt || ''}
          width={width || undefined}
          height={height || undefined}
          className="max-w-full h-auto block"
          style={{
            width: width ? `${width}px` : undefined,
            height: height ? `${height}px` : undefined,
          }}
          draggable={false}
          onLoad={handleImageLoad}
        />

        {/* 리사이즈 핸들 - 선택 시에만 표시 */}
        {selected && (
          <>
            {/* 우하단 핸들 */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize rounded-sm transform translate-x-1/2 translate-y-1/2 hover:bg-blue-600 transition-colors z-10"
              onMouseDown={handleResizeStart}
            />
            {/* 사이즈 표시 */}
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
              {Math.round(width || imageSize.width || 0)} ×{' '}
              {Math.round(height || imageSize.height || 0)}
            </div>
          </>
        )}

        {/* 리사이징 중일 때 오버레이 */}
        {isResizing && <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />}
      </div>
    </NodeViewWrapper>
  );
}

// 리사이저블 이미지 익스텐션 - 기본 Image 확장을 확장
export const ResizableImage = Image.extend({
  inline: true,
  group: 'inline',
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      displayMode: {
        default: 'block',
        parseHTML: (element) => element.getAttribute('data-display-mode') || 'block',
        renderHTML: (attributes) => {
          const mode = attributes.displayMode;
          if (!mode || mode === 'block') {
            return { 'data-display-mode': 'block' };
          }
          return { 'data-display-mode': mode };
        },
      },
      textAlign: {
        default: 'left',
        parseHTML: (element) => element.getAttribute('data-text-align') || 'left',
        renderHTML: (attributes) => {
          const align = attributes.textAlign;
          if (!align || align === 'left') {
            return {};
          }
          const styleMap: Record<string, string> = {
            center: 'display: block; margin-left: auto; margin-right: auto;',
            right: 'display: block; margin-left: auto;',
          };
          return {
            'data-text-align': align,
            style: styleMap[align] || '',
          };
        },
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute('width');
          return width ? parseInt(width, 10) : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const height = element.getAttribute('height');
          return height ? parseInt(height, 10) : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {};
          }
          return { height: attributes.height };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});
