import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Spinner, Modal, Nav } from 'react-bootstrap';
import { User, FileText, Image as ImageIcon, ChevronLeft } from 'lucide-react';
import prescriptionService from '../../services/prescriptionService';
import toast from 'react-hot-toast';
import chatAvatar from '../../assets/avatar-chat.png';

const PrescriptionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [prescription, setPrescription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previewImage, setPreviewImage] = useState(null); // Lưu ảnh đang phóng to

    const getStatusInfo = (status) => {
        switch (status) {
            case 'PENDING': return { label: 'Chờ tư vấn', color: 'warning' };
            case 'CONSULTED': return { label: 'Đã tư vấn', color: 'success' };
            case 'UNREACHABLE': return { label: 'Chưa thể liên lạc', color: 'danger' };
            case 'CANCELLED': return { label: 'Đã hủy', color: 'secondary' };
            default: return { label: status || 'Chưa rõ', color: 'secondary' };
        }
    };

    const fetchPrescriptionDetail = async () => {
        try {
            setLoading(true);
            const response = await prescriptionService.getPrescriptionById(id);
            // Giả định dữ liệu trả về nằm trong response.data hoặc response.data.result
            setPrescription(response?.data?.result || response?.data);
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải chi tiết yêu cầu tư vấn');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchPrescriptionDetail();
        }
    }, [id]);
    console.log('Chi tiết đơn thuốc:', prescription);

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-2 small">Đang tải chi tiết đơn thuốc...</p>
            </div>
        );
    }

    if (!prescription) {
        return (
            <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                <p className="text-dark fw-medium">Không tìm thấy dữ liệu yêu cầu tư vấn.</p>
                <Button variant="primary" className="rounded-pill px-4" onClick={() => navigate(-1)}>
                    Quay lại
                </Button>
            </div>
        );
    }

    const statusInfo = getStatusInfo(prescription.status);
    const formattedDate = prescription.createdAt
        ? new Date(prescription.createdAt).toLocaleDateString('vi-VN')
        : '';
    const formattedTime = prescription.createdAt
        ? new Date(prescription.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '';

    return (
        <div className="container-fluid  py-1 container">
            {/* Breadcrumb điều hướng */}
            <Nav className="small mb-4 text-muted">
                Trang chủ / Cá nhân / <span className="text-primary ms-1 fw-bold">Chi tiết đơn thuốc</span>
            </Nav>

            {/* Khung nội dung chính */}
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                <Card.Body className="p-0">

                    {/* Header thông tin yêu cầu */}
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 border-bottom p-3 bg-white">
                        <div className="d-flex align-items-center flex-wrap gap-2">
                            <h5 className="fw-bold text-dark mb-0 fs-6">
                                Yêu cầu tư vấn {formattedDate}
                            </h5>
                            <span className="text-muted small">•</span>
                            <small className="text-muted">
                                {formattedTime}, {formattedDate}
                            </small>
                        </div>

                        {/* Trạng thái đơn */}
                        <div className="d-flex align-items-center gap-2">
                            <span className={`rounded-circle bg-${statusInfo.color}`} style={{ width: '8px', height: '8px' }} />
                            <span className={`text-${statusInfo.color} fw-bold small`}>
                                {statusInfo.label}
                            </span>
                        </div>
                    </div>

                    {/* Khối thông tin liên hệ và ghi chú chia đôi cột */}
                    <div className="p-4 bg-white">
                        <div className="row g-4">
                            {/* Cột trái: Thông tin khách hàng */}
                            <div className="text-start col-md-6 border-end-md">
                                <div className="d-flex align-items-center gap-2 text-secondary small mb-3">
                                    <User size={16} className="text-primary" />
                                    <span className="text-start fw-medium text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>Thông tin liên hệ</span>
                                </div>
                                <h5 className="fw-bold text-dark mb-1 fs-6">
                                    {prescription.fullName || 'Chưa cung cấp tên'}
                                </h5>
                                <p className="text-secondary small mb-0 font-monospace">
                                    {prescription.phoneNumber || 'Chưa cung cấp SĐT'}
                                </p>
                            </div>

                            {/* Cột phải: Nội dung ghi chú */}
                            <div className="text-start col-md-6 ps-md-4">
                                <div className="d-flex align-items-center gap-2 text-secondary small mb-3">
                                    <FileText size={16} className="text-primary" />
                                    <span className="fw-medium text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>Ghi chú của bạn</span>
                                </div>
                                <p className="text-dark small mb-0 lh-base">
                                    {prescription.note || 'Không có ghi chú bổ sung.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ================= KHU VỰC HIỂN THỊ HÌNH ẢNH ĐƠN THUỐC ĐÃ THÊM ================= */}
                    {/* ================= SỬA LẠI KHU VỰC HIỂN THỊ HÌNH ẢNH THEO ĐÚNG ĐỊNH DẠNG "imageUrls" ================= */}
                    {prescription.imageUrls && prescription.imageUrls.length > 0 && (
                        <div className="mx-4 border-top pt-3 pb-4">
                            <div className="d-flex align-items-center gap-2 text-secondary small mb-3">
                                <ImageIcon size={16} className="text-primary" />
                                <span className="fw-medium text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>
                                    Hình ảnh đơn thuốc tải lên ({prescription.imageUrls.length})
                                </span>
                            </div>
                            <div className="d-flex flex-wrap gap-3">
                                {prescription.imageUrls.map((imgUrl, index) => (
                                    <div
                                        key={index}
                                        className="position-relative overflow-hidden rounded-3 border img-hover-wrapper cursor-pointer shadow-sm"
                                        style={{ width: '100px', height: '100px' }}
                                        onClick={() => setPreviewImage(imgUrl)}
                                    >
                                        <img
                                            src={imgUrl}
                                            alt={`Đơn thuốc đính kèm ${index + 1}`}
                                            className="w-100 h-100 object-fit-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bottom Alert bar hành động */}
                    <div className="mx-3 mb-3 p-2 rounded-4 d-flex justify-content-between align-items-center flex-wrap gap-3 text-white" style={{ backgroundColor: '#eef3ff', border: '1px solid #d2e1ff' }}>
                        <div className="d-flex align-items-center gap-3">
                            {/* Avatar nữ dược sĩ thu nhỏ giả lập từ hệ thống */}
                            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm" style={{ width: '45px', height: '45px' }}>
                                <img
                                    src={chatAvatar}
                                    alt="Pharmacist Avatar"
                                    className="w-100 h-100 p-1 object-fit-contain"
                                />
                            </div>
                            <p className="mb-0 fw-medium small text-primary-emphasis">
                                {prescription.status === 'CONSULTED'
                                    ? 'Yêu cầu của bạn đã được các dược sĩ hỗ trợ tư vấn hoàn tất!'
                                    : 'Dược sỹ sẽ liên hệ lại cho bạn trong thời gian sớm nhất!'}
                            </p>
                        </div>


                    </div>
                </Card.Body>
            </Card>

            {/* Nút quay lại trang danh sách tĩnh */}
            <div className="mb-0">
                <Button variant="link" className="p-0 text-decoration-none d-flex align-items-center gap-1 text-secondary small" onClick={() => navigate(-1)}>
                    <ChevronLeft size={16} /> Quay lại danh sách đơn thuốc
                </Button>
            </div>

            {/* MODAL POPUP PHÓNG TO HÌNH ẢNH KHI CLICK */}
            <Modal show={!!previewImage} onHide={() => setPreviewImage(null)} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0"></Modal.Header>
                <Modal.Body className="text-center pt-0">
                    <img
                        src={previewImage}
                        alt="Đơn thuốc Phóng to"
                        className="img-fluid rounded-3 max-vh-75 shadow-lg object-fit-contain"
                    />
                </Modal.Body>
            </Modal>

            {/* CSS inline tinh chỉnh giao diện chuẩn */}
            <style>{`
                .border-end-md {
                    border-right: 1px solid #dee2e6;
                }
                @media (max-width: 767.98px) {
                    .border-end-md {
                        border-right: none !important;
                        border-bottom: 1px solid #dee2e6;
                        padding-bottom: 1rem;
                    }
                }
                .object-fit-cover { object-fit: cover; }
                .object-fit-contain { object-fit: contain; }
                .max-vh-75 { max-height: 75vh; }
                
                .img-hover-wrapper img {
                    transition: transform 0.25s ease-in-out;
                }
                .img-hover-wrapper:hover img {
                    transform: scale(1.08);
                }
                .text-primary-emphasis {
                    color: #0a3188 !important;
                }
            `}</style>
        </div>
    );
};

export default PrescriptionDetail;