import { Button } from '@/components/ui/button';
import { List, ListOrdered, Code2, Quote, Minus, CornerDownLeft } from 'lucide-react';
import { MenuComponentProps } from './types';

export function ListMenu({ editor, editorState }: MenuComponentProps) {
  return (
    <div className="flex items-center gap-1 pr-2 mr-2">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editorState.isBulletList ? 'bg-accent text-accent-foreground' : ''}
        title="순서 없는 목록"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editorState.isOrderedList ? 'bg-accent text-accent-foreground' : ''}
        title="순서 있는 목록"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editorState.isCodeBlock ? 'bg-accent text-accent-foreground' : ''}
        title="코드 블록"
      >
        <Code2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editorState.isBlockquote ? 'bg-accent text-accent-foreground' : ''}
        title="인용구"
      >
        <Quote className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 mx-1" />
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="구분선"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().setHardBreak().run()}
        title="줄바꿈"
      >
        <CornerDownLeft className="h-4 w-4" />
      </Button>
    </div>
  );
}
