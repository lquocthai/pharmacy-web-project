import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import toast from 'react-hot-toast';
import categoryService from '../../services/categoryService';

export default function ProductPage() {
    const { slug } = useParams();

    const [categoryTree, setCategoryTree] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSub, setSelectedSub] = useState('all'); // Lưu danh mục con đang chọn lọc

    const scrollRef = useRef(null);

    const loadCategoryTree = async (slug) => {
        console.log('Loading category tree for slug:', slug);
        setLoading(true);

        try {
            const { data } = await categoryService.getCategoriesTree(slug);
            if (data.code === 0) setCategoryTree(data.result || []);
            console.log('Loaded categories:', data?.message);
        } catch (err) {
            toast.error('Không thể tải danh mục sản phẩm');
        } finally {
            setLoading(false);
        }
    };
    // 2. Gọi API lấy cấu trúc cây danh mục con
    useEffect(() => {
        // Không bỏ tham số vào dấu ngoặc tròn () của useEffect nữa
        loadCategoryTree(slug);
        setSelectedSub('all');
    }, [slug]); // Khi slug thay đổi, useEffect sẽ chạy lại

    // 3. Xử lý cuộn ngang của thanh Slider Danh mục con
    const handleScroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollAmount = clientWidth * 0.7; // Cuộn 70% chiều rộng khung hiển thị
            scrollRef.current.scrollTo({
                left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (loading) {
        return <div className="container text-center py-5">Đang tải danh mục...</div>;
    }

    return (
        <div className="bg-light min-vh-100 py-3">
            <div className="container-xl">

                {/* ── BREADCRUMB (Đường dẫn) ── */}
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-2" style={{ fontSize: '14px' }}>
                        <li className="breadcrumb-item"><a href="/" className="text-decoration-none text-secondary">Trang chủ</a></li>
                        <li className="breadcrumb-item active text-dark fw-medium" aria-current="page">
                            {categoryTree?.name || 'Danh mục'}
                        </li>
                    </ol>
                </nav>

                {/* ── TIÊU ĐỀ DANH MỤC CHA ── */}
                <h1 className="fw-bold mb-4 text-dark" style={{ fontSize: '28px' }}>
                    {categoryTree?.name}
                </h1>

                {/* ── GRID/SLIDER DANH MỤC CON ── */}
                <div className="position-relative mb-4 px-2 d-flex align-items-center">

                    {/* Nút dịch trái (Ẩn/Hiện tuỳ ý bạn tối ưu thêm, mặc định thiết kế cần khi tràn) */}
                    <button
                        className="btn btn-light rounded-circle shadow-sm position-absolute start-0 z-3 d-none d-md-flex align-items-center justify-content-center"
                        style={{ width: '40px', height: '40px', left: '-15px' }}
                        onClick={() => handleScroll('left')}
                    >
                        <FaChevronLeft size={14} className="text-secondary" />
                    </button>

                    {/* Vùng chứa danh mục con hỗ trợ scroll mượt */}
                    <div
                        ref={scrollRef}
                        className="d-flex align-items-center gap-3 overflow-x-auto w-100 pb-2 hide-scrollbar"
                        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}                    >
                        {/* Box "Tất cả" sản phẩm đầu danh sách */}
                        <div
                            className={`card flex-shrink-0 text-center border-0 p-3 shadow-sm rounded-3 cursor-pointer ${selectedSub === 'all' ? 'border border-2 border-primary' : ''}`}
                            style={{ width: '160px', scrollSnapAlign: 'start', transition: 'all 0.2s', cursor: 'pointer' }}
                            onClick={() => setSelectedSub('all')}
                        >
                            <div className="d-flex align-items-center justify-content-center mb-2 rounded-circle bg-primary bg-opacity-10 mx-auto" style={{ width: '56px', height: '56px' }}>
                                <span className="fw-bold text-primary" style={{ fontSize: '11px' }}>ALL</span>
                            </div>
                            <span className="fw-semibold text-dark text-truncate d-block w-100" style={{ fontSize: '14px' }}>
                                Tất cả sản phẩm
                            </span>
                        </div>

                        {/* Duyệt mảng con `children` trả về từ API của bạn */}
                        {categoryTree?.children && categoryTree.children.map((child) => (
                            <div
                                key={child.id}
                                className={`card flex-shrink-0 text-center border-0 p-3 shadow-sm rounded-3 ${selectedSub === child.slug ? 'border border-2 border-primary' : ''}`}
                                style={{ width: '160px', scrollSnapAlign: 'start', transition: 'all 0.2s', cursor: 'pointer' }}
                                onClick={() => setSelectedSub(child.slug)}
                            >
                                {/* Hiển thị Icon từ DB, nếu không có sẽ lấy hình mặc định */}
                                <div className="mb-2 d-flex align-items-center justify-content-center mx-auto" style={{ width: '56px', height: '56px' }}>
                                    <img
                                        src={child.icon || 'https://cdn.nhathuoclongchau.com.vn/nid/category/default.png'}
                                        alt={child.name}
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    // onError={(e) => { e.target.src = 'https://nhathuoclongchau.com.vn/estore-images/category/duoc-my-pham/cham-soc-da-mat.png' }}
                                    />
                                </div>
                                <span className="fw-semibold text-dark" style={{ fontSize: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '42px', lineHeight: '21px' }}>
                                    {child.name}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Nút dịch phải giống hệt hình mẫu */}
                    <button
                        className="btn btn-light rounded-circle shadow-sm position-absolute end-0 z-3 d-flex align-items-center justify-content-center"
                        style={{ width: '40px', height: '40px', right: '-15px' }}
                        onClick={() => handleScroll('right')}
                    >
                        <FaChevronRight size={14} className="text-secondary" />
                    </button>
                </div>
                <div>danh sách sản phẩm chưa làm</div>



            </div>
        </div>
    );
}