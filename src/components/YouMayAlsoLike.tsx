import { Link } from 'react-router-dom';

interface YouMayAlsoLikeProps {
    currentProductId?: string;
    bgColor?: string;
}

const YouMayAlsoLike = ({ bgColor = 'bg-black' }: YouMayAlsoLikeProps) => {
    // Note: currentProductId is unused in this fixed-layout design but kept for prop compatibility

    return (
        <section className={`py-20 px-6 ${bgColor}`}>
            <div className="max-w-[1440px] mx-auto">
                <h2 className="text-2xl font-serif text-white mb-8">You May Also Like</h2>

                <div className="grid grid-cols-1 md:grid-cols-4">
                    {/* --- Top Row --- */}

                    {/* 1. Plants Collection Text */}
                    <div className="md:col-span-2 bg-[#c16e41] min-h-[300px] md:min-h-[400px] p-12 flex flex-col justify-center items-start text-white relative">
                        <span className="text-sm font-medium tracking-wider mb-2 opacity-90">Plants Collection</span>
                        <h3 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">Starting from <br /> 14.99$</h3>
                        <Link
                            to="/shop?category=plants"
                            className="bg-black text-white px-8 py-3 text-sm font-medium hover:bg-white hover:text-black transition-colors duration-300"
                        >
                            Shop Now
                        </Link>
                    </div>

                    {/* 2. Plants Collection Image */}
                    <div className="md:col-span-2 min-h-[300px] md:min-h-[400px] relative overflow-hidden">
                        <img
                            src="/rhapis-1.png"
                            alt="Plants Collection"
                            className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700"
                        />
                        {/* Fallback overlay if image is transparent PNG to make it look like a full block */}
                        <div className="absolute inset-0 bg-[#E8E6E1] -z-10" />
                    </div>

                    {/* --- Bottom Row --- */}

                    {/* 3. Pots Collection Text */}
                    <div className="md:col-span-1 bg-[#121212] min-h-[250px] p-8 flex flex-col justify-center items-start text-white border-r border-white/5 border-t border-white/5 md:border-t-0">
                        <h3 className="text-2xl font-serif mb-2 leading-tight">Pots <br /> Collection</h3>
                        <p className="text-gray-400 text-sm mb-6">Starting from 11.99$</p>
                        <Link to="/shop?category=pots" className="bg-[#c16e41] text-white px-6 py-2 text-sm font-medium hover:bg-[#a05a32] transition-colors">
                            Shop Now
                        </Link>
                    </div>

                    {/* 4. Pots Collection Image */}
                    <div className="md:col-span-1 min-h-[250px] relative bg-[#1a1a1a] border-t border-white/5 md:border-t-0 overflow-hidden group">
                        <img
                            src="/concrete-pot-1.png"
                            alt="Pots Collection"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>

                    {/* 5. Subscription Boxes Text */}
                    <div className="md:col-span-1 bg-[#121212] min-h-[250px] p-8 flex flex-col justify-center items-start text-white border-r border-white/5 border-t border-white/5 md:border-t-0">
                        <h3 className="text-2xl font-serif mb-2 leading-tight">Subscription <br /> Boxes</h3>
                        <p className="text-gray-400 text-sm mb-6">Starting from 90$</p>
                        <Link to="/shop?category=subscriptions" className="bg-[#c16e41] text-white px-6 py-2 text-sm font-medium hover:bg-[#a05a32] transition-colors">
                            Shop Now
                        </Link>
                    </div>

                    {/* 6. Subscription Boxes Image */}
                    <div className="md:col-span-1 min-h-[250px] relative bg-[#1a1a1a] border-t border-white/5 md:border-t-0 overflow-hidden group">
                        <img
                            src="/cactus-subscription-1.png"
                            alt="Subscription Boxes"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>

                </div>
            </div>
        </section>
    );
};

export default YouMayAlsoLike;
