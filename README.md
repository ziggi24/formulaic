# Formulaic 🎯

A daily emoji code-breaking puzzle game inspired by Wordle and Mastermind. Guess the secret sequence of five emojis in nine tries using visual clues!

🎮 **Play now:** [https://formulaic.dev/](https://formulaic.dev/)

## 🎯 Overview

Formulaic is a language-agnostic, accessible puzzle game that challenges players to decode a secret emoji sequence using logical deduction. Each day brings a new puzzle that's the same for all players worldwide, creating a shared daily challenge experience.

### Key Features

- 🗓️ **Daily Puzzles** - New challenge every day, same for all players
- 🎨 **Visual Accessibility** - Uses distinct emoji shapes instead of colors
- 🧩 **Logic-Based Gameplay** - Pure deduction, no language barriers
- 📱 **Responsive Design** - Works on desktop and mobile
- 💾 **Progress Saving** - Your game state and statistics persist
- 🎊 **Celebratory Animations** - Satisfying win sequences
- 📤 **Social Sharing** - Share your results without spoilers

## 🎮 How to Play

### Objective
Guess the secret emoji pattern in **nine tries or less**. After each guess, use the clues to figure out the right pattern and win!

### Steps
1. **Select** five emojis from the palette to fill a row
2. **Submit** your guess using the Submit button
3. **Check** the clues that appear to see how close you were
4. **Learn** from the feedback and make a better guess on the next line

### Emoji Palette
The game uses 8 distinct emojis chosen for their visual uniqueness and accessibility:
🍓 🚚 🌼 🌲 🧵 ☂️ 💕 💍

## 🔍 Understanding Clues

### Feedback System
After each guess, you'll see clues on the right side of your guess:

- **⚫ Correct Emoji, Correct Spot**
  - You have the right emoji in the perfect position

- **⚪ Correct Emoji, Wrong Spot** 
  - You have a correct emoji, but it's in the wrong place

### Example
If you see clues **⚫ ⚪**, this means:
- One emoji is in the exact right position
- One emoji is correct, but in the wrong position  
- The other three emojis are not in the secret pattern at all

### Important Notes
- 🚨 **Clues don't line up** with your guess positions - they just show total counts
- 🔄 **Duplicates are allowed** in the secret pattern (like 🍓 🌲 🌲 💍 🚚)

## 🏗️ Technical Implementation

### Architecture
- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **No Backend**: Fully client-side implementation
- **Hosting**: GitHub Pages
- **Daily Puzzles**: Date-seeded pseudo-random number generator

### Key Technologies
- **Seeded PRNG**: xmur3 + sfc32 algorithms for deterministic daily puzzles
- **Local Storage**: Game state and statistics persistence
- **CSS Grid & Flexbox**: Responsive layout system
- **Dialog API**: Modal implementations
- **Clipboard API**: Share functionality

### Game State Management
```javascript
// Example game state structure
{
  dayIndex: 123,
  guesses: [["🍓", "🌲", "🚚", "🍓", "💍"]],
  feedbacks: [{black: 2, white: 1}],
  currentGuess: ["🌼", "🚚"],
  isComplete: false,
  isWin: false
}
```

## 🎨 Design Philosophy

### Accessibility First
- **Visual Clarity**: Distinct emoji shapes work for all vision types
- **No Color Dependence**: Game logic relies on shapes, not colors
- **Clear Typography**: High contrast text and proper sizing
- **Keyboard Support**: Full keyboard navigation and shortcuts

### User Experience
- **Progressive Enhancement**: Works without JavaScript (basic functionality)
- **Responsive Design**: Optimized for all screen sizes
- **Performance**: Lightweight, fast loading
- **Intuitive Interface**: Self-explanatory game mechanics

## 🎯 Game Mechanics Deep Dive

### Daily Puzzle Generation
Each day's puzzle is generated using a deterministic algorithm:

1. **Date Seed**: Current date (YYYY-MM-DD) creates a unique seed
2. **PRNG**: Seeded random number generator ensures same puzzle globally
3. **Sequence Creation**: 5 emojis selected from the 8-emoji palette
4. **Duplicates**: Algorithm allows repeated emojis in sequences

### Mastermind-Style Evaluation
The feedback system implements classic Mastermind rules:

```javascript
// Simplified evaluation logic
function evaluateGuess(secret, guess) {
  let exactMatches = 0;
  let colorMatches = 0;
  
  // Count exact position matches
  // Count total color matches (excluding exacts)
  // Return {black: exactMatches, white: colorMatches}
}
```

### Statistics Tracking
- **Games Played**: Total puzzles attempted
- **Win Rate**: Percentage of games won
- **Current Streak**: Consecutive wins
- **Guess Distribution**: Histogram of solve attempts (1-9 guesses)

## 🌟 Features

### Interactive Elements
- **Emoji Palette**: 4×2 grid of selectable emojis
- **Game Board**: 9×5 grid showing guesses and feedback
- **Action Buttons**: Delete and Submit with proper states
- **Info Modal**: Comprehensive how-to-play guide

### Animations & Feedback
- **Bounce Animation**: Emojis bounce left-to-right on submission
- **Slide-in Feedback**: Clues appear with smooth animation
- **Win Celebration**: Emoji celebration with confetti effect
- **Toast Messages**: Contextual feedback for user actions

### Share Functionality
Generates spoiler-free shareable text:
```
Formulaic #172 - 4/9

Guess 1: ⚪
Guess 2: ⚫⚪
Guess 3: ⚫⚫⚪
Guess 4: ⚫⚫⚫⚫⚫

https://formulaic.dev/
```

## 🛠️ Development

### File Structure
```
webGame/
├── index.html          # Main game interface
├── styles/main.css     # All styling and animations
├── scripts/app.js      # Game logic and interactions
└── README.md          # This documentation
```

### Key Functions
- `generateSecret()`: Creates daily puzzle from date seed
- `evaluateGuess()`: Implements Mastermind feedback logic
- `renderBoard()`: Updates visual game state
- `submitGuess()`: Handles guess submission with animations
- `buildShareText()`: Creates shareable results format

### Browser Support
- Modern browsers with ES6+ support
- Dialog API for modals (with fallbacks)
- Clipboard API for sharing (with fallbacks)
- CSS Grid and Flexbox for layout

## 📊 Game Balance

### Difficulty Scaling
- **9 Attempts**: Generous attempt limit for accessibility
- **8 Emoji Palette**: Balanced complexity vs. overwhelming
- **Duplicate Allowance**: Adds strategic depth
- **Visual Feedback**: Clear progress indication

### Mastermind Adaptation
The classic Mastermind game typically uses:
- 4 positions × 6 colors = moderate difficulty
- Formulaic uses 5 positions × 8 emojis = similar complexity
- Added attempts (9 vs. traditional 6) make it more approachable

## 🎉 Future Enhancements

### Potential Features
- **Hard Mode**: 6 attempts instead of 9
- **Color Themes**: Dark/light mode toggle
- **Sound Effects**: Audio feedback for actions
- **Streak Celebrations**: Special animations for milestones
- **Custom Emoji Sets**: Seasonal or themed emoji palettes

## 📜 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Inspiration**: Wordle by Josh Wardle
- **Game Mechanics**: Classic Mastermind board game
- **Community**: Puzzle game enthusiasts worldwide

---

**Made with ❤️ for puzzle lovers everywhere**

Play daily at [https://formulaic.dev/](https://formulaic.dev/)
