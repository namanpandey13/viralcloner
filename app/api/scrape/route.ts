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

    // 3. Group by Author
    const postsByAuthor: Record<string, any[]> = {};
    
    items.forEach((item: any) => {
      if (!item.content) return;
      
      // --- CRITICAL FIX: FIND THE NAME ---
      let authorName = "Unknown Creator";
      
      // 1. Try Official Name
      if (item.author?.name && item.author.name.trim().length > 0) {
        authorName = item.author.name;
      } 
      // 2. Try Handle
      else if (item.author?.username) {
        authorName = `@${item.author.username}`;
      }
      // 3. Try URL (This fixes the missing Justin Welsh name)
      else if (item.linkedinUrl) {
        // Matches: linkedin.com/in/justinwelsh OR linkedin.com/posts/justinwelsh_...
        const postMatch = item.linkedinUrl.match(/posts\/([^_]+)/);
        const profileMatch = item.linkedinUrl.match(/in\/([^/]+)/);
        
        if (postMatch) {
          authorName = postMatch[1];
        } else if (profileMatch) {
          authorName = profileMatch[1];
        }
      }
      
      // Capitalize first letter if we grabbed it from URL
      if (authorName && !authorName.includes(" ")) {
        authorName = authorName.charAt(0).toUpperCase() + authorName.slice(1);
      }
      // ------------------------------------

      if (!postsByAuthor[authorName]) postsByAuthor[authorName] = [];
      postsByAuthor[authorName].push(item);
    });

    let processedPosts: any[] = [];

    // 4. Calculate Stats
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
          handle: p.author?.username || "",
          date: p.postedAt?.date || new Date().toISOString(),
          likes: postLikes,
          baseline: baseline,
          multiplier: parseFloat(multiplier.toFixed(1)), 
          text: p.content,
          url: p.linkedinUrl,
          isViral: multiplier >= 1.5
        };
      });
      processedPosts = [...processedPosts, ...enriched];
    }

    // Sort by Viral Score
    processedPosts.sort((a, b) => b.multiplier - a.multiplier);

    return NextResponse.json({ posts: processedPosts });

  } catch (error: any) {
    console.error("SCRAPE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}