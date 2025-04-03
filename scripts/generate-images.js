import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directories exist
const dirs = [
    path.join(__dirname, '../public/images/hero'),
    path.join(__dirname, '../public/images/promotions')
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Function to create gradient background
function createGradientBackground(ctx, width, height, color1, color2) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

// Function to create pattern overlay
function createPattern(ctx, width, height) {
    for (let i = 0; i < width; i += 50) {
        for (let j = 0; j < height; j += 50) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath();
            ctx.arc(i, j, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Function to add text overlay with shadow
function addTextOverlay(ctx, text, x, y, fontSize = '48px', color = 'white') {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.font = `bold ${fontSize} Inter, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
    ctx.restore();
}

// Function to draw icon
function drawIcon(ctx, x, y, size) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw a simple star icon
    const points = 5;
    const innerRadius = size * 0.4;
    const outerRadius = size * 0.8;
    
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / points;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

// Create hero banner
function createHeroBanner() {
    const canvas = createCanvas(1200, 600);
    const ctx = canvas.getContext('2d');

    // Create gradient background
    createGradientBackground(ctx, 1200, 600, '#5842BD', '#FF6B6B');
    
    // Add pattern
    createPattern(ctx, 1200, 600);
    
    // Add decorative elements
    drawIcon(ctx, 200, 150, 30);
    drawIcon(ctx, 1000, 450, 40);
    
    // Add main text
    addTextOverlay(ctx, 'Discover Amazing Deals', 600, 250, '64px');
    addTextOverlay(ctx, 'on Trending Products', 600, 320, '64px');
    addTextOverlay(ctx, 'Save up to 50% on selected items', 600, 400, '32px', 'rgba(255, 255, 255, 0.8)');

    // Save the image
    const buffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(path.join(__dirname, '../public/images/hero/electronics-banner.jpg'), buffer);
}

// Create promotional images
function createPromotionalImage(filename, title, subtitle, gradient) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    // Create gradient background
    createGradientBackground(ctx, 800, 400, gradient[0], gradient[1]);
    
    // Add pattern
    createPattern(ctx, 800, 400);
    
    // Add decorative icon
    drawIcon(ctx, 200, 200, 40);
    
    // Add text
    addTextOverlay(ctx, title, 400, 180, '48px');
    addTextOverlay(ctx, subtitle, 400, 240, '24px', 'rgba(255, 255, 255, 0.8)');

    // Save the image
    const buffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(path.join(__dirname, `../public/images/promotions/${filename}`), buffer);
}

// Generate all images
async function generateImages() {
    // Create hero banner
    createHeroBanner();

    // Create promotional images
    createPromotionalImage(
        'electronics-promo.jpg',
        'Latest Electronics',
        'Up to 40% off on gadgets',
        ['#2C3E50', '#3498DB']
    );
    createPromotionalImage(
        'fashion-promo.jpg',
        'Fashion Trends',
        'Save up to 50% off',
        ['#8E44AD', '#9B59B6']
    );
    createPromotionalImage(
        'home-promo.jpg',
        'Home Essentials',
        'Starting at $29.99',
        ['#16A085', '#2ECC71']
    );

    console.log('All images generated successfully!');
}

// Run the image generation
generateImages().catch(console.error); 