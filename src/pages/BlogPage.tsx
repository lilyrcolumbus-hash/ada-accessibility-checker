import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, BookOpen } from 'lucide-react';
import { blogPosts } from '@/config/blog-posts';

export default function BlogPage() {
  useEffect(() => {
    document.title = 'Blog — SiteSafe ADA Accessibility Checker';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Expert guides on ADA website compliance, WCAG standards, and how to protect your business from accessibility lawsuits.');
    }
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
          <BookOpen className="h-4 w-4" />
          ADA Compliance Blog
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Protect Your Business From ADA Lawsuits
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">
          Expert guides on website accessibility, compliance deadlines, and lawsuit prevention for small businesses.
        </p>
      </div>

      <div className="space-y-6">
        {blogPosts.map((post) => (
          <Link
            key={post.slug}
            to={`/blog/${post.slug}`}
            className="group block rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm transition-all hover:border-primary-300 hover:shadow-md"
          >
            {post.image && (
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-48 sm:h-56 object-cover"
              />
            )}
            <div className="flex flex-col gap-3 p-6">
              <div className="flex flex-wrap items-center gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="text-xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
                {post.title}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600">
                {post.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:text-primary-700">
                  Read article
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
