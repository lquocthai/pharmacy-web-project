import { useState, useRef, useEffect } from 'react'; // Đã thêm useRef vào đây
import { Row, Col, Card, Form, Button } from 'react-bootstrap';
import { Plus, X } from 'lucide-react'; // Đã thêm icon X để xóa ảnh
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import prescriptionService from '../../services/prescriptionService';

const CreatePrescription = ({ }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    // State lưu trữ dữ liệu form
    const [formData, setFormData] = useState({
        fullName: 'thai', // Giá trị mặc định như ảnh mẫu
        phoneNumber: '0356001730',
        note: ''
    });

    // 1. Khởi tạo State lưu danh sách ảnh và Ref điều khiển input file ẩn
    const [selectedImages, setSelectedImages] = useState([]);
    const fileInputRef = useRef(null);

    // 2. Hàm xử lý khi người dùng chọn file từ máy tính/điện thoại
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        // Kiểm tra nếu tổng số ảnh vượt quá 5
        if (selectedImages.length + files.length > 5) {
            toast.error("Bạn chỉ được chọn tối đa 5 ảnh đơn thuốc!");
            return;
        }

        const validFiles = [];

        files.forEach(file => {
            // Kiểm tra dung lượng file dưới 5MB (5 * 1024 * 1024 bytes)
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`File "${file.name}" vượt quá 5MB. Vui lòng chọn ảnh nhẹ hơn.`);
                return;
            }

            // Tạo đường dẫn tạm thời để hiển thị ảnh preview
            const imageUrl = URL.createObjectURL(file);
            validFiles.push({
                file: file,          // File gốc dùng để truyền lên API upload sau này
                preview: imageUrl    // Link blob tạm thời để cho vào thẻ <img />
            });
        });

        setSelectedImages(prev => [...prev, ...validFiles]);
        e.target.value = null; // Reset để có thể chọn lại chính file đó nếu lỡ xóa
    };

    // 3. Hàm xóa ảnh ra khỏi danh sách
    const handleRemoveImage = (indexToRemove) => {
        URL.revokeObjectURL(selectedImages[indexToRemove].preview); // Thu hồi bộ nhớ link tạm
        setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    // 4. Hàm kích hoạt mở hộp thoại chọn file khi click vào Card
    const handleCardClick = () => {
        if (selectedImages.length >= 5) {
            toast.error("Bạn đã chọn đủ tối đa 5 ảnh!");
            return;
        }
        fileInputRef.current.click();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // const handleSubmit = (e) => {
    //     e.preventDefault();
    //     // Bạn có thể lấy danh sách các file ảnh gốc ở đây để gửi lên server:
    //     // const filesToUpload = selectedImages.map(img => img.file);
    //     console.log("Dữ liệu gửi đi:", formData, "Mảng file ảnh:", selectedImages);
    // };
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (!formData.fullName.trim()) {
                toast.error('Vui lòng nhập họ tên');
                return;
            }

            if (!formData.phoneNumber.trim()) {
                toast.error('Vui lòng nhập số điện thoại');
                return;
            }

            setLoading(true);

            const submitData = new FormData();

            submitData.append('fullName', formData.fullName);
            submitData.append('phoneNumber', formData.phoneNumber);
            submitData.append('note', formData.note);

            selectedImages.forEach((img) => {
                submitData.append('images', img.file);
            });

            const response =
                await prescriptionService.createPrescription(submitData);

            console.log(response);

            if (response?.data?.code === 0) {
                toast.success('Gửi yêu cầu tư vấn thành công');

                selectedImages.forEach((image) => {
                    URL.revokeObjectURL(image.preview);
                });

                setSelectedImages([]);

                setFormData({
                    fullName: '',
                    phoneNumber: '',
                    note: ''
                });

                navigate('/profile?tab=prescriptions');
            }
        } catch (error) {
            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                'Không thể gửi yêu cầu tư vấn'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            {/* Tiêu đề trang */}
            <div className="d-flex align-items-center gap-2 mb-3">
                <h6 className="fw-bold text-dark m-0 ">Cần mua thuốc</h6>
            </div>

            {/* Input file ẩn hoàn toàn phục vụ việc chọn ảnh */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                multiple
                accept="image/*"
                style={{ display: 'none' }}
            />

            <Form onSubmit={handleSubmit}>
                <Row className="align-items-start">
                    {/* BÊN TRÁI: FORM NHẬP THÔNG TIN */}
                    <Col lg={8} md={12} className="mb-4">
                        {/* Khối thông tin liên hệ */}
                        <Card className="border-0 shadow-sm rounded-4 p-4 mb-3">
                            <h5 className="text-start fw-bold text-dark mb-3 fs-6">Thông tin liên hệ</h5>

                            <Row>
                                <Col md={6} className="mb-3">
                                    <Form.Group className="form-floating">
                                        <Form.Control
                                            type="text"
                                            name="fullName"
                                            placeholder="Họ và tên"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            className="rounded-3 border-light-subtle"
                                            required
                                        />
                                        <Form.Label className="text-secondary small">Họ và tên</Form.Label>
                                    </Form.Group>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Group className="form-floating">
                                        <Form.Control
                                            type="text"
                                            name="phoneNumber"
                                            placeholder="Số điện thoại"
                                            value={formData.phoneNumber}
                                            onChange={handleInputChange}
                                            className="rounded-3 border-light-subtle"
                                            required
                                        />
                                        <Form.Label className="text-secondary small">Số điện thoại</Form.Label>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="form-floating mt-1">
                                <Form.Control
                                    as="textarea"
                                    name="note"
                                    placeholder="Ghi chú (không bắt buộc)"
                                    value={formData.note}
                                    onChange={handleInputChange}
                                    style={{ height: '110px' }}
                                    className="rounded-3 border-light-subtle"
                                />
                                <Form.Label className="text-secondary small">
                                    Ghi chú (không bắt buộc) <br />
                                    <span className="text-muted opacity-75">Ví dụ: Tôi cần tư vấn thuốc về bệnh đau dạ dày</span>
                                </Form.Label>
                            </Form.Group>
                        </Card>

                        {/* Thanh đính kèm ảnh đơn thuốc - Click vào để chọn ảnh */}
                        <Card
                            className="border-0 shadow-sm rounded-4 p-3 mb-3 text-start bg-white"
                            style={{ cursor: selectedImages.length >= 5 ? 'not-allowed' : 'pointer' }}
                            onClick={handleCardClick}
                        >
                            <div className="d-flex justify-content-between align-items-center w-100 px-2 py-1">
                                <div>
                                    <p className="fw-bold mb-1 small" style={{ color: '#1250dc' }}>
                                        Thêm ảnh nếu có đơn thuốc (không bắt buộc)
                                        {selectedImages.length > 0 && ` (${selectedImages.length}/5)`}
                                    </p>
                                    <small className="text-muted">Giúp dược sĩ tư vấn chính xác nhất (Tối đa 5 ảnh, dưới 5MB/ảnh)</small>
                                </div>
                                <Plus size={22} style={{ color: '#1250dc' }} />
                            </div>
                        </Card>

                        {/* Danh sách ảnh Preview hiển thị bên dưới Card bấm */}
                        {selectedImages.length > 0 && (
                            <div className="d-flex gap-2 mb-3 flex-wrap bg-white p-3 rounded-4 shadow-sm text-start">
                                {selectedImages.map((img, index) => (
                                    <div
                                        key={index}
                                        className="position-relative rounded-3 border overflow-hidden"
                                        style={{ width: '80px', height: '80px' }}
                                    >
                                        <img
                                            src={img.preview}
                                            alt={`don-thuoc-${index}`}
                                            className="w-100 h-100 object-fit-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Không kích hoạt sự kiện click mở file của Card cha
                                                handleRemoveImage(index);
                                            }}
                                            className="position-absolute top-0 end-0 m-1 bg-dark bg-opacity-70 text-white rounded-circle p-0 d-flex align-items-center justify-content-center border-0"
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}

                                {/* Nếu chưa đủ 5 ảnh, hiển thị thêm 1 ô vuông phụ "Bấm để thêm tiếp nhanh" */}
                                {selectedImages.length < 5 && (
                                    <div
                                        onClick={handleCardClick}
                                        className="d-flex flex-column align-items-center justify-content-center border border-dashed rounded-3 text-secondary"
                                        style={{ width: '80px', height: '80px', cursor: 'pointer', borderStyle: 'dashed', backgroundColor: '#fafafa' }}
                                    >
                                        <Plus size={20} />
                                        <span style={{ fontSize: '10px' }}>Thêm</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </Col>

                    {/* BÊN PHẢI: NÚT GỬI & QUY TRÌNH HƯỚNG DẪN */}
                    <Col lg={4} md={12}>
                        {/* Nút gửi chính */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-100 rounded-pill py-2.5 fw-bold shadow-sm mb-3"
                            style={{ backgroundColor: '#1250dc', border: 'none', fontSize: '15px' }}
                        >
                            {
                                loading
                                    ? 'Đang gửi...'
                                    : 'Gửi yêu cầu tư vấn'
                            }
                        </Button>

                        {/* Khối quy trình tư vấn */}
                        <Card className="border-0 shadow-sm rounded-4 p-4 mb-3">
                            <h6 className="fw-bold text-dark mb-4 text-start" style={{ fontSize: '16px' }}>Quy trình tư vấn tại Quốc Thái</h6>

                            {/* Các bước quy trình - Đã tối ưu căn chỉnh không lệch */}
                            <div className="position-relative text-start" style={{ paddingLeft: '2px' }}>
                                {/* Đường line dọc kết nối chính xác trọng tâm các số */}
                                <div className="position-absolute top-0 bottom-0 border-start border-2 opacity-50"
                                    style={{ left: '11px', zIndex: 0, marginTop: '12px', marginBottom: '80px', borderColor: '#cbd5e1' }}></div>

                                {/* Bước 1 */}
                                <div className="d-flex align-items-start gap-3 mb-4 position-relative" style={{ zIndex: 1 }}>
                                    <span className="badge rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-white"
                                        style={{ width: '24px', height: '24px', backgroundColor: '#7695ec', fontSize: '12px', marginTop: '2px' }}>
                                        1
                                    </span>
                                    <p className="mb-0 text-dark small" style={{ lineHeight: '1.6' }}>
                                        Quý khách vui lòng điền thông tin liên hệ, cung cấp ảnh đơn thuốc hoặc tên sản phẩm cần tư vấn (nếu có).
                                    </p>
                                </div>

                                {/* Bước 2 */}
                                <div className="d-flex align-items-start gap-3 mb-4 position-relative" style={{ zIndex: 1 }}>
                                    <span className="badge rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-white"
                                        style={{ width: '24px', height: '24px', backgroundColor: '#7695ec', fontSize: '12px', marginTop: '2px' }}>
                                        2
                                    </span>
                                    <p className="mb-0 text-dark small" style={{ lineHeight: '1.6' }}>
                                        Dược sĩ chuyên môn của nhà thuốc sẽ gọi lại tư vấn miễn phí cho quý khách.
                                    </p>
                                </div>

                                {/* Bước 3 */}
                                <div className="d-flex align-items-start gap-3 mb-4 position-relative" style={{ zIndex: 1 }}>
                                    <span className="badge rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-white"
                                        style={{ width: '24px', height: '24px', backgroundColor: '#7695ec', fontSize: '12px', marginTop: '2px' }}>
                                        3
                                    </span>
                                    <p className="mb-0 text-dark small" style={{ lineHeight: '1.6' }}>
                                        Quý khách có thể tới các Nhà thuốc Long Châu gần nhất để được hỗ trợ mua hàng trực tiếp.
                                    </p>
                                </div>
                            </div>

                            {/* Phần lưu ý màu xám nhạt */}
                            <div className="p-3 rounded-3 bg-light text-start" style={{ fontSize: '13px' }}>
                                <p className="fw-bold text-dark mb-1">Lưu ý:</p>
                                <p className="text-secondary mb-1">- Nếu mua thuốc kê đơn, vui lòng mang theo đơn thuốc.</p>
                                <p className="text-secondary mb-0">- Dược sĩ vẫn sẽ chủ động tư vấn cho quý khách kể cả trong trường hợp không có đơn thuốc.</p>
                            </div>
                        </Card>

                        {/* Nút xem lại lịch sử đơn thuốc */}
                        <Button
                            variant="white"
                            className="w-100 bg-white rounded-pill py-2 text-primary fw-medium border-0 shadow-sm d-flex align-items-center justify-content-center gap-2 small"
                            style={{ color: '#1250dc' }}
                            onClick={() => navigate('/profile?tab=prescriptions')}
                        >
                            <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px' }}><path fill="currentColor" d="M5.235 4.235C5.235 3.001 6.236 2 7.471 2h8.94c1.235 0 2.236 1 2.236 2.235v13.412c0 1.235-1 2.235-2.235 2.235h-3.64c.283-.343.53-.717.734-1.117h2.906c.617 0 1.117-.5 1.117-1.118V4.235c0-.617-.5-1.117-1.117-1.117H7.47c-.618 0-1.118.5-1.118 1.117v5.82c-.39.11-.764.258-1.118.439V4.235zm2.794.56a.559.559 0 00-.558.558v2.235c0 .309.25.56.558.56h7.824c.309 0 .559-.251.559-.56V5.353a.559.559 0 00-.56-.559H8.03zm.56 2.234V5.912h6.705v1.117H8.588zm11.734-.558h-.558v2.794h.558c.31 0 .56-.25.56-.56V7.03a.559.559 0 00-.56-.558zm0 3.911h-.558v2.795h.558c.31 0 .56-.25.56-.56v-1.676a.559.559 0 00-.56-.559zm0 3.912h-.558v2.794h.558c.31 0 .56-.25.56-.559v-1.676a.559.559 0 00-.56-.559zM8.03 21a5.03 5.03 0 100-10.059A5.03 5.03 0 008.03 21zm0-7.823c.309 0 .56.25.56.558v1.677h1.676a.559.559 0 010 1.117H8.588v1.677a.559.559 0 01-1.117 0v-1.677H5.794a.559.559 0 110-1.117h1.677v-1.677c0-.308.25-.558.558-.558z"></path></svg>
                            Xem lại Đơn thuốc của tôi
                        </Button>
                    </Col>
                </Row>
            </Form>
        </div>
    );
};

export default CreatePrescription;