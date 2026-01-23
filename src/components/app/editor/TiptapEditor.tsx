'use client';

import { forwardRef, useImperativeHandle, useCallback, useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { extensions } from './extensions';
import { MenuBar } from './MenuBar';
import { useCharacterCount } from './hooks/useCharacterCount';
import { useUpload } from '@/hooks/use-upload';
import { Loader2 } from 'lucide-react';

export interface TiptapEditorRef {
  getEditor: () => Editor | null;
  getJSON: () => Record<string, unknown> | null;
  getHTML: () => string;
  getText: () => string;
}

interface TiptapEditorProps {
  siteId: string;
  content?: string | Record<string, unknown>;
  onEditorReady?: (editor: Editor) => void;
}

export const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  ({ siteId, content, onEditorReady }, ref) => {
    const { upload, uploadProgress, reset } = useUpload(siteId);

    // 이미지 파일 업로드
    const handleImageUpload = useCallback(
      async (file: File) => {
        // 이미지 파일인지 확인
        if (!file.type.startsWith('image/')) {
          return false;
        }

        // 지원하는 형식인지 확인
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          return false;
        }

        // 업로드 시작
        await upload(file, { imageType: 'CONTENT' });
        return true;
      },
      [upload],
    );

    const editor = useEditor({
      extensions,
      content: content || undefined,
      // Don't render immediately on the server to avoid SSR issues
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class:
            'prose prose-sm sm:prose-base lg:prose-lg max-w-none min-h-[200px] p-4 rounded-br-md rounded-bl-md bg-white focus:outline-none focus:ring-2 focus:ring-ring ring-offset-background placeholder:text-muted-foreground',
        },
        // 드래그&드롭 핸들러
        handleDrop: (view, event, _slice, moved) => {
          if (moved) {
            return false; // 에디터 내부 이동은 기본 동작 유지
          }

          const files = event.dataTransfer?.files;
          if (!files || files.length === 0) {
            return false;
          }

          const imageFile = Array.from(files).find((file) => file.type.startsWith('image/'));
          if (!imageFile) {
            return false;
          }

          event.preventDefault();

          // view.state가 유효하면 업로드 시작
          if (view.state.schema) {
            handleImageUpload(imageFile);
          }

          return true;
        },
        // 붙여넣기 핸들러
        handlePaste: (view, event) => {
          const items = event.clipboardData?.items;
          if (!items) {
            return false;
          }

          const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'));
          if (!imageItem) {
            return false;
          }

          const file = imageItem.getAsFile();
          if (!file) {
            return false;
          }

          event.preventDefault();

          // view.state가 유효하면 업로드 시작
          if (view.state.schema) {
            handleImageUpload(file);
          }

          return true;
        },
      },
      onUpdate: () => {
        // 에디터 업데이트 시 콜백 호출 (필요한 경우)
      },
    });

    // 업로드 완료 시 에디터에 이미지 삽입
    useEffect(() => {
      if (uploadProgress.status === 'completed' && uploadProgress.publicUrl && editor) {
        editor.chain().focus().setImage({ src: uploadProgress.publicUrl }).run();
        reset();
      }
    }, [uploadProgress.status, uploadProgress.publicUrl, editor, reset]);

    // editor가 준비되면 콜백 호출
    useEffect(() => {
      if (editor && onEditorReady) {
        onEditorReady(editor);
      }
    }, [editor, onEditorReady]);

    useImperativeHandle(ref, () => ({
      getEditor: () => editor,
      getJSON: () => {
        if (!editor) return null;
        try {
          return editor.getJSON();
        } catch {
          return null;
        }
      },
      getHTML: () => {
        if (!editor) return '';
        try {
          return editor.getHTML();
        } catch {
          return '';
        }
      },
      getText: () => {
        if (!editor) return '';
        try {
          return editor.getText();
        } catch {
          return '';
        }
      },
    }));

    const characterCount = useCharacterCount(editor);

    if (!editor || !characterCount) {
      return null;
    }

    const { charactersCount, wordsCount } = characterCount;

    // 업로드 중 상태
    const isUploading =
      uploadProgress.status === 'presigning' ||
      uploadProgress.status === 'uploading' ||
      uploadProgress.status === 'completing';

    return (
      <div className="border rounded-md">
        <MenuBar editor={editor} siteId={siteId} />

        {/* 업로드 진행 상태 표시 */}
        {isUploading && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploadProgress.status === 'presigning' && <span>업로드 준비 중...</span>}
              {uploadProgress.status === 'uploading' && (
                <span>업로드 중... {uploadProgress.progress}%</span>
              )}
              {uploadProgress.status === 'completing' && <span>업로드 완료 처리 중...</span>}
            </div>
            {uploadProgress.status === 'uploading' && (
              <div className="mt-1 w-full bg-blue-200 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* 업로드 에러 표시 */}
        {uploadProgress.status === 'error' && uploadProgress.error && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-100">
            <div className="flex items-center justify-between text-sm text-red-700">
              <span>{uploadProgress.error}</span>
              <button
                type="button"
                onClick={reset}
                className="text-red-500 hover:text-red-700 font-medium"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        <EditorContent editor={editor} />
        <div className="p-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {charactersCount} characters, {wordsCount} words
          </span>
        </div>
      </div>
    );
  },
);

TiptapEditor.displayName = 'TiptapEditor';
