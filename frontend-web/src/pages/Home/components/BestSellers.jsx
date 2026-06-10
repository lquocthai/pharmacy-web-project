import { Link } from 'react-router-dom';
import { ProductCard } from '../../Product/ProductPage';

/**
 * BestSellers — Section "Sản Phẩm Bán Chạy"
 * Nhận products từ HomePage.
 */

const SKELETON_COUNT = 8;

export default function BestSellers({ products = [], loading = false }) {
    console.log(products)
    return (
        <div className="container-xl py-3 ">
            <section className="py-5 rounded-4 pt-3" style={{ background: '#f7f9fb' }}>
                <div className="container-xl">
                    {/* Header */}
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <div>
                            <h2
                                className="fw-bold mb-1 text-start"
                                style={{
                                    fontFamily: 'Manrope, system-ui, sans-serif',
                                    fontSize: 24,
                                    color: '#191c1e',
                                }}
                            >
                                Sản Phẩm Mới
                            </h2>
                            <p className="mb-0 text-start" style={{ fontSize: 14, color: '#737686' }}>
                                Khám phá những sản phẩm mới nhất
                            </p>
                            <div style={{ width: 48, height: 3, background: '#2563EB', borderRadius: 2, marginTop: 6 }} />
                        </div>

                    </div>

                    {/* Grid */}
                    <div className="row g-3">
                        {loading
                            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                                <div key={i} className="col-6 col-sm-4 col-md-3 col-lg-3">
                                    <div
                                        className="rounded-3 overflow-hidden"
                                        style={{ background: '#fff', border: '1px solid #f1f5f9' }}
                                    >
                                        <div
                                            className="skeleton-line"
                                            style={{ width: '100%', aspectRatio: '1/1' }}
                                        />
                                        <div className="p-3 d-flex flex-column gap-2">
                                            <div className="skeleton-line" style={{ width: '80%', height: 14, borderRadius: 6 }} />
                                            <div className="skeleton-line" style={{ width: '50%', height: 14, borderRadius: 6 }} />
                                            <div className="skeleton-line" style={{ width: '100%', height: 34, borderRadius: 99 }} />
                                        </div>
                                    </div>
                                </div>
                            ))
                            : products.map((item) => (
                                <div key={item.id} className="col-6 col-sm-4 col-md-3 col-lg-3">
                                    <ProductCard product={item} />
                                    {console.log("123", item)}
                                </div>
                            ))}
                    </div>


                </div>
            </section>
        </div>
    );
}
