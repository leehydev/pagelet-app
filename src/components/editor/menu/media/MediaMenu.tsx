import { Editor } from '@tiptap/react';
import { YoutubeInsertButton } from './YoutubeInsertButton';
import { ImageInsertButton } from './ImageInsertButton';

export function MediaMenu({ editor }: { editor: Editor }) {
  return (
    <div className="flex items-center gap-2 pr-2 mr-2">
      <YoutubeInsertButton editor={editor} />
      <ImageInsertButton editor={editor} />
    </div>
  );
}
