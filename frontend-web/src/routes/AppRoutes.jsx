
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
import CreatePrescription from '../pages/profile/CreatePrescription';
import PrescriptionDetail from '../pages/profile/PrescriptionDetail';
import AdminUserPage from '../admin/pages/AdminUserPage';
import CreateUserPage from '../admin/pages/CreateUserPage';
import UserDetailAdminPage from '../admin/pages/UserDetailAdminPage';
import CreateCategoryPage from '../admin/pages/CreateCategoryPage';
import AdminOrderPage from '../admin/pages/AdminOrderPage';

// INVENTORY PAGES
import InventoryDashboardPage from '../admin/pages/inventory/InventoryDashboardPage';
import InventoryBatchListPage from '../admin/pages/inventory/InventoryBatchListPage';
import InventoryBatchDetailPage from '../admin/pages/inventory/InventoryBatchDetailPage';
import ImportInventoryPage from '../admin/pages/inventory/ImportInventoryPage';
import EditInventoryBatchPage from '../admin/pages/inventory/EditInventoryBatchPage';
import InventoryTransactionsPage from '../admin/pages/inventory/InventoryTransactionsPage';
import LowStockPage from '../admin/pages/inventory/LowStockPage';
import ExpiringBatchesPage from '../admin/pages/inventory/ExpiringBatchesPage';
import OutOfStockPage from '../admin/pages/inventory/OutOfStockPage';


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
            element={<CreateCategoryPage />}
        />
        <Route
            path="categories/edit/:id"
            element={<CreateCategoryPage />}
        />
        <Route
            path="users"
            element={<AdminUserPage />}
        />
        <Route
            path="users/create"
            element={<CreateUserPage />}
        />
        <Route
            path="users/detail/:id"
            element={<UserDetailAdminPage />}
        />
        <Route
            path="orders"
            element={<AdminOrderPage />}
        />
        <Route
            path="orders/detail/:id"
            element={<AdminOrderPage />}
        />

        {/* ── INVENTORY ── */}
        <Route path="inventory/dashboard" element={<InventoryDashboardPage />} />
        <Route path="inventory/batches" element={<InventoryBatchListPage />} />
        <Route path="inventory/batches/:id" element={<InventoryBatchDetailPage />} />
        <Route path="inventory/batches/:id/edit" element={<EditInventoryBatchPage />} />
        <Route path="inventory/import" element={<ImportInventoryPage />} />
        <Route path="inventory/transactions" element={<InventoryTransactionsPage />} />
        <Route path="inventory/low-stock" element={<LowStockPage />} />
        <Route path="inventory/expiring" element={<ExpiringBatchesPage />} />
        <Route path="inventory/out-of-stock" element={<OutOfStockPage />} />

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