import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatAdvisor from '../components/Chat/ChatAdvisor';

const MainLayout = () => {
    return (
        <div className="app-wrapper">
            <Header />
            <main style={{ background: '#EAEFFA' }}>

                <Outlet /> {/* Nơi các Page (Home, Product...) sẽ hiển thị */}

            </main>
            <Footer />
            <ChatAdvisor />
        </div>
    );
};

export default MainLayout;