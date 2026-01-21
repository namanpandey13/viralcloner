import { ApifyClient } from 'apify-client';
import { NextRequest, NextResponse } from 'next/server';

// Helper to calculate median
function getMedian(values: number[]) {
  if (values.length === 0) return 0;
  values.sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);
  if (values.length % 2) return values[half];
  return (values[half - 1] + values[half]) / 2.0;
}

export async function POST(req: NextRequest) {
  try {
    const { urls } = await req.json();
    
    if (!process.env.APIFY_TOKEN) {
      console.error("❌ MISSING APIFY_TOKEN");
      return NextResponse.json({ error: 'Server missing APIFY_TOKEN' }, { status: 500 });
    }

    const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

    // 1. Run Scraper
    const run = await client.actor("harvestapi/linkedin-profile-posts").call({
      targetUrls: urls,
      maxPosts: 20,
    });
    
    if (!run) throw new Error("Scrape failed to start");

    // 2. Fetch Results
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // 3. Group by Author to calculate Baselines
    const postsByAuthor: Record<string, any[]> = {};
    items.forEach((item: any) => {
      if (!item.content) return;
      const author = item.author?.name || "Unknown";
      if (!postsByAuthor[author]) postsByAuthor[author] = [];
      postsByAuthor[author].push(item);
    });

    let processedPosts: any[] = [];

    // 4. Calculate Outliers
    for (const author in postsByAuthor) {
      const authorPosts = postsByAuthor[author];
      const likes = authorPosts.map(p => p.engagement?.likes || 0);
      const baseline = getMedian(likes);

      const enriched = authorPosts.map(p => {
        const postLikes = p.engagement?.likes || 0;
        const multiplier = baseline > 0 ? (postLikes / baseline) : 0;
        
        return {
          id: p.id || Math.random().toString(36),
          author: author,
          date: p.postedAt?.date || "Unknown",
          likes: postLikes,
          baseline: baseline,
          multiplier: parseFloat(multiplier.toFixed(1)), // e.g., 2.5
          text: p.content,
          url: p.linkedinUrl,
          // Flag as viral if > 1.5x baseline
          isViral: multiplier >= 1.5
        };
      });
      processedPosts = [...processedPosts, ...enriched];
    }

    // Sort: Viral hits first, then by raw likes
    processedPosts.sort((a, b) => b.multiplier - a.multiplier);

    return NextResponse.json({ posts: processedPosts });

  } catch (error: any) {
    console.error("SCRAPE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}