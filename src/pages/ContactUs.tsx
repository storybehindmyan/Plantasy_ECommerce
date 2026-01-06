import { motion } from 'framer-motion';
import { Mail, MapPin, Phone } from 'lucide-react';

const ContactUs = () => {
    return (
        <div className="min-h-screen bg-black text-white pt-40 pb-20">
            <div className="max-w-6xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl md:text-7xl font-serif font-medium mb-6">
                        Get in Touch
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
                        Have a question about a plant? Need help with an order? We're here to help you grow.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    {/* Contact Info */}
                    <div className="space-y-12">
                        <div>
                            <h2 className="text-3xl font-serif text-accent mb-8">Contact Information</h2>
                            <div className="space-y-8 text-gray-300 font-light">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-white/5 rounded-full text-accent">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium mb-1">Visit Us</h3>
                                        <p>123 Green Street, Plant District</p>
                                        <p>Mumbai, Maharashtra 400001</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-white/5 rounded-full text-accent">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium mb-1">Email Us</h3>
                                        <p>support@plantasy.com</p>
                                        <p>wholesale@plantasy.com</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-white/5 rounded-full text-accent">
                                        <Phone size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium mb-1">Call Us</h3>
                                        <p>+91 98765 43210</p>
                                        <p>Mon - Fri, 9am - 6pm</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-white/5 rounded-sm border border-white/10">
                            <h3 className="text-xl font-serif text-white mb-4">FAQ</h3>
                            <p className="text-gray-400 font-light mb-4">
                                Find instant answers to common questions about shipping, tracking, and plant care in our FAQ section.
                            </p>
                            <a href="/care" className="text-accent hover:underline text-sm uppercase tracking-widest">
                                Visit Help Center
                            </a>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white/5 p-8 md:p-10 rounded-sm border border-white/10">
                        <h2 className="text-3xl font-serif text-white mb-8">Send a Message</h2>
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">First Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-accent focus:outline-none transition-colors"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-accent focus:outline-none transition-colors"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-accent focus:outline-none transition-colors"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Subject</label>
                                <select className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-accent focus:outline-none transition-colors">
                                    <option>Order Inquiry</option>
                                    <option>Plant Care Question</option>
                                    <option>Business Partnership</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Message</label>
                                <textarea
                                    rows={5}
                                    className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-accent focus:outline-none transition-colors resize-none"
                                    placeholder="How can we help you?"
                                />
                            </div>

                            <button
                                type="button" // Prevent submit for now since it's UI only
                                className="w-full bg-accent hover:bg-accent/90 text-white font-medium py-4 rounded-sm transition-colors uppercase tracking-widest text-sm"
                            >
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;
