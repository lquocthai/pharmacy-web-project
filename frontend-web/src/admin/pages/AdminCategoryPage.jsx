import React, { useState } from 'react';
import CategoryFormModal from './CategoryFormPage';
import { Navigate, useNavigate } from 'react-router-dom';

// Mock Data mẫu giống hệt JSON API của dự án phục vụ hiển thị
const MOCK_CATEGORIES = [
    {
        id: "cat-01",
        name: "Thực phẩm chức năng",
        slug: "thuc-pham-chuc-nang",
        description: "Vitamin, khoáng chất, thực phẩm bổ sung",
        parentId: null,
        icon: "fa-capsules",
        children: [
            { id: "cat-06", name: "Vitamin & Khoáng chất", description: "Vitamin A, B, C, D, Canxi, Sắt...", parentId: "cat-01", children: [] },
            { id: "cat-07", name: "Hỗ trợ tiêu hóa", description: "Probiotic, men tiêu hóa, enzyme", parentId: "cat-01", children: [] }
        ]
    },
    {
        id: "cat-02",
        name: "Dược mỹ phẩm",
        slug: "duoc-my-pham",
        description: "Các sản phẩm chăm sóc sức khỏe chủ động",
        parentId: null,
        icon: "fa-magic",
        children: [
            { id: "fc343657", name: "Chăm sóc da mặt", description: "Chăm sóc da mặt chuyên sâu", parentId: "cat-02", children: [] },
            { id: "381e5170", name: "Chăm sóc cơ thể", description: "Chăm sóc da body cơ bản", parentId: "cat-02", children: [] }
        ]
    }
];

const AdminCategoryPage = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState(MOCK_CATEGORIES);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // State phân trang & tìm kiếm
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Bộ lọc dữ liệu tìm kiếm
    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Tính toán phân trang
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

    const handleOpenCreateModal = () => {
        setSelectedCategory(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (category) => {
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    const handleSaveCategory = (formData) => {
        if (selectedCategory) {
            // LOGIC CALL API: updateCategory(selectedCategory.id, formData)
            setCategories(categories.map(c => c.id === selectedCategory.id ? { ...c, ...formData } : c));
            alert(`Đã cập nhật danh mục: ${formData.name}`);
        } else {
            // LOGIC CALL API: createCategory(formData)
            const newCat = { id: `cat-${Date.now()}`, ...formData, slug: formData.name.toLowerCase().replace(/ /g, '-') };
            setCategories([...categories, newCat]);
            alert(`Đã tạo danh mục mới: ${formData.name}`);
        }
        setIsModalOpen(false);
    };

    const handleDeleteCategory = (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này cùng toàn bộ danh mục con của nó?")) {
            // LOGIC CALL API: deleteCategory(id)
            setCategories(categories.filter(c => c.id !== id));
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 text-slate-600 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Upper Dashboard: Title & Action Button */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold text-slate-950 tracking-tight">Quản lý danh mục</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Thiết lập cấu trúc cây menu đa cấp cho sản phẩm nhà thuốc</p>
                    </div>
                    <button onClick={() => navigate('/admin/categories/create')} className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        Thêm danh mục
                    </button>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="relative w-full md:max-w-sm">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input type="text" placeholder="Tìm tên danh mục, mô tả..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 text-sm rounded-lg border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="text-xs text-slate-400 font-medium">Tìm thấy {filteredCategories.length} danh mục</div>
                </div>

                {/* Main Data Table Container */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-3.5">Cấu trúc Danh Mục (Cha & Con)</th>
                                    <th className="px-6 py-3.5 hidden md:table-cell">Slug URL</th>
                                    <th className="px-6 py-3.5 hidden sm:table-cell">Mô tả</th>
                                    <th className="px-6 py-3.5 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {paginatedCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-10 text-slate-400 text-sm">Không tìm thấy dữ liệu danh mục tương ứng</td>
                                    </tr>
                                ) : (
                                    paginatedCategories.map((parent) => (
                                        <React.Fragment key={parent.id}>
                                            {/* Dòng Danh mục CHA GỐC */}
                                            <tr className="hover:bg-slate-50/50 bg-indigo-50/10 transition-colors group">
                                                <td className="px-6 py-4 font-semibold text-slate-900">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                            <i className={`fas ${parent.icon || 'fa-folder'}`}></i>
                                                        </div>
                                                        <div>
                                                            <span className="block">{parent.name}</span>
                                                            <span className="block text-[10px] text-slate-400 font-mono tracking-tight">{parent.id}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell text-slate-500 font-mono text-xs">{parent.slug}</td>
                                                <td className="px-6 py-4 hidden sm:table-cell text-slate-500 max-w-xs truncate">{parent.description}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button onClick={() => handleOpenEditModal(parent)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Sửa danh mục">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </button>
                                                        <button onClick={() => handleDeleteCategory(parent.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa danh mục">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Các dòng Danh mục CON thuộc về Cha trên */}
                                            {parent.children && parent.children.map((child) => (
                                                <tr key={child.id} className="hover:bg-slate-50/60 bg-white transition-colors">
                                                    <td className="px-6 py-3 pl-14 text-slate-600 text-xs md:text-sm">
                                                        <div className="flex items-center gap-2">
                                                            {/* Nhánh nối khuỷu chữ L hiển thị phân cấp trực quan */}
                                                            <span className="text-slate-300 font-mono select-none">└──</span>
                                                            <span className="font-medium text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded text-xs">{child.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 hidden md:table-cell text-slate-400 font-mono text-xs pl-14">{child.slug || 'Tự động sinh'}</td>
                                                    <td className="px-6 py-3 hidden sm:table-cell text-slate-400 text-xs truncate max-w-xs">{child.description}</td>
                                                    <td className="px-6 py-3 text-right text-slate-400 text-xs">
                                                        <span className="italic select-none pr-2">Quản lý qua nút sửa Cha</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {totalPages > 1 && (
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