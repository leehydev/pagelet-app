import { Button } from '@/components/ui/button';
import { Type, Heading2, Heading3 } from 'lucide-react';
import { MenuComponentProps } from './types';

export function HeadingMenu({ editor, editorState }: MenuComponentProps) {
  return (
    <div className="flex items-center gap-1 pr-2 mr-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={editorState.isParagraph ? 'bg-accent text-accent-foreground' : ''}
        title="본문"
      >
        <Type className="h-4 w-4" />
        <span className="hidden sm:inline">P</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editorState.isHeading2 ? 'bg-accent text-accent-foreground' : ''}
        title="제목 2"
      >
        <Heading2 className="h-4 w-4" />
        <span className="hidden sm:inline">H2</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editorState.isHeading3 ? 'bg-accent text-accent-foreground' : ''}
        title="제목 3"
      >
        <Heading3 className="h-4 w-4" />
        <span className="hidden sm:inline">H3</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        className={editorState.isHeading4 ? 'bg-accent text-accent-foreground' : ''}
        title="제목 4"
      >
        H4
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
        className={editorState.isHeading5 ? 'bg-accent text-accent-foreground' : ''}
        title="제목 5"
      >
        H5
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
        className={editorState.isHeading6 ? 'bg-accent text-accent-foreground' : ''}
        title="제목 6"
      >
        H6
      </Button>
    </div>
  );
}
