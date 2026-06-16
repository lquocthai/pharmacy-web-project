import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import productAdminService from '../../admin/service/productAdminService';
import symptomService from '../service/symptomService'; // <-- Import Service triệu chứng

const PharmacistProductPage = () => {
    const navigate = useNavigate();
    // ─────────────────────────────────────────────
    // STATES
    // ─────────────────────────────────────────────
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedKeyword, setDebouncedKeyword] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [size] = useState(5);
    const [totalPages, setTotalPages] = useState(0);

    // Dropdown Action State
    const [activeDropdown, setActiveDropdown] = useState(null);

    // ── SYMPTOMS MODAL STATES ──
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAnimate, setModalAnimate] = useState(false); // Xử lý hiệu ứng trượt
    const [modalMode, setModalMode] = useState('add'); // 'add' hoặc 'edit'
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [symptomInputs, setSymptomInputs] = useState(['']); // Mảng chứa danh sách chuỗi đang nhập
    const [modalSubmitting, setModalSubmitting] = useState(false);

    // ─────────────────────────────────────────────
    // EFFECT: XỬ LÝ DEBOUNCE TÌM KIẾM 1 GIÂY
    // ─────────────────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(searchTerm);
            setPage(0);
        }, 1000);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // ─────────────────────────────────────────────
    // FETCH DATA
    // ─────────────────────────────────────────────
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await categoryService.getAll();
            setCategories(res.data?.result || []);
        } catch (error) {
            console.error(error);
            toast.error('Không tải được danh mục');
        }
    };

    const flattenCategories = (categories, level = 0) => {
        let result = [];
        categories.forEach(category => {
            result.push({
                id: category.id,
                slug: category.slug,
                name: category.name,
                level
            });
            if (category.children?.length > 0) {
                result = [
                    ...result,
                    ...flattenCategories(category.children, level + 1)
                ];
            }
        });
        return result;
    };

    const categoryOptions = useMemo(() => flattenCategories(categories), [categories]);

    useEffect(() => {
        fetchProducts();
    }, [page, selectedCategoryFilter, debouncedKeyword]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = {
                page,
                size,
                sortBy: 'name',
                sortDir: 'desc'
            };

            if (selectedCategoryFilter) {
                params.categoryId = selectedCategoryFilter;
            }

            if (debouncedKeyword.trim()) {
                params.keyword = debouncedKeyword.trim();
            }

            const res = await productAdminService.getAdminProducts(params);
            const result = res.data?.result;
            setProducts(result?.content || []);
            setTotalPages(result?.totalPages || 0);
        } catch (error) {
            console.error(error);
            toast.error('Không tải được danh mục sản phẩm từ máy chủ');
        } finally {
            setLoading(false);
        }
    };

    // Click đóng dropdown hành động khi bấm ra ngoài
    useEffect(() => {
        const handleOutsideClick = () => setActiveDropdown(null);
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []);

    // ─────────────────────────────────────────────
    // HANDLERS: SYMPTOMS MODAL
    // ─────────────────────────────────────────────
    // ─────────────────────────────────────────────
    // HANDLERS: SYMPTOMS MODAL (CẬP NHẬT TỰ ĐỘNG GỌI API)
    // ─────────────────────────────────────────────
    const openSymptomModal = async (mode, product) => {
        setModalMode(mode);
        setSelectedProduct(product);
        setIsModalOpen(true);

        // Kích hoạt hiệu ứng trượt xuống liền cho modal đẹp mắt
        setTimeout(() => setModalAnimate(true), 50);

        try {
            setModalSubmitting(true); // Tạm thời bật loading trong lúc đợi API trả về

            // Gọi API lấy các triệu chứng đã có của sản phẩm từ Backend
            const res = await symptomService.getSymptomsByProduct(product.id);

            // Giả định Backend trả về mảng chuỗi trong res.data.result (Ví dụ: ["Đau đầu", "Sốt"])
            const currentSymptoms = res.data?.result || [];

            if (currentSymptoms.length > 0) {
                setSymptomInputs(currentSymptoms);
            } else {
                setSymptomInputs(['']); // Nếu sản phẩm chưa có triệu chứng nào, hiển thị 1 ô trống để nhập
            }
        } catch (error) {
            console.error("Lỗi lấy triệu chứng sản phẩm:", error);
            // Nếu API lỗi hoặc chưa viết kịp ở backend, fallback giữ nguyên 1 ô trống để không bị lỗi giao diện
            setSymptomInputs(['']);
            toast.error('Không thể lấy danh sách triệu chứng hiện tại từ máy chủ');
        } finally {
            setModalSubmitting(false);
        }
    };

    const closeSymptomModal = () => {
        setModalAnimate(false);
        // Chờ hiệu ứng ẩn kết thúc (300ms) rồi mới đóng hẳn trong DOM
        setTimeout(() => {
            setIsModalOpen(false);
            setSelectedProduct(null);
            setSymptomInputs(['']);
        }, 300);
    };

    const handleAddSymptomField = () => {
        setSymptomInputs([...symptomInputs, '']);
    };

    const handleRemoveSymptomField = (index) => {
        if (symptomInputs.length === 1) {
            setSymptomInputs(['']); // Giữ lại ít nhất 1 ô nhập
            return;
        }
        const updated = symptomInputs.filter((_, i) => i !== index);
        setSymptomInputs(updated);
    };

    const handleSymptomInputChange = (index, value) => {
        const updated = [...symptomInputs];
        updated[index] = value;
        setSymptomInputs(updated);
    };

    const handleSubmitSymptoms = async (e) => {
        e.preventDefault();

        // Lọc bỏ các dòng trống không nhập chữ
        const validNames = symptomInputs.map(name => name.trim()).filter(name => name !== '');

        if (validNames.length === 0) {
            toast.error('Vui lòng nhập ít nhất một triệu chứng!');
            return;
        }

        try {
            setModalSubmitting(true);
            if (modalMode === 'add') {
                await symptomService.addSymptoms(selectedProduct.id, validNames);
                toast.success('Thêm triệu chứng thành công!');
            } else {
                await symptomService.editSymptoms(selectedProduct.id, validNames);
                toast.success('Cập nhật triệu chứng thành công!');
            }
            fetchProducts(); // Tải lại danh sách sản phẩm để cập nhật dữ liệu mới
            closeSymptomModal();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setModalSubmitting(false);
        }
    };


    return (
        <div className="min-h-screen bg-[#F1F5F9] p-0 md:p-6 text-[#1C2434] font-satoshi">
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h2 className="text-xl font-bold text-[#1C2434]">Quản lý sản phẩm</h2>
                </div>
                <p className="text-xs text-[#64748B]">Home &gt; Danh sách sản phẩm</p>
            </div>

            <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0]">

                {/* ── 1. HEADER SECTION ── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-2 border-b border-[#E2E8F0]">
                    <div>
                        <h2 className="text-lg text-start font-bold text-[#1C2434]">Danh sách sản phẩm</h2>
                    </div>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button onClick={fetchProducts} className="flex items-center justify-center gap-1.5 bg-white border border-[#E2E8F0] text-[#1C2434] px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#F8FAFC] transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Tải lại
                        </button>

                    </div>
                </div>

                {/* ── 2. FILTER BAR ── */}
                <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col md:flex-row justify-between items-center gap-3">
                    <div className="relative w-full md:w-72">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                            <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            className="w-full bg-white border border-[#E2E8F0] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#1C2434] placeholder-[#8A99AD] focus:outline-none focus:border-[#3C50E0] transition-all"
                            placeholder="Tìm kiếm theo từ khóa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm !== debouncedKeyword && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                                <div className="animate-spin w-3 h-3 border-2 border-[#3C50E0] border-t-transparent rounded-full"></div>
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <select
                            className="bg-white border border-[#E2E8F0] rounded-md px-2 py-1.5 text-xs text-[#1C2434] focus:outline-none focus:border-[#3C50E0] transition-all min-w-[180px]"
                            value={selectedCategoryFilter}
                            onChange={(e) => {
                                setSelectedCategoryFilter(e.target.value);
                                setPage(0);
                            }}
                        >
                            <option value="">Tất cả danh mục</option>
                            {categoryOptions.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {'— '.repeat(cat.level)}{cat.name}
                                </option>
                            ))}
                        </select>


                    </div>
                </div>

                {/* ── 3. TABLE DATA SECTION ── */}
                {loading ? (
                    <div className="p-10 text-center text-[#64748B] font-medium text-xs">
                        <div className="animate-spin inline-block w-5 h-5 border-[2.5px] border-current border-t-transparent text-[#3C50E0] rounded-full mr-2" role="status"></div>
                        Loading products...
                    </div>
                ) : (
                    <>
                        <div className="max-w-full overflow-x-auto no-scrollbar">
                            <table className="w-full table-auto text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#E2E8F0] bg-[#F7F9FC] text-xs font-semibold text-[#64748B]">
                                        <th className="py-2.5 pl-4 w-10">
                                            <input type="checkbox" className="rounded border-[#D2D6DC] text-[#3C50E0] focus:ring-[#3C50E0] w-3.5 h-3.5 cursor-pointer" />
                                        </th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Sản phẩm</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Danh mục</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Sản phẩm kê đơn</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Biến thể & Giá</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold text-right pr-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-[#E2E8F0]">
                                    {products.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center p-8 text-[#64748B] font-medium">
                                                Không có sản phẩm nào phù hợp với từ khóa tìm kiếm.
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map((product) => {
                                            const defaultVariant = product.variants?.find(v => v.variantDefault) || product.variants?.[0];
                                            const isOutOfStock = !defaultVariant || defaultVariant.stockQuantity <= 0;

                                            return (
                                                <tr key={product.id} className="hover:bg-[#F8FAFC] transition-colors">
                                                    <td className="p-2.5 pl-4">
                                                        <input type="checkbox" className="rounded border-[#D2D6DC] text-[#3C50E0] focus:ring-[#3C50E0] w-3.5 h-3.5 cursor-pointer" />
                                                    </td>
                                                    <td className="p-2.5 max-w-[280px]">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-9 h-9 rounded bg-[#F8FAFC] border border-[#E2E8F0] p-0.5 flex-shrink-0 flex items-center justify-center">
                                                                <img
                                                                    src={product.primaryImageUrl || 'https://via.placeholder.com/50'}
                                                                    alt={product.name}
                                                                    className="max-w-full max-h-full object-contain"
                                                                />
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <p className="font-semibold text-xs text-[#1C2434] truncate hover:text-[#3C50E0] cursor-pointer">
                                                                    {product.name}
                                                                </p>
                                                                <p className="text-[10px] text-[#64748B] mt-0.5 truncate">
                                                                    Origin: {product.country || 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-2.5 text-[#64748B] font-medium">
                                                        {product.categoryName || 'Uncategorized'}
                                                    </td>
                                                    <td className="p-2.5">
                                                        {product.prescription ? (
                                                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600 border border-red-100">Kê đơn</span>
                                                        ) : (
                                                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 text-[#64748B] border border-[#E2E8F0]">Không kê đơn</span>
                                                        )}
                                                    </td>
                                                    <td className="p-2.5">
                                                        <div className="flex flex-col gap-1 max-w-[240px]">
                                                            {product.variants?.map((v) => (
                                                                <div
                                                                    key={v.id}
                                                                    className={`flex items-center justify-between text-[11px] p-1 px-1.5 rounded ${v.variantDefault ? 'bg-[#EBF0FF] text-[#3C50E0] font-semibold' : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]'}`}
                                                                >
                                                                    <span className="truncate mr-1.5">📦 {v.variantName || 'Default'} ({v.sku})</span>
                                                                    <span className="font-bold whitespace-nowrap">
                                                                        {v.price?.toLocaleString('vi-VN')}đ ({v.stockQuantity})
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            <div className="mt-0.5">
                                                                {isOutOfStock ? (
                                                                    <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[#FEE2E2] text-[#EF4444]">Out of Stock</span>
                                                                ) : (
                                                                    <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[#DCFCE7] text-[#10B981]">In Stock</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="p-2.5 text-right pr-4 relative" style={{ zIndex: activeDropdown === product.id ? 40 : 'auto' }}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveDropdown(activeDropdown === product.id ? null : product.id);
                                                            }}
                                                            className="text-[#64748B] hover:text-[#1C2434] p-1 rounded-full hover:bg-[#F1F5F9] transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                        </button>

                                                        {activeDropdown === product.id && (
                                                            <div className="absolute right-4 top-[80%] w-36 bg-white border border-[#E2E8F0] rounded shadow-xl py-1 z-[100] text-left token-dropdown">
                                                                <button onClick={() => navigate(`/pharmacist/products/detail/${product.slug}`)} className="w-full px-3 py-1.5 text-xs text-[#1C2434] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5">Chi tiết</button>

                                                                {/* THAY ĐỔI: Bấm mở modal thêm triệu chứng */}
                                                                <button
                                                                    onClick={() => openSymptomModal('add', product)}
                                                                    className="w-full px-3 py-1.5 text-xs text-[#1C2434] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5 font-medium"
                                                                >
                                                                    Thêm triệu chứng
                                                                </button>

                                                                {/* THAY ĐỔI: Bấm mở modal sửa triệu chứng */}
                                                                <button
                                                                    onClick={() => openSymptomModal('edit', product)}
                                                                    className="w-full px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-1.5 font-medium"
                                                                >
                                                                    Sửa triệu chứng
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ── 4. PAGINATION BAR ── */}
                        <div className="flex justify-between items-center px-4 py-3 border-t border-[#E2E8F0] bg-white relative z-10">
                            <span className="text-xs text-[#64748B]">Trang {page + 1}/{totalPages || 1}</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    className="px-2.5 py-1 text-[11px] font-medium border border-[#E2E8F0] rounded text-[#1C2434] bg-white hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    disabled={page === 0}
                                    onClick={() => setPage(prev => prev - 1)}
                                >
                                    Trước
                                </button>
                                <button
                                    className="px-2.5 py-1 text-[11px] font-medium border border-[#E2E8F0] rounded text-[#1C2434] bg-white hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    disabled={page + 1 >= totalPages}
                                    onClick={() => setPage(prev => prev + 1)}
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ─────────────────────────────────────────────
                ── 5. MODAL TRIỆU CHỨNG (HIỆU ỨNG TRƯỢT XUỐNG)
                ───────────────────────────────────────────── */}
            {isModalOpen && (
                /* THAY ĐỔI: Sử dụng bg-slate-500/40 hoặc bg-gray-500/30 để tạo lớp phủ xám mờ hiện đại */
                <div className="fixed inset-0 z-[999] flex items-start justify-center p-4 overflow-y-auto bg-slate-500/40 backdrop-blur-[1px] transition-opacity duration-300">
                    <div
                        className={`bg-white rounded-lg shadow-2xl border border-[#E2E8F0] w-full max-w-md mt-12 transform transition-all duration-300 ease-out ${modalAnimate ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'
                            }`}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
                            <div>
                                <h3 className="text-sm font-bold text-[#1C2434]">
                                    {modalMode === 'add' ? 'Thêm triệu chứng mới' : 'Cập nhật triệu chứng'}
                                </h3>
                                <p className="text-[10px] text-[#64748B] mt-0.5 max-w-[320px] truncate">
                                    Sản phẩm: <span className="font-semibold text-[#3C50E0]">{selectedProduct?.name}</span>
                                </p>
                            </div>
                            <button
                                onClick={closeSymptomModal}
                                className="text-[#64748B] hover:text-[#1C2434] p-1 rounded-full hover:bg-[#F1F5F9] transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body / Form */}
                        {/* Thay thế phần hiển thị các ô input triệu chứng bên trong Modal bằng đoạn này để có hiệu ứng load */}
                        <form onSubmit={handleSubmitSymptoms}>
                            <div className="p-4 max-h-[60vh] overflow-y-auto no-scrollbar flex flex-col gap-2.5">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">
                                    Danh sách tên triệu chứng
                                </label>

                                {modalSubmitting && symptomInputs.length === 1 && symptomInputs[0] === '' ? (
                                    <div className="py-6 text-center text-xs text-[#64748B]">
                                        <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent text-[#3C50E0] rounded-full mr-2"></div>
                                        Đang tải triệu chứng hiện có...
                                    </div>
                                ) : (
                                    <>
                                        {symptomInputs.map((input, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-[#8A99AD] text-xs font-medium">
                                                        {index + 1}.
                                                    </span>
                                                    <input
                                                        type="text"
                                                        required
                                                        className="w-full bg-white border border-[#E2E8F0] rounded-md pl-7 pr-3 py-1.5 text-xs text-[#1C2434] placeholder-[#8A99AD] focus:outline-none focus:border-[#3C50E0] transition-all"
                                                        placeholder="Ví dụ: Đau đầu, sốt cao..."
                                                        value={input}
                                                        onChange={(e) => handleSymptomInputChange(index, e.target.value)}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSymptomField(index)}
                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-md transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={handleAddSymptomField}
                                            className="mt-1 flex items-center justify-center gap-1.5 w-full py-1.5 border border-dashed border-[#3C50E0] text-[#3C50E0] bg-blue-50 bg-opacity-30 rounded-md text-xs font-semibold hover:bg-opacity-70 transition-all"
                                        >
                                            + Thêm ô nhập triệu chứng mới
                                        </button>
                                    </>
                                )}
                            </div>


                            {/* Modal Footer */}
                            <div className="px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end gap-2 rounded-b-lg">
                                <button
                                    type="button"
                                    onClick={closeSymptomModal}
                                    className="px-3 py-1.5 border border-[#E2E8F0] rounded-md text-xs font-medium text-[#1C2434] bg-white hover:bg-[#F8FAFC] transition-all"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={modalSubmitting}
                                    className={`px-4 py-1.5 text-white rounded-md text-xs font-medium transition-all ${modalMode === 'add'
                                        ? 'bg-[#3C50E0] hover:bg-opacity-90'
                                        : 'bg-amber-500 hover:bg-opacity-90'
                                        } disabled:opacity-50`}
                                >
                                    {modalSubmitting ? (
                                        <div className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                                    ) : modalMode === 'add' ? (
                                        'Xác nhận thêm'
                                    ) : (
                                        'Xác nhận sửa'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacistProductPage;