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
    const yStoryBg = useTransform(storyProgress, [0, 1], ["-40%", "40%"]);

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
                    transition={{ duration: 2.5 }} // Slowed down significantly
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
                    <motion.div
                        className="flex justify-between items-end mb-12"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-6xl font-serif">
                            New Arrivals
                        </h2>
                        <Link to="/shop" className="hidden md:inline-block bg-[#c16e41] text-white px-8 py-3 text-sm font-bold tracking-widest hover:bg-[#a0502a] transition duration-300">
                            Shop All
                        </Link>
                    </motion.div>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        {PRODUCTS.filter(p => p.badge === 'New Arrival').slice(0, 4).map((item) => (
                            <div
                                key={item.id}
                                className="group cursor-pointer"
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
                            </div>
                        ))}
                    </motion.div>

                    <div className="mt-12 text-center md:hidden">
                        <Link to="/shop" className="inline-block bg-[#c16e41] text-white px-8 py-3 text-sm font-bold tracking-widest hover:bg-[#a0502a] transition duration-300">
                            Shop All
                        </Link>
                    </div>
                </div>
            </section>

            {/* 1.5. New Arrivals Section - (Correction: Ended above) */}

            {/* 1.8 Discover Sprout Section */}
            <motion.section
                className="relative h-screen bg-black overflow-hidden"
                initial="initial"
                whileHover="hover"
                animate="initial"
            >
                {/* Background Grid */}
                <div className="w-full h-full grid grid-cols-1 md:grid-cols-3">
                    {/* Item 1 */}
                    <Link to="/shop" className="relative h-full border-r border-white/10 group overflow-hidden">
                        <img src="/gram-3.jpg" alt="Shop" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white text-xl tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">Shop</span>
                        </div>
                    </Link>

                    {/* Item 2 */}
                    <Link to="/our-story" className="relative h-full border-r border-white/10 group overflow-hidden">
                        <img src="/story-bg.png" alt="Our Story" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white text-xl tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">Our Story</span>
                        </div>
                    </Link>

                    {/* Item 3 */}
                    <Link to="/shop?category=care" className="relative h-full group overflow-hidden">
                        <img src="/gram-6.jpg" alt="Care" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white text-xl tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">Care</span>
                        </div>
                    </Link>
                </div>

                {/* Flying Text */}
                <motion.div
                    className="absolute z-10 pointer-events-none"
                    variants={{
                        initial: { top: "50%", left: "50%", x: "-50%", y: "-50%", scale: 1 },
                        hover: { top: "10%", left: "50%", x: "-50%", y: "-50%", scale: 0.5 } // Stays in middle, just shrinks
                    }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h2 className="text-6xl md:text-8xl lg:text-9xl font-serif text-white whitespace-nowrap">
                        Discover Sprout
                    </h2>
                </motion.div>
            </motion.section>

            {/* 4. Our Story / From Seed to Sprout Section (Moved here) */}
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
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
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

            {/* 3. Blog Section - From Garden to Vase */}
            <section className="bg-[#f4f1ed] py-24 px-6 text-[#2C2C2C]">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="flex justify-between items-end mb-12">
                        <motion.h2
                            className="text-4xl md:text-6xl font-serif"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            From Garden to Vase
                        </motion.h2>
                        <Link to="/care" className="hidden md:inline-block border-b border-[#2C2C2C] pb-1 text-sm font-bold tracking-widest hover:text-[#c16e41] hover:border-[#c16e41] transition duration-300">
                            READ THE BLOG
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Featured Post */}
                        <motion.div
                            className="group cursor-pointer"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="relative overflow-hidden aspect-[4/3] mb-6">
                                <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 text-xs font-bold tracking-widest uppercase z-10">Featured</span>
                                <img
                                    src="/gram-2.jpg"
                                    alt="Featured Blog Post"
                                    className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                                />
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold tracking-widest text-gray-500 mb-3 uppercase">
                                <span>Oct 12, 2024</span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span>Plant Care</span>
                            </div>
                            <h3 className="text-3xl font-serif mb-3 group-hover:text-[#c16e41] transition-colors">How to Propagate Your Monstera</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                Propagation is a great way to grow your plant collection without spending a dime. Here is everything you need to know about propagating successfully.
                            </p>
                            <Link to="/care?blogId=monstera-propagation" className="inline-block">
                                <span className="text-xs font-bold tracking-widest uppercase border-b border-gray-300 pb-1 group-hover:border-[#c16e41] transition-colors">Read More</span>
                            </Link>
                        </motion.div>

                        {/* Recent Posts List */}
                        <div className="flex flex-col gap-10 justify-center">
                            {[
                                { id: "low-light-plants", title: "5 Plants for Low Light", date: "Sep 28, 2024", img: "/gram-2.jpg", category: "Guides" },
                                { id: "watering-art", title: "The Art of Watering", date: "Sep 15, 2024", img: "/gram-4.jpg", category: "Tips" },
                                { id: "styling-greenery", title: "Styling Your Greenery", date: "Sep 02, 2024", img: "/gram-7.jpg", category: "Inspiration" }
                            ].map((post, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 + (i * 0.1), duration: 0.8 }}
                                >
                                    <Link to={`/care?blogId=${post.id}`} className="flex gap-6 group cursor-pointer">
                                        <div className="w-1/3 aspect-square overflow-hidden shrink-0">
                                            <img src={post.img} alt={post.title} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest text-gray-500 mb-2 uppercase">
                                                <span>{post.date}</span>
                                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                                <span>{post.category}</span>
                                            </div>
                                            <h4 className="text-xl font-serif mb-2 group-hover:text-[#c16e41] transition-colors leading-tight">{post.title}</h4>
                                            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 group-hover:text-[#c16e41] transition-colors">Read Article</span>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12 text-center md:hidden">
                        <Link to="/blog" className="inline-block border-b border-[#2C2C2C] pb-1 text-sm font-bold tracking-widest transition duration-300">
                            READ THE BLOG
                        </Link>
                    </div>
                </div>
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



            {/* 5. Subscription Form - Dark */}
            {/* 5. Subscription Form - Dark */}
            <section className="relative bg-black text-white py-32 px-6 border-t border-white/10 overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/footer.png"
                        alt="Footer Background"
                        className="w-full h-full object-cover opacity-100" // Opacity set to 100 as per image provided, but usually needs a darkening overlay for text readability
                    />
                    <div className="absolute inset-0 bg-black/60" /> {/* Dark overlay for text readability */}
                </div>

                <motion.div
                    className="relative z-10 max-w-4xl mx-auto text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">
                        Everything You Need to Know <br /> About Plants and More. No Spam, <br /> We Promise.
                    </h2>
                    <p className="text-gray-300 mb-12">
                        Subscribe now and get 15% off your first purchase.
                    </p>

                    <form className="max-w-md mx-auto flex flex-col gap-4">
                        <div className="flex flex-col text-left gap-1">
                            <label htmlFor="email" className="text-xs ml-1 text-gray-400">Enter your email here *</label>
                            <div className="flex gap-4">
                                <input
                                    type="email"
                                    id="email"
                                    className="flex-1 bg-transparent border border-white/50 p-3 text-white focus:outline-none focus:border-white transition-colors placeholder:text-gray-500"
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
