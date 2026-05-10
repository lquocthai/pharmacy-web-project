import React, { useState } from 'react';
import { Container, Row, Col, ListGroup, Card, Button, Nav, Modal } from 'react-bootstrap';
import LogoutModal from '../../components/Auth/LogoutModal';
import {
    User, Package, MapPin, Syringe, FileText, Pill, LogOut, ChevronRight, X
} from 'lucide-react';
import { useSelector } from 'react-redux';


const ProfilePage = () => {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState('profile');
    const [showLogout, setShowLogout] = useState(false);



    return (
        <div className=" min-vh-100 py-4">
            <Container>
                {/* Breadcrumb */}
                <Nav className="small mb-4 text-muted">
                    Trang chủ / Cá nhân / <span className="text-primary ms-1 fw-bold">Thông tin cá nhân</span>
                </Nav>

                <Row>
                    {/* Sidebar */}
                    <Col lg={3} md={4} className="mb-4">
                        {/* User Card */}
                        <Card className="border-0 shadow-sm rounded-4 text-center text-white mb-3"
                            style={{ background: 'linear-gradient(to right, #1250dc, #0d3fad)' }}>
                            <Card.Body className="py-4">
                                <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                    style={{ width: '80px', height: '80px', border: '4px solid rgba(255,255,255,0.3)' }}>
                                    <User size={40} className="text-white" />
                                </div>
                                <h5 className="fw-bold mb-1 text-white">{user?.name || 'Người dùng'}</h5>
                                <small className="opacity-75">{user?.phone || '0356001730'}</small>
                            </Card.Body>
                        </Card>

                        {/* Menu List - CODE CỨNG TỪNG ITEM */}
                        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                            <ListGroup variant="flush">
                                {/* Thông tin cá nhân */}
                                <ListGroup.Item action onClick={() => setActiveTab('profile')}
                                    className={`d-flex align-items-center justify-content-between py-3 px-4 border-0 ${activeTab === 'profile' ? 'bg-primary-subtle text-primary fw-bold' : ''}`}>
                                    <div className="d-flex align-items-center gap-3">
                                        <User size={18} className={activeTab === 'profile' ? 'text-primary' : 'text-secondary'} />
                                        <span>Thông tin cá nhân</span>
                                    </div>
                                    <ChevronRight size={16} className="text-secondary opacity-50" />
                                </ListGroup.Item>

                                {/* Đơn hàng của tôi */}
                                <ListGroup.Item action onClick={() => setActiveTab('orders')}
                                    className={`d-flex align-items-center justify-content-between py-3 px-4 border-0 ${activeTab === 'orders' ? 'bg-primary-subtle text-primary fw-bold' : ''}`}>
                                    <div className="d-flex align-items-center gap-3">
                                        <Package size={18} className={activeTab === 'orders' ? 'text-primary' : 'text-secondary'} />
                                        <span>Đơn hàng của tôi</span>
                                    </div>
                                    <ChevronRight size={16} className="text-secondary opacity-50" />
                                </ListGroup.Item>

                                {/* Quản lý sổ địa chỉ */}
                                <ListGroup.Item action onClick={() => setActiveTab('address')}
                                    className={`d-flex align-items-center justify-content-between py-3 px-4 border-0 ${activeTab === 'address' ? 'bg-primary-subtle text-primary fw-bold' : ''}`}>
                                    <div className="d-flex align-items-center gap-3">
                                        <MapPin size={18} className={activeTab === 'address' ? 'text-primary' : 'text-secondary'} />
                                        <span>Quản lý sổ địa chỉ</span>
                                    </div>
                                    <ChevronRight size={16} className="text-secondary opacity-50" />
                                </ListGroup.Item>

                                {/* Lịch hẹn tiêm chủng */}
                                <ListGroup.Item action onClick={() => setActiveTab('vaccine-schedule')}
                                    className={`d-flex align-items-center justify-content-between py-3 px-4 border-0 ${activeTab === 'vaccine-schedule' ? 'bg-primary-subtle text-primary fw-bold' : ''}`}>
                                    <div className="d-flex align-items-center gap-3">
                                        <Syringe size={18} className={activeTab === 'vaccine-schedule' ? 'text-primary' : 'text-secondary'} />
                                        <span>Lịch hẹn tiêm chủng</span>
                                    </div>
                                    <ChevronRight size={16} className="text-secondary opacity-50" />
                                </ListGroup.Item>

                                {/* Đơn hàng tiêm chủng */}
                                <ListGroup.Item action onClick={() => setActiveTab('vaccine-orders')}
                                    className={`d-flex align-items-center justify-content-between py-3 px-4 border-0 ${activeTab === 'vaccine-orders' ? 'bg-primary-subtle text-primary fw-bold' : ''}`}>
                                    <div className="d-flex align-items-center gap-3">
                                        <FileText size={18} className={activeTab === 'vaccine-orders' ? 'text-primary' : 'text-secondary'} />
                                        <span>Đơn hàng tiêm chủng</span>
                                    </div>
                                    <ChevronRight size={16} className="text-secondary opacity-50" />
                                </ListGroup.Item>

                                {/* Đơn thuốc của tôi */}
                                <ListGroup.Item action onClick={() => setActiveTab('prescriptions')}
                                    className={`d-flex align-items-center justify-content-between py-3 px-4 border-0 ${activeTab === 'prescriptions' ? 'bg-primary-subtle text-primary fw-bold' : ''}`}>
                                    <div className="d-flex align-items-center gap-3">
                                        <Pill size={18} className={activeTab === 'prescriptions' ? 'text-primary' : 'text-secondary'} />
                                        <span>Đơn thuốc của tôi</span>
                                    </div>
                                    <ChevronRight size={16} className="text-secondary opacity-50" />
                                </ListGroup.Item>

                                {/* Đăng xuất - Nhấn vào hiện Modal */}
                                <ListGroup.Item action onClick={() => setShowLogout(true)}
                                    className="d-flex align-items-center justify-content-between py-3 px-4 border-0 text-dark">
                                    <div className="d-flex align-items-center gap-3">
                                        <LogOut size={18} className="text-secondary" />
                                        <span>Đăng xuất</span>
                                    </div>
                                    <ChevronRight size={16} className="text-secondary opacity-50" />
                                </ListGroup.Item>
                            </ListGroup>
                        </Card>
                    </Col>

                    {/* Content Area */}
                    <Col lg={9} md={8}>
                        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                            <Card.Header className="bg-white py-3 px-4 border-bottom-0">
                                <h4 className="mb-0 fw-bold text-dark">Thông tin cá nhân</h4>
                            </Card.Header>
                            <Card.Body className="p-5 text-center">
                                <div className="position-relative d-inline-block mb-4">
                                    <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ width: '100px', height: '100px' }}>
                                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ width: '80px', height: '80px' }}>
                                            <User size={45} className="text-white" />
                                        </div>
                                    </div>
                                    <span className="position-absolute top-0 end-0 text-primary opacity-50">✦</span>
                                </div>

                                <div className="mx-auto" style={{ maxWidth: '450px' }}>
                                    <div className="d-flex justify-content-between align-items-center py-3 border-bottom border-light-subtle">
                                        <span className="text-secondary">Họ và tên</span>
                                        <span className="fw-bold text-dark">thai</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center py-3 border-bottom border-light-subtle">
                                        <span className="text-secondary">Số điện thoại</span>
                                        <span className="fw-bold text-dark">0356001730</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center py-3 border-bottom border-light-subtle">
                                        <span className="text-secondary">Giới tính</span>
                                        <Button variant="link" className="p-0 text-decoration-none fw-medium text-primary">Thêm thông tin</Button>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center py-3 border-bottom border-light-subtle">
                                        <span className="text-secondary">Ngày sinh</span>
                                        <Button variant="link" className="p-0 text-decoration-none fw-medium text-primary">Thêm thông tin</Button>
                                    </div>
                                </div>

                                <Button variant="primary" className="mt-5 px-5 py-2 rounded-pill fw-bold shadow-sm"
                                    style={{ backgroundColor: '#1250dc', border: 'none' }}>
                                    Chỉnh sửa thông tin
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
            <LogoutModal
                show={showLogout}
                handleClose={() => setShowLogout(false)}
            />


            <style>{`
                .bg-primary-subtle { background-color: #e7efff !important; }
                .text-primary { color: #1250dc !important; }
                .list-group-item-action:hover { background-color: #f8f9fa; }
            `}</style>
        </div>
    );
};

export default ProfilePage;