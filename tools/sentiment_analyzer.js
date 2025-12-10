/**
 * Performs a basic sentiment analysis on the given text.
 * This is a simplified implementation using keyword matching.
 * For production use, consider integrating with advanced NLP libraries.
 *
 * @param {string} text - The text to analyze (required, non-empty string)
 * @returns {Object} An object containing:
 *   - sentiment {string}: 'positive', 'negative', or 'neutral'
 *   - score {number}: Magnitude of sentiment (higher = stronger sentiment)
 *   - positiveMatches {number}: Count of positive keywords found
 *   - negativeMatches {number}: Count of negative keywords found
 * @throws {TypeError} If text is not a string
 * @throws {Error} If text is empty or only whitespace
 * 
 * @example
 * const result = analyzeSentiment("This is amazing!");
 * // Returns: { sentiment: 'positive', score: 1, positiveMatches: 1, negativeMatches: 0 }
 */
const analyzeSentiment = (text) => {
    // Input validation
    if (typeof text !== 'string') {
        throw new TypeError('Text must be a string');
    }
    
    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
        throw new Error('Text cannot be empty or only whitespace');
    }
    
    const lowerText = trimmedText.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;

    // Enhanced sentiment word lists with common variations
    const positiveWords = [
        'good', 'great', 'excellent', 'awesome', 'happy', 'love', 'positive', 
        'fantastic', 'amazing', 'wonderful', 'brilliant', 'outstanding', 
        'superb', 'perfect', 'nice', 'beautiful', 'joy', 'pleased', 'delighted'
    ];
    
    const negativeWords = [
        'bad', 'terrible', 'horrible', 'sad', 'hate', 'negative', 'awful', 
        'poor', 'worst', 'disappointing', 'frustrating', 'angry', 'upset', 
        'annoying', 'useless', 'waste', 'disgusting', 'pathetic'
    ];

    // Use word boundaries for more accurate matching
    positiveWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
            positiveScore += matches.length;
        }
    });

    negativeWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
            negativeScore += matches.length;
        }
    });

    let sentiment = 'neutral';
    let score = 0;

    if (positiveScore > negativeScore) {
        sentiment = 'positive';
        score = positiveScore - negativeScore;
    } else if (negativeScore > positiveScore) {
        sentiment = 'negative';
        score = negativeScore - positiveScore;
    }

    return { 
        sentiment, 
        score,
        positiveMatches: positiveScore,
        negativeMatches: negativeScore
    };
};

module.exports = { analyzeSentiment };
