import Navbar from './Navbar';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div className="min-h-screen flex flex-col bg-secondary text-primary font-sans">
            <style>{`html { scroll-behavior: smooth; }`}</style>
            <Navbar />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
