import { Editor } from '@tiptap/react';
import { YoutubeInsertButton } from './YoutubeInsertButton';
import { ImageInsertButton } from './ImageInsertButton';

interface MediaMenuProps {
  editor: Editor;
  siteId: string;
}

export function MediaMenu({ editor, siteId }: MediaMenuProps) {
  return (
    <div className="flex items-center gap-2 pr-2 mr-2">
      <YoutubeInsertButton editor={editor} />
      <ImageInsertButton editor={editor} siteId={siteId} />
    </div>
  );
}
