import { Button } from '@/components/ui/button';
import { Palette, X } from 'lucide-react';
import { MenuComponentProps } from './types';

const COLOR_PRESETS = [
  { name: 'Purple', value: '#958DF1', isActive: 'isPurple' },
  { name: 'Red', value: '#F98181', isActive: 'isRed' },
  { name: 'Orange', value: '#FBBC88', isActive: 'isOrange' },
  { name: 'Yellow', value: '#FAF594', isActive: 'isYellow' },
  { name: 'Blue', value: '#70CFF8', isActive: 'isBlue' },
  { name: 'Teal', value: '#94FADB', isActive: 'isTeal' },
  { name: 'Green', value: '#B9F18D', isActive: 'isGreen' },
] as const;

export function ColorMenu({ editor, editorState }: MenuComponentProps) {
  return (
    <div className="flex items-center gap-1 border-border pr-2 mr-2">
      <div className="relative">
        <input
          type="color"
          onInput={(event) => editor.chain().focus().setColor(event.currentTarget.value).run()}
          value={editorState.color || '#000000'}
          data-testid="setColor"
          className="w-8 h-8 rounded border border-border cursor-pointer opacity-0 absolute"
          style={{ appearance: 'none', WebkitAppearance: 'none' }}
        />
        <div
          className="w-8 h-8 rounded border border-border flex items-center justify-center bg-background"
          title="색상 선택"
        >
          <Palette className="h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>
      {COLOR_PRESETS.map((color) => {
        const colorNames: Record<string, string> = {
          Purple: '보라색',
          Red: '빨간색',
          Orange: '주황색',
          Yellow: '노란색',
          Blue: '파란색',
          Teal: '청록색',
          Green: '초록색',
        };
        return (
          <Button
            key={color.value}
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.chain().focus().setColor(color.value).run()}
            className={`${
              editorState[color.isActive]
                ? 'bg-accent text-accent-foreground ring-2 ring-offset-1'
                : ''
            }`}
            data-testid={`set${color.name}`}
            title={colorNames[color.name] || color.name}
            style={{
              backgroundColor: editorState[color.isActive] ? color.value : undefined,
              color: editorState[color.isActive] ? '#fff' : undefined,
            }}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.value }} />
          </Button>
        );
      })}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().unsetColor().run()}
        data-testid="unsetColor"
        title="색상 제거"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
