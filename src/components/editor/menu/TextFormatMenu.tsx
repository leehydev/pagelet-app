import { Button } from '@/components/ui/button';
import { Bold, Italic, Strikethrough, Code, Eraser, Trash2 } from 'lucide-react';
import { MenuComponentProps } from './types';

export function TextFormatMenu({ editor, editorState }: MenuComponentProps) {
  return (
    <div className="flex items-center gap-1 pr-2 mr-2">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editorState.canBold}
        className={editorState.isBold ? 'bg-accent text-accent-foreground' : ''}
        title="굵게"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editorState.canItalic}
        className={editorState.isItalic ? 'bg-accent text-accent-foreground' : ''}
        title="기울임"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editorState.canStrike}
        className={editorState.isStrike ? 'bg-accent text-accent-foreground' : ''}
        title="취소선"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editorState.canCode}
        className={editorState.isCode ? 'bg-accent text-accent-foreground' : ''}
        title="코드"
      >
        <Code className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 mx-1" />
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
        title="서식 지우기"
      >
        <Eraser className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().clearNodes().run()}
        title="노드 지우기"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
