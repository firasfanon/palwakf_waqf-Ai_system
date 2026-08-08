/**
 * Rule-based watchlist matcher
 * Scores fetched_content items against watchlist queries
 */

export interface MatchResult {
	watchlistId: number;
	itemId: number;
	matchedOn: string[];
	score: number;
}

/**
 * Tokenize query string into keywords
 */
function tokenizeQuery(query: string): string[] {
	return query
		.split(/[\s,،]+/)
		.map((t) => t.trim())
		.filter((t) => t.length > 0)
		.map((t) => t.toLowerCase());
}

/**
 * Check if text contains any of the keywords
 */
function matchKeywords(text: string, keywords: string[]): { matched: string[]; count: number } {
	const lowerText = text.toLowerCase();
	const matched: string[] = [];
	let count = 0;

	for (const kw of keywords) {
		if (lowerText.includes(kw)) {
			matched.push(kw);
			count++;
		}
	}

	return { matched, count };
}

/**
 * Match a single item against a watchlist
 */
export function matchItemAgainstWatchlist(
	item: {
		id: number;
		title: string;
		content: string;
		aiCategory?: string | null;
		status?: string;
	},
	watchlist: {
		id: number;
		query: string;
		categories?: string | null;
		sourceTypes?: string | null;
		statuses?: string | null;
	}
): MatchResult | null {
	const keywords = tokenizeQuery(watchlist.query);
	if (keywords.length === 0) return null;

	let score = 0;
	const matchedOn: string[] = [];

	// Match title + content (first 2000 chars)
	const textToSearch = (item.title + " " + item.content.substring(0, 2000)).toLowerCase();
	const keywordMatches = matchKeywords(textToSearch, keywords);
	if (keywordMatches.count > 0) {
		score += keywordMatches.count * 10;
		matchedOn.push(...keywordMatches.matched);
	}

	// Match category if specified
	if (watchlist.categories && item.aiCategory) {
		const categories = watchlist.categories
			.split(",")
			.map((c) => c.trim().toLowerCase())
			.filter((c) => c.length > 0);
		if (categories.includes(item.aiCategory.toLowerCase())) {
			score += 20;
			matchedOn.push("category");
		}
	}

	// Match status if specified
	if (watchlist.statuses && item.status) {
		const statuses = watchlist.statuses
			.split(",")
			.map((s) => s.trim().toLowerCase())
			.filter((s) => s.length > 0);
		if (statuses.includes(item.status.toLowerCase())) {
			score += 5;
			matchedOn.push("status");
		}
	}

	// Return match only if score > 0
	if (score === 0) return null;

	return {
		watchlistId: watchlist.id,
		itemId: item.id,
		matchedOn: Array.from(new Set(matchedOn)), // Remove duplicates
		score,
	};
}

/**
 * Match multiple items against a watchlist
 */
export function matchItemsAgainstWatchlist(
	items: Array<{
		id: number;
		title: string;
		content: string;
		aiCategory?: string | null;
		status?: string;
	}>,
	watchlist: {
		id: number;
		query: string;
		categories?: string | null;
		sourceTypes?: string | null;
		statuses?: string | null;
	}
): MatchResult[] {
	const matches: MatchResult[] = [];

	for (const item of items) {
		const match = matchItemAgainstWatchlist(item, watchlist);
		if (match) {
			matches.push(match);
		}
	}

	return matches;
}

/**
 * Match items against multiple watchlists
 */
export function matchItemsAgainstWatchlists(
	items: Array<{
		id: number;
		title: string;
		content: string;
		aiCategory?: string | null;
		status?: string;
	}>,
	watchlists: Array<{
		id: number;
		query: string;
		categories?: string | null;
		sourceTypes?: string | null;
		statuses?: string | null;
	}>
): MatchResult[] {
	const allMatches: MatchResult[] = [];

	for (const watchlist of watchlists) {
		const matches = matchItemsAgainstWatchlist(items, watchlist);
		allMatches.push(...matches);
	}

	return allMatches;
}
