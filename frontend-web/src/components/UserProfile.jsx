import { useCallback, useEffect, useMemo, useState } from 'react';
import profileService from '../services/profileService';
import LogoInfo from '../assets/avatar-profile.svg';

const formatDate = (value) => {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('vi-VN');
};

const getProviderLabel = (user) => user?.provider || user?.authProvider || 'DEFAULT';

const emptyText = <span className="text-gray-400 italic">Chưa cập nhật</span>;

export default function UserProfile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const roles = useMemo(() => user?.roles || [], [user]);

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const res = await profileService.getMe();
            setUser(res.data?.result || null);
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || 'Không tải được thông tin tài khoản');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    if (loading && !user) {
        return (
            <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center text-[#64748B] font-medium text-xs">
                <div className="animate-spin inline-block w-5 h-5 border-[2.5px] border-current border-t-transparent text-[#3C50E0] rounded-full mr-2" role="status"></div>
                Đang tải thông tin tài khoản...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F1F5F9] p-0 md:p-6 text-[#1C2434] font-satoshi">
                <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <h2 className="text-xl font-bold text-[#1C2434]">Thông tin tài khoản</h2>
                    </div>
                    <p className="text-xs text-[#64748B]">Home &gt; Tài khoản</p>
                </div>

                <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0] p-10 text-center">
                    <p className="text-sm font-medium text-red-600">{error}</p>
                    <button
                        type="button"
                        onClick={fetchProfile}
                        className="mt-4 px-3 py-1.5 rounded-md bg-[#3C50E0] text-white text-xs font-medium hover:bg-opacity-90 transition-all"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#F1F5F9] p-6 text-center text-[#64748B]">
                Không có thông tin tài khoản.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-6 text-[#1C2434] font-satoshi">
            <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h2 className="text-xl font-bold text-[#1C2434]">Thông tin tài khoản</h2>
                </div>
                <div className="flex items-center gap-2">

                    <p className="text-xs text-[#64748B]">Home &gt; Tài khoản</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div style={{ borderRadius: '1rem' }} className="bg-white p-6 border border-[#E2E8F0] text-center">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#E2E8F0] p-1 flex items-center justify-center font-bold text-[#3C50E0] border border-[#CBD5E1]">
                            <img src={LogoInfo} alt={user.username || 'User'} className="w-full h-full rounded-full object-cover" />
                        </div>
                        <h2 className="text-base font-bold text-[#1C2434] truncate">{user.username || 'N/A'}</h2>
                        <p className="text-xs text-[#64748B] mt-1 truncate">{user.email || 'Chưa cập nhật email'}</p>

                        <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-col items-center gap-2">
                            <span className="text-[11px] text-[#8A99AD] font-medium uppercase tracking-wider">Trạng thái tài khoản</span>
                            {user.active ? (
                                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-100">
                                    Hoạt động
                                </span>
                            ) : (
                                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                                    Bị khóa
                                </span>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-col items-center gap-2">
                            <span className="text-[11px] text-[#8A99AD] font-medium uppercase tracking-wider">Vai trò tài khoản</span>
                            {roles.length ? roles.map((role, idx) => (
                                <span key={`${role.name}-${idx}`} className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-100">
                                    {role.name}
                                </span>
                            )) : (
                                <span className="text-xs text-gray-400 italic">Chưa được cấp vai trò</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div style={{ borderRadius: '1rem' }} className="mb-2 bg-white border border-[#E2E8F0] overflow-hidden">
                        <div className="p-2 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                            <h6 className="text-start text-sm font-bold text-[#1C2434] uppercase tracking-wider">Thông tin cá nhân</h6>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <InfoRow label="Mã định danh (ID)" value={user.id} mono />
                            <InfoRow label="Tên tài khoản" value={user.username} strong />
                            <InfoRow label="Địa chỉ Email" value={user.email} />
                            <InfoRow label="Số điện thoại" value={user.phone} />
                            <InfoRow label="Giới tính" value={user.sex} />
                            <InfoRow label="Ngày sinh (DOB)" value={formatDate(user.dob)} />
                            <InfoRow label="Provider" value={getProviderLabel(user)} />
                            <InfoRow label="Auth Provider" value={user.authProvider || 'Không có'} />
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value, mono = false, strong = false }) {
    return (
        <div>
            <label className="block text-[#64748B] font-medium mb-1">{label}</label>
            <div className={`bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded text-[#1C2434] break-words ${mono ? 'font-mono select-all' : ''} ${strong ? 'font-semibold' : ''}`}>
                {value || emptyText}
            </div>
        </div>
    );
}
