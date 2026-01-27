'use client';

import { PostStatus } from '@/lib/api';
import { Label } from '@/components/ui/label';

interface PostStatusRadioProps {
  value: PostStatus;
  onChange: (status: PostStatus) => void;
  disabled?: boolean;
}

/**
 * 게시글 공개 여부 선택 라디오 버튼
 */
export function PostStatusRadio({ value, onChange, disabled }: PostStatusRadioProps) {
  return (
    <div className="space-y-2">
      <Label>공개 여부</Label>
      <div className="flex gap-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="postStatus"
            value={PostStatus.PRIVATE}
            checked={value === PostStatus.PRIVATE}
            onChange={() => onChange(PostStatus.PRIVATE)}
            disabled={disabled}
            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          />
          <span className="text-sm font-normal">비공개</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="postStatus"
            value={PostStatus.PUBLISHED}
            checked={value === PostStatus.PUBLISHED}
            onChange={() => onChange(PostStatus.PUBLISHED)}
            disabled={disabled}
            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          />
          <span className="text-sm font-normal">공개</span>
        </label>
      </div>
    </div>
  );
}
