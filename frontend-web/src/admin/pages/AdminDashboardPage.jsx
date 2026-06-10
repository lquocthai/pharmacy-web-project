import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    AreaChart, Area,
    BarChart, Bar,
    PieChart, Pie, Cell, Tooltip as ReTooltip,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
    ShoppingCart, Users, Package, TrendingUp,
    Clock, CheckCircle, Truck, XCircle, AlertCircle,
} from 'lucide-react';
import dashboardAdminService from '../service/dashboardAdminService';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const fmt = (n) =>
    n == null ? '—' : Number(n).toLocaleString('vi-VN');

const fmtVnd = (n) => {
    if (n == null) return '—';
    const num = Number(n);
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' tỷ';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + ' tr';
    return num.toLocaleString('vi-VN') + ' đ';
};

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, bg }) => (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className={`w-13 h-13 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
            <Icon size={24} className={color} />
        </div>
        <div className="min-w-0">
            <p className="text-xs text-[#64748B] font-medium truncate">{label}</p>
            <p className="text-2xl font-bold text-[#1C2434] mt-0.5 leading-none">{value}</p>
            {sub && <p className="text-[10px] text-[#8A99AD] mt-1">{sub}</p>}
        </div>
    </div>
);

const OrderStatusBadge = ({ label, count, colorClass }) => (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${colorClass}`}>
        <span className="text-xs font-medium">{label}</span>
        <span className="text-lg font-bold">{fmt(count)}</span>
    </div>
);

const SectionCard = ({ title, children, action }) => (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3">
        <div className="flex items-center justify-between mb-4">
            <h2 className=" font-bold text-[#1C2434]">{title}</h2>
            {action}
        </div>
        {children}
    </div>
);

const SkeletonBlock = ({ h = 'h-32' }) => (
    <div className={`bg-[#F1F5F9] animate-pulse rounded-2xl ${h}`} />
);

// Custom tooltip tiền VND
const VndTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-lg px-4 py-2 text-xs">
            <p className="font-semibold text-[#1C2434] mb-1">{label}</p>
            {payload.map((p) => (
                <p key={p.name} style={{ color: p.color }}>
                    {p.name}: {p.name === 'Doanh thu' ? fmtVnd(p.value) : fmt(p.value)}
                </p>
            ))}
        </div>
    );
};

// ─────────────────────────────────────────────
// PIE: Trạng thái đơn hàng
// ─────────────────────────────────────────────
const STATUS_PIE_COLORS = ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444'];

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
const AdminDashboardPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const today = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    useEffect(() => {
        (async () => {
            try {
                const res = await dashboardAdminService.getDashboard();
                setData(res.data?.result);
                console.log(res.data?.result)
            } catch {
                toast.error('Không tải được dữ liệu dashboard');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ── PIE data ──────────────────────────────
    const pieData = data
        ? [
            { name: 'Chờ xác nhận', value: data.pendingOrders },
            { name: 'Đã xác nhận', value: data.confirmedOrders },
            { name: 'Đang giao', value: data.shippingOrders },
            { name: 'Đã giao', value: data.deliveredOrders },
            { name: 'Đã hủy', value: data.cancelledOrders },
        ]
        : [];

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-0 md:p-6 text-[#1C2434]">

            {/* ── Header ── */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h2 className="text-xl font-bold text-[#1C2434]">Dashboard Quản trị</h2>
                    <p className="text-xs text-[#64748B] mt-0.5 capitalize">{today}</p>
                </div>
                <span className="text-xs text-[#64748B]">Trang chủ &gt; Dashboard</span>
            </div>

            {loading ? (
                /* ── Skeleton ── */
                <div className="space-y-5">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => <SkeletonBlock key={i} h="h-24" />)}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <SkeletonBlock h="h-64" />
                        <SkeletonBlock h="h-64" />
                    </div>
                </div>
            ) : (
                <div className="space-y-5">

                    {/* ── Row 1: 8 stat cards ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={ShoppingCart}
                            label="Tổng đơn hàng"
                            value={fmt(data?.totalOrders)}
                            sub={`Hôm nay: ${fmt(data?.todayOrders)} đơn`}
                            color="text-[#3C50E0]"
                            bg="bg-[#EBF0FF]"
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Tổng doanh thu"
                            value={fmtVnd(data?.totalRevenue)}
                            sub={`Hôm nay: ${fmtVnd(data?.todayRevenue)}`}
                            color="text-[#10B981]"
                            bg="bg-[#D1FAE5]"
                        />
                        <StatCard
                            icon={Users}
                            label="Khách hàng"
                            value={fmt(data?.totalCustomers)}
                            sub={`${fmt(data?.totalCustomers)} khách hàng hoạt động`}
                            color="text-[#F59E0B]"
                            bg="bg-[#FEF3C7]"
                        />
                        <StatCard
                            icon={Package}
                            label="Sản phẩm"
                            value={fmt(data?.totalProducts)}
                            sub={`Đang bán: ${fmt(data?.activeProducts)} sản phẩm`}
                            color="text-[#8B5CF6]"
                            bg="bg-[#EDE9FE]"
                        />

                        {/* Status cards */}
                        <StatCard
                            icon={Clock}
                            label="Chờ xác nhận"
                            value={fmt(data?.pendingOrders)}
                            sub="Cần xử lý ngay"
                            color="text-[#F59E0B]"
                            bg="bg-amber-50"
                        />
                        <StatCard
                            icon={CheckCircle}
                            label="Đã xác nhận"
                            value={fmt(data?.confirmedOrders)}
                            sub="Chuẩn bị giao hàng"
                            color="text-[#3B82F6]"
                            bg="bg-blue-50"
                        />
                        <StatCard
                            icon={Truck}
                            label="Đang giao"
                            value={fmt(data?.shippingOrders)}
                            sub="Đơn đang trên đường"
                            color="text-[#8B5CF6]"
                            bg="bg-violet-50"
                        />
                        <StatCard
                            icon={XCircle}
                            label="Đã hủy"
                            value={fmt(data?.cancelledOrders)}
                            sub={`Đã giao: ${fmt(data?.deliveredOrders)} đơn`}
                            color="text-[#EF4444]"
                            bg="bg-red-50"
                        />
                    </div>

                    {/* ── Row 2: Doanh thu 7 ngày + Biểu đồ đơn hàng ── */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                        <SectionCard title="Doanh thu 7 ngày gần nhất">
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={data?.revenueChart || []} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <defs >
                                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3C50E0" stopOpacity={0.18} />
                                            <stop offset="95%" stopColor="#3C50E0" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#64748B' }}
                                        tickFormatter={(v) => fmtVnd(v)}
                                        width={70}
                                    />
                                    <Tooltip content={<VndTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Doanh thu"
                                        stroke="#3C50E0"
                                        strokeWidth={2.5}
                                        fill="url(#revenueGrad)"
                                        dot={{ r: 3.5, fill: '#3C50E0' }}
                                        activeDot={{ r: 5 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </SectionCard>

                        <SectionCard title="Số đơn hàng 7 ngày gần nhất">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={data?.orderChart || []} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                                    <Tooltip content={<VndTooltip />} />
                                    <Bar dataKey="count" name="Đơn hàng" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </SectionCard>
                    </div>

                    {/* ── Row 3: Pie trạng thái + Top sản phẩm ── */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                        <SectionCard title="Phân bổ trạng thái đơn hàng">
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <PieChart width={200} height={200}>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell key={index} fill={STATUS_PIE_COLORS[index]} />
                                        ))}
                                    </Pie>
                                    <ReTooltip
                                        formatter={(v, n) => [fmt(v) + ' đơn', n]}
                                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                                    />
                                </PieChart>

                                <div className="flex-1 space-y-2 w-full">
                                    {pieData.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ background: STATUS_PIE_COLORS[i] }}
                                                />
                                                <span className="text-[#64748B]">{item.name}</span>
                                            </div>
                                            <span className="font-semibold text-[#1C2434]">{fmt(item.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard title="Top sản phẩm bán chạy">
                            {data?.topProducts?.length > 0 ? (
                                <div className="space-y-3">
                                    {data.topProducts.map((p, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            {/* Rank badge */}
                                            <span
                                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-600'
                                                    : i === 1 ? 'bg-slate-100 text-slate-500'
                                                        : i === 2 ? 'bg-orange-100 text-orange-500'
                                                            : 'bg-[#F1F5F9] text-[#64748B]'
                                                    }`}
                                            >
                                                {i + 1}
                                            </span>
                                            {/* Name + bar */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-xs font-medium text-[#1C2434] truncate max-w-[55%]">
                                                        {p.productName}
                                                    </p>
                                                    <p className="text-[10px] text-[#64748B] flex-shrink-0">
                                                        {fmt(p.soldQuantity)} sp — {fmtVnd(p.revenue)}
                                                    </p>
                                                </div>
                                                <div className="w-full bg-[#F1F5F9] rounded-full h-1.5">
                                                    <div
                                                        className="h-1.5 rounded-full bg-[#3C50E0]"
                                                        style={{
                                                            width: `${Math.min(
                                                                100,
                                                                (p.soldQuantity /
                                                                    (data.topProducts[0]?.soldQuantity || 1)) * 100
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-[#64748B] text-center py-8">Chưa có dữ liệu bán hàng</p>
                            )}
                        </SectionCard>
                    </div>

                </div>
            )}
        </div>
    );
};

export default AdminDashboardPage;