import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProductProvider } from './context/ProductContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import AdminDashboard from './pages/AdminDashboard';
import CartDrawer from './components/CartDrawer';
import OurStory from './pages/OurStory';
import Care from './pages/Care';
import UserProfile from './pages/UserProfile';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ProductProvider>
            <CartDrawer />
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="login" element={<Login initialView="login" />} />
                <Route path="signup" element={<Login initialView="signup-options" />} />
                <Route path="shop" element={<Shop />} />
                <Route path="product/:id" element={<ProductDetails />} />
                <Route path="care" element={<Care />} />
                <Route path="our-story" element={<OurStory />} />
                <Route path="profile/*" element={<UserProfile />} />
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
                
              </Route>
            </Routes>
          </ProductProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};



export default App;
