import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { X, Trash2, Plus, Minus } from 'lucide-react';

const CartDrawer = () => {
    const { cart, isCartOpen, toggleCart, removeFromCart, updateQuantity, cartTotal } = useCart();

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleCart}
                        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-sm bg-black/80 backdrop-blur-md shadow-2xl z-50 flex flex-col text-white"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="font-serif text-xl">Your Cart</h2>
                            <button onClick={toggleCart} className="p-2 hover:bg-gray-100 rounded-full transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                                    <p className="text-gray-500">Your cart is empty.</p>
                                    <button onClick={toggleCart} className="text-accent hover:underline">Continue Shopping</button>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex gap-4">
                                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded bg-gray-50" />
                                        <div className="flex-1">
                                            <h3 className="font-medium text-primary line-clamp-1">{item.name}</h3>
                                            <p className="text-gray-500 text-sm mb-2">${item.price.toFixed(2)}</p>

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center border border-gray-200 rounded">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="p-1 hover:bg-gray-100 disabled:opacity-50"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-1 hover:bg-gray-100"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-gray-400 hover:text-red-500 transition ml-auto"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="p-6 border-t border-gray-100 bg-gray-50">
                                <div className="flex justify-between items-center mb-4 text-lg font-medium">
                                    <span>Subtotal</span>
                                    <span>${cartTotal.toFixed(2)}</span>
                                </div>
                                <button className="w-full bg-primary text-white py-3 font-semibold tracking-wide hover:bg-accent transition duration-300">
                                    CHECKOUT
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
