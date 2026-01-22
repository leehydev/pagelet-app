import { useCallback, useState, useRef, useEffect } from 'react';
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
import { Image, Upload } from 'lucide-react';
import { Editor } from '@tiptap/react';
import { useUpload } from '@/hooks/use-upload';
import { cn } from '@/lib/utils';

type InputMode = 'url' | 'upload';

interface ImageInsertButtonProps {
  editor: Editor;
  siteId: string;
}

export function ImageInsertButton({ editor, siteId }: ImageInsertButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [mode, setMode] = useState<InputMode>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, uploadProgress, reset, isUploading } = useUpload(siteId);

  // 업로드 완료 시 에디터에 이미지 삽입
  useEffect(() => {
    if (uploadProgress.status === 'completed' && uploadProgress.publicUrl) {
      editor?.chain().focus().setImage({ src: uploadProgress.publicUrl }).run();
      reset();
      // 다음 프레임에 모달 닫기 (cascading render 방지)
      requestAnimationFrame(() => {
        setIsModalOpen(false);
      });
    }
  }, [uploadProgress.status, uploadProgress.publicUrl, editor, reset]);

  const handleAddImage = useCallback(() => {
    if (imageUrl.trim()) {
      editor?.chain().focus().setImage({ src: imageUrl.trim() }).run();
      setImageUrl('');
      setIsModalOpen(false);
    }
  }, [editor, imageUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await upload(file, { imageType: 'CONTENT' });
    } catch (error) {
      console.error('Upload failed:', error);
    }

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open && !isUploading) {
      setIsModalOpen(false);
      setImageUrl('');
      reset();
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setIsModalOpen(true)}
        title="이미지 삽입"
      >
        <Image className="h-4 w-4" aria-label="Set image" />
      </Button>

      <AlertDialog open={isModalOpen} onOpenChange={handleModalClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이미지 추가</AlertDialogTitle>
            <AlertDialogDescription>
              파일을 업로드하거나 URL을 입력하세요.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* 모드 선택 탭 */}
          <div className="flex gap-2 border-b pb-2">
            <Button
              type="button"
              variant={mode === 'upload' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('upload')}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-1" />
              파일 업로드
            </Button>
            <Button
              type="button"
              variant={mode === 'url' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('url')}
              disabled={isUploading}
            >
              URL 입력
            </Button>
          </div>

          <div className="space-y-4 py-4">
            {/* 파일 업로드 모드 */}
            {mode === 'upload' && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="hidden"
                />

                {/* 업로드 진행 상태 */}
                {isUploading ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      {uploadProgress.status === 'presigning' && <span>업로드 준비 중...</span>}
                      {uploadProgress.status === 'uploading' && (
                        <span>업로드 중... {uploadProgress.progress}%</span>
                      )}
                      {uploadProgress.status === 'completing' && (
                        <span>업로드 완료 처리 중...</span>
                      )}
                    </div>
                    {uploadProgress.status === 'uploading' && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={cn(
                      'flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors',
                      'hover:border-blue-400 hover:bg-blue-50',
                      uploadProgress.status === 'error'
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300',
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 text-center">
                      클릭하여 이미지 선택
                      <br />
                      <span className="text-xs text-gray-400">
                        JPEG, PNG, WebP (최대 2MB)
                      </span>
                    </p>
                  </div>
                )}

                {/* 에러 메시지 */}
                {uploadProgress.status === 'error' && uploadProgress.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {uploadProgress.error}
                  </div>
                )}
              </div>
            )}

            {/* URL 모드 */}
            {mode === 'url' && (
              <div className="space-y-2">
                <Label htmlFor="image-url">이미지 URL</Label>
                <Input
                  id="image-url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddImage();
                    }
                  }}
                  autoFocus
                />
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUploading}>취소</AlertDialogCancel>
            {mode === 'url' && (
              <AlertDialogAction onClick={handleAddImage} disabled={!imageUrl.trim()}>
                추가
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
