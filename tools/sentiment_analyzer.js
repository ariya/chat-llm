/**
 * Performs a basic sentiment analysis on the given text.
 * This is a simplified implementation for demonstration purposes.
 *
 * @param {string} text - The text to analyze.
 * @returns {Object} An object containing the sentiment (positive, negative, neutral) and a score.
 */
const analyzeSentiment = (text) => {
    const lowerText = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;

    const positiveWords = ['good', 'great', 'excellent', 'awesome', 'happy', 'love', 'positive', 'fantastic', 'amazing'];
    const negativeWords = ['bad', 'terrible', 'horrible', 'sad', 'hate', 'negative', 'awful', 'poor'];

    positiveWords.forEach(word => {
        if (lowerText.includes(word)) {
            positiveScore++;
        }
    });

    negativeWords.forEach(word => {
        if (lowerText.includes(word)) {
            negativeScore++;
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

    return { sentiment, score };
};

module.exports = { analyzeSentiment };
