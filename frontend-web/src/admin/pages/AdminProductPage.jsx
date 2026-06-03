import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import productAdminService from '../service/productAdminService';
import { useNavigate } from 'react-router-dom';

const AdminProductPage = () => {
    const navigate = useNavigate();
    // ─────────────────────────────────────────────
    // STATES
    // ─────────────────────────────────────────────
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Giữ nguyên ô nhập input hiển thị mượt mà không bị khựng
    const [searchTerm, setSearchTerm] = useState('');
    // State lưu từ khóa trì hoãn sau 1 giây để trigger gọi API
    const [debouncedKeyword, setDebouncedKeyword] = useState('');

    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [size] = useState(5);
    const [totalPages, setTotalPages] = useState(0);

    // Dropdown Action State
    const [activeDropdown, setActiveDropdown] = useState(null);

    // ─────────────────────────────────────────────
    // EFFECT: XỬ LÝ DEBOUNCE TÌM KIẾM 1 GIÂY
    // ─────────────────────────────────────────────
    useEffect(() => {
        // Cài đặt bộ đếm thời gian trì hoãn 1000ms (1 giây)
        const timer = setTimeout(() => {
            setDebouncedKeyword(searchTerm);
            setPage(0); // Mỗi lần từ khóa thay đổi, reset về trang 1 (page = 0)
        }, 1000);

        // Hàm dọn dẹp (cleanup): Hủy bộ đếm cũ nếu người dùng vẫn đang gõ tiếp
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

    // THAY ĐỔI: Lắng nghe thêm sự thay đổi của biến `debouncedKeyword` thay vì lọc thủ công ở Client
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

            // THAY ĐỔI: Gắn từ khóa tìm kiếm (đã được bọc dữ liệu sau 1s) vào tham số `keyword` để gửi lên API Backend
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


    return (
        <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-6 text-[#1C2434] font-satoshi">
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-3 border-b border-[#E2E8F0]">
                    <div>
                        <h2 className="text-lg text-start font-bold text-[#1C2434]">Danh sách sản phẩm</h2>
                        <p className="text-xs text-[#64748B] mt-0.5">Track your store's progress to boost your sales.</p>
                    </div>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button className="flex items-center justify-center gap-1.5 bg-white border border-[#E2E8F0] text-[#1C2434] px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#F8FAFC] transition-all">
                            <svg className="w-3.5 h-3.5 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16v1a3 3 0 003 3h12a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export
                        </button>
                        <button
                            onClick={() => navigate('/admin/products/create')}
                            className="flex items-center justify-center gap-1.5 bg-[#3C50E0] text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-opacity-90 transition-all w-full sm:w-auto"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Thêm sản phẩm
                        </button>
                    </div>
                </div>

                {/* ── 2. FILTER BAR ── */}
                <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col md:flex-row justify-between items-center gap-3">
                    {/* Search Input */}
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
                        {/* Hiển thị một icon nhỏ xoay nhẹ báo hiệu đang chờ người dùng dừng gõ */}
                        {searchTerm !== debouncedKeyword && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                                <div className="animate-spin w-3 h-3 border-2 border-[#3C50E0] border-t-transparent rounded-full"></div>
                            </span>
                        )}
                    </div>

                    {/* Category Filter & Filter Button */}
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

                        <button className="flex items-center gap-1.5 border border-[#E2E8F0] bg-white px-3 py-1.5 rounded-md text-xs font-medium text-[#1C2434] hover:bg-[#F8FAFC]">
                            <svg className="w-3.5 h-3.5 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                            </svg>
                            Filter
                        </button>
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
                                    {/* THAY ĐỔI: Duyệt trực tiếp danh sách mảng sản phẩm `products` trả từ API về (Vì API đã tự lọc theo keyword cho bạn rồi) */}
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
                                                            <div className="absolute right-4 top-[80%] w-32 bg-white border border-[#E2E8F0] rounded shadow-xl py-1 z-[100] text-left token-dropdown">
                                                                <button className="w-full px-3 py-1.5 text-xs text-[#1C2434] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5">Chi tiết</button>
                                                                <button onClick={() => navigate(`/admin/products/edit/${product.slug}`)} className="w-full px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors flex items-center gap-1.5">Sửa</button>
                                                                <button className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5">Xóa</button>
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
        </div>
    );
};

export default AdminProductPage;