import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PRODUCTS } from '../data/products';

const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8 }
};

const Home = () => {
    const { scrollY } = useScroll();
    const yBg = useTransform(scrollY, [0, 500], [0, 200]);

    const storyRef = useRef(null);
    const { scrollYProgress: storyProgress } = useScroll({
        target: storyRef,
        offset: ["start end", "end start"]
    });
    const yStoryBg = useTransform(storyProgress, [0, 1], ["-10%", "10%"]);

    return (
        <div className="bg-black text-white w-full overflow-x-hidden">

            {/* 1. Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#2C2C2C]">
                {/* Background Image / Texture Element */}
                <motion.div className="absolute inset-0 z-0" style={{ y: yBg }}>
                    <img
                        src="/hero-bg.jpg"
                        alt="Minimal Plant Shadow"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                </motion.div>

                <motion.div
                    className="relative z-10 text-center max-w-3xl px-6"
                    initial="initial"
                    whileInView="whileInView"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                >
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif mb-6 tracking-tight text-white relative inline-block">
                        Grow Your Joy
                    </h1>
                    <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                        Discover our curated collection of rare house plants, handmade pots, and essential gardening tools.
                    </p>
                    <Link to="/shop" className="inline-block border border-white px-10 py-3 text-sm tracking-[0.2em] font-medium hover:bg-white hover:text-black transition-all duration-300 uppercase">
                        Shop Collection
                    </Link>
                </motion.div>
            </section>

            {/* 1.5. New Arrivals Section */}
            <section className="bg-[#E8E6E1] py-24 px-6 text-[#2C2C2C] min-h-screen flex flex-col justify-center">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="flex justify-between items-end mb-12">
                        <motion.h2
                            className="text-4xl md:text-6xl font-serif"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            New Arrivals
                        </motion.h2>
                        <Link to="/shop" className="hidden md:inline-block bg-[#c16e41] text-white px-8 py-3 text-sm font-bold tracking-widest hover:bg-[#a0502a] transition duration-300">
                            Shop All
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {PRODUCTS.filter(p => p.badge === 'New Arrival').slice(0, 4).map((item, i) => (
                            <motion.div
                                key={item.id}
                                className="group cursor-pointer"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.8 }}
                            >
                                <Link to={`/product/${item.id}`}>
                                    <div className="relative aspect-[3/4] overflow-hidden bg-white mb-4">
                                        <span className="absolute top-4 left-4 z-10 bg-[#5F6F52] text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1">
                                            New Arrival
                                        </span>
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out opacity-100"
                                        />
                                        {item.hoverImage && (
                                            <img
                                                src={item.hoverImage}
                                                alt={`${item.name} hover`}
                                                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out opacity-0 group-hover:opacity-100 z-10"
                                            />
                                        )}
                                    </div>
                                    <h3 className="font-serif text-2xl mb-1">{item.name}</h3>
                                    <p className="text-gray-600 mb-4 text-lg">₹{item.price.toFixed(2)}</p>
                                    <button className="w-full border border-black/20 py-3 text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-300">
                                        Add to Cart
                                    </button>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-12 text-center md:hidden">
                        <Link to="/shop" className="inline-block bg-[#c16e41] text-white px-8 py-3 text-sm font-bold tracking-widest hover:bg-[#a0502a] transition duration-300">
                            Shop All
                        </Link>
                    </div>
                </div>
            </section>

            {/* 2. Subscription Boxes (Split Layout) */}
            <section className="flex flex-col md:flex-row min-h-screen">
                {/* Left Image */}
                <motion.div
                    className="w-full md:w-1/2 relative min-h-[50vh] md:min-h-auto"
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <img
                        src="/subscription-box.jpg"
                        alt="Plant Subscription"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </motion.div>

                {/* Right Content - Orange Background */}
                <motion.div
                    className="w-full md:w-1/2 bg-[#c16e41] flex flex-col justify-center p-12 md:p-20 text-white"
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <h2 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">
                        Shop Our Plant <br /> Subscription Boxes
                    </h2>
                    <p className="text-white/90 mb-12 font-light">
                        And look forward to a new plant every month.
                    </p>

                    <div className="space-y-8 mb-12">
                        {/* Cactus Lover */}
                        <Link to="/shop?category=subscriptions" className="flex items-center gap-6 group">
                            <div className="w-16 h-16 rounded-full border border-white/30 flex items-center justify-center group-hover:bg-white/10 transition">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                                    <path d="M12 2v20M8 8v4a4 4 0 0 0 4 4 4 4 0 0 0 4-4V8" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-serif">Cactus Lover</h3>
                                <p className="text-sm text-white/70">Subscription</p>
                            </div>
                        </Link>

                        {/* Exotic Plants */}
                        <Link to="/shop?category=subscriptions" className="flex items-center gap-6 group">
                            <div className="w-16 h-16 rounded-full border border-white/30 flex items-center justify-center group-hover:bg-white/10 transition">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-serif">Exotic Plants</h3>
                                <p className="text-sm text-white/70">Subscription</p>
                            </div>
                        </Link>
                    </div>

                    <Link to="/shop" className="inline-block border border-white px-8 py-3 w-fit text-sm tracking-widest font-medium hover:bg-white hover:text-[#c16e41] transition-all duration-300 uppercase">
                        Subscription Boxes
                    </Link>
                </motion.div>
            </section>

            {/* 3. Sprout on the #Gram Section */}
            <section className="bg-[#5a614a] py-24 px-6 text-white min-h-screen flex flex-col justify-center">
                <motion.div className="text-center mb-16" {...fadeInUp}>
                    <h2 className="text-5xl md:text-7xl font-serif mb-4">
                        Sprout on the <span className="underline decoration-1 underline-offset-8">#Gram</span>
                    </h2>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[1400px] mx-auto w-full">
                    {[
                        "/gram-10.jpg",
                        "/gram-2.jpg",
                        "/gram-3.jpg",
                        "/gram-4.jpg",
                        "/gram-5.jpg",
                        "/gram-6.jpg",
                        "/gram-7.jpg",
                        "/gram-8.jpg"
                    ].map((src, i) => (
                        <motion.div
                            key={i}
                            className="group relative aspect-square overflow-hidden cursor-pointer"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05, duration: 0.6 }}
                        >
                            <img src={src} alt="Instagram" className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                                <Instagram className="text-white w-8 h-8" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 4. Our Story / From Seed to Sprout Section */}
            <section ref={storyRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <motion.div
                        className="absolute inset-0 w-full h-full"
                        style={{ y: yStoryBg, scale: 1.25 }}
                    >
                        <img
                            src="/story-bg.png"
                            alt="Background"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                    </motion.div>
                </div>

                <motion.div
                    className="relative z-10 text-center max-w-2xl px-6 text-white"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-5xl md:text-7xl font-serif mb-6 tracking-tight">
                        From Seed to Sprout
                    </h2>
                    <p className="text-gray-200 text-lg md:text-xl mb-10 leading-relaxed font-light">
                        I'm a paragraph. Click here to add your own text and edit me. It's easy. Just click “Edit Text” or double click me to add your own content and make changes to the font. I’m a great place for you to tell a story and let your users know a little more about you.
                    </p>
                    <Link to="/our-story" className="inline-block border border-white px-10 py-3 text-sm tracking-[0.2em] font-medium hover:bg-white hover:text-black transition-all duration-300 uppercase">
                        Our Story
                    </Link>
                </motion.div>
            </section>

            {/* 5. Subscription Form - Dark */}
            <section className="bg-black text-white py-32 px-6 border-t border-white/10">
                <motion.div
                    className="max-w-4xl mx-auto text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">
                        Everything You Need to Know <br /> About Plants and More. No Spam, <br /> We Promise.
                    </h2>
                    <p className="text-gray-400 mb-12">
                        Subscribe now and get 15% off your first purchase.
                    </p>

                    <form className="max-w-md mx-auto flex flex-col gap-4">
                        <div className="flex flex-col text-left gap-1">
                            <label htmlFor="email" className="text-xs ml-1 text-gray-500">Enter your email here *</label>
                            <div className="flex gap-4">
                                <input
                                    type="email"
                                    id="email"
                                    className="flex-1 bg-transparent border border-white/30 p-3 text-white focus:outline-none focus:border-white transition-colors"
                                />
                                <button type="submit" className="bg-[#c16e41] text-white px-8 py-3 text-sm font-bold tracking-widest hover:bg-[#a0502a] transition duration-300">
                                    Subscribe
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </section>

        </div>
    );
};

export default Home;
