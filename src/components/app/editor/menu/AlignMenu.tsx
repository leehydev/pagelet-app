import { Button } from '@/components/ui/button';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { MenuComponentProps } from './types';

export function AlignMenu({ editor, editorState }: MenuComponentProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={editorState.isAlignLeft ? 'bg-accent text-accent-foreground' : ''}
        title="왼쪽 정렬"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={editorState.isAlignCenter ? 'bg-accent text-accent-foreground' : ''}
        title="가운데 정렬"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={editorState.isAlignRight ? 'bg-accent text-accent-foreground' : ''}
        title="오른쪽 정렬"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={editorState.isAlignJustify ? 'bg-accent text-accent-foreground' : ''}
        title="양쪽 정렬"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>
    </div>
  );
}
