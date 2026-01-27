'use client';

import { Editor } from '@tiptap/react';
import { GripVertical } from 'lucide-react';
import { useMenuEditorState } from './menu/useEditorState';
import { TextFormatMenu } from './menu/TextFormatMenu';
import { HeadingMenu } from './menu/HeadingMenu';
import { AlignMenu } from './menu/AlignMenu';
import { ListMenu } from './menu/ListMenu';
import { ColorMenu } from './menu/ColorMenu';
import { LinkMenu } from './menu/LinkMenu';
import { MediaMenu } from './menu/media/MediaMenu';
import { HistoryMenu } from './menu/HistoryMenu';

interface MenuBarProps {
  editor: Editor;
  siteId: string;
  postId?: string;
}

const Separator = () => (
  <div className="flex items-center px-1">
    <GripVertical className="h-3 w-3 text-muted-foreground/40" />
  </div>
);

export function MenuBar({ editor, siteId, postId }: MenuBarProps) {
  const editorState = useMenuEditorState(editor);

  if (!editorState) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-0 p-2 border-b bg-background sticky top-[64px] z-10">
      <MediaMenu editor={editor} siteId={siteId} postId={postId} />
      <Separator />
      <LinkMenu editor={editor} editorState={editorState} />
      <Separator />
      <ColorMenu editor={editor} editorState={editorState} />
      <Separator />
      <TextFormatMenu editor={editor} editorState={editorState} />
      <Separator />
      <HeadingMenu editor={editor} editorState={editorState} />
      <Separator />
      <AlignMenu editor={editor} editorState={editorState} />
      <Separator />
      <ListMenu editor={editor} editorState={editorState} />
      <Separator />
      <HistoryMenu editor={editor} editorState={editorState} />
    </div>
  );
}
