'use client';

import { forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { extensions } from './extensions';
import { MenuBar } from './MenuBar';
import { useCharacterCount } from './hooks/useCharacterCount';

export interface TiptapEditorRef {
  getEditor: () => Editor | null;
  getJSON: () => Record<string, unknown> | null;
  getHTML: () => string;
  getText: () => string;
}

interface TiptapEditorProps {
  content?: string | Record<string, unknown>;
  onEditorReady?: (editor: Editor) => void;
}

export const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  ({ content, onEditorReady }, ref) => {
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
      },
      onUpdate: () => {
        // 에디터 업데이트 시 콜백 호출 (필요한 경우)
      },
    });

    // editor가 준비되면 콜백 호출
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }

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

    return (
      <div className="border rounded-md">
        <MenuBar editor={editor} />
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
