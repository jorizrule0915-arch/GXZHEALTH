import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Package, DollarSign, RefreshCw, Search,
  ChevronDown, ChevronUp, CheckCircle2, Clock, ShieldCheck,
  Users, TrendingUp, Filter, Mail, Phone, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface Order {
  id: string;
  order_number: string;
  items: OrderItem[];
  total_items: number;
  total_price: number;
  payment_method: string | null;
  payment_reference_id: string | null;
  payer_account_name: string | null;
  payment_submitted_at: string | null;
  status: string;
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  customer_city: string | null;
  customer_state: string | null;
  customer_zip: string | null;
}

const ADMIN_PASSWORD = 'gxzhealth2025';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  complete: {
    label: 'Complete',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  completed: {
    label: 'Complete',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  processing: {
    label: 'Processing',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: <RefreshCw className="w-3 h-3" />,
  },
  payment_submitted: {
    label: 'Payment Submitted',
    color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    icon: <ShieldCheck className="w-3 h-3" />,
  },
  payment_contact_requested: {
    label: 'Payment Contact Requested',
    color: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    icon: <Mail className="w-3 h-3" />,
  },
  pending: {
    label: 'Pending',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: <Clock className="w-3 h-3" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? {
    label: status,
    color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    icon: null,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function StatCard({
  title, value, sub, icon, gradient,
}: { title: string; value: string | number; sub?: string; icon: React.ReactNode; gradient: string }) {
  return (
    <Card className="relative overflow-hidden border-0 bg-slate-800/60 backdrop-blur-sm">
      <div className={`absolute inset-0 opacity-10 ${gradient}`} />
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl ${gradient} bg-opacity-20`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === 'true') {
      setIsAuthenticated(true);
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
      fetchOrders();
    } else {
      alert('Incorrect password');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    navigate('/');
  };

  const fetchOrders = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setOrders(data as Order[]);
    setLoading(false);
    setRefreshing(false);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        o.order_number.toLowerCase().includes(q) ||
        (o.customer_name ?? '').toLowerCase().includes(q) ||
        (o.customer_email ?? '').toLowerCase().includes(q) ||
        (o.payment_reference_id ?? '').toLowerCase().includes(q) ||
        (o.payer_account_name ?? '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    revenue: orders.reduce((s, o) => s + Number(o.total_price), 0),
    pending: orders.filter(o =>
      o.status === 'pending' ||
      o.status === 'processing' ||
      o.status === 'payment_submitted' ||
      o.status === 'payment_contact_requested'
    ).length,
    complete: orders.filter(o => o.status === 'complete' || o.status === 'completed').length,
  }), [orders]);

  // ─── Login Screen ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        {/* background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
        </div>
        <Card className="w-full max-w-sm border-slate-700 bg-slate-800/80 backdrop-blur-xl shadow-2xl relative">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Admin Access</CardTitle>
            <p className="text-slate-400 text-sm mt-1">Enter your password to continue</p>
          </CardHeader>
          <CardContent className="p-6 pt-4 space-y-4">
            <div className="relative">
              <Input
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 h-12 pr-4"
              />
            </div>
            <Button
              onClick={handleLogin}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Dashboard ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b border-slate-700/60 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/GXZ-Health.png" alt="GXZ Health Logo" className="h-9 w-auto object-contain" />
            <span className="hidden sm:block text-slate-600 mx-1">·</span>
            <span className="hidden sm:block text-slate-400 text-sm font-medium">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="text-slate-400 hover:text-white gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Orders Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor and manage all customer orders</p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-0 bg-slate-800/60 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Orders"
              value={stats.total}
              sub="All time"
              gradient="bg-blue-600"
              icon={<Package className="w-5 h-5 text-blue-400" />}
            />
            <StatCard
              title="Total Revenue"
              value={`$${stats.revenue.toFixed(2)}`}
              sub="All time"
              gradient="bg-emerald-600"
              icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
            />
            <StatCard
              title="Pending / Processing"
              value={stats.pending}
              sub="Needs attention"
              gradient="bg-amber-600"
              icon={<Clock className="w-5 h-5 text-amber-400" />}
            />
            <StatCard
              title="Completed"
              value={stats.complete}
              sub="Successfully fulfilled"
              gradient="bg-purple-600"
              icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
            />
          </div>
        )}

        {/* Table Card */}
        <Card className="border-slate-700/60 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-slate-700/60 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Users className="w-5 h-5 text-slate-400" />
                <CardTitle className="text-lg text-white">Recent Orders</CardTitle>
              </div>
              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    placeholder="Search order / customer…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 w-56 h-9 text-sm bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36 h-9 text-sm bg-slate-700/50 border-slate-600 text-white">
                    <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="payment_submitted">Payment Submitted</SelectItem>
                      <SelectItem value="payment_contact_requested">Payment Contact Requested</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-24 text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mr-3" />
                Loading orders…
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                <Package className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-medium">No orders found</p>
                <p className="text-sm mt-1">Try adjusting your search or filter</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/60 hover:bg-transparent">
                    <TableHead className="text-slate-400 w-8" />
                    <TableHead className="text-slate-400">Order #</TableHead>
                    <TableHead className="text-slate-400">Customer</TableHead>
                    <TableHead className="text-slate-400 hidden md:table-cell">Items</TableHead>
                    <TableHead className="text-slate-400">Total</TableHead>
                    <TableHead className="text-slate-400 hidden sm:table-cell">Payment</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400 hidden lg:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => {
                    const isExpanded = expandedRow === order.id;
                    const orderItems = order.items as OrderItem[];
                    const orderSubtotal = orderItems.reduce(
                      (sum, item) => sum + Number(item.total ?? item.price * item.quantity),
                      0
                    );
                    const orderTotal = Number(order.total_price);
                    const shippingCost = Math.max(orderTotal - orderSubtotal, 0);

                    return (
                      <>
                        <TableRow
                          key={order.id}
                          className="border-slate-700/40 hover:bg-slate-700/30 cursor-pointer transition-colors"
                          onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                        >
                          {/* expand toggle */}
                          <TableCell className="pr-0">
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4 text-slate-400" />
                              : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </TableCell>
                          <TableCell className="font-mono text-blue-400 text-sm font-semibold">
                            {order.order_number}
                          </TableCell>
                          <TableCell>
                            <div className="text-white font-medium text-sm">{order.customer_name ?? '—'}</div>
                            <div className="text-slate-500 text-xs">{order.customer_email ?? ''}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-slate-300 text-sm">
                            {order.total_items} item{order.total_items !== 1 ? 's' : ''}
                          </TableCell>
                          <TableCell className="font-bold text-emerald-400">
                            ${orderTotal.toFixed(2)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-slate-400 text-sm">
                            {order.payment_method ?? '—'}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-slate-500 text-xs">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                            <div>{new Date(order.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit', minute: '2-digit',
                            })}</div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded detail row */}
                        {isExpanded && (
                          <TableRow key={`${order.id}-detail`} className="border-slate-700/40 bg-slate-800/80">
                            <TableCell colSpan={8} className="py-4 px-6">
                              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Customer Info */}
                                <div>
                                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                    Customer Info
                                  </p>
                                  <div className="space-y-2">
                                    {order.customer_email && (
                                      <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                        {order.customer_email}
                                      </div>
                                    )}
                                    {order.customer_phone && (
                                      <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                        {order.customer_phone}
                                      </div>
                                    )}
                                    {order.customer_address && (
                                      <div className="flex items-start gap-2 text-sm text-slate-300">
                                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                        <span>
                                          {order.customer_address}
                                          {order.customer_city && `, ${order.customer_city}`}
                                          {order.customer_state && `, ${order.customer_state}`}
                                          {order.customer_zip && ` ${order.customer_zip}`}
                                        </span>
                                      </div>
                                    )}
                                    {(order.payment_method || order.payment_reference_id || order.payer_account_name) && (
                                      <div className="pt-3 mt-3 border-t border-slate-700">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                          Payment Details
                                        </p>
                                        {order.payment_method && (
                                          <div className="text-sm text-slate-300">
                                            <span className="text-slate-500">Method:</span> {order.payment_method}
                                          </div>
                                        )}
                                        {order.payment_reference_id && (
                                          <div className="text-sm text-slate-300">
                                            <span className="text-slate-500">Reference ID:</span> {order.payment_reference_id}
                                          </div>
                                        )}
                                        {order.payer_account_name && (
                                          <div className="text-sm text-slate-300">
                                            <span className="text-slate-500">Account Name:</span> {order.payer_account_name}
                                          </div>
                                        )}
                                        {order.payment_submitted_at && (
                                          <div className="text-sm text-slate-300">
                                            <span className="text-slate-500">Submitted:</span>{' '}
                                            {new Date(order.payment_submitted_at).toLocaleString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Items Ordered */}
                                <div className="lg:col-span-2">
                                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                    Items Ordered
                                  </p>
                                  <div className="space-y-1.5">
                                    {orderItems.map((item, i) => (
                                      <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="text-slate-300">
                                          <span className="text-slate-500 mr-2">×{item.quantity}</span>
                                          {item.name}
                                        </div>
                                        <span className="text-emerald-400 font-semibold ml-4 shrink-0">
                                          ${Number(item.total ?? item.price * item.quantity).toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                    {shippingCost > 0 && (
                                      <>
                                        <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-700 mt-2">
                                          <span className="text-slate-400 font-medium">Subtotal</span>
                                          <span className="text-slate-300">
                                            ${orderSubtotal.toFixed(2)}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                          <span className="text-slate-400 font-medium">Shipping</span>
                                          <span className="text-slate-300">
                                            ${shippingCost.toFixed(2)}
                                          </span>
                                        </div>
                                      </>
                                    )}
                                    <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-700 mt-2">
                                      <span className="text-slate-400 font-medium">Total</span>
                                      <span className="text-white font-bold">
                                        ${orderTotal.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {/* Footer count */}
            {!loading && filteredOrders.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-700/60 text-xs text-slate-500">
                Showing {filteredOrders.length} of {orders.length} orders
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
