import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directories exist
const directories = [
    '../public/images',
    '../public/images/hero',
    '../public/images/icons',
    '../public/images/promos',
    '../public/images/products',
    '../public/images/categories'
].map(dir => path.join(__dirname, dir));

directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Helper function to create gradient background
function createGradientBackground(ctx, width, height, colors) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    colors.forEach((color, index) => {
        gradient.addColorStop(index / (colors.length - 1), color);
    });
    return gradient;
}

// Generate hero banner
async function generateHeroBanner() {
    const width = 1200;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Create gradient background
    ctx.fillStyle = createGradientBackground(ctx, width, height, ['#F8F9FA', '#E9ECEF']);
    ctx.fillRect(0, 0, width, height);

    // Add some design elements
    ctx.fillStyle = '#5842BD';
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(
            Math.random() * width,
            Math.random() * height,
            Math.random() * 100 + 50,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    // Save the image
    const buffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(path.join(__dirname, '../public/images/hero/banner.jpg'), buffer);
}

// Generate icons
async function generateIcons() {
    const icons = [
        { name: 'payment', color: '#5842BD' },
        { name: 'delivery', color: '#00B517' },
        { name: 'quality', color: '#FFB800' },
        { name: 'delivery-time', color: '#FF4E3E' }
    ];

    icons.forEach(icon => {
        const size = 80;
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');

        // Create circular background
        ctx.fillStyle = icon.color + '20'; // 20 is hex for 12% opacity
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
        ctx.fill();

        // Create icon (simplified version)
        ctx.fillStyle = icon.color;
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/4, 0, Math.PI * 2);
        ctx.fill();

        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(path.join(__dirname, `../public/images/icons/${icon.name}.png`), buffer);
    });
}

// Generate promotional images
async function generatePromoImages() {
    const promos = [
        { name: 'quality-eggs', colors: ['#FFD700', '#FFA500'] },
        { name: 'healthy-snacks', colors: ['#4CAF50', '#2E7D32'] },
        { name: 'beverages', colors: ['#2196F3', '#1565C0'] }
    ];

    promos.forEach(promo => {
        const width = 400;
        const height = 200;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Create gradient background
        ctx.fillStyle = createGradientBackground(ctx, width, height, promo.colors);
        ctx.fillRect(0, 0, width, height);

        // Add pattern
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 30 + 10,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        const buffer = canvas.toBuffer('image/jpeg');
        fs.writeFileSync(path.join(__dirname, `../public/images/promos/${promo.name}.jpg`), buffer);
    });
}

// Generate product images
async function generateProductImages() {
    const products = [
        { name: 'apple-juice', colors: ['#FF5722', '#F44336'] },
        { name: 'philadelphia', colors: ['#2196F3', '#1976D2'] }
    ];

    products.forEach(product => {
        const size = 300;
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');

        // Create gradient background
        ctx.fillStyle = createGradientBackground(ctx, size, size, product.colors);
        ctx.fillRect(0, 0, size, size);

        // Add product mockup (simplified)
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.9;
        ctx.fillRect(size/4, size/4, size/2, size/2);

        const buffer = canvas.toBuffer('image/jpeg');
        fs.writeFileSync(path.join(__dirname, `../public/images/products/${product.name}.jpg`), buffer);
    });
}

// Generate category images
async function generateCategoryImages() {
    const categories = [
        { name: 'quality-products', colors: ['#9C27B0', '#7B1FA2'] },
        { name: 'shopping', colors: ['#FF9800', '#F57C00'] }
    ];

    categories.forEach(category => {
        const width = 600;
        const height = 300;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Create gradient background
        ctx.fillStyle = createGradientBackground(ctx, width, height, category.colors);
        ctx.fillRect(0, 0, width, height);

        // Add pattern
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 50 + 20,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        const buffer = canvas.toBuffer('image/jpeg');
        fs.writeFileSync(path.join(__dirname, `../public/images/categories/${category.name}.jpg`), buffer);
    });
}

// Generate all images
async function generateAllImages() {
    await generateHeroBanner();
    await generateIcons();
    await generatePromoImages();
    await generateProductImages();
    await generateCategoryImages();
    console.log('All images generated successfully!');
}

generateAllImages().catch(console.error); 