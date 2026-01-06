import { motion } from 'framer-motion';

const ShippingReturns = () => {
    return (
        <div className="min-h-screen bg-black text-white pt-40 pb-20">
            <div className="max-w-4xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl md:text-7xl font-serif font-medium mb-6">
                        Shipping & Returns
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
                        We want you to love your plants. Here's everything you need to know about our delivery process and return policies.
                    </p>
                </motion.div>

                <div className="space-y-16">
                    <section className="space-y-6">
                        <h2 className="text-3xl font-serif text-accent">Shipping Policy</h2>

                        <div className="space-y-8 text-gray-300 font-light leading-relaxed">
                            <div>
                                <h3 className="text-white text-xl font-medium mb-2">Processing Time</h3>
                                <p>
                                    All orders are processed within 1-3 business days. Orders are not shipped or delivered on weekends or holidays. If we are experiencing a high volume of orders, shipments may be delayed by a few days.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-white text-xl font-medium mb-2">Shipping Rates & Delivery Estimates</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/10 text-white/50 text-sm uppercase tracking-wider">
                                                <th className="py-4 pr-8">Shipping Method</th>
                                                <th className="py-4 pr-8">Estimated Delivery Time</th>
                                                <th className="py-4">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            <tr className="border-b border-white/5">
                                                <td className="py-4 pr-8">Standard Shipping</td>
                                                <td className="py-4 pr-8">5-7 business days</td>
                                                <td className="py-4">₹99</td>
                                            </tr>
                                            <tr className="border-b border-white/5">
                                                <td className="py-4 pr-8">Express Shipping</td>
                                                <td className="py-4 pr-8">2-3 business days</td>
                                                <td className="py-4">₹199</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 pr-8">Same Day Delivery (Metro Only)</td>
                                                <td className="py-4 pr-8">Today (Order by 2 PM)</td>
                                                <td className="py-4">₹299</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="w-full h-px bg-white/10" />

                    <section className="space-y-6">
                        <h2 className="text-3xl font-serif text-accent">Return Policy</h2>

                        <div className="space-y-8 text-gray-300 font-light leading-relaxed">
                            <div>
                                <h3 className="text-white text-xl font-medium mb-2">Plant Health Guarantee</h3>
                                <p>
                                    Plants are living things, and sometimes they don't handle travel well. If your plant arrives damaged or dead, please contact us within 48 hours of delivery with photos, and we will offer a replacement or refund.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-white text-xl font-medium mb-2">Return Conditions</h3>
                                <ul className="list-disc list-inside space-y-2 ml-2">
                                    <li>Items must be returned within 14 days of delivery.</li>
                                    <li>Non-plant items (pods, accessories) must be unused and in original packaging.</li>
                                    <li>Proof of purchase is required for all returns.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-white text-xl font-medium mb-2">How to Initiate a Return</h3>
                                <p>
                                    To start a return, you can contact us at <a href="mailto:support@plantasy.com" className="text-accent underline">support@plantasy.com</a>. If your return is accepted, we’ll send you a return shipping label, as well as instructions on how and where to send your package.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ShippingReturns;
