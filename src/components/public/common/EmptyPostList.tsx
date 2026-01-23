import Link from 'next/link';
import { FileText } from 'lucide-react';

interface EmptyPostListProps {
  siteSlug: string;
  title?: string;
  description?: string;
  showBackLink?: boolean;
}

export function EmptyPostList({
  siteSlug,
  title = '아직 게시글이 없습니다',
  description = '곧 새로운 글이 올라올 예정입니다.',
  showBackLink = true,
}: EmptyPostListProps) {
  return (
    <div className="text-center py-16">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <FileText className="w-10 h-10 text-muted-foreground" />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>

      {/* Description */}
      <p className="text-muted-foreground mb-6">{description}</p>

      {/* Back Link */}
      {showBackLink && (
        <Link
          href={`/t/${siteSlug}`}
          className="inline-flex items-center text-primary hover:text-primary/90 font-medium transition-colors"
        >
          메인으로 돌아가기 →
        </Link>
      )}
    </div>
  );
}
