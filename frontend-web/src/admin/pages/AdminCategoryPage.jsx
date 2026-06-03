import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import categoryService from '../../services/categoryService';
import categoryAdminService from '../service/CategoryAdminService';
import toast from 'react-hot-toast';

const AdminCategoryPage = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // State lưu danh sách ID của các danh mục gốc đang được "MỞ"
    const [expandedIds, setExpandedIds] = useState([]);

    // State phân trang & tìm kiếm
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 2;

    // Hàm gọi API lấy danh sách danh mục
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await categoryService.getAll();
            if (response.data && response.data.code === 0) {
                const dataResult = response.data.result || [];
                setCategories(dataResult);

                // Mới vào trang: Mặc định mở tất cả các danh mục con lên
                const allParentIds = dataResult.map(cat => cat.id);
                setExpandedIds(allParentIds);
            } else {
                setCategories(response.data || []);
            }
        } catch (err) {
            console.error("Lỗi fetch danh mục:", err);
            setError("Không thể tải danh sách danh mục. Vui lòng thử lại sau!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Hàm đóng/mở thủ công khi click vào hàng danh mục gốc
    const toggleExpand = (id) => {
        if (expandedIds.includes(id)) {
            setExpandedIds(expandedIds.filter(item => item !== id)); // Đóng lại
        } else {
            setExpandedIds([...expandedIds, id]); // Mở ra
        }
    };

    // Hàm xử lý Xóa danh mục
    const handleDeleteCategory = async (id, name, isParent) => {
        const message = isParent
            ? `Bạn có chắc chắn muốn xóa danh mục gốc "${name}" cùng toàn bộ danh mục con của nó?`
            : `Bạn có chắc chắn muốn xóa danh mục con "${name}"?`;

        if (window.confirm(message)) {
            try {
                const response = await categoryAdminService.deleteCategory(id);
                if (response.data && response.data.code === 0) {
                    toast.success("Xóa danh mục thành công!");
                } else {
                    throw new Error(response.data?.message || "Lỗi không xác định khi xóa danh mục");
                }
                fetchCategories();
                setCurrentPage(1);
            } catch (err) {
                console.error("Lỗi khi xóa danh mục:", err);
                toast.error(err.response?.data?.message || "Xóa danh mục thất bại. Vui lòng thử lại!");
            }
        }
    };

    const handleOpenEditPage = (id) => {
        navigate(`/admin/categories/edit/${id}`);
    };

    // Bộ lọc Tìm kiếm Tree
    const filteredCategories = categories.filter(cat => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        const matchesParent =
            cat.name.toLowerCase().includes(query) ||
            cat.description.toLowerCase().includes(query);

        const matchesChildren = cat.children && cat.children.some(child =>
            child.name.toLowerCase().includes(query) ||
            child.description.toLowerCase().includes(query)
        );

        return matchesParent || matchesChildren;
    });

    // Tự động bung danh mục khi người dùng gõ tìm kiếm để hiển thị kết quả con trực quan
    useEffect(() => {
        if (searchQuery.trim() !== '') {
            const matchedParentIds = filteredCategories.map(cat => cat.id);
            setExpandedIds(prev => Array.from(new Set([...prev, ...matchedParentIds])));
        }
    }, [searchQuery]);

    // Tính toán phân trang dựa trên danh sách cây đã lọc
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 text-slate-600 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Thêm style ẩn thanh cuộn cho trình duyệt */}
                <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

                <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <h2 className="text-xl font-bold text-[#1C2434]">
                            Quản lý danh mục
                        </h2>
                    </div>
                    <p className="text-xs text-[#64748B]">
                        Home &gt; Danh sách danh mục
                    </p>
                </div>



                {/* Bảng hiển thị dữ liệu chính */}
                <div className="bg-white rounded-2xl border border-slate-200/80  overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-3 border-b border-[#E2E8F0]">
                        <div>
                            <h2 className="text-lg text-start font-bold text-[#1C2434]">Danh sách danh mục</h2>
                        </div>
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                            <button className="flex items-center justify-center gap-1.5 bg-white border border-[#E2E8F0] text-[#1C2434] px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#F8FAFC] transition-all">
                                <svg className="w-3.5 h-3.5 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16v1a3 3 0 003 3h12a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export
                            </button>
                            <button
                                onClick={() => navigate('/admin/categories/create')}
                                className="flex items-center justify-center gap-1.5 bg-[#3C50E0] text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-opacity-90 transition-all  w-full sm:w-auto"
                            >

                                Thêm danh mục
                            </button>
                        </div>
                    </div>
                    {/* Thanh tìm kiếm & Bộ lọc */}
                    <div style={{}} className="bg-white p-3  border border-slate-200/80  flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="relative w-full md:max-w-sm">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input type="text" placeholder="Tìm tên danh mục, mô tả..." value={searchQuery} onChange={handleSearchChange} className="w-full pl-9 pr-4 py-2 bg-slate-50 text-sm rounded-lg border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                        </div>


                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="p-2.5 pl-4">Cấu trúc Danh Mục (Cha & Con)</th>
                                    <th className="p-2.5 hidden md:table-cell">Slug URL</th>
                                    <th className="p-2.5 hidden sm:table-cell">Mô tả</th>
                                    <th className="p-2.5 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-12 text-slate-400 text-sm">
                                            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mr-2"></div>
                                            Đang tải dữ liệu danh mục...
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-10 text-red-500 font-medium text-sm">{error}</td>
                                    </tr>
                                ) : paginatedCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-10 text-slate-400 text-sm">Không tìm thấy dữ liệu danh mục tương ứng</td>
                                    </tr>
                                ) : (
                                    paginatedCategories.map((parent) => {
                                        const isExpanded = expandedIds.includes(parent.id);
                                        const hasChildren = parent.children && parent.children.length > 0;

                                        return (
                                            <React.Fragment key={parent.id}>

                                                {/* 1. DÒNG DANH MỤC GỐC (CHA) */}
                                                <tr className="hover:bg-slate-50/50 bg-indigo-50/10 transition-colors group">
                                                    <td className="px-6 py-4 font-semibold text-slate-900">
                                                        <div className="flex items-center gap-2.5">
                                                            {/* Nút bấm Xổ lên / Xổ xuống */}
                                                            <button
                                                                onClick={() => toggleExpand(parent.id)}
                                                                className={`w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-all ${!hasChildren ? 'opacity-0 pointer-events-none' : ''}`}
                                                            >
                                                                <svg
                                                                    className={`w-3.5 h-3.5 transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </button>

                                                            <div
                                                                className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 cursor-pointer select-none"
                                                                onClick={() => hasChildren && toggleExpand(parent.id)}
                                                            >
                                                                <img src={parent?.icon || '/default-icon.png'} alt='' />
                                                            </div>
                                                            <div
                                                                className="cursor-pointer select-none"
                                                                onClick={() => hasChildren && toggleExpand(parent.id)}
                                                            >
                                                                <span className="block hover:text-indigo-600 transition-colors">{parent.name}</span>
                                                                <span className="block text-[10px] text-slate-400 font-mono tracking-tight">{parent.id}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 hidden md:table-cell text-slate-500 font-mono text-xs">{parent.slug}</td>
                                                    <td className="px-6 py-4 hidden sm:table-cell text-slate-500 max-w-xs truncate">{parent.description}</td>

                                                    {/* Thao tác CHA */}
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button onClick={() => handleOpenEditPage(parent.id)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Sửa danh mục gốc">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                            </button>
                                                            <button onClick={() => handleDeleteCategory(parent.id, parent.name, true)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa danh mục gốc">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* 2. CÁC DÒNG DANH MỤC CON (Chỉ hiển thị khi `isExpanded` bằng true) */}
                                                {isExpanded && parent.children && parent.children.map((child) => (
                                                    <tr key={child.id} className="hover:bg-slate-50/60 bg-white transition-colors animate-fadeIn">
                                                        <td className="px-6 py-3 pl-20 text-slate-600 text-xs md:text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-slate-300 font-mono select-none">└──</span>
                                                                <div
                                                                    className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 cursor-pointer select-none"

                                                                >
                                                                    <img src={child?.icon || '/default-icon.png'} alt='' />
                                                                </div>
                                                                <span className="font-medium text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded text-xs">{child.name}</span>
                                                                <span className="text-[9px] text-slate-400 font-mono">({child.id})</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 hidden md:table-cell text-slate-400 font-mono text-xs pl-14">{child.slug || 'Tự động sinh'}</td>
                                                        <td className="px-6 py-3 hidden sm:table-cell text-slate-400 text-xs truncate max-w-xs">{child.description}</td>

                                                        {/* Thao tác CON: Chỉ có xóa */}
                                                        <td className="px-6 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1.5 pr-1">
                                                                <button onClick={() => handleDeleteCategory(child.id, child.name, false)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa danh mục con">
                                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Phân trang Footer */}
                    {!loading && totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
                            <span className="text-xs font-medium text-slate-500">Trang {currentPage} / {totalPages}</span>
                            <div className="flex items-center gap-1.5">
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors">
                                    Trước
                                </button>
                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors">
                                    Sau
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminCategoryPage;