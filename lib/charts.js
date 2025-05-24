import { getTimezone } from './config.js';

/**
 * Creates a simple ASCII line chart for weight data
 * @param {Array} weightData - Array of weight entries with weight and timestamp
 * @param {number} width - Chart width in characters (default: 60)
 * @param {number} height - Chart height in characters (default: 15)
 * @returns {string} ASCII chart
 */
export function createWeightChart(weightData, width = 60, height = 15) {
  if (!weightData || weightData.length === 0) {
    return 'No weight data available';
  }

  // Sort by timestamp
  const sortedData = [...weightData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Get min/max values for scaling
  const weights = sortedData.map(d => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight || 1; // Avoid division by zero
  
  // Create chart grid
  const grid = Array(height).fill().map(() => Array(width).fill(' '));
  
  // Plot the line
  for (let i = 0; i < sortedData.length - 1; i++) {
    const currentWeight = sortedData[i].weight;
    const nextWeight = sortedData[i + 1].weight;
    
    // Calculate positions
    const currentCol = Math.round((i / (sortedData.length - 1)) * (width - 1));
    const nextCol = Math.round(((i + 1) / (sortedData.length - 1)) * (width - 1));
    
    const currentRow = Math.round(((currentWeight - minWeight) / weightRange) * (height - 1));
    const nextRow = Math.round(((nextWeight - minWeight) / weightRange) * (height - 1));
    
    // Draw line between points
    const colDiff = nextCol - currentCol;
    const rowDiff = nextRow - currentRow;
    const steps = Math.max(Math.abs(colDiff), Math.abs(rowDiff), 1);
    
    for (let step = 0; step <= steps; step++) {
      const col = Math.round(currentCol + (colDiff * step / steps));
      const row = Math.round(currentRow + (rowDiff * step / steps));
      
      if (col >= 0 && col < width && row >= 0 && row < height) {
        grid[height - 1 - row][col] = step === 0 || step === steps ? '●' : '─';
      }
    }
  }
  
  // Handle single point
  if (sortedData.length === 1) {
    const weight = sortedData[0].weight;
    const col = Math.round(width / 2);
    const row = Math.round(((weight - minWeight) / weightRange) * (height - 1));
    if (row >= 0 && row < height) {
      grid[height - 1 - row][col] = '●';
    }
  }
  
  // Create chart lines
  const lines = [];
  
  // Add title
  lines.push('Weight History (lbs)');
  lines.push('');
  
  // Add chart with y-axis labels
  for (let row = 0; row < height; row++) {
    const currentWeight = minWeight + (weightRange * (height - 1 - row) / (height - 1));
    const line = currentWeight.toFixed(1).padStart(6) + ' │' + grid[row].join('');
    lines.push(line);
  }
  
  // Add x-axis
  lines.push('       └' + '─'.repeat(width) + '');
  
  // Add date labels
  if (sortedData.length > 0) {
    const firstDate = new Date(sortedData[0].timestamp).toLocaleDateString();
    const lastDate = new Date(sortedData[sortedData.length - 1].timestamp).toLocaleDateString();
    lines.push(`        ${firstDate}${' '.repeat(Math.max(0, width - firstDate.length - lastDate.length))}${lastDate}`);
  }
  
  return lines.join('\n');
}

/**
 * Creates a simple ASCII bar chart for fast duration data
 * @param {Array} fastData - Array of completed fast entries with durationHours
 * @param {number} width - Chart width in characters (default: 60)
 * @param {number} maxBars - Maximum number of bars to show (default: 10)
 * @returns {string} ASCII chart
 */
export function createFastChart(fastData, width = 60, maxBars = 10) {
  if (!fastData || fastData.length === 0) {
    return 'No completed fasts available';
  }

  // Filter out invalid fasts (negative durations) and sort by start time
  const validFasts = fastData.filter(fast => fast.durationHours > 0);
  
  if (validFasts.length === 0) {
    return 'No valid completed fasts available';
  }

  const sortedData = [...validFasts]
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
    .slice(0, maxBars)
    .reverse(); // Show oldest to newest

  const maxDuration = Math.max(...sortedData.map(f => f.durationHours));
  const barWidth = width - 20; // Leave space for labels

  const lines = [];
  lines.push('Recent Fast Durations (hours)');
  lines.push('');

  sortedData.forEach((fast, index) => {
    const date = new Date(fast.startTime).toLocaleDateString();
    const duration = fast.durationHours;
    const barLength = Math.round((duration / maxDuration) * barWidth);
    
    const bar = '█'.repeat(barLength);
    const label = `${date.padEnd(10)} │${bar} ${duration}h`;
    lines.push(label);
  });

  lines.push('');
  lines.push(`Target: 16h ${'█'.repeat(Math.round((16 / maxDuration) * barWidth))} (16:8 intermittent fasting)`);

  return lines.join('\n');
}

/**
 * Creates a simple ASCII line chart for daily calorie data
 * @param {Array} calorieData - Array of calorie entries with date, calories, and timestamp
 * @param {number} width - Chart width in characters (default: 60)
 * @param {number} height - Chart height in characters (default: 15)
 * @returns {string} ASCII chart
 */
export function createCalorieChart(calorieData, width = 60, height = 15) {
  if (!calorieData || calorieData.length === 0) {
    return 'No calorie data available';
  }

  // Sort by timestamp
  const sortedData = [...calorieData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Get min/max values for scaling
  const calories = sortedData.map(d => d.calories);
  const minCalories = Math.min(...calories);
  const maxCalories = Math.max(...calories);
  const calorieRange = maxCalories - minCalories || 1; // Avoid division by zero
  
  // Create chart grid
  const grid = Array(height).fill().map(() => Array(width).fill(' '));
  
  // Plot the line
  for (let i = 0; i < sortedData.length - 1; i++) {
    const currentCalories = sortedData[i].calories;
    const nextCalories = sortedData[i + 1].calories;
    
    // Calculate positions
    const currentCol = Math.round((i / (sortedData.length - 1)) * (width - 1));
    const nextCol = Math.round(((i + 1) / (sortedData.length - 1)) * (width - 1));
    
    const currentRow = Math.round(((currentCalories - minCalories) / calorieRange) * (height - 1));
    const nextRow = Math.round(((nextCalories - minCalories) / calorieRange) * (height - 1));
    
    // Draw line between points
    const colDiff = nextCol - currentCol;
    const rowDiff = nextRow - currentRow;
    const steps = Math.max(Math.abs(colDiff), Math.abs(rowDiff), 1);
    
    for (let step = 0; step <= steps; step++) {
      const col = Math.round(currentCol + (colDiff * step / steps));
      const row = Math.round(currentRow + (rowDiff * step / steps));
      
      if (col >= 0 && col < width && row >= 0 && row < height) {
        grid[height - 1 - row][col] = step === 0 || step === steps ? '●' : '─';
      }
    }
  }
  
  // Handle single point
  if (sortedData.length === 1) {
    const calories = sortedData[0].calories;
    const col = Math.round(width / 2);
    const row = Math.round(((calories - minCalories) / calorieRange) * (height - 1));
    if (row >= 0 && row < height) {
      grid[height - 1 - row][col] = '●';
    }
  }
  
  // Create chart lines
  const lines = [];
  
  // Add title
  lines.push('Daily Calorie Intake');
  lines.push('');
  
  // Add chart with y-axis labels
  for (let row = 0; row < height; row++) {
    const currentCalories = Math.round(minCalories + (calorieRange * (height - 1 - row) / (height - 1)));
    const line = currentCalories.toString().padStart(6) + ' │' + grid[row].join('');
    lines.push(line);
  }
  
  // Add x-axis
  lines.push('       └' + '─'.repeat(width) + '');
  
  // Add date labels
  if (sortedData.length > 0) {
    const firstDate = new Date(sortedData[0].timestamp).toLocaleDateString();
    const lastDate = new Date(sortedData[sortedData.length - 1].timestamp).toLocaleDateString();
    lines.push(`        ${firstDate}${' '.repeat(Math.max(0, width - firstDate.length - lastDate.length))}${lastDate}`);
  }
  
  // Add average line
  const avgCalories = Math.round(calories.reduce((sum, cal) => sum + cal, 0) / calories.length);
  lines.push('');
  lines.push(`Average: ${avgCalories} calories/day`);
  
  return lines.join('\n');
}

/**
 * Creates a simple ASCII line chart for daily exercise calorie burn data
 * @param {Array} exerciseData - Array of exercise entries with date, caloriesBurned, and timestamp
 * @param {number} width - Chart width in characters (default: 60)
 * @param {number} height - Chart height in characters (default: 15)
 * @returns {string} ASCII chart
 */
export function createExerciseChart(exerciseData, width = 60, height = 15) {
  if (!exerciseData || exerciseData.length === 0) {
    return 'No exercise data available';
  }

  // Sort by timestamp
  const sortedData = [...exerciseData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Get min/max values for scaling
  const calories = sortedData.map(d => d.caloriesBurned);
  const minCalories = Math.min(...calories);
  const maxCalories = Math.max(...calories);
  const calorieRange = maxCalories - minCalories || 1; // Avoid division by zero
  
  // Create chart grid
  const grid = Array(height).fill().map(() => Array(width).fill(' '));
  
  // Plot the line
  for (let i = 0; i < sortedData.length - 1; i++) {
    const currentCalories = sortedData[i].caloriesBurned;
    const nextCalories = sortedData[i + 1].caloriesBurned;
    
    // Calculate positions
    const currentCol = Math.round((i / (sortedData.length - 1)) * (width - 1));
    const nextCol = Math.round(((i + 1) / (sortedData.length - 1)) * (width - 1));
    
    const currentRow = Math.round(((currentCalories - minCalories) / calorieRange) * (height - 1));
    const nextRow = Math.round(((nextCalories - minCalories) / calorieRange) * (height - 1));
    
    // Draw line between points
    const colDiff = nextCol - currentCol;
    const rowDiff = nextRow - currentRow;
    const steps = Math.max(Math.abs(colDiff), Math.abs(rowDiff), 1);
    
    for (let step = 0; step <= steps; step++) {
      const col = Math.round(currentCol + (colDiff * step / steps));
      const row = Math.round(currentRow + (rowDiff * step / steps));
      
      if (col >= 0 && col < width && row >= 0 && row < height) {
        grid[height - 1 - row][col] = step === 0 || step === steps ? '●' : '─';
      }
    }
  }
  
  // Handle single point
  if (sortedData.length === 1) {
    const calories = sortedData[0].caloriesBurned;
    const col = Math.round(width / 2);
    const row = Math.round(((calories - minCalories) / calorieRange) * (height - 1));
    if (row >= 0 && row < height) {
      grid[height - 1 - row][col] = '●';
    }
  }
  
  // Create chart lines
  const lines = [];
  
  // Add title
  lines.push('Daily Calories Burned (Exercise)');
  lines.push('');
  
  // Add chart with y-axis labels
  for (let row = 0; row < height; row++) {
    const currentCalories = Math.round(minCalories + (calorieRange * (height - 1 - row) / (height - 1)));
    const line = currentCalories.toString().padStart(6) + ' │' + grid[row].join('');
    lines.push(line);
  }
  
  // Add x-axis
  lines.push('       └' + '─'.repeat(width) + '');
  
  // Add date labels
  if (sortedData.length > 0) {
    const firstDate = new Date(sortedData[0].timestamp).toLocaleDateString();
    const lastDate = new Date(sortedData[sortedData.length - 1].timestamp).toLocaleDateString();
    lines.push(`        ${firstDate}${' '.repeat(Math.max(0, width - firstDate.length - lastDate.length))}${lastDate}`);
  }
  
  // Add average line
  const avgCalories = Math.round(calories.reduce((sum, cal) => sum + cal, 0) / calories.length);
  lines.push('');
  lines.push(`Average: ${avgCalories} calories burned/day`);
  
  return lines.join('\n');
}

/**
 * Creates a summary table with recent data
 * @param {Object} data - Object containing meals, weights, fasts, and current fast
 * @returns {string} Formatted summary table
 */
export function createSummaryTable(data) {
  const { todaysEntries, recentWeights, fastStats, currentFast, recentFasts, todaysExercises } = data;
  
  const lines = [];
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('                        FASTING APP SUMMARY                        ');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');

  // Current Fast Status
  lines.push('🕐 CURRENT FAST STATUS');
  lines.push('─'.repeat(40));
  if (currentFast) {
    const startTime = new Date(currentFast.startTime);
    const now = new Date();
    const hoursElapsed = Math.round((now - startTime) / (1000 * 60 * 60) * 10) / 10;
    lines.push(`Status: FASTING (${hoursElapsed}h elapsed)`);
    const timezone = getTimezone();
    lines.push(`Started: ${startTime.toLocaleString([], { timeZone: timezone })}`);
    
    if (hoursElapsed >= 16) {
      lines.push('✅ 16-hour target reached!');
    } else {
      const remaining = 16 - hoursElapsed;
      lines.push(`⏰ ${remaining.toFixed(1)}h remaining to reach 16h target`);
    }
  } else {
    lines.push('Status: NOT FASTING');
    lines.push('💡 Use "fasting fast start" to begin a new fast');
  }
  lines.push('');

  // Today's Food Log
  lines.push('🍽️  TODAY\'S FOOD LOG');
  lines.push('─'.repeat(40));
  if (todaysEntries && todaysEntries.length > 0) {
    let totalCalories = 0;
    todaysEntries.forEach(entry => {
      const timezone = getTimezone();
      const time = new Date(entry.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      });
      const type = entry.type === 'meal' ? '🍽️' : '🥤';
      lines.push(`${time} ${type} ${entry.description} (${entry.calories} cal)`);
      totalCalories += entry.calories;
    });
    lines.push('');
    lines.push(`Total calories today: ${totalCalories}`);
  } else {
    lines.push('No meals or drinks logged today');
  }
  lines.push('');

  // Today's Exercise Log
  lines.push('🏃 TODAY\'S EXERCISE LOG');
  lines.push('─'.repeat(40));
  if (todaysExercises && todaysExercises.length > 0) {
    let totalCaloriesBurned = 0;
    todaysExercises.forEach(exercise => {
      const timezone = getTimezone();
      const time = new Date(exercise.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      });
      lines.push(`${time} 🏃 ${exercise.description} (${exercise.duration}min, ${exercise.caloriesBurned} cal burned)`);
      totalCaloriesBurned += exercise.caloriesBurned || 0;
    });
    lines.push('');
    lines.push(`Total calories burned today: ${totalCaloriesBurned}`);
  } else {
    lines.push('No exercises logged today');
  }
  lines.push('');

  // Fast Statistics
  lines.push('📊 FAST STATISTICS');
  lines.push('─'.repeat(40));
  if (fastStats.totalFasts > 0) {
    lines.push(`Total completed fasts: ${fastStats.totalFasts}`);
    lines.push(`Average duration: ${fastStats.averageDuration}h`);
    lines.push(`Longest fast: ${fastStats.longestFast}h`);
    lines.push(`Shortest fast: ${fastStats.shortestFast}h`);
  } else {
    lines.push('No completed fasts yet');
  }
  lines.push('');

  // Recent Weight
  lines.push('⚖️  WEIGHT TRACKING');
  lines.push('─'.repeat(40));
  if (recentWeights && recentWeights.length > 0) {
    const latest = recentWeights[recentWeights.length - 1];
    const latestDate = new Date(latest.timestamp).toLocaleDateString();
    lines.push(`Latest: ${latest.weight} lbs (${latestDate})`);
    
    if (recentWeights.length > 1) {
      const previous = recentWeights[recentWeights.length - 2];
      const change = latest.weight - previous.weight;
      const changeStr = change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
      const arrow = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
      lines.push(`Change: ${changeStr} lbs ${arrow}`);
    }
  } else {
    lines.push('No weight data recorded');
  }
  lines.push('');

  lines.push('═══════════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}