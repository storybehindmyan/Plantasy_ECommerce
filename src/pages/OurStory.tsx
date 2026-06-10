import { motion } from 'framer-motion';

const OurStory = () => {
    return (
        <div className="max-w-4xl mx-auto px-6 py-20 space-y-12">
            <div className="text-center space-y-6">
                <span className="text-shop-terracotta text-sm font-bold tracking-widest uppercase">Since 2024</span>
                <h1 className="text-4xl md:text-6xl font-serif text-shop-ink">Our Story</h1>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="aspect-video bg-gray-100 overflow-hidden rounded-sm"
            >
                <img
                    src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=1200&auto=format&fit=crop"
                    alt="Greenhouse"
                    className="w-full h-full object-cover"
                />
            </motion.div>

            <div className="prose prose-lg mx-auto text-gray-600 font-light leading-relaxed flex flex-col gap-4">
                
                <p>Plantasy was born from a simple belief — everyone should be able to grow their own plants, herbs, vegetables, and flowers, regardless of space limitations.</p>

                <p>What started as a passion for sustainable gardening has evolved into a mission to make modern growing solutions accessible to every home. From beautifully designed 3D-printed planters to innovative hydroponic and aeroponic systems, we create products that help people reconnect with nature in a simple and enjoyable way.</p>
                    
                <p>Whether you have a balcony, terrace, apartment, or backyard, Plantasy provides everything you need to start and succeed in your gardening journey. Our goal is to make growing plants easier, smarter, and more rewarding for everyone.</p>
                    
                <p>Grow more. Waste less. Live greener.</p>
            </div>
        </div>
    );
};

export default OurStory;
