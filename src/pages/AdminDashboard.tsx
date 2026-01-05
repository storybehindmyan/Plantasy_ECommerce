import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { Trash2, PlusCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
    const { user } = useAuth();
    const { products, deleteProduct, addProduct } = useProducts();
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [newProduct, setNewProduct] = useState({
        name: '',
        price: '',
        category: 'plants',
        image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=300&auto=format&fit=crop', // Default placeholder
        description: ''
    });

    if (!user || user.role !== 'admin') {
        // For development/demo purposes, we might want to bypass this or show a message.
        // But adhering to requirements, we redirect. 
        // NOTE: Ensure your login logic assigns 'admin' role correctly if you want to test this!
        return <Navigate to="/login" replace />;
    }

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this product?')) {
            deleteProduct(id);
        }
    };

    const handleAddProduct = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProduct.name || !newProduct.price) return;

        addProduct({
            name: newProduct.name,
            price: parseFloat(newProduct.price),
            category: newProduct.category as 'plants' | 'pots' | 'seeds',
            image: newProduct.image,
            description: newProduct.description || 'No description provided.',
            hoverImage: newProduct.image // Fallback
            ,
            coverImage: undefined,
            discountPrice: undefined
        });

        setIsAdding(false);
        setNewProduct({
            name: '',
            price: '',
            category: 'plants',
            image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=300&auto=format&fit=crop',
            description: ''
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 pt-32 min-h-screen bg-black text-white">
            <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-4xl font-serif text-white">Admin Dashboard</h1>
                    <p className="text-gray-400 mt-2">Manage your inventory and products.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-[#c16e41] text-white px-6 py-3 rounded-sm hover:bg-[#a05a32] transition-colors shadow-lg"
                >
                    {isAdding ? <X size={20} /> : <PlusCircle size={20} />}
                    {isAdding ? 'Cancel' : 'Add Product'}
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-[#1a1a1a] p-8 mb-12 rounded-lg border border-white/10 overflow-hidden"
                    >
                        <h3 className="font-serif text-2xl mb-6 text-white border-b border-white/5 pb-2">Add New Product</h3>
                        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Product Name</label>
                                    <input
                                        type="text"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-[#c16e41] focus:outline-none transition-colors"
                                        placeholder="e.g. Monstera Deliciosa"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Price ($)</label>
                                        <input
                                            type="number"
                                            value={newProduct.price}
                                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-[#c16e41] focus:outline-none transition-colors"
                                            placeholder="0.00"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Category</label>
                                        <select
                                            value={newProduct.category}
                                            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-[#c16e41] focus:outline-none transition-colors appearance-none"
                                        >
                                            <option value="plants">Plants</option>
                                            <option value="pots">Pots</option>
                                            <option value="seeds">Seeds</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                                    <textarea
                                        value={newProduct.description}
                                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-[#c16e41] focus:outline-none transition-colors h-32 resize-none"
                                        placeholder="Product description..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Image URL</label>
                                    <input
                                        type="text"
                                        value={newProduct.image}
                                        onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-sm focus:border-[#c16e41] focus:outline-none transition-colors"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="mt-2 border border-white/10 rounded-lg p-2 bg-black/30 h-[200px] flex items-center justify-center relative overflow-hidden group">
                                    {newProduct.image ? (
                                        <img src={newProduct.image} alt="Preview" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-white/20">Image Preview</span>
                                    )}
                                </div>
                                <button type="submit" className="w-full bg-[#c16e41] text-white py-3 font-medium rounded-sm hover:bg-[#a05a32] transition-colors mt-auto">
                                    Save Product
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-[#111] border border-white/5 rounded-lg overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider font-medium">
                        <tr>
                            <th className="p-6">Product</th>
                            <th className="p-6">Category</th>
                            <th className="p-6">Price</th>
                            <th className="p-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-6 flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/5 rounded-md overflow-hidden border border-white/10">
                                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <span className="font-medium text-white block text-lg">{product.name}</span>
                                        <span className="text-xs text-gray-500">{product.id}</span>
                                    </div>
                                </td>
                                <td className="p-6 text-sm text-gray-400 capitalize">
                                    <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs">{product.category}</span>
                                </td>
                                <td className="p-6 font-medium text-white text-lg">${product.price.toFixed(2)}</td>
                                <td className="p-6 text-right">
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="text-gray-500 hover:text-red-500 p-2 transition-colors duration-200"
                                        title="Delete Product"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {products.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        No products found. Start by adding one!
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
