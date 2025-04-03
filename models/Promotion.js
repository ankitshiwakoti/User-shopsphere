class Promotion {
    constructor(id, title, description, image) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.image = image;
    }

    // This will be replaced with actual database operations later
    static async findAll() {
        // Mock implementation - will be replaced with database query
        return [];
    }

    static async findById(id) {
        // Mock implementation - will be replaced with database query
        return null;
    }

    static async create(promotionData) {
        // Mock implementation - will be replaced with database query
        return null;
    }

    async save() {
        // Mock implementation - will be replaced with database query
        return this;
    }
}

module.exports = Promotion; 