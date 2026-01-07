export interface Product {
    coverImage?: string;
    discountPrice?: number;
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    category: 'plants' | 'pots' | 'seeds';
    badge?: 'Sale' | 'New Arrival';
    image: string;
    hoverImage?: string;
    description: string;
}

export const PRODUCTS: Product[] = [
    {
        id: '1',
        name: 'Rhapis Palm',
        price: 1199,
        originalPrice: 1599,
        category: 'plants',
        badge: 'Sale',
        image: '/rhapis-1.png',
        hoverImage: '/rhapis-2.jpg',
        description: 'An elegant lady palm that prefers indirect light. Perfect for adding a tropical touch.'
    },
    {
        id: '2',
        name: 'Beige Pot',
        price: 899,
        originalPrice: 1199,
        category: 'pots',
        badge: 'Sale',
        image: '/beige-pot-1.png',
        hoverImage: '/beige-pot-2.png',
        description: 'Neutral beige ceramic pot, suitable for any decor style.'
    },
    {
        id: '3',
        name: 'Alokazia Amazonica',
        price: 1899,
        category: 'plants',
        image: '/alokazia-1.png',
        hoverImage: '/alokazia-2.jpg',
        description: 'Known as the African Mask plant, featuring striking dark green leaves with pale veins.'
    },
    {
        id: '4',
        name: 'Metal Pot',
        price: 1549,
        originalPrice: 2099,
        category: 'pots',
        badge: 'Sale',
        image: '/metal-pot-1.png',
        hoverImage: '/metal-pot-2.png',
        description: 'Industrial style metal pot. Durable and stylish.'
    },
    {
        id: '5',
        name: 'Pot Stand',
        price: 1299,
        category: 'pots',
        image: '/pot-stand-1.png',
        hoverImage: '/pot-stand-2.png',
        description: 'Elevate your plants with this sturdy wooden pot stand.'
    },
    {
        id: '6',
        name: 'Schefflera Arboricola',
        price: 1999,
        originalPrice: 2699,
        category: 'plants',
        badge: 'Sale',
        image: '/schefflera-1.png',
        hoverImage: '/schefflera-2.jpg',
        description: 'The Dwarf Umbrella Tree. A hardy, easy-care houseplant.'
    },
    {
        id: '7',
        name: 'Wooden Basket',
        price: 2299,
        category: 'pots',
        badge: 'New Arrival',
        image: '/wooden-basket-1.png',
        hoverImage: '/wooden-basket-2.png',
        description: 'Woven wooden basket for a rustic, natural look.'
    },
    {
        id: '8',
        name: 'Cereus',
        price: 1199,
        originalPrice: 1599,
        category: 'plants',
        badge: 'Sale',
        image: '/cereus-1.png',
        hoverImage: '/cereus-2.png',
        description: 'A columnar cactus that is perfect for sunny spots.'
    },
    {
        id: '9',
        name: 'Cactus',
        price: 1599,
        category: 'plants',
        badge: 'New Arrival',
        image: '/cactus-1.png',
        hoverImage: '/cactus-2.png',
        description: 'Classic desert cactus. Very low maintenance.'
    },
    {
        id: '10',
        name: 'Concrete Pot',
        price: 899,
        originalPrice: 1199,
        category: 'pots',
        badge: 'Sale',
        image: '/concrete-pot-1.png',
        hoverImage: '/concrete-pot-2.png',
        description: 'Modern, minimalist concrete pot for urban jungles.'
    },
    {
        id: '11',
        name: 'Crassula',
        price: 1599,
        category: 'plants',
        image: '/crassula-1.png',
        hoverImage: '/crassula-2.png',
        description: 'The Jade Plant. A symbol of luck and prosperity.'
    },
    {
        id: '12',
        name: 'Rattan Basket',
        price: 2649,
        category: 'pots',
        image: '/rattan-basket-1.png',
        hoverImage: '/rattan-basket-2.png',
        description: 'Boho-chic rattan basket to cover plain nursery pots.'
    },
    {
        id: '13',
        name: 'Rusty Flowerpot',
        price: 1699,
        category: 'pots',
        badge: 'New Arrival',
        image: '/rusty-flowerpot-1.png',
        hoverImage: '/rusty-flowerpot-2.png',
        description: 'Vintage style flowerpot with a weathered rusty finish.'
    },
    {
        id: '14',
        name: 'Monstera Deliciosa',
        price: 2199,
        category: 'plants',
        image: '/monstera-new-1.png',
        hoverImage: '/monstera-new-2.png',
        description: 'The iconic Swiss Cheese plant. A must-have for any collection.'
    },
    {
        id: '15',
        name: 'Graphite Pot',
        price: 899,
        originalPrice: 1199,
        category: 'pots',
        badge: 'Sale',
        image: '/graphite-pot-1.png',
        hoverImage: '/graphite-pot-2.png',
        description: 'Dark graphite colored pot for a sleek, modern contrast.'
    },
    {
        id: '16',
        name: 'Anthurium Clarinervium',
        price: 1299,
        originalPrice: 1799,
        category: 'plants',
        badge: 'Sale',
        image: '/anthurium-1.png',
        hoverImage: '/anthurium-2.png',
        description: 'Velvet cardboard anthurium with striking white veins.'
    },
    {
        id: '17',
        name: 'Zamioculcas',
        price: 1599,
        category: 'plants',
        image: '/zamioculcas-1.png',
        hoverImage: '/zamioculcas-2.png',
        description: 'The ZZ Plant. Tolerates low light and neglect.'
    },
    {
        id: '18',
        name: 'Ficus Lyrata',
        price: 2899,
        category: 'plants',
        badge: 'New Arrival',
        image: '/ficus-lyrata-1.png',
        hoverImage: '/ficus-lyrata-2.png',
        description: 'Fiddle Leaf Fig. A statement tree for bright rooms.'
    },
    {
        id: '19',
        name: 'Exotic Plants Subscription',
        price: 4999,
        category: 'plants',
        image: '/exotic-subscription-1.png',
        hoverImage: '/exotic-subscription-2.png',
        description: 'Monthly delivery of rare and exotic plants.'
    },
    {
        id: '20',
        name: 'Cactus Lover Subscription',
        price: 4999,
        category: 'plants',
        image: '/cactus-subscription-1.png',
        hoverImage: '/cactus-subscription-2.png',
        description: 'Monthly curation of unique cacti delivered to your door.'
    },
    {
        id: '21',
        name: 'Monstera Seeds',
        price: 799,
        category: 'seeds',
        image: '/monstera-1.png', // Reusing placeholder
        hoverImage: '/monstera-2.png',
        description: 'Grow your own Swiss Cheese plant from scratch.'
    },
    {
        id: '22',
        name: 'Palm Seeds',
        price: 649,
        category: 'seeds',
        image: '/rhapis-1.png', // Reusing placeholder
        hoverImage: '/rhapis-2.jpg',
        description: 'Quality palm seeds for patient gardeners.'
    },
    {
        id: '23',
        name: 'Cactus Mix Seeds',
        price: 499,
        category: 'seeds',
        image: '/cactus-1.png', // Reusing placeholder
        hoverImage: '/cactus-2.png',
        description: 'A variety pack of desert cactus seeds.'
    }
];
