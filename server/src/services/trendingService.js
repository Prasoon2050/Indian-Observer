const axios = require('axios');
const cron = require('node-cron');
const { getJson } = require('serpapi');
const News = require('../models/News');
const SystemStatus = require('../models/SystemStatus');

// ---------- IMAGE QUALITY HELPERS ----------
const MIN_IMAGE_WIDTH = 800;
const MIN_IMAGE_HEIGHT = 450;

// Quick heuristic: thumbnails almost always include these patterns
const isLikelyThumbnail = (url = '') =>
  /serpapi|gstatic|encrypted-tbn|thumbnail|=w\d+|=h\d+/i.test(url);

// Fetch image headers to estimate size (safe + fast)
const isImageLargeEnough = async (url) => {
  try {
    const res = await axios.head(url, { timeout: 5000 });
    const type = res.headers['content-type'] || '';
    const length = parseInt(res.headers['content-length'] || '0', 10);

    // Reject non-images or very small files (<40KB)
    if (!type.startsWith('image/') || length < 40000) return false;
    return true;
  } catch {
    return false;
  }
};

// ---------- UNSPLASH FALLBACK ----------
const fetchUnsplashImage = async (query) => {
  if (!process.env.UNSPLASH_ACCESS_KEY) return null;

  try {
    const { data } = await axios.get(
      'https://api.unsplash.com/search/photos',
      {
        params: {
          query,
          orientation: 'landscape',
          per_page: 1,
        },
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    return data?.results?.[0]?.urls?.regular || null;
  } catch {
    return null;
  }
};

// ---------- WIKIMEDIA FALLBACK ----------
const fetchWikimediaImage = async (query) => {
  try {
    const { data } = await axios.get(
      'https://commons.wikimedia.org/w/api.php',
      {
        params: {
          action: 'query',
          format: 'json',
          prop: 'pageimages',
          piprop: 'original',
          pilimit: 1,
          generator: 'search',
          gsrsearch: query,
          gsrnamespace: 6,
        },
      }
    );

    const pages = data?.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0];
    return page?.original?.source || null;
  } catch {
    return null;
  }
};

const resolveBestImage = async ({ imageUrl, topic, category }) => {
  if (!imageUrl || isLikelyThumbnail(imageUrl)) {
    imageUrl = null;
  }
  if (imageUrl) {
    const ok = await isImageLargeEnough(imageUrl);
    if (ok) return imageUrl;
  }
  // Try Wikimedia first for everything — no rate limits, no API key needed
  const wiki = await fetchWikimediaImage(topic);
  if (wiki) return wiki;

  // Unsplash only as last resort
  return await fetchUnsplashImage(topic);
};

// ============================================================
// ✅ IMAGE-SAFE UPSERT HELPER
// Uses MongoDB aggregation pipeline update syntax so imageUrl
// is ONLY written on first insert — never overwritten on re-runs.
// This prevents images from changing every time the cron fires.
// ============================================================
const buildImageSafeUpdate = (fields) => {
  const { imageUrl, ...rest } = fields;

  return [
    // Stage 1: update all non-image fields unconditionally
    { $set: rest },
    // Stage 2: only set imageUrl when the stored value is currently empty/null
    {
      $set: {
        imageUrl: {
          $cond: {
            if: {
              $or: [
                { $eq: ['$imageUrl', null] },
                { $eq: ['$imageUrl', ''] },
                { $not: { $ifNull: ['$imageUrl', false] } },
              ],
            },
            then: imageUrl || null,
            else: '$imageUrl', // ← keep the already-stored URL untouched
          },
        },
      },
    },
  ];
};

// Try multiple model names in order of preference (fallback if one fails)
const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-pro-latest',
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-2.5-pro',
];
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const SUMMARY_MIN_WORDS = 100;
const SUMMARY_MAX_WORDS = 140;

const GEMINI_MIN_INTERVAL_MS = 15000;
let lastGeminiCallAt = 0;
let currentGeminiModelIndex = 0;

const delayIfNeededForGemini = async () => {
  const now = Date.now();
  const elapsed = now - lastGeminiCallAt;

  if (elapsed < GEMINI_MIN_INTERVAL_MS) {
    const waitTime = GEMINI_MIN_INTERVAL_MS - elapsed;
    console.log(`[Gemini Rate Limit] Waiting ${waitTime}ms before next call...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastGeminiCallAt = Date.now();
};

const CATEGORY_FEEDS = [
  {
    id: 'world',
    topic: 'World Watch Briefing',
    query: 'India world diplomacy news',
    category: 'World',
    tags: ['world', 'global'],
  },
  {
    id: 'politics',
    topic: 'Capital Circuit',
    query: 'Indian politics parliament policy',
    category: 'Politics',
    tags: ['politics', 'policy'],
  },
  {
    id: 'sports',
    topic: 'Sports Pulse',
    query: 'India sports headline',
    category: 'Sports',
    tags: ['sports'],
  },
  {
    id: 'tech',
    topic: 'Tech Radar',
    query: 'India technology startups',
    category: 'Technology',
    tags: ['tech', 'innovation'],
  },
  {
    id: 'business',
    topic: 'Boardroom Briefing',
    query: 'India business markets economy',
    category: 'Business',
    tags: ['business', 'markets'],
  },
];

const INGESTION_STATUS_KEY = 'ingestion';

const updateStatus = async (changes) => {
  try {
    await SystemStatus.findOneAndUpdate(
      { key: INGESTION_STATUS_KEY },
      { $set: changes },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    console.error('Failed to persist ingestion status', error.message);
  }
};

const isFresh = (dateString) => {
  if (!dateString) return false;

  const now = Date.now();
  const fourHoursMs = 24 * 60 * 60 * 1000;

  const relativeTime = dateString.toLowerCase();

  if (relativeTime.includes('min') || relativeTime.includes('just now')) {
    return true;
  }

  if (relativeTime.includes('hour')) {
    const parts = relativeTime.match(/(\d+)\s+hour/);
    if (parts && parts[1]) {
      const hours = parseInt(parts[1], 10);
      return hours < 24;
    }
  }

  const parsed = Date.parse(dateString);
  if (!isNaN(parsed)) {
    return now - parsed < fourHoursMs;
  }

  return false;
};

const serpRequest = async (params) => {
  if (!process.env.SERPAPI_KEY) {
    throw new Error('SERPAPI_KEY missing');
  }

  const requestPayload = { api_key: process.env.SERPAPI_KEY, ...params };

  try {
    const response = await new Promise((resolve, reject) => {
      getJson(requestPayload, (json) => {
        if (!json) {
          return reject(new Error('Empty response from SerpAPI'));
        }
        if (json.error) {
          if (typeof json.error === 'string' && json.error.startsWith('{')) {
            try {
              const parsed = JSON.parse(json.error);
              return reject(new Error(parsed.error || json.error));
            } catch (e) { }
          }
          return reject(new Error(json.error));
        }
        resolve(json);
      });
    });
    return response;
  } catch (error) {
    const meta = `engine=${params.engine || 'unknown'} q=${params.q || params.topic_token || ''}`.trim();
    const message = error.message || 'SerpAPI request failed';
    const enriched = new Error(`SerpAPI: ${message}${meta ? ` (${meta})` : ''}`);
    enriched.cause = error;
    throw enriched;
  }
};

const fetchTrendingTopics = async () => {
  const categories = [14, 3, 17, 4];
  const categoryNames = { 14: 'Politics', 3: 'Business', 17: 'Sports', 4: 'Entertainment' };
  const allTopics = new Set();
  const validItems = [];

  console.log(`[Trending] Fetching topics for categories: ${categories.join(', ')}...`);

  for (const catId of categories) {
    try {
      const response = await serpRequest({
        engine: 'google_trends_trending_now',
        geo: 'IN',
        hours: '24',
        category_id: catId,
      });

      const searches = response.trending_searches || [];
      const isPolitics = catId === 14;

      const catTopics = searches
        .map((item) => item?.query?.text || item?.query || item?.title)
        .filter(Boolean)
        .filter((topic) => {
          if (isPolitics) return true;
          return topic.trim().split(/\s+/).length > 1;
        });

      console.log(`[Trending] Cat ${catId} (${categoryNames[catId]}) found: ${catTopics.length} topics`);

      const limitedTopics = isPolitics ? catTopics : catTopics.slice(0, 5);

      limitedTopics.forEach(t => {
        if (!allTopics.has(t.toLowerCase())) {
          allTopics.add(t.toLowerCase());
          validItems.push({ topic: t, category: categoryNames[catId] || 'General' });
        }
      });
    } catch (error) {
      console.warn(`[Trending] Failed to fetch category ${catId}: ${error.message || error}`);
      if (error.message && error.message.includes('run out of searches')) {
        console.error('[Trending] 🛑 SerpApi quota exceeded. Stopping further category fetches.');
        break;
      }
    }
  }

  console.log(`[Trending] Total unique topics found: ${validItems.length}`);
  return validItems;
};

// --------- Keyword lists (India-specific politics) ---------
const tierAKeywords = [
  "parliament", "sansad", "lok sabha", "rajya sabha", "vidhan sabha", "vidhan parishad",
  "legislative assembly", "legislative council", "union government", "central government",
  "state government", "cabinet", "council of ministers", "minister", "ministry",
  "pmo", "prime minister", "chief minister", "deputy cm", "governor", "lieutenant governor", "lg",
  "speaker", "leader of opposition", "whip",
  "bill", "ordinance", "act", "amendment", "parliamentary committee", "standing committee",
  "select committee", "question hour", "zero hour", "no-confidence motion", "confidence motion",
  "floor test", "finance bill", "appropriation bill", "budget", "interim budget",
  "election commission", "eci", "chief election commissioner", "model code of conduct", "mcc",
  "polling", "voter turnout", "constituency", "bypoll", "by-election", "delimitation",
  "evm", "vvpat", "manifesto", "campaign", "rally", "nomination", "counting",
  "nda", "upa", "india bloc", "i.n.d.i.a", "coalition",
  "bjp", "bharatiya janata party",
  "inc", "congress", "indian national congress",
  "aap", "aam aadmi party",
  "cpi", "cpi(m)", "cpim", "left",
  "tmc", "trinamool congress", "all india trinamool congress",
  "sp", "samajwadi party",
  "bsp", "bahujan samaj party",
  "dmk", "aiadmk", "bjd", "ysrcp", "tdp", "jd(u)", "jdu", "rjd",
  "shiv sena", "ncp", "jmm", "trs", "brs", "sad"
];

const tierBKeywords = [
  "constitution", "constitutional", "fundamental rights", "directive principles",
  "supreme court", "sc", "high court", "pil", "bench", "verdict", "stay order",
  "cji", "attorney general", "solicitor general", "article 370", "article 356",
  "tenth schedule", "anti-defection", "disqualification", "impeachment",
  "niti aayog", "raj bhavan", "rashtrapati bhavan", "north block", "south block",
  "panchayat", "gram sabha", "municipal corporation", "municipality",
  "protest", "agitation", "dharna", "bandh", "hartal",
  "political row", "opposition attack", "allegations", "controversy",
  "governance", "policy", "reforms", "law and order", "curfew",
  "corruption", "scam", "graft", "resignation", "cabinet reshuffle",
  "ed", "enforcement directorate", "cbi", "nia", "lokpal", "cvc"
];

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function buildPatterns(keywords) {
  return keywords.map((kw) => {
    const k = normalize(kw);
    const escaped = escapeRegExp(k);
    const isPhrase = /[\s.()]/.test(k);
    const pattern = isPhrase
      ? new RegExp(escaped, "gi")
      : new RegExp(`\\b${escaped}\\b`, "gi");
    return { kw: kw, re: pattern };
  });
}

const tierAPatterns = buildPatterns(tierAKeywords);
const tierBPatterns = buildPatterns(tierBKeywords);

function countMatches(text, patterns) {
  let count = 0;
  for (const { re } of patterns) {
    const found = text.match(re);
    if (found) count += found.length;
  }
  return count;
}

function classifyPoliticsIndia01(inputText, options = {}) {
  const { minTierA = 1, minTierB = 3, requireBoth = false } = options;
  const text = normalize(inputText);
  const tierAScore = countMatches(text, tierAPatterns);
  const tierBScore = countMatches(text, tierBPatterns);

  let isPolitical;
  if (requireBoth) {
    isPolitical = (tierAScore >= 1 && tierBScore >= 1) || tierAScore >= 2;
  } else {
    isPolitical = tierAScore >= minTierA || tierBScore >= minTierB;
  }
  return isPolitical ? 1 : 0;
}

const fetchSpecificPoliticalTopics = async () => {
  console.log('[Political Fetch] Starting specialized political news search...');
  try {
    const response = await serpRequest({
      engine: "google_news",
      q: "India politics when:1d",
      gl: "in",
      hl: "en",
      num: 100
    });

    const articles = response.news_results || [];
    const titles = articles.map(r => r.title).filter(Boolean);
    const uniqueTitles = Array.from(new Set(titles));

    console.log(`[Political Fetch] Found ${uniqueTitles.length} unique titles from Google News.`);

    const validPoliticalTopics = uniqueTitles.filter(title => classifyPoliticsIndia01(title) === 1);

    console.log(`[Political Fetch] Classified ${validPoliticalTopics.length} titles as strictly political.`);

    return validPoliticalTopics.map(topic => ({ topic, category: 'Politics' }));
  } catch (error) {
    console.error(`[Political Fetch] Failed: ${error.message}`);
    return [];
  }
};

const fetchTopicInsights = async (topic) => {
  if (!topic) throw new Error('Missing topic for fetchTopicInsights');
  return serpRequest({
    engine: 'google_trends',
    q: topic,
    data_type: 'TIMESERIES',
  });
};

const fetchTopicArticles = async (topic, limit = 6) => {
  const response = await serpRequest({
    engine: 'google',
    q: topic,
    tbm: 'nws',
    num: limit,
    tbs: 'qdr:h24,sbd:1',
  });

  const articles = (response.news_results || [])
    .map(item => ({
      source: item.source || null,
      title: item.title || topic,
      snippet: item.snippet || '',
      link: item.link || item.news_url || null,
      rawImage: item.original || item.image_url || item.thumbnail || null,
      publishedAt: item.date || item.published_at || null,
    }))
    .filter(a => Boolean(a.link) && isFresh(a.publishedAt));

  await Promise.all(articles.map(async (article) => {
    article.imageUrl = await resolveBestImage({
      imageUrl: article.rawImage,
      topic: article.title,
      category: null,
    });
    delete article.rawImage;
  }));

  return articles;
};

const fetchCategoryArticles = async (feed, limit = 8) => {
  const response = await serpRequest({
    engine: 'google_news',
    hl: feed.lang || 'en',
    gl: feed.country || 'in',
    q: feed.query,
    num: limit,
    tbs: 'qdr:h4,sbd:1',
  });

  const articles = (response.news_results || [])
    .map(item => ({
      source:
        typeof item.source === 'string'
          ? item.source
          : item.source?.name || item.publisher?.name || null,
      title: item.title || feed.topic,
      snippet: item.snippet || item.summary || '',
      link: item.link || item.url || null,
      rawImage:
        item.image?.original ||
        item.image?.src ||
        item.image_url ||
        item.thumbnail ||
        null,
      publishedAt: item.date || item.published_at || null,
    }))
    .filter(a => Boolean(a.link) && isFresh(a.publishedAt));

  await Promise.all(articles.map(async (article) => {
    article.imageUrl = await resolveBestImage({
      imageUrl: article.rawImage,
      topic: article.title,
      category: feed.category,
    });
    delete article.rawImage;
  }));

  return articles;
};

const callGemini = async (prompt, retryCount = 0) => {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY missing');
  }

  await delayIfNeededForGemini();

  const model = GEMINI_MODELS[currentGeminiModelIndex] || GEMINI_MODELS[0];
  const url = `${GEMINI_ENDPOINT}/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;

  try {
    console.log(`[Gemini] Calling model: ${model} (attempt ${retryCount + 1})`);
    const { data } = await axios.post(
      url,
      { contents: [{ parts: [{ text: prompt }] }] },
      {
        timeout: 60000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (!responseText) throw new Error('Empty response from Gemini API');

    if (retryCount === 0) {
      console.log(`[Gemini] Successfully using model: ${model}`);
    }

    return responseText;
  } catch (error) {
    const statusCode = error.response?.status;
    const errorMessage = error.response?.data?.error?.message || error.message;

    if (statusCode === 404) {
      console.warn(`[Gemini] Model ${model} returned 404: ${errorMessage}`);
      const nextIndex = (currentGeminiModelIndex + 1) % GEMINI_MODELS.length;

      if (retryCount < GEMINI_MODELS.length - 1 && nextIndex !== currentGeminiModelIndex) {
        currentGeminiModelIndex = nextIndex;
        console.log(`[Gemini] Trying next model: ${GEMINI_MODELS[currentGeminiModelIndex]}`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return callGemini(prompt, retryCount + 1);
      } else {
        currentGeminiModelIndex = 0;
        throw new Error(`All Gemini models failed with 404. Tried: ${GEMINI_MODELS.join(', ')}. Last error: ${errorMessage}`);
      }
    }

    if (statusCode === 429) {
      const waitTime = Math.min(60000, (retryCount + 1) * 10000);
      console.warn(`[Gemini] Rate limited (429), waiting ${waitTime}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      if (retryCount < 3) return callGemini(prompt, retryCount + 1);
      throw new Error(`Gemini API rate limit exceeded after ${retryCount + 1} retries`);
    }

    if (statusCode === 400) {
      throw new Error(`Gemini API bad request (400): ${errorMessage}. Check your API key and request format.`);
    }

    if (statusCode === 403) {
      if (errorMessage.includes('leaked') || errorMessage.includes('invalid')) {
        throw new Error(`Gemini API key issue (403): ${errorMessage}. Please generate a new API key from Google AI Studio.`);
      }
      throw new Error(`Gemini API forbidden (403): ${errorMessage}. Check API key permissions.`);
    }

    throw new Error(`Gemini API error (${statusCode || 'unknown'}): ${errorMessage}`);
  }
};

const summarizeWithGemini = async (topic, trendData, articles = []) => {
  const trendSlice = JSON.stringify(trendData?.interest_over_time || []).slice(0, 6000);

  const context = articles.length > 0
    ? articles.slice(0, 3).map(a => `Source: ${a.source}\nSnippet: ${a.snippet}\nTitle: ${a.title}`).join('\n\n')
    : 'No direct news context available.';

  const title = articles.length > 0
    ? articles.slice(0, 3).map(a => `Title: ${a.title}`).join('\n')
    : 'No direct news context available.';

  console.log('Context:', context);

  const prompt = [
    'SYSTEM INSTRUCTIONS:',
    'You must behave as a professional news writing system.',
    'PRIMARY OBJECTIVE:',
    'Produce a publish-ready news article using the supplied context.',
    'CONTENT RULES:',
    '- Title length: ~10 words',
    '- Summary length: ~500 words',
    '- Language: formal, neutral, journalistic',
    '- Style: factual reporting',
    '- No dialogue, no meta commentary, no AI references',
    '- No introductory phrases like "This article" or "The following"',
    '- Do not repeat existing titles',
    '- Use only verified facts present in the context',
    'INPUT DATA:',
    'Topic:',
    topic,
    'Previously Used Titles:',
    title,
    'Context News:',
    context,
    'FINAL OUTPUT STRUCTURE:',
    'Title:',
    '(Catchy headline)',
    'Short Summary:',
    '(concise overview, ~60 words)',
    'Detailed Content:',
    '(full news report, ~400 words)',
  ].join('\n');

  try {
    const responseText = await callGemini(prompt);
    console.log('Gemini response:', responseText);

    const titleMatch = responseText.match(/Title:\s*(.+?)(?=\n|Short Summary:|Detailed Content:|$)/i);
    const shortMatch = responseText.match(/Short Summary:\s*([\s\S]+?)(?=\n|Detailed Content:|$)/i);
    const contentMatch = responseText.match(/Detailed Content:\s*([\s\S]+)/i);

    return {
      title: titleMatch ? titleMatch[1].trim() : topic,
      summary: shortMatch ? shortMatch[1].trim() : (responseText || 'Summary unavailable.'),
      content: contentMatch ? contentMatch[1].trim() : (responseText || 'Content unavailable.')
    };
  } catch (error) {
    console.error('Gemini trend summary failed', error.message);
    return { title: topic, summary: 'Summary unavailable.', content: 'Content unavailable.' };
  }
};

const summarizeArticlesWithGemini = async (topic, articles) => {
  if (!Array.isArray(articles) || !articles.length) {
    throw new Error('No articles available to summarize');
  }

  const articlesText = articles
    .map((article, index) => {
      const safeSnippet = article.snippet || 'No synopsis available';
      return `Article ${index + 1}:\nTitle: ${article.title}\nSource: ${article.source || 'Unknown'}\nSummary: ${safeSnippet}\nLink: ${article.link || 'N/A'}`;
    })
    .join('\n\n');

  const prompt = [
    'You are a professional news editor. Combine the following source material into a single, factual news write-up.',
    `Trending topic: ${topic}`,
    'Use the sources below:',
    articlesText,
    'Create JSON with this structure: {"title":"","content":"","summary":"","category":"","tags":["",""]}.',
    'Title should be a catchy, professional headline, distinct from the source titles. Avoid clickbait.',
    'Content should be a detailed article. Summary must be a concise overview. Provide a relevant category and 3 tags.',
  ].join('\n\n');

  try {
    const responseText = await callGemini(prompt);
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Gemini response missing JSON');

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('Gemini response parsed:', JSON.stringify(parsed, null, 2));

    return {
      title: parsed.title || topic,
      content: parsed.content || parsed.summary || 'Content unavailable.',
      summary: parsed.summary || parsed.content,
      category: parsed.category || 'General',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    };
  } catch (error) {
    console.error('Gemini article synthesis failed:', error.message);
    const fallbackSummary = `Highlights for ${topic}: ${articles.slice(0, 2).map(a => a.snippet || a.title).join(' / ')}`;
    return {
      title: `Trending: ${topic}`,
      content: articles.map((a, idx) => `${idx + 1}. ${a.title} - ${a.snippet || ''}`).join('\n'),
      summary: fallbackSummary,
      category: 'General',
      tags: [topic.toLowerCase().replace(/\s+/g, '-'), 'trending'],
    };
  }
};

const ingestCategoryFeeds = async (issues) => {
  const categoryRecords = [];

  for (const feed of CATEGORY_FEEDS) {
    try {
      const articles = await fetchCategoryArticles(feed).catch((error) => {
        throw new Error(error.message || 'Category fetch failed');
      });

      if (!articles.length) {
        const warning = `No Google News articles returned for ${feed.id}`;
        console.warn(warning);
        issues.push(warning);
        continue;
      }

      const articlesToProcess = articles.slice(0, 3);
      console.log(`[Category Feed] Processing ${articlesToProcess.length} articles for ${feed.category} category`);

      for (const article of articlesToProcess) {
        try {
          console.log(`[Category Feed] Generating analysis for: "${article.title}" (${feed.category})`);

          const articleData = await summarizeArticlesWithGemini(article.title, [article]);

          // ✅ Use buildImageSafeUpdate so imageUrl is never overwritten after first insert
          const record = await News.findOneAndUpdate(
            { primaryLink: article.link },
            buildImageSafeUpdate({
              topic: article.title,
              title: articleData.title || article.title,
              summary: articleData.summary || article.snippet,
              content: articleData.content || article.snippet || 'Analysis unavailable.',
              category: feed.category,
              tags: articleData.tags.length ? articleData.tags : feed.tags,
              sourceOptions: [article],
              availableSources: article.source ? [article.source] : [],
              selectedSource: article.source || null,
              primarySource: article.source || null,
              primaryLink: article.link || null,
              externalUrl: article.link || null,
              imageUrl: article.imageUrl || null,
              generatedAt: new Date(),
              isTrending: false,
              autoGenerated: true,
              fromNewsApi: true,
              status: 'published',
              publishedAt: new Date(),
            }),
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );

          console.log(`[MongoDB] ✅ Stored category article: "${record.title}" (ID: ${record._id}) in ${feed.category}`);
          categoryRecords.push(record);
        } catch (articleError) {
          const articleMessage = `Failed to process article "${article.title}" in ${feed.id}: ${articleError.message}`;
          console.error(articleMessage);
          issues.push(articleMessage);
        }
      }
    } catch (error) {
      const message = `Category feed ${feed.id} failed: ${error.message}`;
      console.error(message);
      issues.push(message);
    }
  }

  return categoryRecords;
};

const refreshCategoryFeeds = async () => {
  const issues = [];
  const categoryRecords = await ingestCategoryFeeds(issues);

  const counters = { trending: 0, categories: categoryRecords.length };
  const overallStatus =
    issues.length === 0
      ? 'success'
      : counters.categories > 0
        ? 'partial'
        : 'failed';

  await updateStatus({
    lastRunFinishedAt: new Date(),
    lastRunStatus: overallStatus,
    summary: `Categories only: ${counters.categories}`,
    issues: issues.slice(-8),
    counters,
  });

  return categoryRecords;
};

const runTrendingIngestion = async () => {
  const startedAt = new Date();
  await updateStatus({
    lastRunAt: startedAt,
    lastRunStatus: 'running',
    summary: 'Starting ingestion pipeline…',
    issues: [],
  });

  const [trendingItems, politicalItems] = await Promise.all([
    fetchTrendingTopics(),
    fetchSpecificPoliticalTopics()
  ]);

  const allItemsMap = new Map();
  trendingItems.forEach(item => allItemsMap.set(item.topic.toLowerCase(), item));
  politicalItems.forEach(item => {
    if (!allItemsMap.has(item.topic.toLowerCase())) {
      allItemsMap.set(item.topic.toLowerCase(), item);
    }
  });

  const items = Array.from(allItemsMap.values());
  const results = [];
  const issues = [];
  let trendingCount = 0;

  console.log(`[Trending] Found ${trendingItems.length} standard trending + ${politicalItems.length} specialized political items.`);
  console.log(`[Trending] Total unique items to process: ${items.length}`);

  if (!items.length) {
    console.warn('No trending topics returned from SerpAPI.');
  }

  for (const item of items) {
    const { topic, category } = item;
    try {
      const insights = await fetchTopicInsights(topic).catch(() => null);
      const articles = await fetchTopicArticles(topic);
      const summary = await summarizeWithGemini(topic, insights, articles);
      const availableSources = Array.from(
        new Set(articles.map((article) => article.source).filter(Boolean))
      );
      const firstArticle = articles[0] || {};

      // ✅ Use buildImageSafeUpdate so imageUrl is never overwritten after first insert
      const record = await News.findOneAndUpdate(
        { topic },
        buildImageSafeUpdate({
          topic,
          title: summary.title || topic,
          summary: summary.summary,
          content: summary.content,
          interestOverTime: insights?.interest_over_time || [],
          isTrending: true,
          generatedAt: new Date(),
          sourceOptions: articles,
          availableSources,
          selectedSource: availableSources[0] || null,
          primarySource: firstArticle.source || null,
          primaryLink: firstArticle.link || null,
          externalUrl: firstArticle.link || null,
          imageUrl: firstArticle.imageUrl || null,
          category: category || 'Trending',
          tags: [topic.toLowerCase().replace(/\s+/g, '-'), category?.toLowerCase() || 'trending'],
          autoGenerated: true,
          fromNewsApi: true,
          status: 'published',
          publishedAt: new Date(),
        }),
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log(`[MongoDB] ✅ Stored trending topic: "${topic}" (ID: ${record._id})`);
      trendingCount += 1;
      results.push(record);
    } catch (error) {
      const message = `Failed to process topic "${topic}": ${error.message}`;
      console.error(message);
      issues.push(message);
    }
  }

  /*
  // COMMENTED OUT as per user request to restrict flow to Trending Topics -> Articles -> Gemini -> DB
  const categoryRecords = await ingestCategoryFeeds(issues);
  results.push(...categoryRecords);
  const counters = { trending: trendingCount, categories: categoryRecords.length };
  */

  const counters = { trending: trendingCount, categories: 0 };

  const overallStatus =
    issues.length === 0
      ? 'success'
      : counters.trending > 0
        ? 'partial'
        : 'failed';

  await updateStatus({
    lastRunFinishedAt: new Date(),
    lastRunStatus: overallStatus,
    summary: `Trending: ${counters.trending}`,
    issues: issues.slice(-8),
    counters,
  });

  console.log(`[MongoDB] 📊 Storage Summary: ${counters.trending} trending topics stored`);
  console.log(`[MongoDB] ✅ All filtered content successfully stored in MongoDB`);

  return results;
};

let cronJob;
const scheduleAutoTrendingRefresh = () => {
  if (cronJob) {
    return cronJob;
  }

  const expression = process.env.TRENDING_REFRESH_CRON || '0 */2 * * *';

  cronJob = cron.schedule(
    expression,
    async () => {
      try {
        console.log(`[Cron] Starting scheduled refresh at ${new Date().toISOString()}`);
        await runTrendingIngestion();
        console.log(`[Cron] Scheduled refresh completed`);
      } catch (error) {
        console.error('[Cron] Scheduled refresh task failed:', error.message);
        console.error(error.stack);
      }
    },
    { scheduled: true }
  );

  (async () => {
    try {
      console.log('[Startup] ========================================');
      console.log('[Startup] Running initial content fetch on server restart...');
      console.log('[Startup] Fetching trending topics and category feeds...');
      console.log('[Startup] All content will be stored in MongoDB.');
      console.log('[Startup] ========================================');

      await runTrendingIngestion();

      console.log('[Startup] ✅ Initial content fetch completed.');
      console.log('[Startup] All trending topics and category feeds stored in MongoDB.');
    } catch (error) {
      console.error('[Startup] ❌ Initial content fetch failed:', error.message);
      console.error('[Startup] Error details:', error.stack);
    }
  })();

  return cronJob;
};

const generateNewsFromTopic = async ({ topic, autoPublish = false, authorId = null }) => {
  if (!topic) {
    throw new Error('Topic is required to generate news');
  }

  const [insights, articles] = await Promise.all([
    fetchTopicInsights(topic).catch(() => null),
    fetchTopicArticles(topic, 8),
  ]);

  if (!articles.length) {
    throw new Error('No news articles found for that topic');
  }

  const articleData = await summarizeArticlesWithGemini(topic, articles);
  const availableSources = Array.from(
    new Set(articles.map((article) => article.source).filter(Boolean))
  );
  const firstArticle = articles[0];

  const record = await News.create({
    topic,
    title: articleData.title || topic,
    summary: articleData.summary || articles[0]?.snippet,
    content: articleData.content,
    category: articleData.category,
    tags: articleData.tags,
    interestOverTime: insights?.interest_over_time || [],
    availableSources,
    sourceOptions: articles,
    selectedSource: availableSources[0] || null,
    primarySource: firstArticle.source || null,
    primaryLink: firstArticle.link || null,
    externalUrl: firstArticle.link || null,
    imageUrl: firstArticle.imageUrl || null,
    status: autoPublish ? 'published' : 'draft',
    publishedAt: autoPublish ? new Date() : null,
    isTrending: false,
    autoGenerated: true,
    fromNewsApi: true,
    createdBy: authorId || null,
  });

  return record;
};

module.exports = {
  runTrendingIngestion,
  scheduleAutoTrendingRefresh,
  generateNewsFromTopic,
  refreshCategoryFeeds,
};