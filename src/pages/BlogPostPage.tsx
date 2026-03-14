import { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Shield, ArrowRight } from 'lucide-react';
import { getBlogPost, getRelatedPosts } from '@/config/blog-posts';
import Button from '@/components/ui/Button';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;
  const related = slug ? getRelatedPosts(slug) : [];

  useEffect(() => {
    if (post) {
      document.title = `${post.title} — SiteSafe`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', post.description);
    }
    window.scrollTo(0, 0);
  }, [post]);

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        to="/blog"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All articles
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl leading-tight">
          {post.title}
        </h1>
        <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-400">
          <Calendar className="h-4 w-4" />
          {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </header>

      {/* Article body */}
      <article
        className="prose prose-gray prose-headings:font-bold prose-h2:text-2xl prose-h3:text-lg prose-a:text-primary-600 prose-code:rounded prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* CTA */}
      <div className="mt-10 rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 to-white p-6 text-center">
        <Shield className="mx-auto h-8 w-8 text-primary-600 mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Is your website at risk?
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Find out in 30 seconds with a free accessibility scan. No signup required.
        </p>
        <Link to="/">
          <Button size="lg">Scan Your Website Free</Button>
        </Link>
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Related Articles</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((rp) => (
              <Link
                key={rp.slug}
                to={`/blog/${rp.slug}`}
                className="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-sm"
              >
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-primary-700 transition-colors mb-1.5 line-clamp-2">
                  {rp.title}
                </h4>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                  {rp.description}
                </p>
                <span className="flex items-center gap-1 text-xs font-medium text-primary-600">
                  Read more
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
