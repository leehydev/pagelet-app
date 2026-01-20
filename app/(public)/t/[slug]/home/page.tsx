import { fetchPublicPosts, PublicPost } from '@/lib/api';
import { Metadata } from 'next';
import Link from 'next/link';

// ISR: 60초마다 재검증
export const revalidate = 60;

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} 블로그`,
    description: `${slug}의 블로그입니다.`,
  };
}

async function getPosts(siteSlug: string): Promise<PublicPost[]> {
  try {
    return await fetchPublicPosts(siteSlug);
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return [];
  }
}

function PostCard({ post, siteSlug }: { post: PublicPost; siteSlug: string }) {
  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {post.og_image_url && (
        <div className="aspect-video bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.og_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-5">
        <Link href={`/t/${siteSlug}/posts/${post.slug}`}>
          <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
            {post.title}
          </h2>
        </Link>
        {post.seo_description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {post.seo_description}
          </p>
        )}
        <time className="text-xs text-gray-400">
          {new Date(post.published_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
      </div>
    </article>
  );
}

export default async function TenantHomePage({ params }: PageProps) {
  const { slug } = await params;
  const posts = await getPosts(slug);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">{slug}</h1>
          <p className="text-gray-500 mt-1">{slug}.pagelet-dev.kr</p>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} siteSlug={slug} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h2 className="text-xl font-medium text-gray-600 mb-2">
              아직 게시글이 없습니다
            </h2>
            <p className="text-gray-400">
              곧 새로운 글이 올라올 예정입니다.
            </p>
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          Powered by Pagelet
        </div>
      </footer>
    </div>
  );
}
