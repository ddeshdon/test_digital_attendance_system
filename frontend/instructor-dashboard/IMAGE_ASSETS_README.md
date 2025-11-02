# Image Assets Instructions

## Required Images

### 1. SIIT Building Background
- **File name**: `siit-building.jpg`
- **Location**: `/public/siit-building.jpg`
- **Recommended size**: 1920x1080px or larger
- **Format**: JPG or PNG
- **Usage**: Background image for the main dashboard

### 2. How It Works Step Images
Create these images and place them in `/public/images/`:

- **step1-beacon-app.png** - Screenshot of Beacon Simulator app
- **step2-copy-uuid.png** - Image showing UUID copying process
- **step3-student-scan.png** - Student using mobile app to scan
- **step4-monitor.png** - Dashboard showing attendance monitoring

### 3. SIIT Logo
- The current logo is a placeholder SVG
- Replace `/public/siit-logo.svg` with the official SIIT logo
- Recommended size: 200x60px
- Format: SVG or PNG with transparent background

## Implementation Notes

- All images should be optimized for web use
- Use WebP format for better compression if supported
- Ensure images are accessible with proper alt text
- Consider different screen densities (provide 2x versions if needed)

## File Structure
```
public/
├── siit-building.jpg          # Main background image
├── siit-logo.svg             # SIIT logo (replace with official)
├── images/
│   ├── step1-beacon-app.png
│   ├── step2-copy-uuid.png
│   ├── step3-student-scan.png
│   └── step4-monitor.png
└── ...
```