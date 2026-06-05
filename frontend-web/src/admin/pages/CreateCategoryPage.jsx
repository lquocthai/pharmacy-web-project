import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import categoryAdminService from '../service/CategoryAdminService'; // Điều chỉnh lại đường dẫn cho đúng thực tế dự án
import fileUploadService from '../service/fileUploadService'; // Dịch vụ upload file riêng biệt
import BackButton from '../../components/Common/BackButton';

const CreateCategoryPage = () => {
    const { id } = useParams(); // Nếu URL có id -> Chế độ SỬA, ngược lại -> Chế độ THÊM MỚI
    console.log("ID nhận được từ URL:", id);
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // 1. State Danh mục Cha (Gốc)
    const [parentCategory, setParentCategory] = useState({
        name: '',
        description: '',
        icon: '' // URL ảnh được Backend trả về sau khi upload
    });

    // 2. State danh sách Danh mục Con (Sử dụng clientId để quản lý việc thêm/xóa dòng ở Client)
    const [subCategories, setSubCategories] = useState([
        { clientId: Date.now(), id: null, name: '', description: '', icon: '' }
    ]);

    // Trạng thái hiển thị xoay xoay hiệu ứng chờ (loading) riêng biệt cho từng nút upload ảnh
    const [uploadingParent, setUploadingParent] = useState(false);
    const [uploadingSubs, setUploadingSubs] = useState({}); // Dạng map id: { [clientId]: true/false }

    // FETCH DATA ĐỔ VÀO FORM NẾU LÀ CHẾ ĐỘ CHỈNH SỬA
    useEffect(() => {
        if (isEditMode) {
            const fetchCategoryDetail = async () => {
                setLoading(true);
                try {
                    // Gọi API lấy thông tin chi tiết danh mục cha kèm các con của nó
                    const response = await categoryAdminService.getById(id);
                    console.log("Dữ liệu chi tiết danh mục nhận về:", response.data);
                    if (response.data && response.data.code === 0) {
                        const data = response.data.result;

                        setParentCategory({
                            name: data.name || '',
                            description: data.description || '',
                            icon: data.icon || ''
                        });

                        if (data.children && data.children.length > 0) {
                            setSubCategories(data.children.map(child => ({
                                clientId: child.id, // Dùng luôn ID backend làm client key định danh
                                id: child.id,       // Giữ nguyên ID gốc để Backend phân biệt đây là danh mục cần SỬA CẬP NHẬT
                                name: child.name || '',
                                description: child.description || '',
                                icon: child.icon || ''
                            })));
                        } else {
                            setSubCategories([{ clientId: Date.now(), id: null, name: '', description: '', icon: '' }]);
                        }
                    }
                } catch (err) {
                    console.error("Lỗi khi tải dữ liệu chi tiết danh mục:", err);
                    toast.error(err.response?.data?.message || "Không thể tải dữ liệu danh mục. Vui lòng thử lại!");
                    navigate('/admin/categories');
                } finally {
                    setLoading(false);
                }
            };
            fetchCategoryDetail();
        }
    }, [id, isEditMode]);

    // HÀM LIÊN KẾT ĐẾN API UPLOAD ẢNH CỦA BẠN
    const uploadImageToServer = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        // Gọi API của bạn: @PostMapping("/upload")
        // Đảm bảo trong file Service của bạn đã cấu hình router khớp với API upload này
        const response = await fileUploadService.uploadImage(formData);

        // Khớp cấu trúc: ApiResponse -> result -> FileUploadResponse -> url
        return response.data.result.url;
    };

    // Upload ảnh dành cho Danh mục gốc
    const handleParentImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingParent(true);
        try {
            const uploadedUrl = await uploadImageToServer(file);
            setParentCategory(prev => ({ ...prev, icon: uploadedUrl }));
            toast.success("Tải lên ảnh danh mục gốc thành công!");
        } catch (error) {
            console.error("Lỗi upload ảnh cha:", error);
            toast.error(error.response?.data?.message || "Tải ảnh lên máy chủ thất bại!");
        } finally {
            setUploadingParent(false);
        }
    };

    // Upload ảnh dành cho các Danh mục cấp dưới (Danh mục con)
    const handleSubImageChange = async (clientId, e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingSubs(prev => ({ ...prev, [clientId]: true }));
        try {
            const uploadedUrl = await uploadImageToServer(file);
            setSubCategories(prev =>
                prev.map(sub => sub.clientId === clientId ? { ...sub, icon: uploadedUrl } : sub)
            );
            toast.success("Tải lên ảnh danh mục con thành công!");
        } catch (error) {
            console.error("Lỗi upload ảnh con:", error);
            toast.error(error.response?.data?.message || "Tải ảnh lên máy chủ thất bại!");
        } finally {
            setUploadingSubs(prev => ({ ...prev, [clientId]: false }));
        }
    };

    // Gỡ ảnh tạm thời trên UI
    const handleRemoveParentImage = () => {
        setParentCategory(prev => ({ ...prev, icon: '' }));
    };

    const handleRemoveSubImage = (clientId) => {
        setSubCategories(prev =>
            prev.map(sub => sub.clientId === clientId ? { ...sub, icon: '' } : sub)
        );
    };

    // Thay đổi thông tin văn bản nhóm gốc
    const handleParentChange = (e) => {
        const { name, value } = e.target;
        setParentCategory(prev => ({ ...prev, [name]: value }));
    };

    // Thay đổi thông tin văn bản các ô nhập con
    const handleSubCategoryChange = (clientId, field, value) => {
        setSubCategories(prev =>
            prev.map(sub => sub.clientId === clientId ? { ...sub, [field]: value } : sub)
        );
    };

    // Thêm dòng dữ liệu con trống mới
    const addSubCategoryRow = () => {
        setSubCategories(prev => [
            ...prev,
            { clientId: Date.now() + Math.random(), id: null, name: '', description: '', icon: '' }
        ]);
    };

    // Xóa bớt một dòng danh mục con
    const removeSubCategoryRow = (clientId) => {
        if (subCategories.length === 1) {
            setSubCategories([{ clientId: Date.now(), id: null, name: '', description: '', icon: '' }]);
            return;
        }
        setSubCategories(prev => prev.filter(sub => sub.clientId !== clientId));
    };

    // SUBMIT TOÀN BỘ FORM
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!parentCategory.name.trim()) {
            toast.error("Vui lòng điền tên Danh mục gốc!");
            return;
        }

        // Lọc bỏ các ô bấm thêm dòng nhưng để trống tên, map chuẩn cấu trúc ChildCategoryUpdateRequest
        const validChildren = subCategories
            .filter(sub => sub.name.trim() !== '')
            .map(sub => ({
                id: sub.id ? sub.id : null, // Có id -> Cập nhật sửa đổi | null -> Backend tự động tạo mới hoàn toàn
                name: sub.name.trim(),
                description: sub.description.trim(),
                icon: sub.icon
            }));

        // Đóng gói payload chuẩn UpdateParentWithChildrenCategoryRequest
        const payload = {
            name: parentCategory.name.trim(),
            description: parentCategory.description.trim(),
            icon: parentCategory.icon,
            children: validChildren
        };

        setSubmitting(true);
        try {
            if (isEditMode) {
                console.log("Payload gửi đi để cập nhật danh mục:", payload);
                // Nếu sửa: Truyền thêm ID gốc để xử lý cập nhật chính xác nhóm danh mục
                const response = await categoryAdminService.updateCategory(id, payload);
                console.log("Phản hồi sau khi cập nhật danh mục:", response.data);
                toast.success("Cập nhật thông tin và danh mục cấp dưới thành công!");
            } else {
                // Nếu thêm mới
                const response = await categoryAdminService.createParentWithChildren(payload);
                console.log("Phản hồi sau khi tạo danh mục mới:", response.data);
                toast.success("Khởi tạo nhóm danh mục mới thành công!");
            }
            navigate('/admin/categories');
        } catch (err) {
            console.error("Lỗi khi đồng bộ dữ liệu hệ thống:", err);
            toast.error(err.response?.data?.message || "Không thể thực hiện thao tác. Hãy kiểm tra lại!");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center font-satoshi">
                <div className="text-center space-y-2">
                    <div className="animate-spin w-8 h-8 border-4 border-[#3C50E0] border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-xs font-bold text-[#64748B]">Đang tải cấu trúc dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-6 text-[#1C2434] font-satoshi">
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Header Điều hướng nhanh */}
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h2 className="text-xl font-bold text-[#1C2434]">
                        {isEditMode ? 'Chỉnh sửa và đồng bộ danh mục' : 'Thêm nhóm danh mục phức hợp'}
                    </h2>
                </div>
                <BackButton to="/admin/categories" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">

                {/* ── KHU VỰC 1: THÔNG TIN DANH MỤC CHA (GỐC) ── */}
                <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0] space-y-4 overflow-hidden">
                    <div className="border-b border-[#E2E8F0] p-3 bg-[#F8FAFC]">
                        <h5 className="text-start font-bold text-sm text-[#3C50E0]">
                            {isEditMode ? '1. Chỉnh sửa thông tin danh mục gốc' : '1. Thiết lập thông tin danh mục gốc'}
                        </h5>
                    </div>

                    <div className='p-4 text-start grid grid-cols-1 md:grid-cols-12 gap-4 text-xs'>
                        {/* Nhập text tên & mô tả */}
                        <div className="md:col-span-8 space-y-4">
                            <div>
                                <label className="block font-bold text-[#1C2434] mb-1.5">Tên danh mục gốc <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={parentCategory.name}
                                    onChange={handleParentChange}
                                    placeholder="Ví dụ: Dược phẩm, Thực phẩm chức năng..."
                                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs text-[#1C2434] focus:outline-none focus:border-[#3C50E0] transition-all font-semibold"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-[#1C2434] mb-1.5">Mô tả tổng quan</label>
                                <textarea
                                    name="description"
                                    value={parentCategory.description}
                                    onChange={handleParentChange}
                                    rows="3"
                                    placeholder="Nhập ghi chú hoặc mô tả tóm tắt cho nhóm danh mục này..."
                                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs text-[#1C2434] focus:outline-none focus:border-[#3C50E0] transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Upload file ảnh thông qua API hệ thống */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center border border-dashed border-[#E2E8F0] rounded-xl p-4 bg-[#F8FAFC]">
                            <label className="block font-bold text-[#1C2434] mb-2 text-center w-full">Biểu tượng / Ảnh gốc</label>
                            {parentCategory.icon ? (
                                <div className="relative group w-24 h-24 border border-[#E2E8F0] rounded-lg overflow-hidden bg-white">
                                    <img src={parentCategory.icon} alt="Parent Icon" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={handleRemoveParentImage}
                                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold text-[10px] transition-all"
                                    >
                                        Thay đổi ảnh
                                    </button>
                                </div>
                            ) : (
                                <label className="w-24 h-24 border border-dashed border-[#cbd5e1] rounded-lg flex flex-col items-center justify-center cursor-pointer bg-white hover:border-[#3C50E0] transition-all p-2 text-center">
                                    {uploadingParent ? (
                                        <div className="animate-spin w-4 h-4 border-2 border-[#3C50E0] border-t-transparent rounded-full"></div>
                                    ) : (
                                        <>
                                            <span className="text-[18px] text-[#64748B]">+</span>
                                            <span className="text-[9px] text-[#64748B] font-semibold">Tải tệp lên</span>
                                        </>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleParentImageChange} className="hidden" disabled={uploadingParent} />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── KHU VỰC 2: QUẢN LÝ THÊM BẤT KỲ SỐ LƯỢNG DANH MỤC CON ── */}
                <div style={{ borderRadius: '1rem' }} className="bg-white  border border-[#E2E8F0] space-y-4 overflow-hidden">
                    <div className="flex justify-between items-center border-b border-[#E2E8F0] p-3 bg-[#F8FAFC]">
                        <div>
                            <h5 className="text-start font-bold text-sm text-[#1C2434]">2. Danh sách danh mục cấp dưới (Sub-categories)</h5>
                            <p className="text-start text-[10px] text-[#64748B] mt-0.5">Ấn nút Thêm danh mục con để bổ sung các nhánh phân cấp bên dưới danh mục gốc</p>
                        </div>
                        <button
                            type="button"
                            onClick={addSubCategoryRow}
                            className="flex items-center gap-1 bg-[#3C50E0] text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-opacity-90 transition-all "
                        >
                            + Thêm danh mục con
                        </button>
                    </div>

                    {/* Vùng cuộn danh sách động */}
                    <div className="p-4 text-start space-y-3.5 max-h-[450px] overflow-y-auto pr-1 no-scrollbar">
                        {subCategories.map((sub, index) => (
                            <div
                                key={sub.clientId}
                                className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg items-center relative group transition-all hover:border-[#cbd5e1]"
                            >
                                {/* Trạng thái ID kiểm soát */}
                                <div className="absolute top-2 left-2 bg-[#E2E8F0] text-[#64748B] text-[8px] font-bold px-1.5 py-0.5 rounded flex gap-1">
                                    <span>#{index + 1}</span>
                                    {sub.id ? <span className="text-emerald-600">[CẬP NHẬT ID: {sub.id}]</span> : <span className="text-amber-600">[HÀNG MỚI]</span>}
                                </div>

                                {/* Ô nhập Tên con */}
                                <div className="md:col-span-3 text-xs pt-3">
                                    <label className="block font-medium text-[#64748B] mb-1">Tên danh mục con</label>
                                    <input
                                        type="text"
                                        value={sub.name}
                                        onChange={(e) => handleSubCategoryChange(sub.clientId, 'name', e.target.value)}
                                        placeholder="Ví dụ: Thuốc hạ sốt, Vitamin..."
                                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-2.5 py-1.5 text-xs text-[#1C2434] focus:outline-none focus:border-[#3C50E0] font-semibold transition-all"
                                    />
                                </div>

                                {/* Ô nhập Mô tả con */}
                                <div className="md:col-span-5 text-xs pt-3">
                                    <label className="block font-medium text-[#64748B] mb-1">Mô tả chi tiết</label>
                                    <input
                                        type="text"
                                        value={sub.description}
                                        onChange={(e) => handleSubCategoryChange(sub.clientId, 'description', e.target.value)}
                                        placeholder="Nhập mô tả định nghĩa ngắn..."
                                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-2.5 py-1.5 text-xs text-[#1C2434] focus:outline-none focus:border-[#3C50E0] transition-all"
                                    />
                                </div>

                                {/* Nút tải ảnh con gián tiếp qua server */}
                                <div className="md:col-span-3 text-xs pt-3 flex flex-col items-center">
                                    <label className="block font-medium text-[#64748B] mb-1 self-start pl-2">Ảnh đại diện con</label>
                                    {sub.icon ? (
                                        <div className="relative group w-12 h-12 border border-[#E2E8F0] rounded-md overflow-hidden bg-white">
                                            <img src={sub.icon} alt="Sub Icon" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSubImage(sub.clientId)}
                                                className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold text-[8px] transition-all"
                                            >
                                                Đổi ảnh
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="w-full h-9 border border-dashed border-[#cbd5e1] rounded-md flex items-center justify-center cursor-pointer bg-white hover:border-[#3C50E0] transition-all gap-1 text-[#64748B]">
                                            {uploadingSubs[sub.clientId] ? (
                                                <div className="animate-spin w-3 h-3 border-2 border-[#3C50E0] border-t-transparent rounded-full"></div>
                                            ) : (
                                                <>
                                                    <span className="font-bold text-xs">+</span>
                                                    <span className="text-[10px]">Tải ảnh con</span>
                                                </>
                                            )}
                                            <input type="file" accept="image/*" onChange={(e) => handleSubImageChange(sub.clientId, e)} className="hidden" disabled={uploadingSubs[sub.clientId]} />
                                        </label>
                                    )}
                                </div>

                                {/* Nút Xóa bớt hàng */}
                                <div className="md:col-span-1 flex justify-center pt-6">
                                    <button
                                        type="button"
                                        onClick={() => removeSubCategoryRow(sub.clientId)}
                                        className="p-1.5 border border-[#E2E8F0] text-[#64748B] hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-md transition-colors w-full md:w-auto flex items-center justify-center"
                                        title="Xóa dòng này"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── FOOTER ĐIỀU KHIỂN SUBMIT TOÀN TRANG ── */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/categories')}
                        className="px-4 py-2 border border-[#E2E8F0] bg-white rounded-md text-xs font-semibold text-[#1C2434] hover:bg-[#F8FAFC] transition-all"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2 bg-[#3C50E0] text-white rounded-md text-xs font-semibold hover:bg-opacity-90  disabled:opacity-60 transition-all flex items-center gap-1.5"
                    >
                        {submitting && <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div>}
                        {submitting ? 'Đang cập nhật DB...' : isEditMode ? 'Lưu cập nhật' : 'Lưu thông tin'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateCategoryPage;