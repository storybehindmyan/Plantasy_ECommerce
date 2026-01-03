import { Link } from 'react-router-dom';

interface YouMayAlsoLikeProps {
    currentProductId?: string;
    bgColor?: string;
    hideFirstImage?: boolean;
    compact?: boolean;
}

const YouMayAlsoLike = ({
    bgColor = 'bg-black',
    hideFirstImage = false,
    compact = false,
}: YouMayAlsoLikeProps) => {
    // Reduced vertical spacing
    const paddingY = compact ? 'py-6' : 'py-10';

    // Reduced card heights
    const minHeightLarge = compact
        ? 'min-h-[180px] md:min-h-[220px]'
        : 'min-h-[220px] md:min-h-[280px]';

    const minHeightSmall = compact
        ? 'min-h-[140px]'
        : 'min-h-[180px]';

    return (
        <section className={`${paddingY} px-6 ${bgColor}`}>
            <div className="max-w-[1440px] mx-auto">

                <h2 className="text-2xl font-serif text-white mb-6">
                    You May Also Like
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4">

                    {/* 1. Plants Collection Text */}
                    <div
                        className={`${hideFirstImage ? 'md:col-span-4' : 'md:col-span-3'}
              bg-[#c16e41] ${minHeightLarge}
              p-8 flex flex-col justify-center items-start text-white`}
                    >
                        <span className="text-sm font-medium tracking-wider mb-2 opacity-90">
                            Plants Collection
                        </span>

                        <h3 className="text-3xl md:text-4xl font-serif mb-4 leading-tight">
                            Starting from <br /> ₹1,200
                        </h3>

                        <Link
                            to="/shop?category=plants"
                            className="bg-black text-white px-6 py-2 text-sm font-medium
                         hover:bg-white hover:text-black transition-colors"
                        >
                            Shop Now
                        </Link>
                    </div>

                    {/* 2. Plants Collection Image */}
                    {!hideFirstImage && (
                        <div className={`md:col-span-1 ${minHeightLarge} relative overflow-hidden`}>
                            <img
                                src="/rhapis-1.png"
                                alt="Plants Collection"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-[#E8E6E1] -z-10" />
                        </div>
                    )}

                    {/* 3. Pots Collection Text */}
                    <div
                        className={`md:col-span-1 bg-[#121212] ${minHeightSmall}
              p-6 flex flex-col justify-center items-start text-white
              border-r border-white/5 border-t border-white/5 md:border-t-0`}
                    >
                        <h3 className="text-xl font-serif mb-2">
                            Pots <br /> Collection
                        </h3>

                        <p className="text-gray-400 text-sm mb-4">
                            Starting from ₹999
                        </p>

                        <Link
                            to="/shop?category=pots"
                            className="bg-[#c16e41] text-white px-5 py-2 text-sm font-medium
                         hover:bg-[#a05a32] transition-colors"
                        >
                            Shop Now
                        </Link>
                    </div>

                    {/* 4. Pots Collection Image */}
                    <div
                        className={`md:col-span-1 ${minHeightSmall}
              relative bg-[#1a1a1a] border-t border-white/5 md:border-t-0
              overflow-hidden group`}
                    >
                        <img
                            src="/concrete-pot-1.png"
                            alt="Pots Collection"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>

                    {/* 5. Subscription Boxes Text */}
                    <div
                        className={`md:col-span-1 bg-[#121212] ${minHeightSmall}
              p-6 flex flex-col justify-center items-start text-white
              border-r border-white/5 border-t border-white/5 md:border-t-0`}
                    >
                        <h3 className="text-xl font-serif mb-2">
                            Seeds <br /> Collection
                        </h3>

                        <p className="text-gray-400 text-sm mb-4">
                            Starting from ₹5,000
                        </p>

                        <Link
                            to="/shop?category=seeds"
                            className="bg-[#c16e41] text-white px-5 py-2 text-sm font-medium
                         hover:bg-[#a05a32] transition-colors"
                        >
                            Shop Now
                        </Link>
                    </div>

                    {/* 6. Subscription Boxes Image */}
                    <div
                        className={`md:col-span-1 ${minHeightSmall}
              relative bg-[#1a1a1a] border-t border-white/5 md:border-t-0
              overflow-hidden group`}
                    >
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
