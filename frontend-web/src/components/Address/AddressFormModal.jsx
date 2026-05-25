import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import Select from 'react-select';
import ghnService from '../../services/ghnService';

const AddressFormModal = ({ show, onHide, onSubmit, initialData }) => {
    const isEdit = !!initialData;

    const emptyForm = {
        fullName: '',
        phone: '',

        // TEXT để hiển thị
        province: '',
        district: '',
        ward: '',

        // ID/CODE để xử lý ship
        provinceId: null,
        districtId: null,
        wardCode: '',

        addressDetail: '',
        isDefault: false,
        label: 'HOME',
    };

    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // options select
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    // style react select
    const customStyles = (fieldName) => ({
        control: (base, state) => ({
            ...base,
            borderRadius: '0.5rem',
            borderColor: errors[fieldName]
                ? '#dc3545'
                : state.isFocused
                    ? '#1250dc'
                    : '#dee2e6',
            '&:hover': {
                borderColor: errors[fieldName]
                    ? '#dc3545'
                    : '#1250dc',
            },
            boxShadow: state.isFocused
                ? '0 0 0 0.25rem rgba(18, 80, 220, 0.25)'
                : 'none',
        }),
    });

    // =========================================================
    // LOAD PROVINCES
    // =========================================================
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const data = await ghnService.getProvinces();

                setProvinces(
                    data.map((p) => ({
                        value: p.ProvinceID,
                        label: p.ProvinceName,
                    }))
                );
            } catch (err) {
                console.error('Lỗi load tỉnh:', err);
            }
        };

        fetchProvinces();
    }, []);

    // =========================================================
    // INIT FORM KHI MỞ MODAL
    // =========================================================
    useEffect(() => {
        const initForm = async () => {
            if (!show) return;

            // ADD
            if (!initialData) {
                setForm(emptyForm);
                setDistricts([]);
                setWards([]);
                setErrors({});
                return;
            }

            // EDIT
            const data = {
                fullName: initialData.fullName || '',
                phone: initialData.phone || '',

                province: initialData.province || '',
                district: initialData.district || '',
                ward: initialData.ward || '',

                provinceId: initialData.provinceId || null,
                districtId: initialData.districtId || null,
                wardCode: initialData.wardCode || '',

                addressDetail: initialData.addressDetail || '',
                label: initialData.label || 'HOME',

                isDefault: initialData.defaultAddress || false,
            };

            setForm(data);
            setErrors({});

            // load districts
            if (data.provinceId) {
                try {
                    const districtData = await ghnService.getDistricts(
                        data.provinceId
                    );

                    const districtOptions = districtData.map((d) => ({
                        value: d.DistrictID,
                        label: d.DistrictName,
                    }));

                    setDistricts(districtOptions);
                } catch (err) {
                    console.error('Lỗi load district:', err);
                }
            }

            // load wards
            if (data.districtId) {
                try {
                    const wardData = await ghnService.getWards(
                        data.districtId
                    );

                    const wardOptions = wardData.map((w) => ({
                        value: w.WardCode,
                        label: w.WardName,
                    }));

                    setWards(wardOptions);
                } catch (err) {
                    console.error('Lỗi load ward:', err);
                }
            }
        };

        initForm();
    }, [show, initialData]);

    // =========================================================
    // CHANGE PROVINCE
    // =========================================================
    const onProvinceChange = async (opt) => {
        setForm((prev) => ({
            ...prev,

            // text
            province: opt ? opt.label : '',

            // id
            provinceId: opt ? opt.value : null,

            // reset cấp dưới
            district: '',
            districtId: null,

            ward: '',
            wardCode: '',
        }));

        setDistricts([]);
        setWards([]);

        setErrors((prev) => ({
            ...prev,
            province: '',
        }));

        if (!opt) return;

        try {
            const data = await ghnService.getDistricts(opt.value);

            setDistricts(
                data.map((d) => ({
                    value: d.DistrictID,
                    label: d.DistrictName,
                }))
            );
        } catch (err) {
            console.error('Lỗi load quận/huyện:', err);
        }
    };

    // =========================================================
    // CHANGE DISTRICT
    // =========================================================
    const onDistrictChange = async (opt) => {
        setForm((prev) => ({
            ...prev,

            // text
            district: opt ? opt.label : '',

            // id
            districtId: opt ? opt.value : null,

            // reset ward
            ward: '',
            wardCode: '',
        }));

        setWards([]);

        setErrors((prev) => ({
            ...prev,
            district: '',
        }));

        if (!opt) return;

        try {
            const data = await ghnService.getWards(opt.value);

            setWards(
                data.map((w) => ({
                    value: w.WardCode,
                    label: w.WardName,
                }))
            );
        } catch (err) {
            console.error('Lỗi load phường/xã:', err);
        }
    };

    // =========================================================
    // CHANGE WARD
    // =========================================================
    const onWardChange = (opt) => {
        setForm((prev) => ({
            ...prev,

            // text
            ward: opt ? opt.label : '',

            // code
            wardCode: opt ? opt.value : '',
        }));

        setErrors((prev) => ({
            ...prev,
            ward: '',
        }));
    };

    // =========================================================
    // INPUT CHANGE
    // =========================================================
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    // =========================================================
    // VALIDATE
    // =========================================================
    const validate = () => {
        const newErrors = {};

        if (!form.fullName.trim()) {
            newErrors.fullName = 'Vui lòng nhập tên người nhận';
        }

        if (!form.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại';
        } else if (!/^(0|\+84)[0-9]{9}$/.test(form.phone)) {
            newErrors.phone = 'Số điện thoại không hợp lệ';
        }

        if (!form.provinceId) {
            newErrors.province = 'Vui lòng chọn tỉnh/thành phố';
        }

        if (!form.districtId) {
            newErrors.district = 'Vui lòng chọn quận/huyện';
        }

        if (!form.wardCode) {
            newErrors.ward = 'Vui lòng chọn phường/xã';
        }

        if (!form.addressDetail.trim()) {
            newErrors.addressDetail = 'Vui lòng nhập địa chỉ chi tiết';
        }

        return newErrors;
    };

    // =========================================================
    // SUBMIT
    // =========================================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = validate();

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            console.log('FORM SUBMIT:', form);

            await onSubmit(form);

            onHide();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            backdrop="static"
            keyboard={false}
            centered
            size="lg"
            contentClassName="border-0 rounded-4 shadow-lg"
        >
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold fs-5">
                    {isEdit ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="px-4 pb-4">
                <Form onSubmit={handleSubmit}>
                    {/* LABEL */}
                    <div className="d-flex gap-2 mb-4">
                        {['HOME', 'WORK', 'OTHER'].map((v) => (
                            <button
                                key={v}
                                type="button"
                                className={`btn btn-sm px-3 py-2 rounded-pill ${form.label === v
                                    ? 'btn-primary'
                                    : 'btn-outline-secondary'
                                    }`}
                                onClick={() =>
                                    setForm((prev) => ({
                                        ...prev,
                                        label: v,
                                    }))
                                }
                            >
                                {v === 'HOME'
                                    ? 'Nhà riêng'
                                    : v === 'WORK'
                                        ? 'Văn phòng'
                                        : 'Khác'}
                            </button>
                        ))}
                    </div>

                    <Row className="g-3">
                        {/* FULL NAME */}
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-secondary">
                                    Tên người nhận *
                                </Form.Label>

                                <Form.Control
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    isInvalid={!!errors.fullName}
                                    className="rounded-3"
                                />

                                <Form.Control.Feedback type="invalid">
                                    {errors.fullName}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* PHONE */}
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-secondary">
                                    Số điện thoại *
                                </Form.Label>

                                <Form.Control
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    isInvalid={!!errors.phone}
                                    className="rounded-3"
                                />

                                <Form.Control.Feedback type="invalid">
                                    {errors.phone}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* PROVINCE */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-secondary">
                                    Tỉnh/Thành phố *
                                </Form.Label>

                                <Select
                                    placeholder="Chọn tỉnh..."
                                    options={provinces}
                                    value={
                                        provinces.find(
                                            (p) =>
                                                p.value === form.provinceId
                                        ) || null
                                    }
                                    onChange={onProvinceChange}
                                    styles={customStyles('province')}
                                    isClearable
                                />

                                {errors.province && (
                                    <div className="text-danger small mt-1">
                                        {errors.province}
                                    </div>
                                )}
                            </Form.Group>
                        </Col>

                        {/* DISTRICT */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-secondary">
                                    Quận/Huyện *
                                </Form.Label>

                                <Select
                                    placeholder="Chọn quận..."
                                    options={districts}
                                    value={
                                        districts.find(
                                            (d) =>
                                                d.value === form.districtId
                                        ) || null
                                    }
                                    onChange={onDistrictChange}
                                    styles={customStyles('district')}
                                    isDisabled={!form.provinceId}
                                    isClearable
                                />

                                {errors.district && (
                                    <div className="text-danger small mt-1">
                                        {errors.district}
                                    </div>
                                )}
                            </Form.Group>
                        </Col>

                        {/* WARD */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-secondary">
                                    Phường/Xã *
                                </Form.Label>

                                <Select
                                    placeholder="Chọn xã..."
                                    options={wards}
                                    value={
                                        wards.find(
                                            (w) =>
                                                w.value === form.wardCode
                                        ) || null
                                    }
                                    onChange={onWardChange}
                                    styles={customStyles('ward')}
                                    isDisabled={!form.districtId}
                                    isClearable
                                />

                                {errors.ward && (
                                    <div className="text-danger small mt-1">
                                        {errors.ward}
                                    </div>
                                )}
                            </Form.Group>
                        </Col>

                        {/* ADDRESS DETAIL */}
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-secondary">
                                    Số nhà, tên đường *
                                </Form.Label>

                                <Form.Control
                                    name="addressDetail"
                                    value={form.addressDetail}
                                    onChange={handleChange}
                                    isInvalid={!!errors.addressDetail}
                                    className="rounded-3"
                                />

                                <Form.Control.Feedback type="invalid">
                                    {errors.addressDetail}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* DEFAULT */}
                        <Col md={12}>
                            <Form.Check
                                type="checkbox"
                                name="isDefault"
                                id="isDefault"
                                label="Đặt làm địa chỉ mặc định"
                                checked={form.isDefault}
                                onChange={handleChange}
                                className="small"
                            />
                        </Col>
                    </Row>

                    <div className="d-flex gap-2 justify-content-end mt-4">
                        <Button
                            variant="light"
                            onClick={onHide}
                            className="px-4 rounded-pill"
                        >
                            Hủy
                        </Button>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                            className="px-4 rounded-pill fw-bold"
                            style={{
                                backgroundColor: '#1250dc',
                                border: 'none',
                            }}
                        >
                            {loading
                                ? 'Đang lưu...'
                                : isEdit
                                    ? 'Cập nhật'
                                    : 'Thêm địa chỉ'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AddressFormModal;