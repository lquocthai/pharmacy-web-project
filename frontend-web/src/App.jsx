import './App.css';
import AppRoutes from './routes/AppRoutes';
import AuthModal from './components/Auth/AuthModal';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart } from './redux/slices/cartSlice';
import { Toaster } from 'react-hot-toast';
function App() {
    const dispatch = useDispatch();
    const { accessToken, user } = useSelector(state => state.auth);

    useEffect(() => {
        if (accessToken && user?.roles?.[0]?.name === 'USER') {
            dispatch(fetchCart());
        }
    }, [accessToken]);
    return (
        <>
            <AppRoutes />
            <AuthModal />
            <Toaster
                position="top-center"
                reverseOrder={false}
            />
        </>
    );
}

export default App;
