# Repo Preview — GitHub Action

Generate beautiful social preview images for your GitHub repository. Every time you push, your repo gets a custom 1280x640 OG image that shows up when people share your repo on Twitter, LinkedIn, Discord, or Slack.

## Usage

```yaml
name: Generate Social Preview
on:
  push:
    branches: [main, master]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astra-intelligence/repo-preview@v1
        with:
          primary-color: '#6B46C1'
          secondary-color: '#3B82F6'
```

### With watermark removal (requires license)

```yaml
- uses: astra-intelligence/repo-preview@v1
  with:
    primary-color: '#6B46C1'
    secondary-color: '#3B82F6'
    license-key: ${{ secrets.REPO_PREVIEW_KEY }}
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `output-path` | No | `.github/social-preview.svg` | Where to save the SVG |
| `repo-name` | No | (auto) | Override repo name (e.g. `owner/repo`) |
| `repo-description` | No | (auto) | Override repo description |
| `primary-color` | No | `#6B46C1` | Primary gradient color |
| `secondary-color` | No | `#3B82F6` | Secondary gradient color |
| `license-key` | No | — | Gumroad license to remove watermark |

## Outputs

| Output | Description |
|--------|-------------|
| `preview-path` | Path to generated SVG |

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Generate unlimited previews with watermark |
| **Pro** | **$1** | Remove watermark, custom colors, priority |

Get a Pro license: [grantshatz.gumroad.com/l/oushyg](https://grantshatz.gumroad.com/l/oushyg)

Set it as a repo secret:
```
REPO_PREVIEW_KEY=your-license-key-here
```

## License

MIT — free for personal and commercial use. Remove watermark with paid license.