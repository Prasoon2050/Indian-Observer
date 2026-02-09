const fetchTrendingTopics = async () => {
    // Categories: 14 (People & Society), 3 (Business), 17 (Sports), 4 (Arts & Entertainment/Reference)
    const categories = [14, 3, 17, 4];
    const categoryNames = {
        14: 'Politics',
        3: 'Business',
        17: 'Sports',
        4: 'Entertainment'
    };

    const allTopics = new Set();
    const validItems = [];

    console.log(`[Trending] Fetching topics for categories: ${categories.join(', ')}...`);

    for (const catId of categories) {
        try {
            // Use "google_trends_trending_now" (Realtime)
            const response = await serpRequest({
                engine: 'google_trends_trending_now',
                geo: 'IN',
                hours: '24', // Expanded to 24 hours
                category_id: catId,
            });

            const searches = response.trending_searches || [];
            const catTopics = searches
                .map((item) => {
                    const topicText = item?.query?.text || item?.query || item?.title;
                    return topicText;
                })
                .filter(Boolean)
                .filter((topic) => topic.trim().split(/\s+/).length > 1);

            console.log(`[Trending] Cat ${catId} (${categoryNames[catId]}) found: ${catTopics.length} topics`);

            catTopics.forEach(t => {
                if (!allTopics.has(t.toLowerCase())) {
                    allTopics.add(t.toLowerCase());
                    // Push object with topic and category
                    validItems.push({
                        topic: t,
                        category: categoryNames[catId] || 'General'
                    });
                }
            });
        } catch (error) {
            console.warn(`[Trending] Failed to fetch category ${catId}: ${error.message || error}`);
            if (error.message && error.message.includes('run out of searches')) {
                console.error('[Trending] 🛑 SerpApi quota exceeded. Stopping further category fetches.');
                break; // Stop trying other categories if quota is gone
            }
        }
    }

    console.log(`[Trending] Total unique multi-word topics found: ${validItems.length}`);
    return validItems.slice(0, 20); // Limit to 20 total
};
