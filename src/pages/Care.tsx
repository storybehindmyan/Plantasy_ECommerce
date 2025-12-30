import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sun, Droplets, Thermometer } from 'lucide-react';

const CareItem = ({ title, icon: Icon, children }: any) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-white/10 rounded-sm overflow-hidden bg-transparent">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition group"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/5 rounded-full text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                        <Icon size={24} />
                    </div>
                    <span className="font-serif text-xl text-white">{title}</span>
                </div>
                {isOpen ? <ChevronUp className="text-white/50" /> : <ChevronDown className="text-white/50" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-white/10 mt-2 font-light">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const BLOG_POSTS: Record<string, { title: string; content: React.ReactNode; image: string; date: string }> = {
    "monstera-propagation": {
        title: "How to Propagate Your Monstera",
        date: "Oct 12, 2024",
        image: "/gram-2.jpg",
        content: (
            <>
                <p className="mb-6">
                    Monstera deliciosa is one of the most popular houseplants, and for good reason. Its iconic split leaves adds a tropical feel to any room.
                    Fortunately, it's also one of the easiest plants to propagate.
                </p>
                <h3 className="text-2xl font-serif text-white mb-4">Step 1: Find a Node</h3>
                <p className="mb-6">
                    Look for a node on the stem—this is a bump where leaves, aerial roots, and new stems grow. You'll need to cut just below this node.
                </p>
                <h3 className="text-2xl font-serif text-white mb-4">Step 2: Take the Cut</h3>
                <p className="mb-6">
                    Using clean, sharp shears, make a clean cut below the node. Ensure your cutting has at least one healthy leaf.
                </p>
                <h3 className="text-2xl font-serif text-white mb-4">Step 3: Rooting</h3>
                <p>
                    Place your cutting in a jar of water, ensuring the node is submerged but the leaf is not. Change the water every few days.
                    In a few weeks, you'll see roots! Once they are 2-3 inches long, you can pot it in soil.
                </p>
            </>
        )
    },
    "low-light-plants": {
        title: "5 Plants for Low Light",
        date: "Sep 28, 2024",
        image: "/gram-2.jpg",
        content: (
            <>
                <p className="mb-6">Not every home is blessed with floor-to-ceiling south-facing windows. But don't worry, you can still have a jungle!</p>
                <ul className="list-disc pl-5 space-y-2 mb-6">
                    <li><strong>Snake Plant:</strong> Indestructible and architectural.</li>
                    <li><strong>ZZ Plant:</strong> Thrives on neglect and low light.</li>
                    <li><strong>Pothos:</strong> The classic trailing vine that grows anywhere.</li>
                    <li><strong>Cast Iron Plant:</strong> True to its name, it's tough as nails.</li>
                    <li><strong>Peace Lily:</strong> Dramatic bloomer that tells you when it needs water.</li>
                </ul>
            </>
        )
    },
    "watering-art": {
        title: "The Art of Watering",
        date: "Sep 15, 2024",
        image: "/gram-4.jpg",
        content: (
            <>
                <p className="mb-6">Watering seems simple, but it's where most new plant parents struggle. It's not just about a schedule; it's about observing.</p>
                <p className="mb-6"><strong>The Finger Test:</strong> Stick your finger 1-2 inches into the soil. If it's dry, water. If it's damp, wait.</p>
                <p><strong>Bottom Watering:</strong> Place your nursery pot in a bowl of water for 30 minutes. The soil will absorb what it needs from the drainage holes. This encourages deep root growth.</p>
            </>
        )
    },
    "styling-greenery": {
        title: "Styling Your Greenery",
        date: "Sep 02, 2024",
        image: "/gram-7.jpg",
        content: (
            <>
                <p className="mb-6">Plants are the best decor. Here are a few tips to style them:</p>
                <p className="mb-6"><strong>Group in Odd Numbers:</strong> Groups of 3 look more organic and pleasing to the eye.</p>
                <p className="mb-6"><strong>Vary Heights:</strong> Use plant stands or stacks of books to create different levels.</p>
                <p><strong>Mix Textures:</strong> Combine broad leaves (Rubber Tree) with feathery ones (Ferns) and trailing vines.</p>
            </>
        )
    }
};

const Care = () => {
    const [searchParams] = useSearchParams();
    const blogId = searchParams.get('blogId');
    const blogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (blogId && blogRef.current) {
            setTimeout(() => {
                blogRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [blogId]);

    const activeBlog = blogId ? BLOG_POSTS[blogId] : null;

    return (
        <div className="min-h-screen bg-black pt-40 pb-20">
            <div className="max-w-3xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h1 className="text-5xl md:text-7xl font-serif font-medium text-white mb-6">Your Guide to Plant Care</h1>
                </div>

                <div className="space-y-6 mb-24">
                    <CareItem title="Light Requirements" icon={Sun}>
                        <p>
                            Understanding light is crucial. Most indoor plants prefer "bright, indirect light," which means they cast a shadow but aren't in the direct beam of the sun.
                            South-facing windows offer the most intese light, while north-facing ones are gentler. If your plant is reaching towards the light, move it closer to a window.
                        </p>
                    </CareItem>

                    <CareItem title="Watering Basics" icon={Droplets}>
                        <p>
                            Overwatering is the #1 killer of houseplants! Always check the soil before adding water. Stick your finger about an inch deep into the soil; if it feels dry, it's time to water.
                            Ensuring your pot has drainage holes is non-negotiable to prevent root rot.
                        </p>
                    </CareItem>

                    <CareItem title="Temperature & Humidity" icon={Thermometer}>
                        <p>
                            Most tropical plants thrive in temperatures between 65°F and 80°F (18°C - 26°C). Avoid placing them near cold drafts (like AC vents) or heat sources (radiators).
                            Many plants also love humidity! Mist them occasionally or place them on a pebble tray with water.
                        </p>
                    </CareItem>
                </div>

                {/* Blog Rendering Section */}
                <AnimatePresence>
                    {activeBlog && (
                        <motion.div
                            ref={blogRef}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            transition={{ duration: 0.8 }}
                            className="border-t border-white/20 pt-20 mb-24"
                        >
                            <span className="text-accent text-sm font-bold tracking-widest uppercase mb-4 block">{activeBlog.date}</span>
                            <h2 className="text-4xl md:text-5xl font-serif text-white mb-8">{activeBlog.title}</h2>
                            <div className="w-full aspect-video overflow-hidden rounded-sm mb-10 bg-gray-800">
                                <img src={activeBlog.image} alt={activeBlog.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="prose prose-invert prose-lg max-w-none text-gray-300 font-light">
                                {activeBlog.content}
                            </div>
                            <div className="mt-12 pt-8 border-t border-white/10 text-center">
                                <button
                                    onClick={() => {
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="text-white hover:text-accent transition-colors text-sm tracking-widest uppercase"
                                >
                                    Back to Top
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* All Articles Section */}
                <div className="border-t border-white/20 pt-20">
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-12 text-center">Plant Care Articles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {Object.entries(BLOG_POSTS).map(([id, post]) => (
                            <Link to={`/care?blogId=${id}`} key={id} className="group cursor-pointer">
                                <div className="aspect-[4/3] overflow-hidden bg-gray-800 mb-6">
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-accent text-xs font-bold tracking-widest uppercase mb-2">{post.date}</span>
                                    <h3 className="text-2xl font-serif text-white mb-3 group-hover:text-accent transition-colors">{post.title}</h3>
                                    <span className="text-white/60 text-sm tracking-widest uppercase group-hover:text-white transition-colors">Read Article</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Care;
