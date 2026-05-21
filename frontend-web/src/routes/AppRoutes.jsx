import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { openLoginModal } from '../redux/slices/authSlice';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/Home/HomePage';
import CartPage from '../pages/Cart/CartPage';
import ProfilePage from '../pages/profile/ProfilePage';
import ProductDetailPage from '../pages/Product/ProductDetailPage';
import CheckoutPage from '../pages/Checkout/CheckoutPage';
import ProductPage from '../pages/Product/ProductPage';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useSelector(state => state.auth);
    const dispatch = useDispatch();

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
            <Route path="/products/detail/:slug" element={<ProductDetailPage />} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
            <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
            <Route path="/products" element={<ProductPage />} />
            <Route path="/products/:slug" element={<ProductPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
    </Routes>
);

export default AppRoutes;