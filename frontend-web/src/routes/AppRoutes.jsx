// import { Routes, Route, Navigate } from 'react-router-dom';
// import { useSelector, useDispatch } from 'react-redux';
// import { openLoginModal } from '../redux/slices/authSlice';
// import MainLayout from '../layouts/MainLayout';
// import HomePage from '../pages/Home/HomePage';
// import CartPage from '../pages/Cart/CartPage';
// import ProfilePage from '../pages/profile/ProfilePage';
// import ProductDetailPage from '../pages/Product/ProductDetailPage';
// import CheckoutPage from '../pages/Checkout/CheckoutPage';
// import ProductPage from '../pages/Product/ProductPage';
// import CheckoutSuccessPage from '../pages/Checkout/CheckoutSuccessPage';
// import PaymentResultPage from '../pages/Checkout/PaymentResultPage';
// import MyOrders from '../pages/profile/MyOrder';
// import OrderDetail from '../pages/profile/OrderDetail';

// const PrivateRoute = ({ children }) => {
//     const { isAuthenticated } = useSelector(state => state.auth);
//     const dispatch = useDispatch();

//     if (!isAuthenticated) {
//         dispatch(openLoginModal());
//         return <Navigate to="/" replace />;
//     }
//     return children;
// };

// const AppRoutes = () => (
//     <Routes>
//         <Route element={<MainLayout />}>
//             <Route path="/" element={<HomePage />} />
//             <Route path="/products/detail/:slug" element={<ProductDetailPage />} />
//             <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
//             <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
//             <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
//             <Route path="/products" element={<ProductPage />} />
//             <Route path="/products/:slug" element={<ProductPage />} />
//             <Route path="/checkout-success" element={<PrivateRoute><CheckoutSuccessPage /></PrivateRoute>} />
//             <Route path="/payment-result" element={<PrivateRoute><PaymentResultPage /></PrivateRoute>} />
//             <Route path="/my-orders" element={<PrivateRoute><MyOrders /></PrivateRoute>} />
//             {/* 🚀 ROUTE MỚI: Trang chi tiết đơn hàng (Ví dụ: /profile/orders/QT-20260525-1759) */}
//             <Route path="/profile/orders/:orderCode" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />

//         </Route>
//         <Route path="*" element={<Navigate to="/" />} />
//     </Routes>
// );

// export default AppRoutes;


import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { openLoginModal } from '../redux/slices/authSlice';

// USER LAYOUT
import MainLayout from '../layouts/MainLayout';
// ADMIN LAYOUT
import AdminLayout from '../admin/layouts/AdminLayout';
// USER PAGES
import HomePage from '../pages/Home/HomePage';
import CartPage from '../pages/Cart/CartPage';
import ProfilePage from '../pages/profile/ProfilePage';
import ProductDetailPage from '../pages/Product/ProductDetailPage';
import CheckoutPage from '../pages/Checkout/CheckoutPage';
import ProductPage from '../pages/Product/ProductPage';
import CheckoutSuccessPage from '../pages/Checkout/CheckoutSuccessPage';
import PaymentResultPage from '../pages/Checkout/PaymentResultPage';
import MyOrders from '../pages/profile/MyOrder';
import OrderDetail from '../pages/profile/OrderDetail';

// ADMIN PAGES
import AdminDashboardPage from '../admin/pages/AdminDashboardPage';
import AdminProductPage from '../admin/pages/AdminProductPage';
import ProductFormPage from '../admin/pages/ProductFormPage';
import ChatBotPage from '../admin/pages/ChatBotPage';
import AdminCategoryPage from '../admin/pages/AdminCategoryPage';
import CategoryFormPage from '../admin/pages/CategoryFormPage';
import CreatePrescription from '../pages/profile/CreatePrescription';
import PrescriptionDetail from '../pages/profile/PrescriptionDetail';
// import AdminProductListPage from '../admin/pages/products/AdminProductListPage';
// import AdminCreateProductPage from '../admin/pages/products/AdminCreateProductPage';
// import AdminEditProductPage from '../admin/pages/products/AdminEditProductPage';
// import AdminCategoryPage from '../admin/pages/categories/AdminCategoryPage';
// import AdminOrderPage from '../admin/pages/orders/AdminOrderPage';
// import AdminUserPage from '../admin/pages/users/AdminUserPage';

// ─────────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────────
export const ROLES = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    PHARMACIST: 'PHARMACIST'
};

// ─────────────────────────────────────────────
// PROTECTED ROUTE
// ─────────────────────────────────────────────
const ProtectedRoute = ({ children, roles = [] }) => {
    const { isAuthenticated, user } = useSelector(state => state.auth);
    const dispatch = useDispatch();

    // chưa login
    if (!isAuthenticated) {
        dispatch(openLoginModal());
        return null;
    }

    // lấy list role của user
    const userRoles = user?.roles?.map(role => role.name) || [];

    // check quyền
    const hasRole =
        roles.length === 0 ||
        roles.some(role => userRoles.includes(role));

    // không có quyền
    if (!hasRole) {
        return <Navigate to="/" replace />;
    }

    return children;
};

// ─────────────────────────────────────────────
// USER ROUTES
// ─────────────────────────────────────────────
const UserRoutes = () => (
    <Route element={<MainLayout />}>

        {/* PUBLIC */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductPage />} />
        <Route path="/products/:slug" element={<ProductPage />} />
        <Route path="/products/detail/:slug" element={<ProductDetailPage />} />
        {/* PRIVATE */}
        <Route
            path="/profile"
            element={
                <ProtectedRoute
                    roles={[
                        ROLES.USER,
                        ROLES.ADMIN,
                        ROLES.PHARMACIST
                    ]}
                >
                    <ProfilePage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/cart"
            element={
                <ProtectedRoute roles={[ROLES.USER]}>
                    <CartPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/checkout"
            element={
                <ProtectedRoute roles={[ROLES.USER]}>
                    <CheckoutPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/checkout-success"
            element={
                <ProtectedRoute roles={[ROLES.USER]}>
                    <CheckoutSuccessPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/payment-result"
            element={
                <ProtectedRoute roles={[ROLES.USER]}>
                    <PaymentResultPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/my-orders"
            element={
                <ProtectedRoute roles={[ROLES.USER]}>
                    <MyOrders />
                </ProtectedRoute>
            }
        />

        <Route
            path="/profile/orders/:orderCode"
            element={
                <ProtectedRoute roles={[ROLES.USER]}>
                    <OrderDetail />
                </ProtectedRoute>
            }
        />
        <Route
            path="/create-prescription"
            element={
                <ProtectedRoute roles={[ROLES.USER]}>
                    <CreatePrescription />
                </ProtectedRoute>
            }
        />
        <Route
            path="/profile/prescriptions/:id"
            element={
                <ProtectedRoute roles={[ROLES.USER]}>
                    <PrescriptionDetail />
                </ProtectedRoute>
            }
        />
    </Route>
);

// ─────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────
const AdminRoutes = () => (
    <Route
        path="/admin"
        element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
                <AdminLayout />
            </ProtectedRoute>
        }
    >
        {/* dashboard */}
        <Route index element={<AdminDashboardPage />} />

        {/* products */}
        <Route
            path="products"
            element={<AdminProductPage />}
        />
        <Route
            path="products/create"
            element={<ProductFormPage />}
        />
        <Route
            path="products/edit/:slug"
            element={<ProductFormPage />}
        />
        <Route
            path="ai-assistant"
            element={<ChatBotPage />}
        />
        <Route
            path="categories"
            element={<AdminCategoryPage />}
        />
        <Route
            path="categories/create"
            element={<CategoryFormPage />}
        />

        {/* admin fallback */}
        <Route
            path="*"
            element={<Navigate to="/admin" replace />}
        />
    </Route>
);

// ─────────────────────────────────────────────
// APP ROUTES
// ─────────────────────────────────────────────
const AppRoutes = () => {
    return (
        <Routes>

            {UserRoutes()}
            {AdminRoutes()}

            {/* GLOBAL FALLBACK */}
            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />

        </Routes>
    );
};

export default AppRoutes;