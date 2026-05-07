import './App.css';
import AppRoutes from './routes/AppRoutes';
import AuthModal from './components/Auth/AuthModal';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart } from './redux/slices/cartSlice';
function App() {
    const dispatch = useDispatch();
    const { accessToken } = useSelector(state => state.auth);

    useEffect(() => {
        if (accessToken) {
            dispatch(fetchCart());
        }
    }, [accessToken]);
    return (
        <>
            <AppRoutes />
            <AuthModal />
        </>
    );
}

export default App;
