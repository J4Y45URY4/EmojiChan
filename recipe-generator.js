/**
 * Absurdist Recipe Generator
 * Generates normal or absurd recipes based on emoji input
 */

async function generateRecipeFromEmojis(input) {
    // Define common food-related emojis
    const commonFoodEmojis = [
        '🍕', '🥩', '🍫', '🥦', '🧀', '🥚', '🍌', '🍞', '🍔', '🍓', 
        '🥗', '🥔', '🍋', '🍅', '🥕', '🧄', '🧅', '🌶️', '🥒', '🥬',
        '🍇', '🍊', '🍎', '🍐', '🥝', '🥥', '🍒', '🍑', '🥭', '🍍',
        '🥖', '🥯', '🧇', '🥞', '🍳', '🥓', '🍗', '🍖', '🌭', '🥪',
        '🌮', '🌯', '🥙', '🍝', '🍜', '🍲', '🍛', '🍣', '🍤', '🦐',
        '🦀', '🐟', '🐠', '🥟', '🍱', '🍘', '🍙', '🍚', '🍥', '🥮',
        '🧆', '🥘', '🍯', '🥜', '🌰', '🥨', '🍿', '🧊', '🥤', '☕',
        '🍵', '🧃', '🥛', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🧈',
        '🍆', '🍠', '🍰', '🍦', '🍨', '🍧', '🍩', '🍪', '🍬', '🍭', '🍮',
        '🥧', '🧁', '🥨', '🥖', '🫓', '🥐', '🫒', '🥑', '🌽', '🫑',
        '🥒', '🫐', '🥥', '🥝', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍',
        '🥭', '🍑', '🍒', '🍓', '🫖', '🍴', '🥄', '🔪', '🥢', '🍽️',
        '🧂', '🫘', '🌶️', '🫚', '🧄', '🧅', '🍄', '🥜', '🌰', '🫔',
        '🌮', '🌯', '🫔', '🥙', '🧆', '🥗', '🍲', '🍜', '🍝', '🥘',
        '🍛', '🍚', '🍙', '🍘', '🍱', '🍣', '🍤', '🍥', '🥮', '🧊',
        '💦'];

    // Extract emojis from input
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojis = input.match(emojiRegex) || [];
    
    if (emojis.length === 0) {
        return '<div class="error">Please include some emojis in your input! 🤔</div>';
    }

    // Count common food emojis vs total emojis
    const foodEmojiCount = emojis.filter(emoji => commonFoodEmojis.includes(emoji)).length;
    const foodRatio = foodEmojiCount / emojis.length;
    
    // Determine if we should generate normal or absurd recipe
    const isNormalRecipe = foodRatio > 0.6; // More than 60% food emojis = normal recipe

    // Call secure backend API instead of Gemini directly
    const API_BASE_URL = 'http://localhost:5000';

    try {
        const response = await fetch(`${API_BASE_URL}/api/generate-recipe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: input
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const recipeText = data.recipeText;
        const recipeType = data.recipeType || 'absurd';
        const dominantEmotion = data.dominantEmotion;
        const isNormalRecipe = recipeType === 'normal';

        // Convert the markdown-style response to HTML
        const htmlRecipe = convertRecipeToHTML(recipeText, isNormalRecipe, recipeType, dominantEmotion);
        
        return htmlRecipe;

    } catch (error) {
        console.error('Error generating recipe:', error);
        return `<div class="error">
            <h3>Oops! Recipe generation failed 😅</h3>
            <p>Error: ${error.message}</p>
            <p><strong>Make sure to:</strong></p>
            <ul>
                <li>The backend server is running on http://localhost:5000</li>
                <li>Check your internet connection</li>
                <li>Verify the backend has a valid Gemini API key configured</li>
            </ul>
        </div>`;
    }
}

/**
 * Converts the AI-generated recipe text to properly formatted HTML
 */
function convertRecipeToHTML(recipeText, isNormal, recipeType = 'absurd', dominantEmotion = null) {
    const lines = recipeText.split('\n').filter(line => line.trim());
    let html = '';
    let currentSection = '';
    
    // Determine CSS class based on recipe type
    let recipeClass = 'absurd-recipe';
    if (isNormal) {
        recipeClass = 'normal-recipe';
    } else if (recipeType === 'emotion' && dominantEmotion) {
        recipeClass = `emotion-recipe emotion-${dominantEmotion}`;
    }
    
    html += `<div class="recipe ${recipeClass}">`;
    
    // Add emotion indicator if it's an emotion-based recipe
    if (recipeType === 'emotion' && dominantEmotion) {
        const emotionEmojis = {
            happy: '😊',
            sad: '😢',
            angry: '😠',
            love: '❤️',
            excited: '🤩',
            calm: '😌',
            scared: '😱',
            sick: '🤒'
        };
        html += `<div class="emotion-indicator">${emotionEmojis[dominantEmotion]} ${dominantEmotion.toUpperCase()} THEMED RECIPE ${emotionEmojis[dominantEmotion]}</div>`;
    }
    
    for (let line of lines) {
        line = line.trim();
        
        // Recipe title (usually first line or marked with **)
        if (line.startsWith('**') && line.endsWith('**')) {
            const title = line.replace(/\*\*/g, '');
            if (title.toLowerCase().includes('ingredient')) {
                html += '<h4>Ingredients:</h4><ul>';
                currentSection = 'ingredients';
            } else if (title.toLowerCase().includes('instruction')) {
                if (currentSection === 'ingredients') html += '</ul>';
                html += '<h4>Instructions:</h4><ol>';
                currentSection = 'instructions';
            } else {
                html += `<h3>${title}</h3>`;
                currentSection = 'title';
            }
        }
        // Ingredient items (start with -)
        else if (line.startsWith('-') && currentSection === 'ingredients') {
            const ingredient = line.substring(1).trim();
            html += `<li>${ingredient}</li>`;
        }
        // Instruction items (start with number)
        else if (/^\d+\./.test(line) && currentSection === 'instructions') {
            const instruction = line.replace(/^\d+\.\s*/, '');
            html += `<li>${instruction}</li>`;
        }
        // Regular paragraph
        else if (line && !line.startsWith('**')) {
            if (currentSection === 'title' || !currentSection) {
                html += `<h3>${line}</h3>`;
                currentSection = 'title';
            }
        }
    }
    
    // Close any open tags
    if (currentSection === 'ingredients') html += '</ul>';
    if (currentSection === 'instructions') html += '</ol>';
    
    html += '</div>';
    
    return html;
}

// Export for use in other files or modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateRecipeFromEmojis };
}
