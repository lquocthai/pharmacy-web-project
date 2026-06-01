import React, { useState, useEffect } from 'react';

const CategoryFormPage = ({ categoryData, rootCategories, onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('');
    const [parentId, setParentId] = useState('');
    const [children, setChildren] = useState([]);

    // Đồng bộ dữ liệu khi trang được tải (dùng cho cả Thêm mới hoặc Sửa)
    useEffect(() => {
        if (categoryData) {
            setName(categoryData.name || '');
            setDescription(categoryData.description || '');
            setIcon(categoryData.icon || '');
            setParentId(categoryData.parentId || '');
            setChildren(categoryData.children || []);
        } else {
            setName('');
            setDescription('');
            setIcon('');
            setParentId('');
            setChildren([]);
        }
    }, [categoryData]);

    // Thêm một dòng danh mục con mới tinh
    const handleAddChildRow = () => {
        setChildren([...children, { id: null, name: '', description: '', icon: '' }]);
    };

    // Cập nhật giá trị danh mục con theo Index
    const handleChildChange = (index, field, value) => {
        const updatedChildren = [...children];
        updatedChildren[index][field] = value;
        setChildren(updatedChildren);
    };

    // Xóa dòng danh mục con tạm thời trên UI
    const handleRemoveChildRow = (index) => {
        setChildren(children.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            name,
            description,
            icon,
            parentId: parentId || null,
            children
        });
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 text-[#475569] font-sans">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Breadcrumb & Page Title (Đúng chuẩn style ảnh mẫu) */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h1 className="text-xl md:text-2xl font-bold text-[#0f172a]">
                        {categoryData ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-[#64748b]">
                        <span>Home</span>
                        <svg className="w-3 h-3 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        <span className="text-[#0f172a] font-medium">
                            {categoryData ? 'Edit Category' : 'Add Category'}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* KHỐI 1: THÔNG TIN DANH MỤC CHÍNH (Giống hệt khu vực Products Description trong ảnh) */}
                    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#f1f5f9]">
                            <h3 className="text-base font-semibold text-[#0f172a]">Thông tin danh mục</h3>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Row 1: Name & Category Parent */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-[#334155] mb-2">Tên danh mục *</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg border border-[#cbd5e1] text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="Nhập tên danh mục chính..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#334155] mb-2">Thuộc danh mục cha</label>
                                    <div className="relative">
                                        <select
                                            value={parentId}
                                            onChange={(e) => setParentId(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-lg border border-[#cbd5e1] text-sm text-[#0f172a] bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                                        >
                                            <option value="">Không có (Là danh mục gốc cấp cao nhất)</option>
                                            {rootCategories.filter(c => c.id !== categoryData?.id).map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-[#64748b]">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Icon Class */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-semibold text-[#334155] mb-2">Icon Class (FontAwesome)</label>
                                    <input
                                        type="text"
                                        value={icon}
                                        onChange={(e) => setIcon(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg border border-[#cbd5e1] text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="fa-capsules, fa-prescription..."
                                    />
                                </div>
                            </div>

                            {/* Row 3: Description Textarea */}
                            <div>
                                <label className="block text-sm font-semibold text-[#334155] mb-2">Mô tả danh mục</label>
                                <textarea
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-[#cbd5e1] text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                    placeholder="Nhập thông tin mô tả chi tiết danh mục tại đây (Tùy chọn)..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* KHỐI 2: QUẢN LÝ DANH MỤC CẤP CON TRỰC THUỘC */}
                    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-[#0f172a]">Danh mục con kèm theo</h3>
                                <p className="text-xs text-[#64748b] mt-0.5">Các danh mục phụ sẽ hiển thị lồng trong danh mục chính này</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddChildRow}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-3 py-2 rounded-lg transition-all"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                Thêm danh mục con
                            </button>
                        </div>

                        <div className="p-6">
                            {children.length === 0 ? (
                                <div className="text-center py-12 border border-dashed border-[#cbd5e1] rounded-xl text-sm text-[#64748b] bg-[#f8fafc]/50">
                                    <svg className="w-8 h-8 mx-auto text-[#94a3b8] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    Chưa có danh mục cấp con nào. Bấm nút phía trên để bắt đầu thêm mới.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {children.map((child, index) => (
                                        <div key={index} className="flex gap-3 p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-sm items-start transition-all hover:border-[#cbd5e1] group">
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#475569] mb-1.5">Tên danh mục con *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={child.name}
                                                        onChange={(e) => handleChildChange(index, 'name', e.target.value)}
                                                        className="w-full px-3.5 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-lg text-xs text-[#0f172a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                        placeholder="Ví dụ: Chăm sóc da mặt..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#475569] mb-1.5">Mô tả danh mục con</label>
                                                    <input
                                                        type="text"
                                                        value={child.description}
                                                        onChange={(e) => handleChildChange(index, 'description', e.target.value)}
                                                        className="w-full px-3.5 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-lg text-xs text-[#0f172a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                        placeholder="Mô tả ngắn tính năng..."
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveChildRow(index)}
                                                className="p-2 text-[#94a3b8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-5"
                                                title="Xóa dòng"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BOTTOM ACTIONS: NÚT ĐIỀU HƯỚNG CUỐI TRANG */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-5 py-2.5 text-sm font-semibold text-[#475569] bg-white hover:bg-[#f1f5f9] border border-[#cbd5e1] rounded-xl transition-all"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all"
                        >
                            Lưu danh mục
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default CategoryFormPage;