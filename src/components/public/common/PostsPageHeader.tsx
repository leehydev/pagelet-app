import { Badge } from '@/components/ui/badge';

interface PostsPageHeaderProps {
  category: string;
  title: string;
  description: string;
}

export function PostsPageHeader({ category, title, description }: PostsPageHeaderProps) {
  return (
    <header className="border-b border-gray-200">
      <div className="px-4 py-12 md:py-16">
        <div className="text-center space-y-4">
          {/* Category Badge */}
          <div>
            <Badge variant="secondary" className="uppercase text-xs font-semibold tracking-wide">
              {category}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">{description}</p>
          )}
        </div>
      </div>
    </header>
  );
}
