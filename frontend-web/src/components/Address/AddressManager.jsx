import { useState, useEffect } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import { Plus, MapPin } from 'lucide-react';
import profileService from '../../services/profileService';
import AddressCard from './AddressCard';
import AddressFormModal from './AddressFormModal';
import toast from 'react-hot-toast';

/**
 * Component quản lý sổ địa chỉ — dùng trong ProfilePage
 * Thay thế phần content khi activeTab === 'address'
 */
const AddressManager = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null); // null = thêm mới

    // Load danh sách địa chỉ
    const loadAddresses = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await profileService.getAddresses();
            if (data.code === 0) setAddresses(data.result || []);
            console.log('Loaded addresses:', data.result);
        } catch (err) {
            setError('Không thể tải danh sách địa chỉ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAddresses();
    }, []);

    // Mở modal thêm mới
    const handleOpenCreate = () => {
        setEditingAddress(null);
        setShowModal(true);
    };

    // Mở modal sửa
    const handleOpenEdit = (address) => {
        setEditingAddress(address);
        setShowModal(true);
    };

    // Submit form (thêm hoặc sửa)
    const handleSubmit = async (formData) => {
        console.log('Submitting address form with data:', formData);
        try {
            if (editingAddress) {
                // Sửa
                const { data } = await profileService.updateAddress(editingAddress.id, formData);
                if (data.code !== 0) throw new Error(data.message);
                toast.success(`Cập nhật địa chỉ thành công: ${data.code}`);
            } else {
                // Thêm mới
                const { data } = await profileService.createAddress(formData);
                if (data.code !== 0) throw new Error(data.message);
                toast.success('Thêm địa chỉ thành công');
            }
            await loadAddresses(); // Reload để lấy dữ liệu mới nhất
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Có lỗi xảy ra');
            throw err; // Để modal không đóng khi lỗi
        }
    };

    // Xóa địa chỉ
    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
        try {
            const { data } = await profileService.deleteAddress(id);
            if (data.code !== 0) throw new Error(data.message);
            setAddresses(prev => prev.filter(a => a.id !== id));
            toast.success('Xóa địa chỉ thành công');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể xóa địa chỉ');
        }
    };

    // Đặt làm mặc định
    // const handleSetDefault = async (id) => {
    //     try {
    //         const { data } = await profileService.setDefaultAddress(id);
    //         if (data.code !== 0) throw new Error(data.message);
    //         // Cập nhật local state — không cần reload
    //         setAddresses(prev => prev.map(a => ({
    //             ...a,
    //             isDefault: a.id === id,
    //         })));
    //     } catch (err) {
    //         toast.error(err.response?.data?.message || 'Không thể đặt địa chỉ mặc định');
    //     }
    // };

    return (
        <>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h6 className="text-start fw-bold mb-0">Sổ địa chỉ</h6>
                    <p className="text-muted small mb-0">Quản lý địa chỉ giao hàng của bạn (tối đa 10 địa chỉ)</p>
                </div>
                <Button variant="primary" size="sm" className="rounded-pill px-3 fw-bold"
                    style={{ backgroundColor: '#1250dc', border: 'none' }}
                    onClick={handleOpenCreate}
                    disabled={addresses.length >= 10}>
                    <Plus size={15} className="me-1" />
                    Thêm địa chỉ
                </Button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" size="sm" />
                    <p className="text-muted small mt-2">Đang tải...</p>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <Alert variant="danger" className="rounded-3">{error}</Alert>
            )}

            {/* Empty state */}
            {!loading && !error && addresses.length === 0 && (
                <div className="text-center py-5">
                    <MapPin size={48} className="text-muted mb-3" />
                    <p className="text-muted">Bạn chưa có địa chỉ nào.</p>
                    <Button variant="primary" className="rounded-pill px-4 fw-bold"
                        style={{ backgroundColor: '#1250dc', border: 'none' }}
                        onClick={handleOpenCreate}>
                        <Plus size={15} className="me-1" />
                        Thêm địa chỉ đầu tiên
                    </Button>
                </div>
            )}

            {/* Danh sách địa chỉ */}
            {!loading && !error && addresses.length > 0 && (
                <div>
                    {addresses.map(address => (
                        <AddressCard
                            key={address.id}
                            address={address}
                            onEdit={handleOpenEdit}
                            onDelete={handleDelete}
                        // onSetDefault={handleSetDefault}
                        />
                    ))}
                    <p className="text-muted small text-end mt-2">
                        {addresses.length}/10 địa chỉ
                    </p>
                </div>
            )}

            {/* Modal thêm/sửa */}
            <AddressFormModal
                show={showModal}
                onHide={() => setShowModal(false)}
                onSubmit={handleSubmit}
                initialData={editingAddress}
            />
        </>
    );
};

export default AddressManager;
