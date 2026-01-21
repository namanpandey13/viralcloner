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
      // Skip empty content/reposts if they have no text
      if (!item.content) return;
      
      // --- FIXED NAME FINDING LOGIC ---
      let authorName = "Unknown Creator";
      
      // Priority 1: Official Name field
      if (item.author?.name && item.author.name.trim().length > 0) {
        authorName = item.author.name;
      } 
      // Priority 2: Handle from object
      else if (item.author?.username) {
        authorName = `@${item.author.username}`;
      }
      // Priority 3: Extract from POST URL (The Fix)
      // Matches: linkedin.com/posts/justinwelsh_...
      else if (item.linkedinUrl) {
        const postMatch = item.linkedinUrl.match(/posts\/([^_]+)/);
        const profileMatch = item.linkedinUrl.match(/in\/([^/]+)/);
        
        if (postMatch) {
          authorName = postMatch[1]; // Returns "justinwelsh"
        } else if (profileMatch) {
          authorName = profileMatch[1];
        }
      }
      // ------------------------------------

      // Clean up the name (capitalize first letter if it's a handle)
      if (!authorName.includes(" ")) {
        authorName = authorName.charAt(0).toUpperCase() + authorName.slice(1);
      }
      
      // Remove emojis
      authorName = authorName.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '').trim();

      if (!postsByAuthor[authorName]) postsByAuthor[authorName] = [];
      postsByAuthor[authorName].push(item);
    });

    let processedPosts: any[] = [];

    // 4. Calculate Stats & Format
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

    // Sort: Highest Impact First
    processedPosts.sort((a, b) => b.multiplier - a.multiplier);

    return NextResponse.json({ posts: processedPosts });

  } catch (error: any) {
    console.error("SCRAPE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}