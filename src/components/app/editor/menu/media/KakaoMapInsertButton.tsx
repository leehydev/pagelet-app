'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { MapPin } from 'lucide-react';
import { Editor } from '@tiptap/react';
import { parseKakaoMapHtml, isValidKakaoMapHtml } from '@/lib/kakaomap-parser';

export function KakaoMapInsertButton({ editor }: { editor: Editor }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [htmlInput, setHtmlInput] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  const handleInsert = useCallback(() => {
    setParseError(null);

    if (!htmlInput.trim()) {
      setParseError('HTML 코드를 입력해주세요.');
      return;
    }

    if (!isValidKakaoMapHtml(htmlInput)) {
      setParseError('올바른 카카오맵 퍼가기 HTML이 아닙니다. 카카오맵에서 "지도 퍼가기" 코드를 복사해주세요.');
      return;
    }

    const params = parseKakaoMapHtml(htmlInput);
    if (!params) {
      setParseError('HTML에서 지도 정보를 추출하지 못했습니다. 올바른 카카오맵 퍼가기 코드인지 확인해주세요.');
      return;
    }

    editor?.commands.setKakaoMap(params);
    setHtmlInput('');
    setParseError(null);
    setIsModalOpen(false);
  }, [editor, htmlInput]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setHtmlInput('');
      setParseError(null);
    }
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setIsModalOpen(true)}
        title="카카오맵 추가"
      >
        <MapPin className="h-4 w-4" />
      </Button>

      <AlertDialog open={isModalOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>카카오맵 추가</AlertDialogTitle>
            <AlertDialogDescription>
              카카오맵에서 &quot;지도 퍼가기&quot; HTML 코드를 복사하여 붙여넣으세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kakaomap-html">카카오맵 HTML</Label>
              <Textarea
                id="kakaomap-html"
                placeholder={`<div id="daumRoughmapContainer..." class="root_daum_roughmap..."></div>
<script charset="UTF-8" class="daum_roughmap_loader_script" src="https://ssl.daumcdn.net/..."></script>
<script charset="UTF-8">
    new daum.roughmap.Lander({...}).render();
</script>`}
                value={htmlInput}
                onChange={(e) => {
                  setHtmlInput(e.target.value);
                  setParseError(null);
                }}
                rows={8}
                className="font-mono text-xs"
              />
              {parseError && (
                <p className="text-sm text-red-500">{parseError}</p>
              )}
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-medium">카카오맵에서 퍼가기 코드 가져오는 방법:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>카카오맵에서 원하는 장소 검색</li>
                <li>장소 정보에서 &quot;공유&quot; 버튼 클릭</li>
                <li>&quot;지도 퍼가기&quot; 탭 선택</li>
                <li>HTML 코드 복사</li>
              </ol>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleInsert} disabled={!htmlInput.trim()}>
              추가
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
