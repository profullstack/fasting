/**
 * Simple CLI spinner utility for showing progress during async operations
 */

class Spinner {
  constructor(text = 'Loading...') {
    this.text = text;
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.frameIndex = 0;
    this.interval = null;
    this.isSpinning = false;
  }

  start() {
    if (this.isSpinning) return;
    
    this.isSpinning = true;
    this.frameIndex = 0;
    
    // Hide cursor
    process.stdout.write('\x1B[?25l');
    
    this.interval = setInterval(() => {
      const frame = this.frames[this.frameIndex];
      process.stdout.write(`\r${frame} ${this.text}`);
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
    }, 80);
  }

  stop(finalText = null) {
    if (!this.isSpinning) return;
    
    this.isSpinning = false;
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    // Clear the line and show cursor
    process.stdout.write('\r\x1B[K');
    process.stdout.write('\x1B[?25h');
    
    if (finalText) {
      console.log(finalText);
    }
  }

  updateText(newText) {
    this.text = newText;
  }
}

/**
 * Convenience function to wrap an async operation with a spinner
 * @param {string} text - Text to show while spinning
 * @param {Function} asyncFn - Async function to execute
 * @param {string} successText - Text to show on success (optional)
 * @returns {Promise} Result of the async function
 */
export async function withSpinner(text, asyncFn, successText = null) {
  const spinner = new Spinner(text);
  
  try {
    spinner.start();
    const result = await asyncFn();
    spinner.stop(successText);
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

export { Spinner };