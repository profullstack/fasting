# Fasting App

A comprehensive CLI and Node.js module for 16:8 intermittent fasting with meal tracking, weight monitoring, and fast history with visual charts.

## Features

- **Fast tracking** - Start/end fasts with duration tracking and history
- **Meal & drink logging** - Track consumption during eating windows
- **Exercise tracking** - Log workouts with automatic calorie burn estimation
- **Automatic calorie estimation** using OpenAI's GPT-4o model for food and exercise
- **Weight monitoring** - Log and visualize weight trends with ASCII charts
- **Calorie tracking** - Daily calorie intake and burn visualization with line charts
- **Cloud storage** - Optional Supabase integration for cloud data storage and sync
- **Visual charts** - CLI bar charts for fast durations and line charts for weight, calories, and exercise
- **Comprehensive summary** - All-in-one dashboard with current status and history
- **Flexible timing** - Specify custom start/end times for fasts and meals
- Manual calorie override when needed

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Link for global CLI access (optional):
```bash
pnpm link --global
```

2. Configure OpenAI API key for automatic calorie estimation:
```bash
fasting setup
```

The setup command will prompt you for your OpenAI API key and save it securely to `~/.config/fasting/config.json`.

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
# Calories are automatically estimated using AI
fasting meal "Grilled chicken breast with quinoa"
fasting drink "Orange juice"

# Specify portion sizes for more accurate estimates
fasting meal "Pizza" --size "2 slices"
fasting drink "Orange juice" --size "32oz"
fasting meal "Salad" -s "large"
```

### Exercise Tracking
```bash
# Calories burned are automatically estimated using AI and your weight
fasting exercise "Running" 30
fasting exercise "Weight lifting" 45
fasting exercise "Yoga" 60

# Override automatic estimation with manual calories
fasting exercise "Swimming" 30 --calories 400
```

### Weight & Summary
```bash
fasting weight 200
fasting summary                      # Comprehensive dashboard with charts
fasting summary --weight-chart       # Show only weight chart
fasting summary --fast-chart         # Show only fast duration chart
fasting summary --calorie-chart      # Show only daily calorie chart
fasting summary --exercise-chart     # Show only exercise calories burned chart
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
- `meal <description>` - Log a meal with automatic calorie estimation
- `drink <description>` - Log a drink with automatic calorie estimation
- `exercise <description> <duration>` - Log exercise with automatic calorie burn estimation
- `weight <value>` - Log weight in pounds
- `summary` - Show comprehensive dashboard with current status, charts, and history

### Setup & Management
- `setup` - Configure OpenAI API key for automatic calorie estimation
- `setup --supabase` - Configure Supabase cloud storage
- `setup --local` - Switch to local file storage
- `clean` - Delete all stored data (meals, weight, fasts, exercises)

### Command Options

**Fast Command:**
- `-t, --time <time>` - Specify start/end time
  - Examples: "18:00", "2023-12-01 18:00", "10:30"

**Meal/Drink Commands:**
- `-c, --calories <number>` - Override automatic calorie estimation with manual value
- `-s, --size <size>` - Specify portion size for more accurate calorie estimation
  - Examples: "32oz", "large", "2 cups", "small", "16oz", "2 slices", "1 bowl"

**Exercise Command:**
- `-c, --calories <number>` - Override automatic calorie burn estimation with manual value
- `<duration>` - Duration in minutes (required)

**Summary Command:**
- `--weight-chart` - Show only weight trend chart
- `--fast-chart` - Show only fast duration chart
- `--calorie-chart` - Show only daily calorie intake chart
- `--exercise-chart` - Show only daily exercise calories burned chart

**Clean Command:**
- `--config` - Also delete API key configuration

## File Structure

### Project Files
```
fasting-app/
├── bin/
│   └── cli.js
├── lib/
│   ├── index.js
│   ├── fasting.js
│   ├── weight.js
│   ├── calorie-estimator.js
│   └── config.js
├── .env.example
└── README.md
```

### User Data (stored in ~/.config/fasting/)
```
~/.config/fasting/
├── config.json     # API key and settings
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

### Calorie Estimation
Automatic calorie estimation using OpenAI's GPT-4o model:

1. The description (and optional size) is sent to OpenAI's API
2. The AI estimates calories based on the specified portion size or typical serving sizes
3. The estimated calories are logged along with your food/drink
4. You can specify portion sizes with `--size` for more accurate estimates
5. You can still manually override with the `-c` flag if needed

### Visual Charts
- **Weight trends** - ASCII line charts showing weight changes over time
- **Fast durations** - Bar charts displaying recent fast lengths vs. 16h target
- **Daily calories** - Line charts showing calorie intake trends over time with averages
- **Exercise calories** - Line charts showing daily calories burned through exercise
- **Comprehensive summary** - All-in-one dashboard with current fast status, today's meals, exercises, statistics, and charts

### Exercise Tracking
The app estimates calories burned using OpenAI's GPT-4o model and your current weight:

1. **Log exercise** - Provide exercise description and duration in minutes
2. **AI estimation** - Uses your latest recorded weight and exercise details for accurate calorie burn calculation
3. **Manual override** - Use `-c` flag to specify exact calories burned if needed
4. **Daily tracking** - View total calories burned per day with trend analysis

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
- **Drinks**: "32oz", "16oz", "large", "small", "2 cups"
- **Meals**: "2 slices", "large portion", "small bowl", "1 cup", "half plate"

### Configuration & Data Management

The app stores all data in `~/.config/fasting/` for secure, persistent access:

- **Configuration**: Run `fasting setup` to configure or update your API key
- **Data Storage**: All meals, drinks, and weight data are stored locally
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
} from 'fasting-app';

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

Note: When using the module API, you need to provide calorie counts manually. Automatic calorie estimation via OpenAI is only available through the CLI commands.

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

- **Fast Tracking**: Start/end fasts, duration calculation, history management
- **Charts**: Weight line charts, fast bar charts, summary tables
- **Meal/Drink Logging**: Entry creation, today's entries filtering
- **Weight Tracking**: Weight logging, history retrieval, trend analysis
- **Calorie Charts**: Daily calorie aggregation, chart generation, history tracking
- **Exercise Tracking**: Exercise logging, calorie burn estimation, daily aggregation, chart generation

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

