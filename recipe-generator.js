/**
 * Absurdist Recipe Generator
 * Generates normal or absurd recipes based on emoji input
 * Calls backend API to keep API key hidden
 */

async function generateRecipeFromEmojis(input) {
    // Define common food-related emojis (same as before)
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
        '💦'
    ];

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
    const isNormalRecipe = foodRatio > 0.7; // More than 70% food emojis = normal recipe

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
        
        **Instructions:**
        1. step 1
        2. step 2`;
    } else {
        prompt = `Create an absolutely absurd, surreal recipe based on these emojis: ${emojis.join(' ')}
        
        Guidelines:
        - Create a ridiculous dish name that sounds impossible
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
        
        **Instructions:**
        1. step 1
        2. step 2`;
    }

    try {
        // Call your backend instead of Gemini API directly:
        const response = await fetch('http://localhost:3000/generate-recipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                temperature: isNormalRecipe ? 0.7 : 1.2
            })
        });

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const recipeText = data.candidates[0].content.parts[0].text;

        // Convert markdown-style text to HTML
        const htmlRecipe = convertRecipeToHTML(recipeText, isNormalRecipe);

        return htmlRecipe;

    } catch (error) {
        console.error('Error generating recipe:', error);
        return `<div class="error">
            <h3>Oops! Recipe generation failed 😅</h3>
            <p>Error: ${error.message}</p>
            <p><strong>Make sure your backend server is running at http://localhost:3000</strong></p>
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
        else if (line.startsWith('-') && currentSection === 'ingredients') {
            html += `<li>${line.substring(1).trim()}</li>`;
        }
        else if (/^\d+\./.test(line) && currentSection === 'instructions') {
            html += `<li>${line.replace(/^\d+\.\s*/, '')}</li>`;
        }
        else if (line && !line.startsWith('**')) {
            if (currentSection === 'title' || !currentSection) {
                html += `<h3>${line}</h3>`;
                currentSection = 'title';
            }
        }
    }
    
    if (currentSection === 'ingredients') html += '</ul>';
    if (currentSection === 'instructions') html += '</ol>';
    
    html += '</div>';
    
    return html;
}
