const fs = require('fs');
const path = require('path');

try {
  const nextDir = path.join(__dirname, '..', '.next');
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 3 });
  }
} catch {
  // Silently proceed
}
