import React, { useEffect, useState } from 'react';
import { Card, Button, Nav, Spinner } from 'react-bootstrap';
import { ChevronRight } from 'lucide-react';
import orderEmpty from '../../assets/order-not-found.svg';
import { useNavigate } from 'react-router-dom';
import prescriptionService from '../../services/prescriptionService';
import toast from 'react-hot-toast';

const MyPrescription = () => {
    const [activeStatus, setActiveStatus] = useState('all');
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const statuses = [
        { key: 'all', label: 'Tất cả' },
        { key: 'pending', label: 'Chờ tư vấn' },
        { key: 'consulted', label: 'Đã tư vấn' },
        { key: 'unreachable', label: 'Chưa thể liên lạc' },
        { key: 'cancelled', label: 'Đã hủy' }
    ];

    const statusMap = {
        all: null,
        pending: 'PENDING',
        consulted: 'CONSULTED',
        unreachable: 'UNREACHABLE',
        cancelled: 'CANCELLED'
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'PENDING':
                return {
                    label: 'Chờ tư vấn',
                    color: 'warning'
                };

            case 'CONSULTED':
                return {
                    label: 'Đã tư vấn',
                    color: 'success'
                };

            case 'UNREACHABLE':
                return {
                    label: 'Chưa thể liên lạc',
                    color: 'danger'
                };

            case 'CANCELLED':
                return {
                    label: 'Đã hủy',
                    color: 'secondary'
                };

            default:
                return {
                    label: status,
                    color: 'secondary'
                };
        }
    };

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);

            const status = statusMap[activeStatus];

            const response =
                await prescriptionService.getMyPrescriptions(
                    status
                );
            console.log(response.data);

            setPrescriptions(
                response?.data?.result || []
            );
        } catch (error) {
            console.error(error);

            toast.error(
                'Không thể tải danh sách đơn thuốc'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrescriptions();
    }, [activeStatus]);

    return (
        <div>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-1">
                <h6 className="fw-bold text-dark m-0">
                    Đơn thuốc của tôi
                </h6>

                <Button
                    className="rounded-pill px-3 py-1 fw-medium d-flex align-items-center gap-1 shadow-sm"
                    style={{
                        backgroundColor: '#1250dc',
                        border: 'none',
                        fontSize: '1rem'
                    }}
                    onClick={() =>
                        navigate('/create-prescription')
                    }
                >
                    Gửi yêu cầu mới
                </Button>
            </div>

            {/* Tabs */}
            <Nav
                variant="tabs"
                activeKey={activeStatus}
                onSelect={(selectedKey) =>
                    setActiveStatus(selectedKey)
                }
                className="border-bottom mb-4 flex-nowrap overflow-x-auto text-nowrap scrollbar-hidden"
                style={{ gap: '15px' }}
            >
                {statuses.map((tab) => (
                    <Nav.Item key={tab.key}>
                        <Nav.Link
                            eventKey={tab.key}
                            className={`px-3 pb-2 border-0 bg-transparent text-secondary position-relative ${activeStatus === tab.key
                                ? 'text-primary fw-bold border-bottom border-primary border-3'
                                : ''
                                }`}
                        >
                            {tab.label}
                        </Nav.Link>
                    </Nav.Item>
                ))}
            </Nav>

            {/* Loading */}
            {loading && (
                <div className="text-center py-5">
                    <Spinner animation="border" />
                </div>
            )}

            {/* Data */}
            {!loading && (
                <>
                    {prescriptions.length > 0 ? (
                        prescriptions.map((item) => {
                            const statusInfo =
                                getStatusInfo(item.status);

                            return (
                                <Card
                                    key={item.id}
                                    className="border-0 shadow-sm rounded-4 mb-3 overflow-hidden"
                                >
                                    <Card.Body className="p-0">
                                        {/* Header */}
                                        <div className="d-flex justify-content-between align-items-start border-bottom p-2 mb-3">
                                            <div className="d-flex flex-wrap align-items-center">
                                                <h5 className="fw-bold text-dark mb-0 fs-6">
                                                    Yêu cầu tư vấn #
                                                    {item.id.slice(
                                                        0,
                                                        8
                                                    )}
                                                </h5>

                                                <div className="d-flex align-items-center gap-2 ps-3">
                                                    <span
                                                        className="rounded-circle bg-secondary"
                                                        style={{
                                                            width: '6px',
                                                            height: '6px'
                                                        }}
                                                    />

                                                    <small className="text-muted">
                                                        {new Date(
                                                            item.createdAt
                                                        ).toLocaleString(
                                                            'vi-VN'
                                                        )}
                                                    </small>
                                                </div>
                                            </div>

                                            <div className="d-flex align-items-center gap-2">
                                                <span
                                                    className={`rounded-circle bg-${statusInfo.color}`}
                                                    style={{
                                                        width: '6px',
                                                        height: '6px'
                                                    }}
                                                />

                                                <span
                                                    className={`text-${statusInfo.color} fw-medium small`}
                                                >
                                                    {
                                                        statusInfo.label
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        {/* Detail */}
                                        <div className="mb-2 mx-3 border-bottom pb-2">
                                            <Button
                                                variant="link"
                                                className="p-0 text-decoration-none d-flex align-items-center gap-1 small fw-medium"
                                                style={{
                                                    color: '#1250dc'
                                                }}
                                                onClick={() =>
                                                    navigate(
                                                        `/profile/prescriptions/${item.id}`
                                                    )
                                                }
                                            >
                                                Xem chi tiết{' '}
                                                <ChevronRight
                                                    size={16}
                                                />
                                            </Button>
                                        </div>

                                        {/* Footer */}
                                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 pt-2 p-3">
                                            <p className="mb-0 text-secondary small">
                                                {item.note ||
                                                    'Dược sĩ sẽ liên hệ với bạn trong thời gian sớm nhất.'}
                                            </p>




                                        </div>
                                    </Card.Body>
                                </Card>
                            );
                        })
                    ) : (
                        <div className="text-center py-4 bg-white">
                            <img
                                src={orderEmpty}
                                alt="No prescriptions"
                                className="img-fluid mb-3 d-block mx-auto"
                                style={{
                                    maxWidth: '300px'
                                }}
                            />

                            <h6
                                className="text-dark mb-2"
                                style={{
                                    color: '#2c333f'
                                }}
                            >
                                Bạn chưa có yêu cầu nào.
                            </h6>

                            <p
                                className="text-muted small mb-4 px-3"
                                style={{
                                    maxWidth: '400px',
                                    margin: '0 auto',
                                    lineHeight: '1.5'
                                }}
                            >
                                Dược sĩ Quốc Thái luôn sẵn
                                lòng lắng nghe những yêu cầu
                                của bạn
                            </p>
                        </div>
                    )}
                </>
            )}

            <style>{`
                .scrollbar-hidden::-webkit-scrollbar {
                    display: none;
                }

                .scrollbar-hidden {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }

                .nav-tabs .nav-link.active {
                    color: #1250dc !important;
                }
            `}</style>
        </div>
    );
};

export default MyPrescription;