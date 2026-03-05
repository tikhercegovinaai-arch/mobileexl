export interface DataInsight {
    type: 'summary' | 'trend' | 'anomaly';
    text: string;
}

export interface AggregatedData {
    categoryTotals: Record<string, number>;
    totalSum: number;
    insights: DataInsight[];
}

export const AnalyticsService = {
    /**
     * Attempts to aggregate extracted data based on generic numerical fields and categories.
     * This is a dynamic aggregator designed to work with variable JSON outputs from the LLM.
     */
    aggregateData(data: Record<string, unknown>): AggregatedData {
        const categoryTotals: Record<string, number> = {};
        let totalSum = 0;

        // Recursive function to search for numbers and categorizable structures
        const traverseAndAggregate = (obj: any, currentCategory: string = 'Uncategorized') => {
            if (Array.isArray(obj)) {
                obj.forEach((item) => traverseAndAggregate(item, currentCategory));
                return;
            }

            if (typeof obj === 'object' && obj !== null) {
                // If it's an object with a 'category' and a value, try to interpret it
                const likelyCategory = typeof obj.category === 'string' ? obj.category : currentCategory;

                for (const key in obj) {
                    const value = obj[key];

                    // Look for fields that sound like amounts
                    const lowerKey = key.toLowerCase();
                    if (lowerKey.includes('amount') || lowerKey.includes('total') || lowerKey.includes('price') || lowerKey.includes('cost')) {
                        const num = this._parseValueToNumber(value);
                        if (!isNaN(num)) {
                            categoryTotals[likelyCategory] = (categoryTotals[likelyCategory] || 0) + num;
                            totalSum += num;
                        }
                    } else if (typeof value === 'object') {
                        traverseAndAggregate(value, key);
                    }
                }
            }
        };

        // If batch results exist, iterate through them
        if (data.batchResults && Array.isArray(data.batchResults)) {
            traverseAndAggregate(data.batchResults);
        } else {
            traverseAndAggregate(data);
        }

        const insights = this._generateBasicInsights(categoryTotals, totalSum);

        return {
            categoryTotals,
            totalSum,
            insights
        };
    },

    /**
     * Helper to safely parse localized strings or numbers into floats.
     */
    _parseValueToNumber(val: any): number {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const cleaned = val.replace(/[^0-9.-]+/g, '');
            return parseFloat(cleaned);
        }
        return NaN;
    },

    /**
     * Generates simple plain-text insights based on the aggregated totals.
     */
    _generateBasicInsights(categoryTotals: Record<string, number>, totalSum: number): DataInsight[] {
        const insights: DataInsight[] = [];

        if (totalSum > 0) {
            insights.push({
                type: 'summary',
                text: `Total identified value across all documents is ${totalSum.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}.`
            });
        }

        const entries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
        if (entries.length > 0) {
            const topCategory = entries[0];
            insights.push({
                type: 'trend',
                text: `The largest category is "${topCategory[0]}" at ${topCategory[1].toLocaleString(undefined, { style: 'currency', currency: 'USD' })}.`
            });
        }

        return insights;
    }
};
