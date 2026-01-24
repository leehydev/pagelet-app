'use client';

const products = [
  {
    title: 'Editor with Tiptap',
    caption: '강력한 직관적인 에디터로 쉽게 글을 작성하세요',
  },
  {
    title: 'Admin Dashboard',
    caption: '깔끔한 관리자 대시보드로 콘텐츠를 관리하세요',
  },
  {
    title: 'Public Blog Page',
    caption: '아름다운 블로그 페이지로 독자를 만나세요',
  },
];

export function ProductPreview() {
  return (
    <section id="product-preview" className="py-20 bg-gray-50 dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Product Preview
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            강력한 직관적인 툴로 완성된 블로그 플랫폼을 직접 경험하세요
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <div
              key={index}
              className="group cursor-pointer animate-fade-in-down"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Screenshot Placeholder */}
              <div className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                {/* Browser Chrome */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                {/* Screenshot Content */}
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 p-6">
                  <div className="w-full space-y-3">
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-5/6" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-4/5" />
                  </div>
                </div>
              </div>
              {/* Caption */}
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {product.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{product.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
