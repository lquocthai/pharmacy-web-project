import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import prescriptionServicePharmacist from '../service/prescriptionPharmacistService';

const STATUS_OPTIONS = [
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Chờ tư vấn', value: 'PENDING' },
    { label: 'Đã tư vấn', value: 'CONSULTED' },
    { label: 'Chưa thể liên lạc', value: 'UNREACHABLE' },
    { label: 'Đã hủy', value: 'CANCELLED' },
];

const UPDATE_STATUS_OPTIONS = STATUS_OPTIONS.filter(option => option.value);

const statusLabel = {
    PENDING: 'Chờ tư vấn',
    CONSULTED: 'Đã tư vấn',
    UNREACHABLE: 'Chưa thể liên lạc',
    CANCELLED: 'Đã hủy',
};

const statusBadgeClass = {
    PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
    CONSULTED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    UNREACHABLE: 'bg-sky-50 text-sky-600 border-sky-200',
    CANCELLED: 'bg-rose-50 text-rose-600 border-rose-200',
};

const formatTime = (value) => value ? new Date(value).toLocaleString('vi-VN') : '—';

const getPrescriptionImages = (prescription) => (
    Array.isArray(prescription?.imageUrls) ? prescription.imageUrls.filter(Boolean) : []
);

const getInitial = (name) => (name || '?').trim().charAt(0).toUpperCase();

const ModalShell = ({ title, children, onClose, footer }) => {
    const [animate, setAnimate] = useState(false);

    // Kích hoạt hiệu ứng ngay sau khi component được mount vào DOM
    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), 30);
        return () => clearTimeout(timer);
    }, []);

    // Hàm xử lý đóng kèm hiệu ứng thu nhỏ/mờ dần (tùy chọn để đóng mượt hơn)
    const handleClose = () => {
        setAnimate(false);
        setTimeout(onClose, 200); // Đợi hiệu ứng kết thúc rồi mới gỡ khỏi DOM
    };

    return (
        <div
            className={`fixed inset-0 z-[10000] flex items-start justify-center bg-black/40 px-4 py-12 transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'
                }`}
            onClick={handleClose} // Bấm ra ngoài nền đen để đóng
        >
            <div
                className={`w-full max-w-3xl overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-xl transition-all duration-300 ease-out ${animate
                        ? 'translate-y-0 opacity-100 scale-100'
                        : '-translate-y-12 opacity-0 scale-95'
                    }`}
                onClick={(e) => e.stopPropagation()} // Ngăn chặn đóng modal khi bấm vào bên trong nội dung
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-4 py-3">
                    <h2 className="text-base font-bold text-[#1C2434]">{title}</h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1C2434] transition-all"
                        aria-label="Đóng modal"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="text-start max-h-[70vh] overflow-y-auto p-4 no-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex flex-wrap justify-end gap-2 border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

const DetailModal = ({ prescription, onClose, onEditStatus }) => {
    const images = getPrescriptionImages(prescription);

    return (
        <ModalShell
            title="Chi tiết đơn thuốc"
            onClose={onClose}
            footer={(
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-3 rounded-md border border-[#E2E8F0] bg-white text-xs font-medium text-[#64748B] hover:text-[#1C2434] transition-all"
                    >
                        Đóng
                    </button>
                    <button
                        type="button"
                        onClick={() => onEditStatus(prescription)}
                        className="h-9 px-3 rounded-md bg-[#3C50E0] text-xs font-medium text-white hover:bg-opacity-90 transition-all"
                    >
                        Sửa trạng thái
                    </button>
                </>
            )}
        >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
                <div className="space-y-4">
                    <div className="rounded-lg border border-[#E2E8F0] p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#EBF0FF] text-sm font-bold text-[#3C50E0]">
                                {getInitial(prescription.fullName)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-[#1C2434]">{prescription.fullName || 'Khách hàng'}</p>
                                <p className="mt-1 text-xs text-[#64748B]">{prescription.phoneNumber || 'Chưa có số điện thoại'}</p>
                                <p className="mt-1 break-all text-[11px] text-[#8A99AD]">{prescription.id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-[#E2E8F0] p-4">
                        <h2 className="text-sm font-bold text-[#1C2434]">Ghi chú khách hàng</h2>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1C2434]">
                            {prescription.note || 'Khách hàng chưa để lại ghi chú.'}
                        </p>
                    </div>

                    <div className="rounded-lg border border-[#E2E8F0] p-4">
                        <h2 className="text-sm font-bold text-[#1C2434]">Ghi chú dược sĩ</h2>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1C2434]">
                            {prescription.pharmacistNote || 'Chưa có ghi chú từ dược sĩ.'}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-lg border border-[#E2E8F0] p-4">
                        <h2 className="text-sm font-bold text-[#1C2434]">Trạng thái</h2>
                        <span className={`mt-2 inline-flex px-2.5 py-1 rounded-full text-[10px] font-medium border ${statusBadgeClass[prescription.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {statusLabel[prescription.status] || prescription.status || '—'}
                        </span>
                        <div className="mt-3 space-y-2 text-xs text-[#64748B]">
                            <p>Tạo: {formatTime(prescription.createdAt)}</p>
                            <p>Cập nhật: {formatTime(prescription.updatedAt)}</p>
                            <p>Tư vấn: {formatTime(prescription.consultedAt)}</p>
                        </div>
                    </div>

                    <div className="rounded-lg border border-[#E2E8F0] p-4">
                        <h2 className="text-sm font-bold text-[#1C2434]">Ảnh đơn thuốc ({images.length})</h2>
                        {!images.length ? (
                            <p className="mt-2 text-xs text-[#64748B]">Không có ảnh đính kèm.</p>
                        ) : (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {images.map((url, index) => (
                                    <a key={url} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-[#E2E8F0] bg-[#F8FAFC]">
                                        <img src={url} alt={`Ảnh đơn thuốc ${index + 1}`} className="h-24 w-full object-cover transition-transform hover:scale-105" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ModalShell>
    );
};

const StatusModal = ({ prescription, saving, onClose, onSubmit }) => {
    const [status, setStatus] = useState(prescription?.status || 'PENDING');
    const [pharmacistNote, setPharmacistNote] = useState(prescription?.pharmacistNote || '');

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit({
            status,
            pharmacistNote: pharmacistNote.trim(),
        });
    };

    return (
        <ModalShell
            title="Sửa trạng thái đơn thuốc"
            onClose={saving ? undefined : onClose}
            footer={(
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="h-9 px-3 rounded-md border border-[#E2E8F0] bg-white text-xs font-medium text-[#64748B] hover:text-[#1C2434] disabled:opacity-60 transition-all"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        form="prescription-status-form"
                        disabled={saving}
                        className="h-9 px-3 rounded-md bg-[#3C50E0] text-xs font-medium text-white hover:bg-opacity-90 disabled:opacity-60 transition-all"
                    >
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </>
            )}
        >
            <form id="prescription-status-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="text-start rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                    <p className="text-sm font-bold text-[#1C2434]">Khách hàng : {prescription.fullName || 'Khách hàng'}</p>
                    <p className="mt-1 text-xs text-[#64748B]">Số điện thoại liên lạc : {prescription.phoneNumber || 'Chưa có số điện thoại'}</p>
                </div>

                <div>
                    <p className="text-start mb-2 text-xs font-bold uppercase tracking-wider text-[#64748B]">Trạng thái</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {UPDATE_STATUS_OPTIONS.map(option => (
                            <label
                                key={option.value}
                                className={`d-flex flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-all ${status === option.value ? 'border-[#3C50E0] bg-[#EBF0FF] text-[#3C50E0]' : 'border-[#E2E8F0] bg-white text-[#1C2434] hover:bg-[#F8FAFC]'}`}
                            >
                                <input
                                    type="radio"
                                    name="status"
                                    value={option.value}
                                    checked={status === option.value}
                                    onChange={(event) => setStatus(event.target.value)}
                                    className="h-3.5 w-3.5 accent-[#3C50E0]"
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="pharmacistNote" className="text-start text-xs font-bold uppercase tracking-wider text-[#64748B]">
                        Ghi chú dược sĩ
                    </label>
                    <textarea
                        id="pharmacistNote"
                        value={pharmacistNote}
                        onChange={(event) => setPharmacistNote(event.target.value)}
                        rows={5}
                        maxLength={1000}
                        placeholder="Nhập ghi chú tư vấn, lý do chưa liên lạc được hoặc lý do hủy"
                        className="mt-2 w-full resize-none rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#1C2434] outline-none focus:border-[#3C50E0]"
                    />
                    <p className="mt-1 text-right text-[11px] text-[#8A99AD]">{pharmacistNote.length}/1000</p>
                </div>
            </form>
        </ModalShell>
    );
};

const PharmacistPrescriptionPage = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        fullName: '',
        status: '',
    });
    const [detailPrescription, setDetailPrescription] = useState(null);
    const [statusPrescription, setStatusPrescription] = useState(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setFilters(prev => {
                if (prev.fullName !== searchTerm) {
                    setPage(0);
                    return { ...prev, fullName: searchTerm };
                }
                return prev;
            });
        }, 700);

        return () => clearTimeout(handler);
    }, [searchTerm]);

    const requestParams = useMemo(() => ({
        page,
        size: 10,
        sort: 'createdAt,desc',
        ...(filters.status && { status: filters.status }),
        ...(filters.fullName.trim() && { fullName: filters.fullName.trim() }),
    }), [filters, page]);

    const fetchPrescriptions = useCallback(async () => {
        try {
            setLoading(true);
            const res = await prescriptionServicePharmacist.getPrescriptions(requestParams);
            const result = res.data?.result;
            setPrescriptions(result?.content || []);
            setTotalPages(result?.totalPages || 0);
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được danh sách đơn thuốc');
        } finally {
            setLoading(false);
        }
    }, [requestParams]);

    useEffect(() => {
        fetchPrescriptions();
    }, [fetchPrescriptions]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilters({ fullName: '', status: '' });
        setPage(0);
    };

    const openStatusModal = (prescription) => {
        setDetailPrescription(null);
        setStatusPrescription(prescription);
    };

    const handleUpdateStatus = async (payload) => {
        if (!statusPrescription?.id) return;

        try {
            setSaving(true);
            const res = await prescriptionServicePharmacist.updateStatus(statusPrescription.id, payload);
            const updatedPrescription = res.data?.result || { ...statusPrescription, ...payload };

            setPrescriptions(prev => prev.map(item => (
                item.id === statusPrescription.id ? { ...item, ...updatedPrescription } : item
            )));
            setStatusPrescription(null);
            toast.success('Cập nhật trạng thái đơn thuốc thành công');
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Cập nhật trạng thái đơn thuốc thất bại');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] text-[#1C2434] font-satoshi">
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-start">
                    <h2 className="text-xl font-bold text-[#1C2434]">Quản lý đơn thuốc</h2>
                </div>
                <p className="text-xs text-[#64748B]">Home &gt; Đơn thuốc</p>
            </div>

            <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 border-b border-[#E2E8F0]">
                    <div>
                        <h2 className="text-base font-bold text-[#1C2434]">Danh sách đơn thuốc</h2>
                        <p className="text-start text-[11px] text-[#8A99AD] mt-0.5">{prescriptions.length} đơn thuốc trong trang hiện tại</p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchPrescriptions}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] text-[#1C2434] px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#F8FAFC] disabled:opacity-60 transition-all"
                    >
                        <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" />
                        </svg>
                        Làm mới
                    </button>
                </div>

                <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] grid grid-cols-1 md:grid-cols-[1fr_190px_auto] gap-2 items-center">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A99AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
                        </svg>
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Tìm theo tên khách hàng"
                            className="w-full h-9 rounded-md border border-[#E2E8F0] bg-white pl-9 pr-3 text-xs text-[#1C2434] outline-none focus:border-[#3C50E0]"
                        />
                    </div>
                    <select
                        value={filters.status}
                        onChange={(event) => handleFilterChange('status', event.target.value)}
                        className="h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#1C2434] outline-none focus:border-[#3C50E0]"
                    >
                        {STATUS_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className="h-9 px-3 rounded-md border border-[#E2E8F0] bg-white text-xs font-medium text-[#64748B] hover:bg-white hover:text-[#1C2434] transition-all"
                    >
                        Xóa lọc
                    </button>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-[#64748B] text-xs">
                        <div className="animate-spin inline-block w-5 h-5 border-[2.5px] border-current border-t-transparent text-[#3C50E0] rounded-full mr-2" />
                        Đang tải...
                    </div>
                ) : (
                    <>
                        <div className="max-w-full overflow-x-auto no-scrollbar">
                            <table className="w-full table-auto text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#E2E8F0] bg-[#F7F9FC] text-xs font-semibold text-[#64748B]">
                                        <th className="p-2.5 pl-4 uppercase tracking-wider font-bold">Khách hàng</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Liên hệ</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Ghi chú</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Ảnh</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Trạng thái</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Thời gian</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold text-right pr-4">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-[#E2E8F0]">
                                    {prescriptions.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center p-8 text-[#64748B]">
                                                Không có đơn thuốc nào.
                                            </td>
                                        </tr>
                                    ) : prescriptions.map((prescription) => {
                                        const images = getPrescriptionImages(prescription);

                                        return (
                                            <tr key={prescription.id} className="hover:bg-[#F8FAFC] transition-colors">
                                                <td className="p-2.5 pl-4 min-w-[220px]">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#EBF0FF] text-xs font-bold text-[#3C50E0]">
                                                            {getInitial(prescription.fullName)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-[#1C2434] whitespace-nowrap">{prescription.fullName || 'Khách hàng'}</p>
                                                            <p className="text-[10px] text-[#8A99AD] truncate max-w-[170px]">{prescription.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-2.5 text-[#64748B] whitespace-nowrap">
                                                    {prescription.phoneNumber || '—'}
                                                </td>
                                                <td className="p-2.5 min-w-[240px]">
                                                    <p className="line-clamp-2 text-[#1C2434]">{prescription.note || 'Không có ghi chú'}</p>
                                                    {prescription.pharmacistNote && (
                                                        <p className="mt-1 line-clamp-1 text-[10px] text-[#8A99AD]">DS: {prescription.pharmacistNote}</p>
                                                    )}
                                                </td>
                                                <td className="p-2.5">
                                                    <span className="inline-flex rounded-full border border-[#E2E8F0] bg-white px-2 py-0.5 text-[10px] font-medium text-[#64748B]">
                                                        {images.length} ảnh
                                                    </span>
                                                </td>
                                                <td className="p-2.5">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-medium border ${statusBadgeClass[prescription.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                        {statusLabel[prescription.status] || prescription.status || '—'}
                                                    </span>
                                                </td>
                                                <td className="p-2.5 text-[#64748B] whitespace-nowrap">
                                                    {formatTime(prescription.createdAt)}
                                                </td>
                                                <td className="p-2.5 pr-4">
                                                    <div className="flex justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setDetailPrescription(prescription)}
                                                            className="px-2.5 py-1 text-[11px] font-medium border border-[#E2E8F0] rounded text-[#1C2434] bg-white hover:bg-[#F8FAFC] transition-all"
                                                        >
                                                            Chi tiết
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openStatusModal(prescription)}
                                                            className="px-2.5 py-1 text-[11px] font-medium border border-[#3C50E0] rounded text-[#3C50E0] bg-white hover:bg-[#EBF0FF] transition-all"
                                                        >
                                                            Sửa trạng thái
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center px-4 py-3 border-t border-[#E2E8F0] bg-white">
                            <span className="text-xs text-[#64748B]">Trang {page + 1}/{totalPages || 1}</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    disabled={page === 0}
                                    onClick={() => setPage(prev => Math.max(0, prev - 1))}
                                    className="px-2.5 py-1 text-[11px] font-medium border border-[#E2E8F0] rounded text-[#1C2434] bg-white hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Trước
                                </button>
                                <button
                                    type="button"
                                    disabled={page + 1 >= totalPages}
                                    onClick={() => setPage(prev => prev + 1)}
                                    className="px-2.5 py-1 text-[11px] font-medium border border-[#E2E8F0] rounded text-[#1C2434] bg-white hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {detailPrescription && (
                <DetailModal
                    prescription={detailPrescription}
                    onClose={() => setDetailPrescription(null)}
                    onEditStatus={openStatusModal}
                />
            )}

            {statusPrescription && (
                <StatusModal
                    key={statusPrescription.id}
                    prescription={statusPrescription}
                    saving={saving}
                    onClose={() => !saving && setStatusPrescription(null)}
                    onSubmit={handleUpdateStatus}
                />
            )}
        </div>
    );
};

export default PharmacistPrescriptionPage;
