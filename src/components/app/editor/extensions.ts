import StarterKit from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { Placeholder, CharacterCount, Dropcursor } from '@tiptap/extensions';
import TextAlign from '@tiptap/extension-text-align';
import Emoji, { gitHubEmojis } from '@tiptap/extension-emoji';
import Youtube from '@tiptap/extension-youtube';
import { linkExtension } from './config/link-config';
import { ResizableImage } from './extensions/ResizableImage';
import { KakaoMap } from './extensions/KakaoMap';

export const extensions = [
  TextStyleKit,
  StarterKit.configure({
    dropcursor: false,
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph', 'image'],
  }),
  Placeholder.configure({
    placeholder: '내용을 입력해주세요.',
  }),
  CharacterCount.configure({}),
  ResizableImage,
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
  KakaoMap,
];
