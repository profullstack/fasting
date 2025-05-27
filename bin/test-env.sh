#!/bin/bash

echo "=========================================="
echo "FASTING APP ENVIRONMENT DEBUG"
echo "=========================================="

echo ""
echo "=== SYSTEM INFO ==="
echo "Hostname: $(hostname)"
echo "OS: $(uname -a)"
echo "Node version: $(node --version)"

echo ""
echo "=== LOCALE & TIMEZONE ==="
echo "LANG: $LANG"
echo "LC_ALL: $LC_ALL"
echo "LC_TIME: $LC_TIME"
echo "TZ: $TZ"
echo "System timezone: $(timedatectl status 2>/dev/null | grep "Time zone" || echo "timedatectl not available")"

echo ""
echo "=== TMUX INFO ==="
if [ -n "$TMUX" ]; then
    echo "Running in tmux: YES"
    echo "TMUX session: $TMUX"
else
    echo "Running in tmux: NO"
fi

echo ""
echo "=== APP TIMEZONE CONFIG ==="
node -e "import('./lib/config.js').then(config => console.log('App timezone:', config.getTimezone()))" 2>/dev/null || echo "Failed to get app timezone"

echo ""
echo "=== NODE.JS INTL TEST ==="
node -e "
const date = new Date('2024-05-26T18:03:00.000Z');
console.log('Test UTC timestamp: 2024-05-26T18:03:00.000Z');
console.log('Date object:', date.toString());
console.log('System timezone detected:', Intl.DateTimeFormat().resolvedOptions().timeZone);

const pacificFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles',
  hour: 'numeric',
  minute: 'numeric',
  hour12: true
});
console.log('Pacific time format:', pacificFormatter.format(date));
console.log('Pacific time parts:', JSON.stringify(pacificFormatter.formatToParts(date)));
" 2>/dev/null || echo "Failed to run Node.js Intl test"

echo ""
echo "=== TIMEZONE DEBUG SCRIPT ==="
if [ -f "debug-timezone.js" ]; then
    node debug-timezone.js 2>/dev/null || echo "Failed to run debug-timezone.js"
else
    echo "debug-timezone.js not found"
fi

echo ""
echo "=== MEALS DATA SAMPLE ==="
if [ -f "$HOME/.config/fasting/meals.json" ]; then
    echo "Meals file exists, showing first few entries:"
    head -20 "$HOME/.config/fasting/meals.json" 2>/dev/null || echo "Failed to read meals file"
else
    echo "No meals file found at $HOME/.config/fasting/meals.json"
fi

echo ""
echo "=== FASTING SUMMARY TEST ==="
echo "Running 'fasting summary' to see current output:"
node bin/cli.js summary 2>/dev/null | head -30 || echo "Failed to run fasting summary"

echo ""
echo "=========================================="
echo "DEBUG COMPLETE"
echo "=========================================="