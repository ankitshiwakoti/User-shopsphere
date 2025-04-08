# Keep in Mind - ShopSphere Project Guidelines

## Project Structure (MVC)
We are following a strict MVC (Model-View-Controller) architecture using ES Modules:

### Models (`/models`)
- Using ES Modules syntax (import/export)
- Mongoose schemas for data structure
- All models must include:
  - Proper validation
  - Timestamps
  - Status tracking
  - Static methods for common queries

### Views (`/views`)
- Using EJS templating
- Current design must be preserved
- No design changes allowed to existing components
- New components must match existing design patterns

### Controllers (`/controllers`)
- Using ES Modules syntax
- Async/await for database operations
- Error handling for all operations
- Device detection for responsive content

## Important Guidelines

### 1. ES Modules Usage
```javascript
// DO use ES Modules syntax
import Product from '../models/Product.js';
export const someFunction = () => {};

// DON'T use CommonJS
const Product = require('../models/Product');
module.exports = someFunction;
```

### 2. Design Preservation
- ✅ Keep all existing design elements
- ✅ Maintain current layout structure
- ✅ Use existing CSS classes
- ❌ No new design patterns
- ❌ No modification to existing styles

### 3. Data Structure
- Product schema must be maintained as is
- Promotion schema must be maintained as is
- Any new schemas should follow the same pattern

### 4. Controller Pattern
- Keep the existing error handling
- Maintain the current data fetching pattern
- Follow the established response structure

### 5. File Naming Conventions
- Models: PascalCase (e.g., `Product.js`)
- Controllers: camelCase (e.g., `homeController.js`)
- Views: lowercase with hyphens (e.g., `product-list.ejs`)

### 6. Current Features to Preserve
- Categories sidebar
- Service features section
- New arrivals section
- Promotional cards
- Product grid layout
- Mobile responsiveness

## Database Integration
- Models are prepared for MongoDB with Mongoose
- Currently using mock data
- Database connection will be added later
- No changes needed to models when adding database

## Frontend Guidelines
- Bootstrap is being used
- Font Awesome for icons
- Custom CSS in `public/css/style.css`
- Mobile-first approach

## Note for AI Assistance
When providing assistance:
1. DO NOT suggest design changes
2. DO NOT modify existing component structure
3. DO NOT change the established MVC pattern
4. DO maintain ES Modules syntax
5. DO follow existing naming conventions
6. DO preserve all current functionality

## Current Tech Stack
- Node.js
- Express.js
- MongoDB (prepared for)
- Mongoose
- EJS Templates
- ES Modules
- Bootstrap
- Font Awesome 