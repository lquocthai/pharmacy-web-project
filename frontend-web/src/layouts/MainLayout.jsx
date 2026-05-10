import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const MainLayout = () => {
    return (
        <div className="app-wrapper">
            <Header />
            <main style={{ minHeight: '80vh', padding: '20px', background: '#edf0f3' }}>
                <Outlet /> {/* Nơi các Page (Home, Product...) sẽ hiển thị */}
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;