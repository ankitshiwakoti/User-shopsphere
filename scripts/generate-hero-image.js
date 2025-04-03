import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateHeroImage() {
    // Create canvas
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(1, '#e9ecef');
    ctx.fillStyle = gradient;
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
    ctx.globalAlpha = 1;

    // Add product mockup
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    
    // Draw product boxes
    ctx.fillRect(width/2 - 150, height/2 - 100, 300, 400);
    ctx.fillRect(width/2 + 50, height/2 - 150, 250, 350);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Add some text to the boxes
    ctx.fillStyle = '#5842BD';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Premium Products', width/2, height/2 + 180);

    // Save the image as JPG
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    const outputPath = path.join(__dirname, '..', 'public', 'images', 'hero', 'saffron-products.jpg');
    fs.writeFileSync(outputPath, buffer);
    console.log('Hero image generated successfully!');
}

generateHeroImage().catch(console.error); 