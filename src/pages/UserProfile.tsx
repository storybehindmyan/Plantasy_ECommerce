import React from 'react';
import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import { MoreHorizontal, Edit3, Camera, AlignLeft, Video, Smile, Lock, ChevronDown, Package, Wallet, Heart, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// --- Shared Components ---

// Plantasy Logo for empty states
const PlantasyLogo = () => (
    <div className="flex flex-col items-center mt-12 opacity-80">
        <div className="w-12 h-16 border-2 border-white/80 rounded-full flex items-center justify-center mb-1 drop-shadow-md bg-transparent">
            <span className="font-serif text-2xl italic text-white pt-1">P</span>
        </div>
        <span className="text-xl font-serif font-semibold tracking-tight text-white drop-shadow-md mt-1">Plantasy</span>
    </div>
);

// --- Header & Nav ---

const ProfileHeader = () => {
    const { user, updateUser } = useAuth();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && user) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                updateUser({ photoURL: base64String });
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    if (!user) return null;

    return (
        <div className="bg-[#c16e41] h-48 relative flex items-center px-10">
            {/* Top Corners */}
            <div className="absolute top-4 left-4 text-white">
                <Camera
                    className="w-5 h-5 opacity-80 cursor-pointer hover:opacity-100"
                    onClick={triggerFileInput}
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>
            <div className="absolute top-4 right-4 text-white">
                <MoreHorizontal className="w-6 h-6 cursor-pointer" />
            </div>

            {/* Main Profile Info */}
            <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-black/20 overflow-hidden border-2 border-white/30 backdrop-blur-sm flex items-center justify-center relative group">
                    {/* Avatar Image */}
                    <img
                        src={user.photoURL || "https://tse1.mm.bing.net/th/id/OIP.nloKH2rnGKa0cl6U5alOygAAAA?pid=ImgDet&w=185&h=277&c=7&dpr=1.3&o=7&rm=3"}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                    {/* Overlay for upload hint */}
                    <div
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={triggerFileInput}
                    >
                        <Camera className="text-white w-6 h-6" />
                    </div>
                </div>
                <div className="text-white">
                    <h1 className="text-3xl font-serif mb-1">{user.name}</h1>
                    <div className="flex gap-4 text-sm font-light opacity-90">
                        <span>0 Followers</span>
                        <span>0 Following</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NavTab = ({ to, label }: { to: string, label: string }) => (
    <NavLink
        to={to}
        end={to === ''}
        className={({ isActive }) =>
            `px-6 py-4 text-sm font-medium transition-colors relative whitespace-nowrap ${isActive ? 'text-white' : 'text-gray-400 hover:text-[#c16e41]'}`
        }
    >
        {({ isActive }) => (
            <>
                {label}
                {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#c16e41]" />}
            </>
        )}
    </NavLink>
);

// --- Sections ---

const ProfileInfo = () => {
    const { user, updateUser } = useAuth();
    const [bio, setBio] = React.useState(user?.bio || "");

    React.useEffect(() => {
        if (user?.bio) setBio(user.bio);
    }, [user?.bio]);

    const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newBio = e.target.value;
        setBio(newBio);
    };

    const saveBio = () => {
        updateUser({ bio });
        alert("Bio updated!");
    };

    return (
        <div className="max-w-3xl">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-serif text-white">Profile</h2>
                <button className="flex items-center gap-2 text-[#c16e41] text-sm hover:text-[#a05a32] transition-colors">
                    <Edit3 size={14} /> Edit Profile
                </button>
            </div>

            <p className="text-white/60 text-sm mb-12">Join date: Dec 28, 2025</p>

            <div className="mb-8">
                <h3 className="text-white text-lg font-serif mb-6">About</h3>
                <div className="w-full bg-transparent border border-white/10 rounded-sm focus-within:border-white/30 transition-colors">
                    <textarea
                        value={bio}
                        onChange={handleBioChange}
                        onBlur={saveBio} // Auto-save on blur for bio
                        placeholder="Add a short bio or personal note..."
                        className="w-full bg-transparent p-4 text-white text-sm focus:outline-none min-h-[120px] resize-none placeholder:text-white/30"
                    />
                    <div className="flex gap-4 p-4 text-white/50 border-t border-white/5">
                        <Camera size={18} className="cursor-pointer hover:text-white transition-colors" />
                        <AlignLeft size={18} className="cursor-pointer hover:text-white transition-colors" />
                        <Video size={18} className="cursor-pointer hover:text-white transition-colors" />
                        <span className="text-xs font-bold self-center cursor-pointer hover:text-white transition-colors tracking-widest">GIF</span>
                        <Smile size={18} className="cursor-pointer hover:text-white transition-colors" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const MyOrders = () => (
    <div>
        <h2 className="text-2xl font-serif text-white mb-6">My Orders</h2>
        <div className="border border-white/10 p-8 text-center rounded-sm">
            <Package size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">You haven't placed any orders yet.</p>
            <button className="mt-4 text-[#c16e41] hover:underline">Start Shopping</button>
        </div>
    </div>
);

const WalletPage = () => (
    <div>
        <h2 className="text-2xl font-serif text-white mb-6 flex items-center gap-2">
            <Wallet className="text-[#c16e41]" /> My Wallet
        </h2>
        <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] p-8 rounded-lg border border-white/5">
            <p className="text-gray-400 text-sm mb-1">Total Balance</p>
            <h3 className="text-4xl text-white font-medium mb-6">₹0.00</h3>
            <div className="flex gap-4">
                <button className="bg-[#c16e41] text-white px-6 py-2 rounded-sm text-sm font-medium">Add Money</button>
                <button className="border border-white/20 text-white px-6 py-2 rounded-sm text-sm font-medium">History</button>
            </div>
        </div>
    </div>
);


const Addresses = () => {
    const [isAddingMode, setIsAddingMode] = React.useState(false);
    const [addresses, setAddresses] = React.useState<any[]>([]);

    // Form State
    const [form, setForm] = React.useState({
        label: 'Home',
        address: '',
        city: '',
        zip: ''
    });

    const handleSave = () => {
        setAddresses([...addresses, form]);
        setIsAddingMode(false);
        setForm({ label: 'Home', address: '', city: '', zip: '' }); // Reset
    };

    return (
        <div className="min-h-[400px] flex flex-col">
            <h2 className="text-2xl font-serif text-white mb-2">My Addresses</h2>
            <p className="text-gray-400 text-sm mb-12">Add and manage the addresses you use often.</p>

            {isAddingMode ? (
                <div className="max-w-md bg-white/5 p-8 rounded-lg border border-white/10">
                    <h3 className="text-white text-lg font-serif mb-6">New Address</h3>
                    <div className="space-y-4">
                        <input
                            placeholder="Label (e.g. Home)"
                            className="w-full bg-transparent border border-white/20 p-3 text-white rounded-sm"
                            value={form.label}
                            onChange={(e) => setForm({ ...form, label: e.target.value })}
                        />
                        <input
                            placeholder="Address Line"
                            className="w-full bg-transparent border border-white/20 p-3 text-white rounded-sm"
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                        />
                        <div className="flex gap-4">
                            <input
                                placeholder="City"
                                className="w-full bg-transparent border border-white/20 p-3 text-white rounded-sm"
                                value={form.city}
                                onChange={(e) => setForm({ ...form, city: e.target.value })}
                            />
                            <input
                                placeholder="Zip Code"
                                className="w-full bg-transparent border border-white/20 p-3 text-white rounded-sm"
                                value={form.zip}
                                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button onClick={handleSave} className="bg-[#c16e41] text-white px-6 py-2 rounded-sm text-sm hover:bg-[#a05a32]">Save Address</button>
                            <button onClick={() => setIsAddingMode(false)} className="text-white/60 px-6 py-2 text-sm hover:text-white">Cancel</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center mb-12">
                    {addresses.length === 0 ? (
                        <>
                            <p className="text-white text-lg font-light mb-8">You haven't saved any addresses yet.</p>
                            <button
                                onClick={() => setIsAddingMode(true)}
                                className="bg-[#c16e41] text-white px-8 py-3 rounded-sm text-sm font-medium hover:bg-[#a05a32] transition-colors"
                            >
                                Add New Address
                            </button>
                            <PlantasyLogo />
                        </>
                    ) : (
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                            {addresses.map((addr, idx) => (
                                <div key={idx} className="p-6 border border-white/10 rounded-sm bg-white/5 relative group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-[#c16e41]/20 text-[#c16e41] px-2 py-0.5 text-xs rounded uppercase tracking-wider">{addr.label}</span>
                                        <MoreHorizontal className="text-white/40 cursor-pointer hover:text-white" size={16} />
                                    </div>
                                    <p className="text-white font-medium">{addr.address}</p>
                                    <p className="text-white/60 text-sm">{addr.city}, {addr.zip}</p>
                                </div>
                            ))}
                            <button
                                onClick={() => setIsAddingMode(true)}
                                className="border border-dashed border-white/20 rounded-sm flex flex-col items-center justify-center min-h-[140px] text-white/40 hover:text-white hover:border-white/40 transition-all"
                            >
                                <Plus size={24} className="mb-2" />
                                <span>Add Another Address</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Subscriptions = () => (
    <div className="min-h-[400px] flex flex-col">
        <h2 className="text-2xl font-serif text-white mb-2">Subscriptions</h2>
        <p className="text-gray-400 text-sm mb-12">View and manage the subscriptions you've purchased.</p>

        <div className="flex-1 flex flex-col items-center justify-center mb-12">
            <p className="text-white text-lg font-medium mb-2">No purchased subscriptions</p>
            <p className="text-gray-400 text-sm mb-8">When you purchase a subscription, it'll appear here.</p>
            <PlantasyLogo />
        </div>
    </div>
);

const MyAccount = () => {
    const { user, updateUser } = useAuth();
    // In a real app, we would fetch this from an API endpoint for `user.uid`
    // For now, we seed it with the AuthContext user data

    const [info, setInfo] = React.useState({
        displayName: user?.name || '',
        title: user?.title || '',
        firstName: user?.name?.split(' ')[0] || '',
        lastName: user?.name?.split(' ').slice(1).join(' ') || '',
        phone: user?.phone || ''
    });

    React.useEffect(() => {
        if (user) {
            setInfo(prev => ({
                ...prev,
                displayName: user.name,
                title: user.title || '',
                firstName: user.name.split(' ')[0],
                lastName: user.name.split(' ').slice(1).join(' ') || '',
                phone: user.phone || ''
            }));
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleUpdate = () => {
        const fullName = `${info.firstName} ${info.lastName}`.trim();
        updateUser({
            name: fullName || info.displayName, // Fallback to display name if constructed name is empty, or prefer constructed name
            title: info.title,
            phone: info.phone
        });
        alert("Profile updated successfully!"); // Simple feedback
    };

    return (
        <div className="max-w-4xl">
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h2 className="text-3xl font-serif text-white mb-2">Account</h2>
                    <p className="text-gray-400 text-sm">View and edit your personal info below.</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-2 text-white border border-white/20 hover:border-white/40 transition-colors text-sm">Discard</button>
                    <button onClick={handleUpdate} className="px-6 py-2 bg-[#c16e41] text-white hover:bg-[#a05a32] transition-colors text-sm">Update Info</button>
                </div>
            </div>

            {/* Display Info */}
            <div className="space-y-8 mb-16">
                <h3 className="text-lg text-white font-medium border-b border-white/10 pb-4">Display Info</h3>
                <p className="text-gray-400 text-sm -mt-6 mb-6">This information will be visible to all members of this site.</p>

                <div className="flex gap-12">
                    <div className="flex-1 space-y-6">
                        <div>
                            <label className="block text-white text-sm mb-2">Display name *</label>
                            <input
                                type="text"
                                name="displayName"
                                value={info.displayName}
                                onChange={handleChange}
                                className="w-full bg-transparent border border-white/20 p-3 text-white focus:border-[#c16e41] focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-white text-sm mb-2">Title</label>
                            <input
                                type="text"
                                name="title"
                                value={info.title}
                                onChange={handleChange}
                                placeholder=""
                                className="w-full bg-transparent border border-white/20 p-3 text-white focus:border-[#c16e41] focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                    <div className="w-1/3">
                        <label className="block text-white text-sm mb-4">Profile image</label>
                        <div className="w-24 h-24 rounded-full bg-white/10 overflow-hidden border border-white/20 flex items-center justify-center">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white/50 text-xs">Image</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Personal Info */}
            <div className="space-y-8 mb-16">
                <h3 className="text-lg text-white font-medium border-b border-white/10 pb-4">Personal info</h3>
                <p className="text-gray-400 text-sm -mt-6 mb-6">Update your personal information.</p>

                <div className="grid grid-cols-2 gap-8">
                    <div className="relative">
                        <label className="block text-white text-sm mb-2">First name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={info.firstName}
                            onChange={handleChange}
                            className="w-full bg-transparent border border-white/20 p-3 text-white focus:border-[#c16e41] focus:outline-none transition-colors"
                        />
                        <Lock size={14} className="absolute right-4 top-[42px] text-[#c16e41]" />
                    </div>
                    <div className="relative">
                        <label className="block text-white text-sm mb-2">Last name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={info.lastName}
                            onChange={handleChange}
                            className="w-full bg-transparent border border-white/20 p-3 text-white focus:border-[#c16e41] focus:outline-none transition-colors"
                        />
                        <Lock size={14} className="absolute right-4 top-[42px] text-[#c16e41]" />
                    </div>
                    <div className="relative col-span-1">
                        <label className="block text-white text-sm mb-2">Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={info.phone}
                            onChange={handleChange}
                            className="w-full bg-transparent border border-white/20 p-3 text-white focus:border-[#c16e41] focus:outline-none transition-colors"
                        />
                        <Lock size={14} className="absolute right-4 top-[42px] text-[#c16e41]" />
                    </div>
                </div>
            </div>

            {/* Login Info */}
            <div className="space-y-8 mb-16">
                <h3 className="text-lg text-white font-medium border-b border-white/10 pb-4">Login info</h3>
                <p className="text-gray-400 text-sm -mt-6 mb-6">View and update your login email and password.</p>

                <div className="space-y-6">
                    <div>
                        <p className="text-white text-sm mb-1">Login email:</p>
                        <p className="text-white font-medium">{user?.email}</p>
                        <button className="text-[#c16e41] text-sm mt-2 hover:underline">Change Email</button>
                    </div>
                    <div>
                        <p className="text-white text-sm mb-1">Password:</p>
                        <p className="text-white font-medium tracking-widest">••••••••</p>
                        <button className="text-[#c16e41] text-sm mt-2 hover:underline">Change Password</button>
                    </div>
                </div>
            </div>

            {/* Visibility */}
            <div className="space-y-6 mb-12">
                <h3 className="text-lg text-white font-medium border-b border-white/10 pb-4">Visibility and privacy</h3>
                <p className="text-gray-400 text-sm -mt-6">Update your personal information.</p>

                <div className="space-y-0 text-white">
                    {['Profile URL', 'Profile privacy', 'Blocked members'].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-4 border-b border-white/5 cursor-pointer hover:bg-white/5 px-2 transition-colors">
                            <span>{item}</span>
                            <ChevronDown size={16} className="text-white/50" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-4 mt-8">
                <button className="px-6 py-2 text-white border border-white/20 hover:border-white/40 transition-colors text-sm">Discard</button>
                <button onClick={handleUpdate} className="px-6 py-2 bg-[#c16e41] text-white hover:bg-[#a05a32] transition-colors text-sm">Update Info</button>
            </div>
        </div>
    );
};

// --- Main Layout ---

const UserProfile = () => {
    return (
        <div className="min-h-screen bg-black pt-32">
            <div className="max-w-5xl mx-auto bg-[#0a0a0a] min-h-[800px] border-x border-white/5 shadow-2xl">
                <ProfileHeader />

                {/* Navigation Bar */}
                <div className="border-b border-white/10 px-6 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    <NavTab to="/profile" label="Profile" />
                    <NavTab to="/profile/orders" label="My Orders" />
                    <NavTab to="/profile/my-account" label="My Account" />
                    <NavTab to="/profile/addresses" label="My Addresses" />
                    <NavTab to="/profile/wallet" label="My Wallet" />
                    <NavTab to="/profile/subscriptions" label="My Subscriptions" />
                    <NavTab to="/profile/wishlist" label="My Wishlist" />
                </div>

                {/* Content Area */}
                <div className="p-8 md:p-12 min-h-[600px]">
                    <Routes>
                        <Route index element={<ProfileInfo />} />
                        <Route path="orders" element={<MyOrders />} />
                        <Route path="my-account" element={<MyAccount />} />
                        <Route path="addresses" element={<Addresses />} />
                        <Route path="wallet" element={<WalletPage />} />
                        <Route path="subscriptions" element={<Subscriptions />} />
                        <Route path="wishlist" element={
                            <div className="text-white flex flex-col items-center py-12 border border-white/10 rounded-sm">
                                <Heart size={48} className="text-gray-600 mb-4" />
                                <p className="text-gray-400">Your wishlist is empty.</p>
                            </div>
                        } />
                        <Route path="*" element={<Navigate to="" replace />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
