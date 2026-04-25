import './App.css';
import AppRoutes from './routes/AppRoutes';
import AuthModal from './components/Auth/AuthModal';

function App() {
    return (
        <>
            <AppRoutes />
            <AuthModal />
        </>
    );
}

export default App;
