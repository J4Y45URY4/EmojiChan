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

    // Prepare Google Gemini API call
    const apiKey = 'AIzaSyA0swGiEqxrrvop88aXHw3v_VIkBl9jftw'; // Replace with your actual Gemini API key
    
    let prompt;
    if (isNormalRecipe) {
        prompt = `Create a realistic, practical recipe based on these emojis: ${emojis.join(' ')}
        
        Guidelines:
        - Create a plausible dish name that incorporates the emoji ingredients
        - List 5-8 realistic ingredients with quantities
        - Provide 4-6 clear, concise cooking steps
        - Keep it practical and cookable
        - Use a friendly, helpful tone
        - if emotions are included, reflect them in the recipe (e.g., happy = cheerful dish, sad = comfort food)

        
        Format your response as:
        **Recipe Name**
        
        **Ingredients:**
        - ingredient 1
        - ingredient 2
        (etc.)  
        
        **Instructions:**
        1. step 1
        2. step 2
        (etc.)`;
    } else {
        prompt = `Create an absolutely absurd, surreal recipe based on these emojis: ${emojis.join(' ')}
        
        Guidelines:
        - Create a ridiculous dish name that sounds mystical or impossible
        - List 5-8 "ingredients" that are completely related to the emojis
        - Provide 4-6 hilariously impossible cooking steps
        - Be creative, witty, and over-the-top
        - Include scientific/absurd cooking methods
        - Make it entertaining and funny
        - Dont make it too complex
        - if emotions are included, reflect them in the recipe (e.g., happy = cheerful dish, sad = comfort food)
    
        
        Format your response as:
        **Recipe Name**
        
        **Ingredients:**
        - ingredient 1
        - ingredient 2
        (etc.)
        
        **Instructions:**
        1. step 1
        2. step 2
        (etc.)`;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: isNormalRecipe ? 0.7 : 1.2 // Higher creativity for absurd recipes
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const recipeText = data.candidates[0].content.parts[0].text;

        // Convert the markdown-style response to HTML
        const htmlRecipe = convertRecipeToHTML(recipeText, isNormalRecipe);
        
        return htmlRecipe;

    } catch (error) {
        console.error('Error generating recipe:', error);
        return `<div class="error">
            <h3>Oops! Recipe generation failed 😅</h3>
            <p>Error: ${error.message}</p>
            <p><strong>Make sure to:</strong></p>
            <ul>
                <li>Replace 'YOUR_GEMINI_API_KEY_HERE' with your actual Google Gemini API key</li>
                <li>Check your internet connection</li>
                <li>Verify your API key is valid and has sufficient quota</li>
            </ul>
        </div>`;
    }
}

/**
 * Converts the AI-generated recipe text to properly formatted HTML
 */
function convertRecipeToHTML(recipeText, isNormal) {
    const lines = recipeText.split('\n').filter(line => line.trim());
    let html = '';
    let currentSection = '';
    
    const recipeClass = isNormal ? 'normal-recipe' : 'absurd-recipe';
    html += `<div class="recipe ${recipeClass}">`;
    
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
