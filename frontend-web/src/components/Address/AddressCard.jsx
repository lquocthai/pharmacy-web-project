import { Badge, Button } from 'react-bootstrap';
import { MapPin, Pencil, Trash2, Star } from 'lucide-react';

/**
 * Hiển thị 1 địa chỉ trong danh sách
 * Props:
 *   address: UserAddressResponse
 *   onEdit: (address) => void
 *   onDelete: (id) => void
 *   onSetDefault: (id) => void
 */
const LABEL_MAP = {
    HOME: { text: 'Nhà riêng' },
    WORK: { text: 'Văn phòng' },
    OTHER: { text: 'Khác' },
};
// sau này có thể thêm onSetDefault để đặt làm mặc định ngay từ card mà không cần vào form sửa
const AddressCard = ({ address, onEdit, onDelete }) => {
    const labelInfo = LABEL_MAP[address.label] || LABEL_MAP.OTHER;
    return (
        <div className={`border rounded-3 p-3 mb-3 position-relative ${address.default ? 'border-primary' : ''}`}
            style={{ backgroundColor: address.default ? '#f0f5ff' : '#fff' }}>

            {/* Badge mặc định */}
            {address.default && (
                <Badge bg="primary" className="position-absolute top-0 end-0 m-2"
                    style={{ fontSize: '11px' }}>
                    Mặc định
                </Badge>
            )}

            <div className="d-flex align-items-start gap-3">

                {/* Nội dung */}
                <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="fw-bold">{address.fullName}</span>
                        <span className="text-muted small">|</span>
                        <span className="text-muted small">{address.phone}</span>
                        <Badge bg="light" text="dark" className="border small">{labelInfo.text}</Badge>
                    </div>
                    <p className="text-start text-muted small mb-0">{address.fullAddress}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="d-flex gap-2 mt-3 justify-content-end">
                {/* {!address.default && (
                    <Button variant="outline-primary" size="sm" className="rounded-pill px-3"
                        onClick={() => onSetDefault(address.id)}>
                        <Star size={13} className="me-1" />
                        Đặt mặc định
                    </Button>
                )} */}
                <Button variant="outline-secondary" size="sm" className="rounded-pill px-3"
                    onClick={() => onEdit(address)}>
                    <Pencil size={13} className="me-1" />
                    Sửa
                </Button>
                <Button variant="outline-danger" size="sm" className="rounded-pill px-3"
                    onClick={() => onDelete(address.id)}>
                    <Trash2 size={13} className="me-1" />
                    Xóa
                </Button>
            </div>
        </div>
    );
};

export default AddressCard;
