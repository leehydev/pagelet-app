import { useEditorState } from '@tiptap/react';
import { Editor } from '@tiptap/react';
import { EditorState } from './types';

export function useMenuEditorState(editor: Editor | null): EditorState | null {
  return useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return null;

      return {
        isBold: ctx.editor.isActive('bold') ?? false,
        canBold: ctx.editor.can().chain().toggleBold().run() ?? false,
        isItalic: ctx.editor.isActive('italic') ?? false,
        canItalic: ctx.editor.can().chain().toggleItalic().run() ?? false,
        isStrike: ctx.editor.isActive('strike') ?? false,
        canStrike: ctx.editor.can().chain().toggleStrike().run() ?? false,
        isCode: ctx.editor.isActive('code') ?? false,
        canCode: ctx.editor.can().chain().toggleCode().run() ?? false,
        canClearMarks: ctx.editor.can().chain().unsetAllMarks().run() ?? false,
        isParagraph: ctx.editor.isActive('paragraph') ?? false,
        isHeading1: ctx.editor.isActive('heading', { level: 1 }) ?? false,
        isHeading2: ctx.editor.isActive('heading', { level: 2 }) ?? false,
        isHeading3: ctx.editor.isActive('heading', { level: 3 }) ?? false,
        isHeading4: ctx.editor.isActive('heading', { level: 4 }) ?? false,
        isHeading5: ctx.editor.isActive('heading', { level: 5 }) ?? false,
        isHeading6: ctx.editor.isActive('heading', { level: 6 }) ?? false,
        isBulletList: ctx.editor.isActive('bulletList') ?? false,
        isOrderedList: ctx.editor.isActive('orderedList') ?? false,
        isCodeBlock: ctx.editor.isActive('codeBlock') ?? false,
        isBlockquote: ctx.editor.isActive('blockquote') ?? false,
        canUndo: ctx.editor.can().chain().undo().run() ?? false,
        canRedo: ctx.editor.can().chain().redo().run() ?? false,
        color: ctx.editor.getAttributes('textStyle').color,
        isPurple: ctx.editor.isActive('textStyle', { color: '#958DF1' }),
        isRed: ctx.editor.isActive('textStyle', { color: '#F98181' }),
        isOrange: ctx.editor.isActive('textStyle', { color: '#FBBC88' }),
        isYellow: ctx.editor.isActive('textStyle', { color: '#FAF594' }),
        isBlue: ctx.editor.isActive('textStyle', { color: '#70CFF8' }),
        isTeal: ctx.editor.isActive('textStyle', { color: '#94FADB' }),
        isGreen: ctx.editor.isActive('textStyle', { color: '#B9F18D' }),
        isLink: ctx.editor.isActive('link'),
        isAlignLeft: ctx.editor.isActive({ textAlign: 'left' }),
        isAlignCenter: ctx.editor.isActive({ textAlign: 'center' }),
        isAlignRight: ctx.editor.isActive({ textAlign: 'right' }),
        isAlignJustify: ctx.editor.isActive({ textAlign: 'justify' }),
      };
    },
  });
}
