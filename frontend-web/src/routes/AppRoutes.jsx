import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { openLoginModal } from '../redux/slices/authSlice';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/Home/HomePage';
import CartPage from '../pages/Cart/CartPage';
import ProfilePage from '../pages/profile/ProfilePage';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, isLoggingOut } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    // useEffect(() => {
    //     // Reset flag sau khi đã redirect về trang home
    //     if (isLoggingOut) {
    //         dispatch(resetLogoutFlag());
    //     }
    // }, [isLoggingOut, dispatch]);
    if (!isAuthenticated) {
        dispatch(openLoginModal());
        return <Navigate to="/" replace />;
    }
    return children;
};

const AppRoutes = () => (
    <Routes>
        <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
    </Routes>
);

export default AppRoutes;