import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import categoryService from '../../services/categoryService';
import productAdminService from '../service/productAdminService';

const ProductFormPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!slug;
    const [deletedImageIds, setDeletedImageIds] = useState([]);
    const [deletedVariantIds, setDeletedVariantIds] = useState([]);

    // ─────────────────────────────────────────────
    // STATES
    // ─────────────────────────────────────────────
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    const [product, setProduct] = useState({
        name: '',
        categorySlug: '',
        manufacturer: '',
        description: '',
        prescription: false,
        country: '',
        primaryImageUrl: '',    // Dùng để hiển thị preview ảnh chính (Blob hoặc URL từ server)
        primaryImageFile: null,  // Lưu file object thực tế của ảnh chính
        subImageUrls: [],        // Mảng chứa các đối tượng { id, imageUrl, file } của ảnh phụ
        specifications: [
            { specKey: 'Thành phần', specValue: '' },
            { specKey: 'Công dụng', specValue: '' },
            { specKey: 'Cách dùng', specValue: '' },
            { specKey: 'Bảo quản', specValue: '' },
            { specKey: 'Chống chỉ định', specValue: '' }
        ],
        variants: [
            {
                id: '',
                variantName: 'Hộp 3 vỉ x 10 viên',
                price: 0,
                originalPrice: 0,
                stockQuantity: 0,
                variantDefault: true
            }
        ]
    });

    // ─────────────────────────────────────────────
    // LOAD CATEGORIES & PRODUCT DETAIL (IF EDIT)
    // ─────────────────────────────────────────────
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                const catRes = await categoryService.getAll();
                setCategories(catRes.data?.result || []);

                if (isEditMode) {
                    const prodRes = await productAdminService.getDetail(slug);
                    if (prodRes.data?.result) {
                        const data = prodRes.data.result;
                        console.log("Loaded product detail:", data); // Debug log để kiểm tra dữ liệu trả về

                        const primaryImage = data.images?.find(img => img.defaultImage);

                        const formattedSubImages = (data.images || [])
                            .filter(img => !img.defaultImage)
                            .map((img) => ({
                                id: img.id,
                                imageUrl: img.imageUrl,
                                file: null
                            }));

                        setProduct({
                            ...data,
                            primaryImageUrl: primaryImage?.imageUrl || '',
                            primaryImageFile: null,
                            subImageUrls: formattedSubImages
                        });
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi tải dữ liệu sản phẩm.');
                navigate('/admin/products');

            } finally {
                setLoading(false);
            }
        };
        if (slug == "slug") {
            toast.error('Hãy chọn sản phẩm chỉnh sửa từ trang danh sách sản phẩm!');
            navigate('/admin/products');

        } else {
            loadInitialData();
        }
    }, [slug, isEditMode]);

    // Flatten Categories
    const categoryOptions = useMemo(() => {
        const flatten = (items, level = 0) => {
            let res = [];
            items.forEach(item => {
                res.push({ id: item.id, slug: item.slug, name: item.name, level });
                if (item.children?.length > 0) {
                    res = [...res, ...flatten(item.children, level + 1)];
                }
            });
            return res;
        };
        return flatten(categories);
    }, [categories]);

    // ─────────────────────────────────────────────
    // HANDLERS: INPUT CƠ BẢN
    // ─────────────────────────────────────────────
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProduct(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // ─────────────────────────────────────────────
    // HANDLERS: FILE HÌNH ẢNH (UPLOAD & PREVIEW REALTIME)
    // ─────────────────────────────────────────────

    // Xử lý chọn ảnh đại diện chính
    const handlePrimaryImageChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Kích thước ảnh chính không được vượt quá 5MB");
            return;
        }

        setProduct(prev => ({
            ...prev,
            primaryImageUrl: URL.createObjectURL(file),
            primaryImageFile: file
        }));
    };

    // Xóa ảnh đại diện chính
    const handleRemovePrimaryImage = () => {
        setProduct(prev => ({
            ...prev,
            primaryImageUrl: '',
            primaryImageFile: null
        }));
    };

    // Xử lý chọn nhiều ảnh phụ cùng lúc
    // Xử lý chọn nhiều ảnh phụ cùng lúc (Giới hạn tối đa 5MB/ảnh)
    const handleSubImagesUpload = (e) => {
        const files = Array.from(e.target.files);
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB tính bằng bytes

        // 1. Kiểm tra xem có file nào vượt quá 5MB không để thông báo cho user
        const hasLargeFile = files.some(file => file.size > MAX_FILE_SIZE);
        if (hasLargeFile) {
            // Thay alert bằng toast.error(.) nếu dự án của bạn có xài react-hot-toast
            toast.error("Một số ảnh không được tải lên vì vượt quá dung lượng tối đa cho phép (5MB)!");
        }

        // 2. Lọc SẠCH: Chỉ giữ lại những file dưới hoặc bằng 5MB
        const validFiles = files.filter(file => file.size <= MAX_FILE_SIZE);

        // 3. Tiến hành map mảng các file hợp lệ thành cấu trúc object để hiển thị preview
        const newSubImages = validFiles.map(file => ({
            id: `local-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
            imageUrl: URL.createObjectURL(file),
            file: file
        }));

        // 4. Cập nhật state nếu có ít nhất 1 file hợp lệ
        if (newSubImages.length > 0) {
            setProduct(prev => ({
                ...prev,
                subImageUrls: [...prev.subImageUrls, ...newSubImages]
            }));
        }

        // Reset value input file để có thể chọn lại cùng một file nếu muốn
        e.target.value = '';
    };

    // Xóa một ảnh phụ theo cấu trúc Object ID
    const handleRemoveSubImage = (idToRemove) => {
        setProduct(prev => ({
            ...prev,
            subImageUrls: prev.subImageUrls.filter(item => item.id !== idToRemove)
        }));

        setDeletedImageIds(prev => [...prev, idToRemove]);
    };

    // ─────────────────────────────────────────────
    // HANDLERS: THÔNG SỐ KỸ THUẬT (SPECIFICATIONS)
    // ─────────────────────────────────────────────
    const handleAddSpec = () => {
        setProduct(prev => ({
            ...prev,
            specifications: [...prev.specifications, { specKey: '', specValue: '' }]
        }));
    };

    const handleSpecChange = (index, field, value) => {
        const updatedSpecs = [...product.specifications];
        updatedSpecs[index][field] = value;
        setProduct(prev => ({ ...prev, specifications: updatedSpecs }));
    };

    const handleRemoveSpec = (index) => {
        setProduct(prev => ({
            ...prev,
            specifications: prev.specifications.filter((_, i) => i !== index)
        }));
    };

    // ─────────────────────────────────────────────
    // HANDLERS: BIẾN THỂ SẢN PHẨM (VARIANTS)
    // ─────────────────────────────────────────────
    const handleAddVariant = () => {
        setProduct(prev => ({
            ...prev,
            variants: [
                ...prev.variants,
                {
                    id: Date.now().toString(),
                    variantName: '',
                    price: 0,
                    originalPrice: 0,
                    stockQuantity: 1,
                    variantDefault: false
                }
            ]
        }));
    };

    const handleVariantChange = (index, field, value) => {
        const updatedVariants = [...product.variants];
        if (field === 'variantDefault' && value === true) {
            updatedVariants.forEach((v, i) => v.variantDefault = i === index);
        } else {
            updatedVariants[index][field] = value;
        }
        setProduct(prev => ({ ...prev, variants: updatedVariants }));
    };

    const handleRemoveVariant = (index) => {
        if (product.variants[index].variantDefault && product.variants.length > 1) {
            toast.error('Không thể xóa biến thể mặc định hiện tại. Vui lòng tích chọn dòng khác làm mặc định trước.');
            return;
        }
        setProduct(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
    };

    // ─────────────────────────────────────────────
    // SUBMIT FORM
    // ─────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            console.log("Submitting product data:", product);
            if (!product.primaryImageFile && !isEditMode) {
                toast.error('Vui lòng chọn ảnh đại diện chính');
                return;
            }
            if (product.variants.length === 0) {
                toast.error('Phải có ít nhất 1 biến thể');
                return;
            }
            if (isEditMode) {
                const response = await productAdminService.updateProduct(slug, payload);
                if (response.data?.code === 0) {
                    toast.success('Cập nhật sản phẩm thành công!');
                }
            } else {
                const response =
                    await productAdminService.createProduct(product);
                console.log("Create product response:", response);
                if (response.data?.code === 0) {
                    toast.success('Thêm sản phẩm thành công!');
                }
            }
            navigate('/admin/products');
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message ||
                'Đã xảy ra lỗi khi lưu sản phẩm'
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                <div className="flex flex-col items-center bg-white px-8 py-6 rounded-xl shadow-xl border border-slate-100 max-w-xs text-center scale-up">
                    {/* Vòng xoay Loading tinh tế */}
                    <div className="relative w-10 h-10 mb-4">
                        <div className="w-10 h-10 rounded-full border-4 border-slate-100"></div>
                        <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-4 border-[#3C50E0] border-t-transparent animate-spin"></div>
                    </div>

                    {/* Văn bản thông báo */}
                    <h3 className="text-xs font-semibold text-slate-800 mb-1">
                        Vui lòng đợi
                    </h3>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                        Đang đồng bộ hóa dữ liệu từ hệ thống...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 font-satoshi text-left text-[#1C2434] bg-[#F1F5F9] min-h-screen">

            {/* Header điều hướng */}
            <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h2 className="text-xl font-bold text-[#1C2434]">
                        Quản lý sản phẩm
                    </h2>
                </div>
                <button
                    onClick={() => navigate('/admin/products')}
                    className="flex items-center gap-1.5  font-medium text-[#64748B] hover:text-[#3C50E0] transition-colors"
                >
                    &larr; Quay lại danh sách
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* KHỐI 1: PRODUCTS DESCRIPTION */}
                <div style={{ borderRadius: '1rem' }} className="bg-white rounded-sm  border border-[#E2E8F0]">
                    <div style={{ borderRadius: '1rem 0 0 0' }} className="border-b border-[#E2E8F0] p-3 bg-[#F8FAFC]">
                        <h5 className="font-bold text-sm">{isEditMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</h5>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold mb-2">Tên sản phẩm</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={product.name}
                                    onChange={handleInputChange}
                                    placeholder="Nhập tên sản phẩm"
                                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-4 py-2 text-xs outline-none focus:border-[#3C50E0] transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-2">Danh mục</label>
                                <select
                                    name="categorySlug"
                                    value={product.categorySlug}
                                    onChange={handleInputChange}
                                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-4 py-2 text-xs outline-none focus:border-[#3C50E0] transition-all"
                                    required
                                >
                                    <option value="">Chọn danh mục</option>
                                    {categoryOptions.map(cat => (
                                        <option key={cat.id} value={cat.slug}>
                                            {'— '.repeat(cat.level)}{cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold mb-2">Nhà sản xuất</label>
                                <input
                                    type="text"
                                    name="manufacturer"
                                    value={product.manufacturer}
                                    onChange={handleInputChange}
                                    placeholder="Nhập thương hiệu"
                                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-4 py-2 text-xs outline-none focus:border-[#3C50E0] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-2">Xuất xứ (Quốc gia)</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={product.country}
                                    onChange={handleInputChange}
                                    placeholder="Ví dụ: Việt Nam, Pháp..."
                                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-4 py-2 text-xs outline-none focus:border-[#3C50E0] transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

                            <div className="flex items-center h-full pt-6">
                                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="prescription"
                                        checked={product.prescription}
                                        onChange={handleInputChange}
                                        className="rounded border-[#D2D6DC] text-[#3C50E0] focus:ring-[#3C50E0] w-4 h-4 cursor-pointer"
                                    />
                                    Sản phẩm này cần kê đơn thuốc độc quyền của dược sĩ
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-2">Mô tả</label>
                            <textarea
                                name="description"
                                rows="3"
                                value={product.description}
                                onChange={handleInputChange}
                                placeholder="Receipt Info (optional)"
                                className="w-full bg-white border border-[#E2E8F0] rounded-md px-4 py-2 text-xs outline-none focus:border-[#3C50E0] transition-all resize-y"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* KHỐI 2: HÌNH ẢNH SẢN PHẨM (ĐÃ CHUYỂN ĐỔI CHỌN FILE VÀ HIỂN THỊ ẢNH THẬT) */}
                <div style={{ borderRadius: '1rem' }} className="bg-white rounded-sm  border border-[#E2E8F0] overflow-hidden">
                    <div className="border-b border-[#E2E8F0] p-3 bg-[#F8FAFC]">
                        <h5 className="font-bold text-sm">Hình ảnh sản phẩm</h5>
                    </div>
                    <div className="p-6 space-y-6">

                        {/* 1. Phần ảnh chính */}
                        <div>
                            <label className="block text-xs font-semibold mb-2 text-[#3C50E0]">Ảnh đại diện chính</label>
                            {product.primaryImageUrl ? (
                                <div className="relative w-36 h-36 border border-[#E2E8F0] rounded-lg overflow-hidden bg-[#F8FAFC] group shadow-xs">
                                    <img
                                        src={product.primaryImageUrl}
                                        alt="Primary Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemovePrimaryImage}
                                        className="absolute inset-0 bg-black/60 text-white text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                        ✕ Thay đổi ảnh
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-36 h-36 border-2 border-dashed border-[#CBD5E1] hover:border-[#3C50E0] rounded-lg cursor-pointer bg-[#F8FAFC] transition-colors group">
                                    <div className="flex flex-col items-center justify-center p-2 text-center">
                                        <svg className="w-5 h-5 mb-1.5 text-[#64748B] group-hover:text-[#3C50E0] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                        <p className="text-[11px] font-medium text-[#64748B] group-hover:text-[#3C50E0] transition-colors">Chọn ảnh chính ảnh dưới 5mb(định dạng jpg,jpeg,png)</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePrimaryImageChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>

                        {/* 2. Phần ảnh phụ (Album) */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <label className="block text-xs font-semibold text-[#1C2434]">Album ảnh phụ kèm theo</label>
                                    <p className="text-[10px] text-[#8A99AD] mt-0.5">Có thể chọn cùng lúc một hoặc nhiều tệp ảnh</p>
                                </div>
                                <label className="bg-[#3C50E0] text-white px-3 py-1.5 rounded text-[11px] font-medium hover:bg-opacity-90 cursor-pointer  transition-all">
                                    + Thêm ảnh từ máy tính
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleSubImagesUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {product.subImageUrls.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0]">
                                    {product.subImageUrls.map((item) => (
                                        <div key={item.id} className="relative aspect-square border border-[#E2E8F0] rounded-md overflow-hidden bg-white group shadow-xs">
                                            <img
                                                src={item.imageUrl}
                                                alt="Sub variant file"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSubImage(item.id)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors  cursor-pointer"
                                                title="Xóa hình này"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border border-dashed border-[#E2E8F0] rounded-lg p-5 text-center bg-[#F8FAFC]">
                                    <p className="text-xs text-[#8A99AD] italic">Mỗi ảnh dưới 5mb(định dạng jpg,jpeg,png)</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* KHỐI 3: THÔNG SỐ ĐẶC THÙ */}
                <div style={{ borderRadius: '1rem' }} className="bg-white rounded-sm  border border-[#E2E8F0]">
                    <div style={{ borderRadius: '1rem 0 0 0' }} className="border-b border-[#E2E8F0] p-2 bg-[#F8FAFC] flex justify-between items-center">
                        <h5 className="font-bold text-sm">Thông số chi tiết</h5>
                        <button
                            type="button"
                            onClick={handleAddSpec}
                            className="bg-[#3C50E0] text-white px-3 py-1 rounded text-[11px] font-medium hover:bg-opacity-90"
                        >
                            + Thêm thông số
                        </button>
                    </div>
                    <div className="p-6 space-y-3">
                        {product.specifications.map((spec, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                <div className="md:col-span-4">
                                    <input
                                        type="text"
                                        value={spec.specKey}
                                        onChange={(e) => handleSpecChange(index, 'specKey', e.target.value)}
                                        placeholder="Tên thông số (e.g., Tác dụng phụ)"
                                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-xs outline-none focus:border-[#3C50E0]"
                                    />
                                </div>
                                <div className="md:col-span-7">
                                    <input
                                        type="text"
                                        value={spec.specValue}
                                        onChange={(e) => handleSpecChange(index, 'specValue', e.target.value)}
                                        placeholder="Giá trị (e.g., Buồn ngủ nhẹ)"
                                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-xs outline-none focus:border-[#3C50E0]"
                                    />
                                </div>
                                <div className="md:col-span-1 text-right">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSpec(index)}
                                        className="text-xs text-red-500 hover:underline"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* KHỐI 4: QUẢN LÝ BIẾN THỂ & GIÁ CẢ */}
                <div style={{ borderRadius: '1rem' }} className="bg-white rounded-sm  border border-[#E2E8F0]">
                    <div style={{ borderRadius: '1rem 0 0 0' }} className="border-b border-[#E2E8F0] p-2 bg-[#F8FAFC] flex justify-between items-center">
                        <h5 className="font-bold text-sm">Biến thể sản phẩm</h5>
                        <button
                            type="button"
                            onClick={handleAddVariant}
                            className="bg-[#3C50E0] text-white px-3 py-1 rounded text-[11px] font-medium hover:bg-opacity-90"
                        >
                            + Thêm biến thể
                        </button>
                    </div>
                    <div className="p-4 overflow-x-auto">
                        <table className="w-full table-auto text-xs border-collapse">
                            <thead>
                                <tr className="bg-[#F7F9FC] text-[#64748B] border-b border-[#E2E8F0]">
                                    <th className="p-2 text-left w-12">Mặc định</th>
                                    <th className="p-2 text-left min-w-[160px]">Tên phân loại / Quy cách</th>
                                    <th className="p-2 text-left w-32">Giá bán (đ)</th>
                                    <th className="p-2 text-left w-32">Giá gốc (đ)</th>
                                    <th className="p-2 text-left w-24">Kho hàng</th>
                                    <th className="p-2 text-center w-16">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {product.variants.map((v, index) => (
                                    <tr key={v.id} className="hover:bg-[#F8FAFC]">
                                        <td className="p-2 text-center">
                                            <input
                                                type="radio"
                                                name="defaultVariant"
                                                checked={v.variantDefault}
                                                onChange={() =>
                                                    setProduct(prev => ({
                                                        ...prev,
                                                        variants: prev.variants.map((v, i) => ({
                                                            ...v,
                                                            variantDefault: i === index
                                                        }))
                                                    }))
                                                }
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={v.variantName}
                                                onChange={(e) => handleVariantChange(index, 'variantName', e.target.value)}
                                                placeholder="Ví dụ: Vỉ 10 viên, Chai 100ml"
                                                className="w-full bg-white border border-[#E2E8F0] rounded p-1.5 text-xs outline-none focus:border-[#3C50E0]"
                                                required
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={v.price}
                                                onChange={(e) => handleVariantChange(index, 'price', Number(e.target.value))}
                                                className="w-full bg-white border border-[#E2E8F0] rounded p-1.5 text-xs outline-none focus:border-[#3C50E0]"
                                                min="0"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={v.originalPrice}
                                                onChange={(e) => handleVariantChange(index, 'originalPrice', Number(e.target.value))}
                                                className="w-full bg-white border border-[#E2E8F0] rounded p-1.5 text-xs outline-none focus:border-[#3C50E0]"
                                                min="0"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={v.stockQuantity}
                                                onChange={(e) => handleVariantChange(index, 'stockQuantity', Number(e.target.value))}
                                                className="w-full bg-white border border-[#E2E8F0] rounded p-1.5 text-xs outline-none focus:border-[#3C50E0]"
                                                min="0"
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveVariant(index)}
                                                className="text-red-500 hover:text-red-700 font-medium"
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* KHỐI NÚT HÀNH ĐỘNG DƯỚI CÙNG */}
                <div className="flex justify-end gap-3.5 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/products')}
                        className="px-6 py-2.5 border border-[#E2E8F0] bg-white text-[#1C2434] rounded-md text-xs font-medium hover:bg-[#F8FAFC] transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-[#3C50E0] text-white rounded-md text-xs font-medium hover:bg-opacity-90 transition-all disabled:opacity-50"
                    >
                        {
                            loading
                                ? 'Đang xử lý...'
                                : isEditMode
                                    ? 'Cập nhật sản phẩm'
                                    : 'Lưu sản phẩm'
                        }
                    </button>

                </div>

            </form>
        </div>
    );
};

export default ProductFormPage;