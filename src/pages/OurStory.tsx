import { motion } from 'framer-motion';

const OurStory = () => {
    return (
        <div className="max-w-4xl mx-auto px-6 py-20 space-y-12">
            <div className="text-center space-y-6">
                <span className="text-accent text-sm font-bold tracking-widest uppercase">Since 2024</span>
                <h1 className="text-4xl md:text-6xl font-serif text-primary">Growing Green</h1>
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

            <div className="prose prose-lg mx-auto text-gray-600 font-light leading-relaxed">
                <p>
                    Plantasy began with a simple idea: bringing the calm and beauty of nature into our modern, busy lives should be easy and accessible. What started as a small personal collection on a windowsill has grown into a curated haven for plant lovers.
                </p>
                <p>
                    We believe that plants are more than just decor; they are living companions that improve our air, lift our moods, and connect us to the earth. Our mission is to help you build your own indoor sanctuary, no matter how much space or experience you have.
                </p>
                <p>
                    Every plant we ship is hand-selected for its health and vitality. We work with sustainable nurseries to ensure that we are not only greening your home but also caring for our planet.
                </p>
            </div>
        </div>
    );
};

export default OurStory;
