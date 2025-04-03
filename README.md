# ShopSphere - E-commerce Website

A modern e-commerce website built with Express.js, Node.js, MongoDB, and Bootstrap using the MVC pattern.

## Features

- User authentication and authorization
- Product management (CRUD operations)
- Shopping cart functionality
- Order management
- Responsive design with Bootstrap
- Admin dashboard
- User profiles

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shopsphere.git
cd shopsphere
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/shopsphere
SESSION_SECRET=your-secret-key-here
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
shopsphere/
├── config/             # Configuration files
├── controllers/        # Route controllers
├── middleware/         # Custom middleware
├── models/            # Database models
├── public/            # Static files
│   ├── css/          # Stylesheets
│   ├── js/           # Client-side JavaScript
│   └── images/       # Image assets
├── routes/            # Route definitions
├── views/             # View templates
│   ├── layouts/      # Layout templates
│   ├── partials/     # Reusable view components
│   └── products/     # Product-related views
├── .env              # Environment variables
├── .gitignore        # Git ignore file
├── app.js            # Application entry point
├── package.json      # Project dependencies
└── README.md         # Project documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 