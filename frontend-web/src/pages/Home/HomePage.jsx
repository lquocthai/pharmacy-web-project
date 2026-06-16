import { useState, useEffect } from 'react';
import homeService from '../../services/homeService';

import categoryService from '../../services/categoryService';
import productService from '../../services/productService';

import HeroBanner from './components/HeroBanner';
import TrustBadges from './components/TrustBadges';
import CategoryGrid from './components/CategoryGrid';
import BestSellers from './components/BestSellers';
import PromoBanner from './components/PromoBanner';
import HowItWorks from './components/HowItWorks';
import PharmacistCTA from './components/PharmacistCTA';
import HealthBlog from './components/HealthBlog';
import Testimonials from './components/Testimonials';
import NewsletterBanner from './components/NewsletterBanner';
import chantrang from '../../assets/chan_trang.png';
import { FaArrowUp } from 'react-icons/fa';
import '../Product/ProductPage.scss'


export function HomePage() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loadingCats, setLoadingCats] = useState(true);
    const [loadingProds, setLoadingProds] = useState(true);

    // Trạng thái ẩn/hiện của nút cuộn lên đầu trang
    const [showScrollButton, setShowScrollButton] = useState(false);

    useEffect(() => {
        // Gọi API lấy danh mục và sản phẩm bán chạy qua Service
        fetchCategories();
        fetchBestSellers();

        // Theo dõi sự kiện cuộn trang của trình duyệt
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollButton(true);
            } else {
                setShowScrollButton(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        // Hủy lắng nghe sự kiện khi component bị unmount
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchCategories = async () => {
        setLoadingCats(true);
        try {
            // Thay 'homeService.getAll()' hoặc 'categoryService.getAll()' tùy cấu hình định nghĩa của bạn
            const response = await categoryService.getAll();

            // Axios trả về dữ liệu nằm trong trường .data
            // Dựa vào cấu hình API của bạn: response.data.result
            setCategories(response.data?.result || []);
        } catch (error) {
            console.error('Fetch categories error via service:', error);
        } finally {
            setLoadingCats(false);
        }
    };

    // Thay đổi hàm gọi API cũ thành hàm này
    const fetchBestSellers = async () => {
        setLoadingProds(true);
        try {
            // Truyền các tham số theo yêu cầu của bạn:
            // categorySlug = null (lấy toàn bộ), page = 0, size = 8, sortBy = 'createdAt', sortDir = 'desc' (để sản phẩm mới nhất lên đầu)
            const response = await productService.getAllProducts(
                0,              // page
                8,              // size: chỉ lấy 8 sản phẩm
                'createdAt',    // sortBy: sắp xếp theo thời gian tạo để lấy sản phẩm mới
                'desc'          // sortDir: 'desc' để hàng mới nhất nằm trên cùng (bạn có thể đổi thành 'asc' nếu muốn)
            );

            // Bóc tách dữ liệu trả về từ ApiResponse cấu trúc Spring Boot của bạn
            const data = response.data?.result;
            console.log(data)

            // Kiểm tra xem dữ liệu trả về là mảng trực tiếp hay nằm trong PageResponse (.content)
            const list = Array.isArray(data) ? data : (data?.content || []);

            setProducts(list);
        } catch (error) {
            console.error('Fetch new products error via productService:', error);
        } finally {
            setLoadingProds(false);
        }
    };

    // Hàm xử lý khi click vào nút cuộn lên đầu trang
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <div className="position-relative">
            <div className="home-page container px-0" style={{ background: '#EAEFFA' }}>
                {/* 1. Hero Banner — slide tự động */}
                <HeroBanner />

                {/* 3. Danh mục nổi bật */}
                <CategoryGrid categories={categories} loading={loadingCats} />

                {/* 4. Sản phẩm bán chạy */}
                <BestSellers products={products} loading={loadingProds} />

                {/* 6. Quy trình mua thuốc */}
                <HowItWorks />

                {/* 7. Tư vấn dược sĩ */}
                <PharmacistCTA />

                <div>
                    <img className='w-100' src={chantrang} alt="chan trang" />
                </div>
            </div>

            {/* NÚT BẤM LÊN ĐẦU TRANG (Floating Back to Top Button) */}
            {showScrollButton && (
                <button
                    onClick={scrollToTop}
                    // 🌟 SỬA CLASS: Thêm d-none (ẩn trên mobile) và d-md-flex (hiện trên PC)
                    className="btn btn-primary rounded-circle position-fixed d-none d-md-flex align-items-center justify-content-center shadow-lg border-0"
                    style={{
                        // 🛠️ GIỮ NGUYÊN 100% CSS THỦ CÔNG CỦA BẠN
                        position: 'fixed',
                        bottom: '140px',
                        right: '44px',
                        width: '50px',
                        height: '50px',
                        zIndex: 1050,
                        backgroundColor: '#2563EB',

                        // 🚀 THÊM HIỆU ỨNG TRỒI LÊN / THU NHỎ KHI XUẤT HIỆN & BIẾN MẤT
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        animation: showScrollButton ? 'scrollToTopIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' : 'none',
                    }}
                    title="Lên đầu trang"
                >
                    {/* Nhúng đoạn style tạo hiệu ứng trồi lên/thu nhỏ trực tiếp vào đây để không cần sửa file CSS ngoài */}
                    <style>{`
            @keyframes scrollToTopIn {
                0% { opacity: 0; transform: scale(0.3) translateY(40px); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
            }
        `}</style>
                    <FaArrowUp size={20} color="#fff" />
                </button>
            )}
        </div>
    );
}