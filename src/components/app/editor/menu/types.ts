import { Editor } from '@tiptap/react';

export interface EditorState {
  isBold: boolean;
  canBold: boolean;
  isItalic: boolean;
  canItalic: boolean;
  isStrike: boolean;
  canStrike: boolean;
  isCode: boolean;
  canCode: boolean;
  canClearMarks: boolean;
  isParagraph: boolean;
  isHeading1: boolean;
  isHeading2: boolean;
  isHeading3: boolean;
  isHeading4: boolean;
  isHeading5: boolean;
  isHeading6: boolean;
  isBulletList: boolean;
  isOrderedList: boolean;
  isCodeBlock: boolean;
  isBlockquote: boolean;
  canUndo: boolean;
  canRedo: boolean;
  color: string;
  isPurple: boolean;
  isRed: boolean;
  isOrange: boolean;
  isYellow: boolean;
  isBlue: boolean;
  isTeal: boolean;
  isGreen: boolean;
  isLink: boolean;
}

export interface MenuComponentProps {
  editor: Editor;
  editorState: EditorState;
}
