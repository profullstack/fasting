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
  
  // Create chart lines
  const lines = [];
  
  // Add title
  lines.push('Weight History (lbs)');
  lines.push('');
  
  // Create the chart
  for (let row = height - 1; row >= 0; row--) {
    let line = '';
    const currentWeight = minWeight + (weightRange * row / (height - 1));
    
    // Y-axis label
    line += currentWeight.toFixed(1).padStart(6) + ' │';
    
    // Plot points
    for (let col = 0; col < width; col++) {
      const dataIndex = Math.floor((col / (width - 1)) * (sortedData.length - 1));
      const dataPoint = sortedData[dataIndex];
      
      if (dataPoint) {
        const normalizedWeight = (dataPoint.weight - minWeight) / weightRange;
        const expectedRow = Math.round(normalizedWeight * (height - 1));
        
        if (expectedRow === row) {
          line += '●';
        } else {
          line += ' ';
        }
      } else {
        line += ' ';
      }
    }
    
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

  // Sort by start time and take the most recent fasts
  const sortedData = [...fastData]
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
 * Creates a summary table with recent data
 * @param {Object} data - Object containing meals, weights, fasts, and current fast
 * @returns {string} Formatted summary table
 */
export function createSummaryTable(data) {
  const { todaysEntries, recentWeights, fastStats, currentFast, recentFasts } = data;
  
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
    lines.push(`Started: ${startTime.toLocaleString()}`);
    
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
      const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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