const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const https = require('https');

function generateSVG({ repoName, description, primaryColor, secondaryColor, watermark }) {
  const safeName = repoName || 'username/repo';
  const safeDesc = description
    ? description.length > 120
      ? description.slice(0, 117) + '...'
      : description
    : 'A powerful tool for developers';

  const [owner, repo] = safeName.includes('/') ? safeName.split('/') : ['', safeName];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640" viewBox="0 0 1280 640">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}" />
      <stop offset="100%" stop-color="${secondaryColor}" />
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.08)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="rgba(0,0,0,0.3)" />
    </filter>
    <clipPath id="rounded">
      <rect width="1280" height="640" rx="16" />
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="1280" height="640" fill="url(#bg)" clip-path="url(#rounded)" />

  <!-- Decorative circles -->
  <circle cx="1100" cy="100" r="280" fill="url(#glow)" />
  <circle cx="200" cy="500" r="200" fill="url(#glow)" />
  <circle cx="1200" cy="550" r="150" fill="rgba(255,255,255,0.03)" />

  <!-- Grid pattern -->
  <g opacity="0.04">
    <line x1="0" y1="160" x2="1280" y2="160" stroke="white" stroke-width="1" />
    <line x1="0" y1="320" x2="1280" y2="320" stroke="white" stroke-width="1" />
    <line x1="0" y1="480" x2="1280" y2="480" stroke="white" stroke-width="1" />
    <line x1="320" y1="0" x2="320" y2="640" stroke="white" stroke-width="1" />
    <line x1="640" y1="0" x2="640" y2="640" stroke="white" stroke-width="1" />
    <line x1="960" y1="0" x2="960" y2="640" stroke="white" stroke-width="1" />
  </g>

  <!-- Content -->
  <g transform="translate(80, 80)">

    <!-- GitHub icon -->
    <g transform="translate(0, 20)">
      <rect x="0" y="0" width="64" height="64" rx="14" fill="rgba(255,255,255,0.15)" />
      <text x="32" y="42" font-family="monospace" font-size="28" fill="white" text-anchor="middle" font-weight="bold">&#x3C;/&#x3E;</text>
    </g>

    <!-- Owner / Repo name -->
    ${owner ? `<text x="0" y="140" font-family="sans-serif" font-size="24" fill="rgba(255,255,255,0.7)" font-weight="500">${owner} /</text>` : ''}
    <text x="0" y="190" font-family="sans-serif" font-size="56" fill="white" font-weight="bold">${repo || safeName}</text>

    <!-- Description -->
    <text x="0" y="250" font-family="sans-serif" font-size="22" fill="rgba(255,255,255,0.8)" font-weight="400" letter-spacing="0.5">
      ${safeDesc}
    </text>

    <!-- Divider -->
    <line x1="0" y1="300" x2="1120" y2="300" stroke="rgba(255,255,255,0.15)" stroke-width="1" />

    <!-- Features bar -->
    <g transform="translate(0, 330)">
      <rect x="0" y="0" width="200" height="36" rx="18" fill="rgba(255,255,255,0.1)" />
      <circle cx="24" cy="18" r="4" fill="#4ADE80" />
      <text x="38" y="24" font-family="sans-serif" font-size="14" fill="rgba(255,255,255,0.8)">Open Source</text>

      <rect x="220" y="0" width="160" height="36" rx="18" fill="rgba(255,255,255,0.1)" />
      <text x="244" y="24" font-family="sans-serif" font-size="14" fill="rgba(255,255,255,0.8)">MIT License</text>

      <rect x="400" y="0" width="180" height="36" rx="18" fill="rgba(255,255,255,0.1)" />
      <text x="424" y="24" font-family="sans-serif" font-size="14" fill="rgba(255,255,255,0.8)">&#x2605; Production Ready</text>
    </g>
  </g>

  ${watermark ? `
  <!-- Watermark -->
  <g transform="translate(640, 605)" text-anchor="middle">
    <text font-family="sans-serif" font-size="12" fill="rgba(255,255,255,0.25)" letter-spacing="2">
      GENERATED WITH REPO-PREVIEW
    </text>
  </g>` : ''}
</svg>`;

  return svg;
}

function validateLicenseKey(key) {
  return new Promise((resolve) => {
    if (!key) {
      resolve(false);
      return;
    }

    const postData = JSON.stringify({
      product_permalink: 'https://grantshatz.gumroad.com/l/oushyg',
      license_key: key
    });

    const req = https.request({
      hostname: 'api.gumroad.com',
      path: '/v2/licenses/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.success === true && parsed.uses && parsed.uses > 0);
        } catch {
          resolve(false);
        }
      });
    });

    req.on('error', () => resolve(false));
    req.write(postData);
    req.end();
  });
}

async function run() {
  try {
    const outputPath = core.getInput('output-path') || '.github/social-preview.svg';
    const primaryColor = core.getInput('primary-color') || '#6B46C1';
    const secondaryColor = core.getInput('secondary-color') || '#3B82F6';
    const licenseKey = core.getInput('license-key');

    // Get repo info
    const ctx = github.context;
    let repoName = core.getInput('repo-name');
    let repoDescription = core.getInput('repo-description');

    if (!repoName && ctx.payload.repository) {
      repoName = ctx.payload.repository.full_name;
    }
    if (!repoDescription && ctx.payload.repository) {
      repoDescription = ctx.payload.repository.description;
    }

    // Validate license key for watermark removal
    const validLicense = await validateLicenseKey(licenseKey);
    const watermark = !validLicense;

    const svg = generateSVG({
      repoName,
      description: repoDescription,
      primaryColor,
      secondaryColor,
      watermark
    });

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, svg, 'utf-8');
    core.setOutput('preview-path', outputPath);

    if (watermark) {
      core.info('✅ Repo preview generated (watermarked)');
      core.info('💡 Remove watermark with a license key from: https://grantshatz.gumroad.com/l/oushyg');
    } else {
      core.info('✅ Repo preview generated (no watermark — license validated)');
    }

    core.info(`📁 Saved to: ${outputPath}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();