import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Link, Link2Off } from 'lucide-react';
import { MenuComponentProps } from './types';

export function LinkMenu({ editor, editorState }: MenuComponentProps) {
  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    try {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message);
      } else {
        alert('An unknown error occurred');
      }
    }
  }, [editor]);

  return (
    <div className="flex items-center gap-1 pr-2 mr-2">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={setLink}
        className={editorState.isLink ? 'bg-accent text-accent-foreground' : ''}
        title="링크 설정"
      >
        <Link className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editorState.isLink}
        title="링크 제거"
      >
        <Link2Off className="h-4 w-4" />
      </Button>
    </div>
  );
}
