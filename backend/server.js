const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Common food emojis for detection
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

// Emotion emojis for themed recipes
const emotionEmojis = {
    happy: ['😀', '😃', '😄', '😁', '😆', '😊', '☺️', '😋', '😍', '🥰', '😘', '🤗', '🤩', '😎', '🥳', '🎉', '🎊', '✨'],
    sad: ['😢', '😭', '😿', '💔', '😞', '😔', '😟', '😕', '🙁', '☔', '🌧️', '⛈️', '🌩️'],
    angry: ['😠', '😡', '🤬', '👿', '😤', '💢', '🔥', '⚡', '💥', '🌋'],
    love: ['❤️', '💕', '💖', '💗', '💓', '💞', '💘', '🥰', '😍', '😘', '💋', '💐', '🌹', '💒'],
    excited: ['🤩', '🥳', '🎉', '🎊', '✨', '🌟', '⭐', '💫', '🎆', '🎇', '🚀', '⚡'],
    calm: ['😌', '😴', '💤', '🧘‍♀️', '🧘‍♂️', '🌙', '🌛', '🌜', '☁️', '🕯️', '🌿', '🍃'],
    scared: ['😨', '😰', '😱', '👻', '💀', '☠️', '🎃', '🕷️', '🦇', '🌚', '⚡', '💥'],
    sick: ['🤒', '🤧', '😷', '🤮', '🤢', '💊', '🏥', '🌡️', '🩹']
};

// Recipe generation endpoint
app.post('/api/generate-recipe', async (req, res) => {
    try {
        const { input } = req.body;

        if (!input) {
            return res.status(400).json({ error: 'Input is required' });
        }

        // Extract emojis from input
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu;
        const emojis = input.match(emojiRegex) || [];
        
        if (emojis.length === 0) {
            return res.status(400).json({ error: 'Please include some emojis in your input! 🤔' });
        }

        // Count common food emojis vs total emojis
        const foodEmojiCount = emojis.filter(emoji => commonFoodEmojis.includes(emoji)).length;
        const foodRatio = foodEmojiCount / emojis.length;

        // Detect emotion themes
        let dominantEmotion = null;
        let maxEmotionCount = 0;
        
        for (const [emotion, emotionEmojiList] of Object.entries(emotionEmojis)) {
            const emotionCount = emojis.filter(emoji => emotionEmojiList.includes(emoji)).length;
            if (emotionCount > maxEmotionCount) {
                maxEmotionCount = emotionCount;
                dominantEmotion = emotion;
            }
        }

        // Determine recipe type
        let recipeType = 'absurd'; // default
        if (foodRatio > 0.6) {
            recipeType = 'normal';
        } else if (dominantEmotion && maxEmotionCount > 0) {
            recipeType = 'emotion';
        }

        // Prepare prompt based on type
        let prompt = '';
        const emojiString = emojis.join(' ');

        if (recipeType === 'normal') {
            prompt = `Create a realistic, practical recipe based on these emojis: ${emojiString}
            
            Guidelines:
            - Create a plausible dish name that incorporates the emoji ingredients
            - List 5-8 realistic ingredients with quantities
            - Provide 4-6 clear, concise cooking steps
            - Keep it practical and cookable
            - Use a friendly, helpful tone
            
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

        } else if (recipeType === 'emotion') {
            const emotionThemes = {
                happy: "uplifting and cheerful",
                sad: "comforting and soothing",
                angry: "spicy and intense",
                love: "romantic and sweet",
                excited: "energizing and vibrant",
                calm: "peaceful and relaxing",
                scared: "mysteriously spooky",
                sick: "healing and nourishing"
            };

            prompt = `Create a ${emotionThemes[dominantEmotion]} recipe inspired by the ${dominantEmotion} emotion and these emojis: ${emojiString}
            
            Guidelines:
            - Create a dish name that reflects the ${dominantEmotion} emotion
            - Make ingredients and steps match the emotional theme
            - For ${dominantEmotion} mood: make it ${emotionThemes[dominantEmotion]}
            - Keep it whimsical but somewhat cookable
            - Use creative, emotional language
            
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
            // Absurd recipe
            prompt = `Create an absolutely absurd, surreal recipe based on these emojis: ${emojiString}
            
            Guidelines:
            - Create a ridiculous dish name that sounds mystical or impossible
            - List 5-8 "ingredients" that are completely related to the emojis
            - Provide 4-6 hilariously impossible cooking steps
            - Be creative, witty, and over-the-top
            - Include scientific/absurd cooking methods
            - Make it entertaining and funny
            - Don't make it too complex
            - Use Malayalam as the language for absurd recipes
            
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

        // Call Gemini API (API key is safely stored on server)
        const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyA0swGiEqxrrvop88aXHw3v_VIkBl9jftw' ;
        if (!apiKey) {
            return res.status(500).json({ error: 'Gemini API key not configured on server' });
        }

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
                    temperature: recipeType === 'normal' ? 0.7 : 1.2
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const recipeText = data.candidates[0].content.parts[0].text;

        // Return the recipe with metadata
        res.json({
            recipeText,
            recipeType,
            dominantEmotion,
            emojis: emojiString,
            foodRatio: Math.round(foodRatio * 100)
        });

    } catch (error) {
        console.error('Error generating recipe:', error);
        res.status(500).json({ 
            error: 'Failed to generate recipe',
            message: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Absurdist Recipe Generator API is running!',
        features: ['Food Recipes', 'Emotion-based Recipes', 'Absurd Recipes', 'Malayalam Support']
    });
});

// Serve static files from parent directory for the HTML app
const path = require('path');
app.use(express.static(path.join(__dirname, '../')));

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🦄 Absurdist Recipe Generator API ready!`);
    console.log(`😊 Emotion-based recipes enabled!`);
    console.log(`📱 Frontend available at: http://localhost:${PORT}`);
});


