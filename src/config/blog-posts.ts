export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  image: string;
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: '10-common-ada-website-violations',
    title: '10 Most Common ADA Website Violations and How to Fix Them',
    description: 'Learn about the 10 most frequently cited ADA website accessibility violations and get actionable steps to fix each one before you face a lawsuit.',
    date: '2026-03-10',
    tags: ['WCAG', 'Compliance', 'How-To'],
    image: '/blog-violations.jpg',
    content: `
<img src="/blog-violations.jpg" alt="SiteSafe accessibility score dashboard showing 43/100 compliance score with a list of violations" style="width:100%;border-radius:12px;margin-bottom:24px;" />

<h2>Why These Violations Matter</h2>
<p>Over 4,600 ADA website accessibility lawsuits were filed in 2023 alone, and 67% targeted small businesses. Most of these lawsuits cite the same recurring violations. Here are the 10 issues that appear in nearly every complaint — and how to fix them.</p>

<h3>1. Missing Alternative Text on Images</h3>
<p>Screen readers rely on <code>alt</code> attributes to describe images to blind users. When an image has no alt text, a screen reader either skips it entirely or reads the filename — something like "IMG_3847.jpg." Every meaningful image needs a descriptive <code>alt</code> attribute. Decorative images should use <code>alt=""</code> to be skipped.</p>

<h3>2. Insufficient Color Contrast</h3>
<p>WCAG 2.1 AA requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text (18px bold or 24px regular). Light gray text on a white background is the most common offender. Use a contrast checker tool to verify your color combinations meet the minimum ratios.</p>

<h3>3. Missing Form Labels</h3>
<p>Every form input — text fields, dropdowns, checkboxes, radio buttons — needs a programmatically associated <code>&lt;label&gt;</code> element. Without labels, screen reader users cannot tell what information a form field is asking for. Placeholder text is not a substitute for a label.</p>

<h3>4. Non-Descriptive Link Text</h3>
<p>Links that say "click here," "read more," or "learn more" provide no context when read out of the visual page flow. Screen reader users often navigate by tabbing through links alone. Each link should describe its destination, such as "View our pricing plans" instead of "click here."</p>

<h3>5. Missing Language Attribute</h3>
<p>The <code>&lt;html&gt;</code> element must include a <code>lang</code> attribute (e.g., <code>lang="en"</code>). This tells screen readers which language to use for pronunciation. Without it, assistive technology may mispronounce every word on the page.</p>

<h3>6. Keyboard Navigation Issues</h3>
<p>All interactive elements — links, buttons, form fields, menus — must be operable using only a keyboard. Many users with motor disabilities cannot use a mouse. Custom JavaScript widgets that only respond to mouse clicks are a major barrier. Ensure focus indicators are visible and tab order is logical.</p>

<h3>7. Empty Buttons and Links</h3>
<p>Buttons or links that contain only an icon (like a hamburger menu or social media icon) with no text or <code>aria-label</code> are invisible to screen readers. Add an <code>aria-label</code> attribute describing the action, such as <code>aria-label="Open navigation menu"</code>.</p>

<h3>8. Skipped Heading Levels</h3>
<p>Headings should follow a logical hierarchy: <code>h1</code> followed by <code>h2</code>, then <code>h3</code>, and so on. Jumping from <code>h1</code> directly to <code>h4</code> confuses screen reader users who rely on heading levels to understand page structure. Never choose heading levels based on visual size — use CSS for styling.</p>

<h3>9. Auto-Playing Media</h3>
<p>Videos or audio that play automatically can be disorienting for screen reader users and harmful for people with cognitive disabilities. If media must autoplay, provide clearly labeled pause, stop, and volume controls. Better yet, require user interaction to start playback.</p>

<h3>10. Missing Table Headers</h3>
<p>Data tables need <code>&lt;th&gt;</code> elements with proper <code>scope</code> attributes so screen readers can associate data cells with their headers. Without them, a table full of numbers becomes meaningless to a non-sighted user.</p>

<h2>What To Do Next</h2>
<p>These 10 violations account for the vast majority of ADA website lawsuits. The good news: most are straightforward to fix. Start by running an automated scan to identify which of these issues exist on your site, then prioritize critical and serious findings first. With the federal deadline of April 26, 2026 approaching, the time to act is now — not after you receive a demand letter.</p>
`,
  },
  {
    slug: 'ada-website-compliance-deadline-2026',
    title: 'ADA Website Compliance Deadline: What Small Businesses Need to Know',
    description: 'The DOJ has set April 26, 2026 as the deadline for website ADA compliance. Learn what this means for your small business, the penalties, and what steps to take now.',
    date: '2026-03-08',
    tags: ['Legal', 'Deadline', 'Small Business'],
    image: '/blog-deadline.jpg',
    content: `
<img src="/blog-deadline.jpg" alt="Calendar showing April 26, 2026 deadline circled in red next to SiteSafe scanner showing 43 days left" style="width:100%;border-radius:12px;margin-bottom:24px;" />

<h2>The Clock Is Ticking</h2>
<p>On April 24, 2024, the U.S. Department of Justice published a final rule under Title II of the ADA requiring state and local government websites to meet WCAG 2.1 Level AA standards. While Title II applies directly to government entities, the rule has accelerated enforcement expectations for <strong>all</strong> businesses with public-facing websites — especially those operating in states with aggressive ADA litigation like New York, Florida, and California.</p>

<p>The compliance deadline for entities with populations of 50,000 or more is <strong>April 26, 2026</strong>. Smaller entities have until April 26, 2027. But private businesses face lawsuits under Title III right now, and courts increasingly point to WCAG 2.1 AA as the standard.</p>

<h2>What Are the Penalties?</h2>
<p>ADA lawsuits don't require proving damages. A single plaintiff can file a complaint and demand a settlement. Here's what small businesses typically face:</p>
<ul>
<li><strong>Demand letters:</strong> $3,000 to $10,000 to settle before litigation</li>
<li><strong>Lawsuit settlements:</strong> $5,000 to $25,000 on average</li>
<li><strong>Legal defense costs:</strong> $50,000 to $100,000+ if you fight it</li>
<li><strong>DOJ penalties:</strong> Up to $75,000 for first violation, $150,000 for subsequent</li>
</ul>
<p>Serial filers like Brian Whitaker (1,700+ lawsuits) and Orlando Garcia (800+ lawsuits) target small businesses specifically because most will settle rather than fight. In 2023, 67% of ADA web accessibility lawsuits targeted businesses with under $25M in revenue.</p>

<h2>What Does Compliance Actually Require?</h2>
<p>WCAG 2.1 Level AA includes 50 specific success criteria organized under four principles: Perceivable, Operable, Understandable, and Robust. In practical terms, your website must:</p>
<ul>
<li>Have alt text on all meaningful images</li>
<li>Meet minimum color contrast ratios (4.5:1 for normal text)</li>
<li>Be fully navigable using only a keyboard</li>
<li>Have proper form labels and error messages</li>
<li>Use correct heading hierarchy</li>
<li>Provide captions for video content</li>
<li>Not trap keyboard focus in any element</li>
<li>Work with screen readers and other assistive technologies</li>
</ul>

<h2>Common Misconceptions</h2>
<p><strong>"My website builder handles accessibility."</strong> — Platforms like Wix, Squarespace, and Shopify provide some accessibility features, but your content, images, and customizations can still create violations. The platform won't add alt text to your images for you.</p>

<p><strong>"I installed an accessibility widget."</strong> — Overlay widgets like accessiBe do not fix underlying code issues. The FTC fined accessiBe $1 million in February 2025 for misleading claims. In 2025, 22.6% of businesses sued for ADA violations had an accessibility overlay installed. Courts have consistently rejected overlays as adequate compliance.</p>

<p><strong>"No one with a disability uses my site."</strong> — 26% of adults in the US have some form of disability. More importantly, ADA lawsuits don't require proof that a disabled person actually tried to use your site — only that barriers exist.</p>

<h2>What To Do Right Now</h2>
<ol>
<li><strong>Scan your website</strong> for accessibility issues using an automated tool to understand your current state</li>
<li><strong>Fix critical issues first</strong> — missing alt text, broken form labels, and low contrast are the most commonly cited in lawsuits</li>
<li><strong>Document your efforts</strong> — showing you're actively working toward compliance can help in legal situations</li>
<li><strong>Plan for ongoing monitoring</strong> — accessibility isn't a one-time fix; new content can introduce new violations</li>
</ol>

<p>The April 2026 deadline is approaching fast. Whether it applies to you directly or not, it signals where enforcement is headed. Every day you wait is a day you remain exposed to a lawsuit that could cost your business thousands.</p>
`,
  },
  {
    slug: 'why-accessibility-overlays-dont-protect-you',
    title: "Why Accessibility Overlays Don't Protect You From Lawsuits",
    description: 'Accessibility overlay widgets like accessiBe promise instant ADA compliance, but courts disagree. Learn why overlays fail and what actually protects your business.',
    date: '2026-03-05',
    tags: ['Overlays', 'Legal', 'accessiBe'],
    image: '/blog-overlays.jpg',
    content: `
<img src="/blog-overlays.jpg" alt="Broken overlay widget versus SiteSafe secure code shield — real protection vs fake solutions" style="width:100%;border-radius:12px;margin-bottom:24px;" />

<h2>The $490/Year Promise That Falls Apart in Court</h2>
<p>Accessibility overlay companies like accessiBe, UserWay, and AudioEye promise a simple pitch: add one line of JavaScript to your site, and you're ADA compliant. Prices start around $490/year, and the widget adds a toolbar letting users adjust font sizes, contrast, and other settings.</p>

<p>It sounds too good to be true — because it is.</p>

<h2>accessiBe Fined $1 Million by the FTC</h2>
<p>In February 2025, the Federal Trade Commission fined accessiBe $1 million for deceptive business practices. The FTC found that accessiBe's claims of making websites "fully compliant" and "lawsuit-proof" were false and misleading. The company's AI-powered overlay failed to detect or fix many common accessibility barriers.</p>

<p>This wasn't a surprise to the accessibility community. The National Federation of the Blind had already issued a statement calling overlays "worse than nothing" because they create a false sense of security while actual barriers remain.</p>

<h2>The Numbers Don't Lie</h2>
<p>According to UsableNet's 2025 mid-year report, <strong>22.6% of businesses sued for ADA web accessibility violations had an overlay widget installed</strong> at the time of the lawsuit. Having an overlay on your site does not prevent lawsuits — and it certainly doesn't win them.</p>

<p>In multiple court cases, judges have ruled that overlays do not constitute adequate compliance with the ADA. In <em>Murphy v. Eyebobs LLC</em> (2024), the court explicitly noted that the defendant's use of an accessibility overlay did not remediate the accessibility barriers on their website.</p>

<h2>Why Overlays Don't Work</h2>

<h3>They Can't Fix Missing Content</h3>
<p>If an image doesn't have alt text, no JavaScript widget can generate an accurate description of what's in the image. The overlay might add generic text or attempt AI-based descriptions, but these are frequently wrong. A photo of your team might get described as "a group of people standing" — useless for understanding who they are or why the image matters.</p>

<h3>They Don't Fix the Source Code</h3>
<p>Overlays sit on top of your existing code. They don't change your HTML, your heading structure, your form labels, or your ARIA attributes. When a screen reader encounters your page, it reads the underlying code — not what the overlay tries to inject. This creates unpredictable and often broken experiences for assistive technology users.</p>

<h3>They Can Actually Make Things Worse</h3>
<p>Multiple studies have shown that overlays can interfere with the assistive technology that disabled users already use. Screen reader users report that overlay widgets hijack keyboard navigation, introduce unexpected focus traps, and conflict with their own accessibility settings. Some users have browser extensions specifically designed to block overlay widgets.</p>

<h3>They Create a False Sense of Security</h3>
<p>The most dangerous aspect of overlays is that business owners believe they've solved the problem. They stop thinking about accessibility, stop training their content creators, and stop checking new pages for issues. Meanwhile, every new blog post, product page, or menu update can introduce fresh violations.</p>

<h2>What Actually Protects Your Business</h2>
<p>Real accessibility compliance requires fixing your actual website code:</p>
<ul>
<li><strong>Add proper alt text</strong> to every meaningful image — written by a human who understands the context</li>
<li><strong>Fix your HTML structure</strong> — correct heading hierarchy, semantic elements, proper form labels</li>
<li><strong>Test with real assistive technology</strong> — not just automated tools, but actual screen readers</li>
<li><strong>Train your team</strong> — anyone who adds content to your site needs to understand basic accessibility practices</li>
<li><strong>Monitor continuously</strong> — accessibility isn't a checkbox; it's an ongoing commitment</li>
</ul>

<p>Start with an automated scan to identify your most critical issues, then fix them in your source code. It takes more effort than installing a widget, but it's the only approach that actually works — in court and for your users.</p>

<p>The $49 you spend on a real accessibility audit could save you $10,000+ in lawsuit settlements. An overlay subscription costs $490/year and protects you from nothing.</p>
`,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getRelatedPosts(currentSlug: string, limit = 2): BlogPost[] {
  return blogPosts.filter((p) => p.slug !== currentSlug).slice(0, limit);
}
