import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Youtube } from 'lucide-react';
import { Editor } from '@tiptap/react';

export function YoutubeInsertButton({ editor }: { editor: Editor }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [width, setWidth] = useState(640);
  const [height, setHeight] = useState(480);

  const handleAddYoutubeVideo = useCallback(() => {
    if (youtubeUrl.trim()) {
      editor?.commands.setYoutubeVideo({
        src: youtubeUrl.trim(),
        width: Math.max(320, Number(width)) || 640,
        height: Math.max(180, Number(height)) || 480,
      });
      setYoutubeUrl('');
      setIsModalOpen(false);
    }
  }, [editor, youtubeUrl, width, height]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setIsModalOpen(true)}
        title="YouTube 동영상 추가"
      >
        <Youtube className="h-4 w-4" />
      </Button>

      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>YouTube 동영상 추가</AlertDialogTitle>
            <AlertDialogDescription>YouTube URL과 크기를 입력하세요.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <Input
                id="youtube-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="video-width">너비 (px)</Label>
                <Input
                  id="video-width"
                  type="number"
                  inputMode="numeric"
                  min="320"
                  max="1024"
                  placeholder="640"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video-height">높이 (px)</Label>
                <Input
                  id="video-height"
                  type="number"
                  inputMode="numeric"
                  min="180"
                  max="720"
                  placeholder="480"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddYoutubeVideo} disabled={!youtubeUrl.trim()}>
              추가
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
