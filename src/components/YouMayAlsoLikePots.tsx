import { Link } from 'react-router-dom';

const YouMayAlsoLikePots = () => {
    return (
        <section className="py-20 px-6 bg-black">
            <div className="max-w-[1440px] mx-auto">
                <h2 className="text-2xl font-serif text-white mb-8">You May Also Like</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* --- Left Column: Plants --- */}
                    <div className="relative group overflow-hidden h-[400px]">
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <img
                                src="/rhapis-1.png"
                                alt="Plants Collection"
                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                            />
                            {/* Dark Overlay for Text Visibility */}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-500" />
                        </div>

                        {/* Content Overlay */}
                        <div className="absolute inset-0 p-8 flex flex-col justify-end items-start text-white">
                            <h3 className="text-3xl font-serif mb-2 leading-tight">Plants Collection</h3>
                            <p className="text-white/80 text-sm mb-6">Greenery to liven up your space. Starting from ₹1,200.</p>
                            <Link
                                to="/shop?category=plants"
                                className="bg-white text-black px-6 py-3 text-sm font-medium hover:bg-[#c16e41] hover:text-white transition-colors duration-300"
                            >
                                Shop Plants
                            </Link>
                        </div>
                    </div>

                    {/* --- Right Column: Seeds --- */}
                    <div className="relative group overflow-hidden h-[400px]">
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <img
                                src="/cactus-subscription-1.png"
                                alt="Seeds Collection"
                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                            />
                            {/* Dark Overlay for Text Visibility */}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-500" />
                        </div>

                        {/* Content Overlay */}
                        <div className="absolute inset-0 p-8 flex flex-col justify-end items-start text-white">
                            <h3 className="text-3xl font-serif mb-2 leading-tight">Seeds Collection</h3>
                            <p className="text-white/80 text-sm mb-6">Grow your own joy from scratch. Starting from ₹150.</p>
                            <Link
                                to="/shop?category=seeds"
                                className="bg-white text-black px-6 py-3 text-sm font-medium hover:bg-[#c16e41] hover:text-white transition-colors duration-300"
                            >
                                Shop Seeds
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default YouMayAlsoLikePots;
