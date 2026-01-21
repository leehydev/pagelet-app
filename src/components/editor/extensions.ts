import StarterKit from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { Placeholder, CharacterCount, Dropcursor } from '@tiptap/extensions';
import Image from '@tiptap/extension-image';
import Emoji, { gitHubEmojis } from '@tiptap/extension-emoji';
import Youtube from '@tiptap/extension-youtube';
import { linkExtension } from './config/link-config';

export const extensions = [
  TextStyleKit,
  StarterKit,
  Placeholder.configure({
    placeholder: '내용을 입력해주세요.',
  }),
  CharacterCount.configure({}),
  Image,
  Dropcursor,
  Emoji.configure({
    emojis: gitHubEmojis,
    enableEmoticons: true,
  }),
  linkExtension,
  Youtube.configure({
    controls: false,
    nocookie: true,
  }),
];
