export type FoodOffer = {
    id: string;
    name: string;
    type: string;
    price: number;
    quantity: number;
    unit: string;
    address: {
        street: string;
        city: string;
        zip: string;
        lat: number;
        lng: number;
    };
    seller: {
        id: string;
        name: string;
        contact: string;
    };
    availableFrom: string;
    availableTo: string;
    description: string;
    imageUrl: string;
};

const foodTypes = [
    "Vegetables",
    "Fruits",
    "Dairy",
    "Meat",
    "Bakery",
    "Other"
];

const units = ["kg", "g", "l", "pcs", "box"];

// Cities and coordinates for Algarve region, Portugal
const cities = [
    { city: "Faro", zip: "8000-000", lat: 37.0194, lng: -7.9304 },
    { city: "Portimão", zip: "8500-000", lat: 37.1386, lng: -8.5377 },
    { city: "Lagos", zip: "8600-000", lat: 37.1020, lng: -8.6742 },
    { city: "Albufeira", zip: "8200-000", lat: 37.0891, lng: -8.2479 },
    { city: "Tavira", zip: "8800-000", lat: 37.1268, lng: -7.6497 },
    { city: "Loulé", zip: "8100-000", lat: 37.1370, lng: -8.0198 },
    { city: "Silves", zip: "8300-000", lat: 37.1892, lng: -8.4387 },
    { city: "Vila Real de Santo António", zip: "8900-000", lat: 37.1950, lng: -7.4176 },
    { city: "Olhão", zip: "8700-000", lat: 37.0281, lng: -7.8411 },
    { city: "Quarteira", zip: "8125-000", lat: 37.0695, lng: -8.1001 }
];

const names = [
    "Tomatoes", "Apples", "Milk", "Eggs", "Bread", "Chicken", "Cheese", "Carrots", "Potatoes", "Bananas",
    "Strawberries", "Yogurt", "Butter", "Beef", "Pork", "Lettuce", "Cucumber", "Peppers", "Oranges", "Grapes"
];

function randomFromArray<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomPrice(type: string) {
    switch (type) {
        case "Vegetables": return +(Math.random() * 3 + 1).toFixed(2);
        case "Fruits": return +(Math.random() * 4 + 1).toFixed(2);
        case "Dairy": return +(Math.random() * 2 + 1).toFixed(2);
        case "Meat": return +(Math.random() * 10 + 5).toFixed(2);
        case "Bakery": return +(Math.random() * 2 + 0.5).toFixed(2);
        default: return +(Math.random() * 5 + 1).toFixed(2);
    }
}

function randomQuantity() {
    return Math.floor(Math.random() * 20) + 1;
}

function randomDate(daysFromNow: number) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split("T")[0];
}

function randomImageUrl(type: string) {
    return `https://source.unsplash.com/400x300/?${type.toLowerCase()}`;
}

export const mockFoodOffers: FoodOffer[] = Array.from({ length: 100 }, (_, i) => {
    const type = randomFromArray(foodTypes);
    const name = randomFromArray(names);
    const cityObj = randomFromArray(cities);
    return {
        id: `offer-${i + 1}`,
        name,
        type,
        price: randomPrice(type),
        quantity: randomQuantity(),
        unit: randomFromArray(units),
        address: {
            street: `${Math.floor(Math.random() * 100) + 1} Main St`,
            city: cityObj.city,
            zip: cityObj.zip,
            lat: +(cityObj.lat + (Math.random() - 0.5) * 0.05).toFixed(6),
            lng: +(cityObj.lng + (Math.random() - 0.5) * 0.05).toFixed(6),
        },
        seller: {
            id: `seller-${Math.floor(Math.random() * 20) + 1}`,
            name: `Seller ${Math.floor(Math.random() * 20) + 1}`,
            contact: `seller${Math.floor(Math.random() * 20) + 1}@market.com`
        },
        availableFrom: randomDate(0),
        availableTo: randomDate(Math.floor(Math.random() * 14) + 1),
        description: `Fresh ${name} available from local producer in ${cityObj.city}.`,
        imageUrl: randomImageUrl(type)
    };
});