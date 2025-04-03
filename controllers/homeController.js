export const getHomePage = (req, res) => {
    // Mock data - will be replaced with actual database calls later
    const newArrivals = [
        {
            id: 1,
            name: "100 Percent Apple Juice – 64 fl oz Bottle",
            price: 0.50,
            oldPrice: 1.99,
            discount: 75,
            image: "/images/products/apple-juice.jpg",
            badges: ["ORGANIC"],
            rating: 3
        },
        {
            id: 2,
            name: "Great Value Rising Crust Frozen Pizza, Supreme",
            price: 8.99,
            oldPrice: 9.99,
            discount: 11,
            image: "/images/products/pizza.jpg",
            badges: ["COLD SALE"],
            rating: 3
        },
        {
            id: 3,
            name: "Simply Orange Pulp Free Juice – 52 fl oz",
            price: 2.45,
            oldPrice: 4.13,
            discount: 41,
            image: "/images/products/orange-juice.jpg",
            badges: [],
            rating: 2
        },
        {
            id: 4,
            name: "California Pizza Kitchen Margherita, Crispy Thin Crust",
            price: 11.77,
            oldPrice: 14.77,
            discount: 21,
            image: "/images/products/pizza-kitchen.jpg",
            badges: ["COLD SALE"],
            rating: 3
        },
        {
            id: 5,
            name: "Cantaloupe Melon Fresh Organic Cut",
            price: 1.25,
            oldPrice: 2.98,
            discount: 59,
            image: "/images/products/cantaloupe.jpg",
            badges: ["ORGANIC"],
            rating: 3
        },
        {
            id: 6,
            name: "Angel Soft Toilet Paper, 9 Mega Rolls",
            price: 14.12,
            oldPrice: 17.12,
            discount: 18,
            image: "/images/products/toilet-paper.jpg",
            badges: [],
            megaRolls: 9,
            rating: 3
        }
    ];

    const promotions = [
        {
            id: 1,
            title: "Quality eggs at an affordable price",
            description: "Fresh farm eggs and fruits delivered to your doorstep",
            image: "/images/promos/eggs-fruits.jpg"
        },
        {
            id: 2,
            title: "Snacks that nourish our mind and body",
            description: "Healthy and delicious green fruits and vegetables",
            image: "/images/promos/green-fruits.jpg"
        },
        {
            id: 3,
            title: "Unbeatable quality, unbeatable prices",
            description: "Wide variety of snack products at great prices",
            image: "/images/promos/snacks.jpg"
        }
    ];

    const categories = [
        { id: 1, name: "Fruits & Vegetables", icon: "fas fa-apple-alt" },
        { id: 2, name: "Meat & Fish", icon: "fas fa-fish" },
        { id: 3, name: "Snacks", icon: "fas fa-cookie" },
        { id: 4, name: "Beverages", icon: "fas fa-wine-bottle" },
        { id: 5, name: "Beauty & Health", icon: "fas fa-heart" },
        { id: 6, name: "Bread & Bakery", icon: "fas fa-bread-slice" }
    ];

    const features = [
        {
            id: 1,
            title: "Free Shipping",
            description: "Orders over $200",
            icon: "fas fa-truck"
        },
        {
            id: 2,
            title: "Quick Payment",
            description: "100% secure payment",
            icon: "fas fa-credit-card"
        },
        {
            id: 3,
            title: "24/7 Support",
            description: "Ready for you",
            icon: "fas fa-headset"
        }
    ];

    res.render('index', {
        newArrivals,
        promotions,
        categories,
        features
    });
}; 