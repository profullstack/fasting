# Fasting App

A comprehensive CLI and Node.js module for 16:8 intermittent fasting with meal tracking, weight monitoring, fast history, and AI-powered personalized recommendations with visual charts.

## Features

- **Fast tracking** - Start/end fasts with duration tracking and history
- **Meal & drink logging** - Track consumption during eating windows with intelligent unit support
- **Exercise tracking** - Log workouts with flexible duration formats (minutes/hours) and automatic calorie burn estimation
- **🤖 AI-powered personalized recommendations** - Get meal, exercise, and drink suggestions based on your activity level, medical conditions, fasting status, and preferences
- **👤 User profile management** - Set activity level (sedentary/moderate/active) and medical conditions for personalized recommendations
- **📏 Imperial/Metric unit system support** - Comprehensive support for both measurement systems with automatic conversion
- **Automatic calorie estimation** using OpenAI's GPT-4o model for food and exercise with personalized prompts and visual progress indicators
- **Weight monitoring** - Log and visualize weight trends with ASCII charts in your preferred units
- **Calorie tracking** - Daily calorie intake and burn visualization with line charts
- **Cloud storage** - Optional Supabase integration for cloud data storage and sync
- **Visual charts** - CLI bar charts for fast durations and line charts for weight, calories, and exercise
- **Comprehensive summary** - All-in-one dashboard with current status and history
- **Flexible timing** - Specify custom start/end times for fasts and meals
- **Smart unit parsing** - Supports various unit formats (kg, lbs, ml, fl oz, cups, hours, minutes)
- **Visual progress indicators** - Animated spinners show progress during AI API calls
- Manual calorie override when needed

## Setup (usage)

1. Install the CLI:
```bash
pnpm install -g @profullstack/fasting
```

2. Configure OpenAI API key, unit system, timezone, and user profile:
```bash
fasting setup
```

## Setup (Development)

1. Install dependencies:
```bash
pnpm install
```

2. Link for global CLI access (optional):
```bash
pnpm link --global
```

2. Configure OpenAI API key, unit system, timezone, and user profile:
```bash
fasting setup
```

The setup command will prompt you for your OpenAI API key, unit system preference (imperial/metric), timezone, activity level, and medical conditions, saving them securely to `~/.config/fasting/config.json`.

**Alternative**: You can also set the `OPENAI_API_KEY` environment variable if you prefer.

3. Optional: Configure Supabase cloud storage:
```bash
fasting setup --supabase
```

This will prompt you for your Supabase configuration and enable cloud storage for your data.

## Local Development

To run the CLI locally during development:

```bash
# Option 1: Direct execution
node bin/cli.js summary
node bin/cli.js fast start
node bin/cli.js meal "Chicken salad" --calories 350

# Option 2: After linking globally
pnpm link --global
fasting summary
fasting fast start

# Option 3: Using pnpm exec
pnpm exec fasting summary
```

## Usage

### Fast Tracking
```bash
# Start a fast (uses current time)
fasting fast start

# Start a fast at a specific time
fasting fast start --time "18:00"
fasting fast start --time "2023-12-01 18:00"

# End a fast (uses current time)
fasting fast end

# End a fast at a specific time
fasting fast end --time "10:00"
```

### Meal & Drink Logging
```bash
# Calories are automatically estimated using AI with unit-aware prompts
fasting meal "Grilled chicken breast with quinoa"
fasting drink "Orange juice"

# Specify portion sizes for more accurate estimates (supports both imperial and metric)
fasting meal "Pizza" --size "2 slices"
fasting drink "Orange juice" --size "32oz"    # Imperial
fasting drink "Orange juice" --size "500ml"   # Metric
fasting meal "Chicken breast" --size "6oz"    # Imperial
fasting meal "Chicken breast" --size "150g"   # Metric
fasting meal "Salad" -s "large"
```

### User Profile Management
```bash
# Set your activity level for personalized recommendations
fasting activity sedentary    # Little to no exercise, desk job
fasting activity moderate     # Light exercise 1-3 days/week, some walking
fasting activity active       # Moderate to intense exercise 3-5+ days/week

# Manage medical conditions for health-conscious recommendations
fasting condition add "high blood pressure"
fasting condition add diabetes
fasting condition remove diabetes
fasting condition list       # Show current profile
fasting condition clear      # Remove all conditions
```

### AI-Powered Personalized Recommendations
```bash
# Get personalized meal recommendations based on your profile and current status
fasting recommend

# Get recommendations for specific food types
fasting recommend sandwiches
fasting recommend salads
fasting recommend "healthy breakfast"

# Advanced options for targeted recommendations
fasting recommend --type breakfast
fasting recommend --type lunch --calories 400
fasting recommend --type dinner --dietary vegetarian
fasting recommend pasta --calories 500 --dietary "gluten-free"

# Get exercise recommendations based on your activity level and conditions
fasting recommend --exercise
fasting recommend --exercise --type cardio --intensity moderate
fasting recommend --exercise --equipment "dumbbells, yoga mat"

# Get drink recommendations based on your profile
fasting recommend --drink
fasting recommend --drink --type smoothie --purpose "post-workout"
```

### Exercise Tracking
```bash
# Calories burned are automatically estimated using AI and your weight
# Supports flexible duration formats
fasting exercise "Running" 30           # 30 minutes
fasting exercise "Running" "30 minutes" # Same as above
fasting exercise "Cycling" "1.5 hours" # 1.5 hours (converted to 90 minutes)
fasting exercise "Weight lifting" "45min"
fasting exercise "Yoga" "1h"

# Override automatic estimation with manual calories
fasting exercise "Swimming" 30 --calories 400
```

### Weight & Summary
```bash
# Weight logging with automatic unit conversion
fasting weight 200          # Uses your preferred unit (lbs or kg)
fasting weight 200lbs       # Explicit imperial
fasting weight 90kg         # Explicit metric
fasting weight 12oz         # Also supports ounces

# Comprehensive dashboard with charts
fasting summary                      # All charts and current status
fasting summary --weight-chart       # Show only weight chart
fasting summary --fast-chart         # Show only fast duration chart
fasting summary --calorie-chart      # Show only daily calorie chart
fasting summary --exercise-chart     # Show only exercise calories burned chart
```

### Unit System Configuration
```bash
# Configure your preferred unit system
fasting setup --units               # Interactive unit system setup
fasting setup --weight-unit         # Configure just weight units (lbs/kg)

# Configure timezone for accurate "today's" data calculation
fasting setup --timezone            # Interactive timezone setup

# Switch storage modes
fasting setup --local               # Use local file storage
fasting setup --supabase            # Use Supabase cloud storage
```

### Data Export & Backup
```bash
# Export all fasting data and configuration to a zip file
fasting export                       # Creates ~/fasting.zip with all data

# To restore on another machine:
# 1. Copy fasting.zip to the target machine
# 2. Extract: unzip ~/fasting.zip -d ~
# 3. Data will be restored to ~/.config/fasting/
```

### Manual Calorie Override
```bash
# Override automatic estimation with manual calories
fasting meal "Chicken Salad" -c 450
fasting drink "Black Coffee" -c 5

# Combine size specification with manual override
fasting drink "Smoothie" --size "16oz" --calories 350
```

## Commands

### Core Commands
- `fast <start|end>` - Start or end a fast with optional custom timing
- `meal <description>` - Log a meal with automatic calorie estimation and personalized prompts
- `drink <description>` - Log a drink with automatic calorie estimation and personalized prompts
- `exercise <description> <duration>` - Log exercise with flexible duration formats and personalized calorie burn estimation
- `weight <value>` - Log weight with automatic unit conversion (supports lbs, kg, oz, g)
- `recommend [preference]` - Get AI-powered personalized meal, exercise, and drink recommendations
- `summary` - Show comprehensive dashboard with current status, charts, and history

### User Profile Commands
- `activity <level>` - Set activity level (sedentary, moderate, active) for personalized recommendations
- `condition <action> [condition]` - Manage medical conditions (add, remove, list, clear)

### Setup & Management
- `setup` - Configure OpenAI API key, unit system, timezone, and user profile preferences
- `setup --units` - Configure unit system preference (imperial/metric)
- `setup --weight-unit` - Configure weight unit preference (lbs/kg)
- `setup --timezone` - Configure timezone preference for accurate date calculations
- `setup --supabase` - Configure Supabase cloud storage
- `setup --local` - Switch to local file storage
- `export` - Export all fasting data and configuration to ~/fasting.zip
- `clean` - Delete all stored data (meals, weight, fasts, exercises)

### Command Options

**Fast Command:**
- `-t, --time <time>` - Specify start/end time
  - Examples: "18:00", "2023-12-01 18:00", "10:30"

**Meal/Drink Commands:**
- `-c, --calories <number>` - Override automatic calorie estimation with manual value
- `-s, --size <size>` - Specify portion size for more accurate calorie estimation (supports both imperial and metric)
  - Imperial examples: "32oz", "16oz", "2 cups", "6oz", "1lb", "2 slices"
  - Metric examples: "500ml", "250g", "1kg", "150g", "1l"
  - General: "large", "small", "medium", "1 bowl"

**Exercise Command:**
- `-c, --calories <number>` - Override automatic calorie burn estimation with manual value
- `<duration>` - Duration with flexible formats (required)
  - Examples: "30", "30 minutes", "45min", "1.5 hours", "2h", "90 min"

**Recommend Command:**
- `--meal` - Get meal recommendations (default)
- `--drink` - Get drink/beverage recommendations
- `--exercise` - Get exercise/workout recommendations
- `-t, --type <type>` - Meal type (breakfast, lunch, dinner, snack) or drink type (smoothie, tea, coffee, etc.) or exercise type (cardio, strength, yoga, etc.)
- `-c, --calories <number>` - Target calories for the meal/drink or duration in minutes for exercise
- `-d, --dietary <restrictions>` - Dietary restrictions (vegetarian, vegan, gluten-free, etc.)
- `--intensity <level>` - Exercise intensity (low, moderate, high) - for exercise recommendations
- `--equipment <items>` - Available equipment (e.g., "dumbbells, yoga mat") - for exercise recommendations
- `--location <place>` - Exercise location (home, gym, outdoor) - for exercise recommendations
- `--purpose <goal>` - Drink purpose (hydration, energy, post-workout, relaxation) - for drink recommendations
- `[preference]` - Food/exercise/drink preference or category (optional)
  - Examples: "sandwiches", "salads", "pasta", "healthy breakfast", "cardio", "smoothies"

**Activity Command:**
- `<level>` - Activity level: sedentary, moderate, or active

**Condition Command:**
- `add <condition>` - Add a medical condition (e.g., "high blood pressure", "diabetes")
- `remove <condition>` - Remove a medical condition
- `list` - Show current user profile (activity level and medical conditions)
- `clear` - Remove all medical conditions

**Weight Command:**
- Supports multiple units with automatic conversion
  - Examples: "200lbs", "90kg", "200", "12oz", "2000g"
  - Uses your configured unit system as default when no unit specified

**Summary Command:**
- `--weight-chart` - Show only weight trend chart
- `--fast-chart` - Show only fast duration chart
- `--calorie-chart` - Show only daily calorie intake chart
- `--exercise-chart` - Show only daily exercise calories burned chart

**Setup Command:**
- `--units` - Configure unit system preference (imperial/metric)
- `--weight-unit` - Configure weight unit preference (lbs/kg)
- `--timezone` - Configure timezone preference for accurate date calculations
- `--supabase` - Configure Supabase cloud storage
- `--local` - Switch to local file storage

**Clean Command:**
- `--config` - Also delete API key configuration

## File Structure

### Project Files
```
fasting/
├── bin/
│   └── cli.js
├── lib/
│   ├── index.js
│   ├── fasting.js
│   ├── weight.js
│   ├── units.js                    # NEW: Unit parsing and conversion
│   ├── calorie-estimator.js
│   ├── meal-recommender.js         # NEW: AI-powered meal recommendations
│   ├── exercise-estimator.js
│   ├── charts.js
│   ├── storage.js
│   ├── supabase.js
│   ├── fast.js
│   ├── exercise.js
│   └── config.js
├── tests/                          # Comprehensive test suite
│   ├── units.test.js              # NEW: Unit system tests
│   ├── config-units.test.js       # NEW: Unit configuration tests
│   ├── exercise-duration.test.js  # NEW: Duration parsing tests
│   ├── meal-recommender.test.js   # NEW: Recommendation tests
│   └── ...
├── .env.example
└── README.md
```

### User Data (stored in ~/.config/fasting/)
```
~/.config/fasting/
├── config.json     # API key, settings, activity level, and medical conditions
├── meals.json      # Meal and drink logs
├── weight.json     # Weight history
├── fasts.json      # Fast tracking history
└── exercises.json  # Exercise logs
```

## How It Works

### Fast Tracking
The app tracks your intermittent fasting periods:

1. **Start a fast** - Records timestamp and creates an active fast entry
2. **End a fast** - Calculates duration and stores completed fast data
3. **Custom timing** - Specify exact start/end times for accurate tracking
4. **History & stats** - View all past fasts with duration analysis

### Unit System Support
Comprehensive imperial and metric unit support:

1. **Automatic detection** - Recognizes unit types (weight, volume) and systems (imperial, metric)
2. **Smart conversion** - Converts between units automatically (lbs ↔ kg, oz ↔ ml, etc.)
3. **User preferences** - Configure your preferred unit system during setup
4. **Flexible input** - Accept various formats ("500ml", "16oz", "2 cups", "1.5 hours")
5. **AI integration** - Provides unit-aware prompts to AI for better estimates

### Timezone Support
Accurate timezone handling for proper date calculations:

1. **Timezone awareness** - All timestamps are stored using your configured timezone
2. **Today's data** - "Today's" meals, exercises, and summaries respect your local timezone
3. **Flexible configuration** - Choose from common timezones or specify custom ones
4. **Automatic detection** - Defaults to your system timezone if not configured
5. **Cross-timezone consistency** - Maintains accurate data even when traveling

### User Profile & Personalization
Comprehensive user profile management for personalized recommendations:

1. **Activity Level**: Set your activity level (sedentary, moderate, active) to get appropriate calorie and exercise recommendations
2. **Medical Conditions**: Add conditions like "high blood pressure" or "diabetes" for health-conscious recommendations
3. **Personalized AI**: All OpenAI calls include your profile for tailored suggestions
4. **Smart Recommendations**: Meal, exercise, and drink suggestions consider your health profile and activity level
5. **Profile Management**: Easy commands to view, update, and manage your profile settings

### Calorie Estimation
Automatic calorie estimation using OpenAI's GPT-4o model with personalized context:

1. The description (and optional size) is sent to OpenAI's API with unit system and user profile context
2. The AI estimates calories based on your activity level, medical conditions, and specified portion size
3. Size parsing handles both imperial and metric measurements automatically
4. Personalized estimates consider your health profile for appropriate portion sizing
5. You can specify portion sizes with `--size` for more accurate estimates
6. You can still manually override with the `-c` flag if needed

### AI-Powered Personalized Recommendations
Comprehensive recommendation system for meals, exercises, and drinks based on your profile:

1. **Profile-aware analysis** - Considers your activity level, medical conditions, fasting status, recent meals, weight, and history
2. **Multi-type recommendations** - Get suggestions for meals, exercises, or drinks based on your needs
3. **Health-conscious suggestions** - Recommendations consider medical conditions for heart-healthy, diabetic-friendly options
4. **Activity-appropriate content** - Exercise intensity and meal portions matched to your activity level
5. **Unit-aware portions** - All measurements provided in your configured unit system
6. **Personalized advice** - Includes tailored advice based on your health profile and goals
7. **Fallback support** - Works even without OpenAI API key with sensible default recommendations

**Recommendation Features:**
- **Health profile integration**: Activity level and medical conditions inform all suggestions
- **Contextual awareness**: Knows if you're fasting, your recent meals, exercises, and intake
- **Multi-category support**: Meals ("sandwiches", "salads"), exercises ("cardio", "strength"), drinks ("smoothies", "teas")
- **Advanced filtering**: Calorie targets, dietary restrictions, exercise intensity, equipment availability
- **Rich information**: Includes prep time, ingredients, nutrition notes, exercise instructions, and safety tips
- **Beautiful formatting**: Well-structured output with clear sections and helpful tips

### Visual Charts
- **Weight trends** - ASCII line charts showing weight changes over time
- **Fast durations** - Bar charts displaying recent fast lengths vs. 16h target
- **Daily calories** - Line charts showing calorie intake trends over time with averages
- **Exercise calories** - Line charts showing daily calories burned through exercise
- **Comprehensive summary** - All-in-one dashboard with current fast status, today's meals, exercises, statistics, and charts

### Exercise Tracking
The app estimates calories burned using OpenAI's GPT-4o model with personalized context:

1. **Log exercise** - Provide exercise description and duration in minutes
2. **Personalized AI estimation** - Uses your activity level, medical conditions, weight, and exercise details for accurate calorie burn calculation
3. **Health-aware recommendations** - Exercise suggestions consider your medical conditions for safe, appropriate workouts
4. **Activity-matched intensity** - Recommendations match your current activity level for progressive fitness
5. **Manual override** - Use `-c` flag to specify exact calories burned if needed
6. **Daily tracking** - View total calories burned per day with trend analysis

### Cloud Storage with Supabase
The app supports optional cloud storage using Supabase for data synchronization across devices:

1. **Setup** - Run `fasting setup --supabase` to configure cloud storage
2. **Automatic sync** - All data (meals, exercises, weight, fasts) stored in Supabase
3. **Cross-device access** - Access your data from multiple devices with the same configuration
4. **Local fallback** - Switch back to local storage anytime with `fasting setup --local`

**Required Supabase Configuration:**
- Supabase URL
- Service Role Key

**Environment Variables (optional):**
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FASTING_STORAGE_MODE=supabase  # or 'local'
```

### Size Examples

**Imperial System:**
- **Drinks**: "32oz", "16oz", "8oz", "2 cups", "1 pint", "1 quart"
- **Meals**: "6oz", "8oz", "1lb", "2 slices", "large portion", "small bowl", "1 cup"

**Metric System:**
- **Drinks**: "500ml", "250ml", "1l", "1.5l"
- **Meals**: "150g", "250g", "500g", "1kg", "large portion", "small bowl"

**Duration Examples:**
- **Minutes**: "30", "45", "30 minutes", "45min"
- **Hours**: "1.5 hours", "2h", "1 hour 30 minutes"

**Weight Examples:**
- **Imperial**: "200lbs", "12oz", "2lbs"
- **Metric**: "90kg", "500g", "1.5kg"

### Configuration & Data Management

The app stores all data in `~/.config/fasting/` for secure, persistent access:

- **Configuration**: Run `fasting setup` to configure or update your API key
- **Data Storage**: All meals, drinks, and weight data are stored locally
- **Data Export**: Use `fasting export` to create a backup zip file at `~/fasting.zip`
- **Data Restore**: Extract the zip file with `unzip ~/fasting.zip -d ~` to restore data
- **Environment Variable**: You can use `OPENAI_API_KEY` as an alternative (takes precedence)
- **Clean Data**: Use `fasting clean` to delete meals/weight data
- **Full Reset**: Use `fasting clean --config` to delete everything including API key

### Clean Command Options

```bash
# Delete meals, weight, and fast data (keeps API key)
fasting clean

# Delete everything including API key configuration
fasting clean --config
```

If the OpenAI API is unavailable, the app falls back to default estimates (200 calories for meals, 50 for drinks).

## Node.js Module API

This package can also be used as a Node.js module in your own applications:

```javascript
import {
  logMeal, logDrink, getTodaysEntries, getCalorieHistory,
  logWeight, getWeightHistory,
  startFast, endFast, getCurrentFast, getFastHistory, getFastStats,
  logExercise, getTodaysExercises, getExerciseHistory
} from '@profullstack/fasting';

// NEW: Import recommendation and unit functions
import { generateMealRecommendations, formatRecommendations } from '@profullstack/fasting/lib/meal-recommender.js';
import { generateExerciseRecommendations, formatExerciseRecommendations } from '@profullstack/fasting/lib/exercise-recommender.js';
import { generateDrinkRecommendations, formatDrinkRecommendations } from '@profullstack/fasting/lib/drink-recommender.js';
import { parseSize, convertVolume, getSizeExamples } from '@profullstack/fasting/lib/units.js';
import { getUnitSystem, setUnitSystem, getActivityLevel, setActivityLevel, getMedicalConditions, addMedicalCondition, getUserProfile } from '@profullstack/fasting/lib/config.js';

// Fast tracking
startFast(); // Start fast now
startFast('2023-12-01 18:00'); // Start fast at specific time
const currentFast = getCurrentFast(); // Get active fast
const completedFast = endFast(); // End current fast

// Log meals and drinks programmatically
logMeal('Grilled chicken breast', 350);
logDrink('Orange juice', 120);

// Get today's entries
const todaysEntries = getTodaysEntries();
console.log(todaysEntries);

// Weight tracking
logWeight(175.5);
const weightHistory = getWeightHistory();

// Fast history and statistics
const fastHistory = getFastHistory(); // Completed fasts only
const fastStats = getFastStats(); // Statistics summary

// Calorie history
const calorieHistory = getCalorieHistory(); // Daily calorie totals

// Exercise tracking
logExercise('Running', 30, 300); // description, duration (min), calories burned
const todaysExercises = getTodaysExercises(); // Today's exercises
const exerciseHistory = getExerciseHistory(); // Daily exercise calorie totals

// NEW: User profile management
setActivityLevel('active'); // or 'sedentary', 'moderate'
const activityLevel = getActivityLevel();
addMedicalCondition('high blood pressure');
addMedicalCondition('diabetes');
const conditions = getMedicalConditions(); // ['high blood pressure', 'diabetes']
const profile = getUserProfile(); // Complete user profile

// NEW: AI-powered personalized recommendations
const mealRecommendations = await generateMealRecommendations('sandwiches', {
  mealType: 'lunch',
  calorieTarget: 400,
  dietaryRestrictions: 'vegetarian'
});
const formattedMeals = formatRecommendations(mealRecommendations);

const exerciseRecommendations = await generateExerciseRecommendations('cardio', {
  duration: 30,
  intensity: 'moderate',
  location: 'home'
});
const formattedExercises = formatExerciseRecommendations(exerciseRecommendations);

const drinkRecommendations = await generateDrinkRecommendations('smoothies', {
  purpose: 'post-workout',
  calorieTarget: 200
});
const formattedDrinks = formatDrinkRecommendations(drinkRecommendations);

// NEW: Unit system management
setUnitSystem('metric'); // or 'imperial'
const currentSystem = getUnitSystem();

// NEW: Unit parsing and conversion
const parsed = parseSize('500ml', 'volume');
const converted = convertVolume(16, 'fl oz', 'ml'); // 473.18
const examples = getSizeExamples('volume'); // ['250ml', '500ml', '1l', '1.5l']
```

### API Functions

**Fast Tracking:**
- **`startFast(startTime?)`** - Start a new fast (optional custom start time)
- **`endFast(endTime?)`** - End current fast (optional custom end time)
- **`getCurrentFast()`** - Get active fast or null
- **`getFastHistory()`** - Get all completed fasts
- **`getFastStats()`** - Get fast statistics (average, longest, etc.)

**Meal & Weight Tracking:**
- **`logMeal(description, calories)`** - Log a meal with description and calorie count
- **`logDrink(description, calories)`** - Log a drink with description and calorie count
- **`getTodaysEntries()`** - Get all meals and drinks logged today
- **`getCalorieHistory()`** - Get daily calorie totals grouped by date
- **`logWeight(weight)`** - Log weight in pounds
- **`getWeightHistory()`** - Get complete weight history with timestamps

**Exercise Tracking:**
- **`logExercise(description, duration, caloriesBurned)`** - Log exercise with description, duration (minutes), and calories burned
- **`getTodaysExercises()`** - Get all exercises logged today
- **`getExerciseHistory()`** - Get daily exercise calorie totals grouped by date

**NEW: AI-Powered Personalized Recommendations:**
- **`generateMealRecommendations(preference, options)`** - Generate personalized meal recommendations
- **`formatRecommendations(recommendations)`** - Format meal recommendations for display
- **`generateExerciseRecommendations(preference, options)`** - Generate personalized exercise recommendations
- **`formatExerciseRecommendations(recommendations)`** - Format exercise recommendations for display
- **`generateDrinkRecommendations(preference, options)`** - Generate personalized drink recommendations
- **`formatDrinkRecommendations(recommendations)`** - Format drink recommendations for display

**NEW: User Profile Management:**
- **`getActivityLevel()`** - Get current activity level ('sedentary', 'moderate', 'active')
- **`setActivityLevel(level)`** - Set activity level preference
- **`getMedicalConditions()`** - Get array of medical conditions
- **`addMedicalCondition(condition)`** - Add a medical condition
- **`removeMedicalCondition(condition)`** - Remove a medical condition
- **`setMedicalConditions(conditions)`** - Set medical conditions array
- **`getUserProfile()`** - Get complete user profile object

**NEW: Unit System Management:**
- **`getUnitSystem()`** - Get current unit system ('imperial' or 'metric')
- **`setUnitSystem(system)`** - Set unit system preference
- **`parseSize(input, type)`** - Parse size input with unit detection
- **`convertVolume(value, fromUnit, toUnit)`** - Convert between volume units
- **`getSizeExamples(type)`** - Get size examples for current unit system

Note: When using the module API, you need to provide calorie counts manually for basic functions. Automatic calorie estimation and AI recommendations via OpenAI are available through both CLI commands and the new recommendation API functions.

## Development & Testing

### Running Tests

The project includes comprehensive unit tests for all functionality:

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:fast           # Fast tracking tests
pnpm test:charts         # Chart generation tests
pnpm test:fasting        # Meal/drink logging tests
pnpm test:weight         # Weight tracking tests
pnpm test:calorie-chart  # Calorie chart tests
pnpm test:exercise       # Exercise tracking tests
```

### Test Coverage

**Core Functionality:**
- **Fast Tracking**: Start/end fasts, duration calculation, history management
- **Charts**: Weight line charts, fast bar charts, summary tables
- **Meal/Drink Logging**: Entry creation, today's entries filtering
- **Weight Tracking**: Weight logging, history retrieval, trend analysis
- **Calorie Charts**: Daily calorie aggregation, chart generation, history tracking
- **Exercise Tracking**: Exercise logging, calorie burn estimation, daily aggregation, chart generation

**NEW: Enhanced Test Coverage:**
- **Unit System Tests**: Imperial/metric unit parsing, conversion, and configuration
- **Duration Parsing**: Flexible duration format handling (minutes, hours, mixed formats)
- **Meal Recommendations**: AI response formatting, JSON parsing, fallback handling
- **Exercise Recommendations**: Exercise suggestion formatting, intensity handling, equipment filtering
- **Drink Recommendations**: Beverage suggestion formatting, purpose-based filtering
- **Unit Conversion**: Volume and weight conversions between imperial and metric
- **Configuration Management**: Unit system preferences, backward compatibility
- **User Profile Tests**: Activity level validation, medical condition management, profile integration

**Test Statistics:**
- **12 test files** with **85+ total tests**
- **100% pass rate** with comprehensive error handling validation
- **Isolated testing environment** - Uses temporary directories to avoid interfering with real user data
- **Integration testing** - Validates system consistency and cross-module functionality

All tests use isolated temporary directories to avoid interfering with real user data.

### Git Pre-commit Hook

The project includes a git pre-commit hook that runs syntax checks before allowing commits:

```bash
# The hook runs automatically on git commit
git commit -m "Your commit message"

# To manually run the pre-commit check
pnpm run pre-commit
```

The pre-commit hook performs:
- **Full test suite** - Runs all unit tests to ensure code quality
- **Comprehensive validation** - Tests all functionality including async operations, storage, and charts
- **Quality assurance** - Prevents broken code from being committed

To bypass the pre-commit hook (not recommended):
```bash
git commit --no-verify -m "Your commit message"
```

### Examples

The project includes example scripts demonstrating usage:

```bash
# Run CLI usage example
pnpm example

# Run API usage example
pnpm example:api
```

**Example Files:**
- [`examples/basic-usage.js`](examples/basic-usage.js) - Demonstrates CLI commands and workflow
- [`examples/api-usage.js`](examples/api-usage.js) - Shows programmatic Node.js module usage

## Publishing

### Version Bumping

```bash
# Patch version (bug fixes): 1.0.2 -> 1.0.3
pnpm version patch

# Minor version (new features): 1.0.2 -> 1.1.0
pnpm version minor

# Major version (breaking changes): 1.0.2 -> 2.0.0
pnpm version major

# Specific version
pnpm version 1.2.3
```

### Publishing to NPM

```bash
# Complete workflow
pnpm test                    # Run tests first
pnpm version patch           # Bump version
pnpm publish --access public # Publish to npm
git push && git push --tags  # Push to git

# Dry run to see what would be published
pnpm publish --dry-run
```

