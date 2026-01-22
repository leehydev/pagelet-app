import { useEditorState } from '@tiptap/react';
import { Editor } from '@tiptap/react';

interface CharacterCountState {
  charactersCount: number;
  wordsCount: number;
}

export function useCharacterCount(editor: Editor | null): CharacterCountState | null {
  return useEditorState({
    editor,
    selector: (context) => ({
      charactersCount: context.editor?.storage.characterCount.characters() ?? 0,
      wordsCount: context.editor?.storage.characterCount.words() ?? 0,
    }),
  });
}
