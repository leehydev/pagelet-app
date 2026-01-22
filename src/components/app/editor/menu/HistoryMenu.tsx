import { Button } from '@/components/ui/button';
import { Undo, Redo } from 'lucide-react';
import { MenuComponentProps } from './types';

export function HistoryMenu({ editor, editorState }: MenuComponentProps) {
  return (
    <div className="flex items-center gap-1 pr-2 mr-2">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editorState.canUndo}
        title="실행 취소"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editorState.canRedo}
        title="다시 실행"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
}
