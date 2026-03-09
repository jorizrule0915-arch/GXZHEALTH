import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Order {
  id: string;
  order_number: string;
  items: any[];
  total_items: number;
  total_price: number;
  payment_method: string;
  status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const ADMIN_PASSWORD = 'gxzhealth2025'; // Change this to your secure password

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
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

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8faff' }}>
        <div style={{ background: 'white', padding: '48px', borderRadius: '24px', boxShadow: '0 8px 32px rgba(37,99,235,.12)', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: '800', marginBottom: '24px', textAlign: 'center' }}>Admin Login</h2>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%',
              padding: '14px',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '1rem',
              marginBottom: '16px'
            }}
          />
          <Button onClick={handleLogin} style={{ width: '100%' }} size="lg">
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8faff', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem', fontWeight: '800' }}>Orders Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(37,99,235,.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Package className="w-5 h-5 text-blue-500" />
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Total Orders</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0a1628' }}>{orders.length}</div>
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(37,99,235,.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <DollarSign className="w-5 h-5 text-green-500" />
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Total Revenue</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0a1628' }}>
              ${orders.reduce((sum, order) => sum + Number(order.total_price), 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(37,99,235,.08)', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Recent Orders</h2>
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>
          ) : orders.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>No orders yet</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8faff' }}>
                  <tr>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Order #</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Items</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Total</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Payment</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Date</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px', fontWeight: '600', color: '#1e293b' }}>{order.order_number}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '0.875rem' }}>
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} style={{ marginBottom: '4px' }}>
                              {item.name} (x{item.quantity})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontWeight: '600', color: '#10b981' }}>${Number(order.total_price).toFixed(2)}</td>
                      <td style={{ padding: '16px', color: '#475569' }}>{order.payment_method}</td>
                      <td style={{ padding: '16px', color: '#475569', fontSize: '0.875rem' }}>
                        {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '100px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: order.status === 'completed' ? '#d1fae5' : '#fef3c7',
                          color: order.status === 'completed' ? '#065f46' : '#92400e'
                        }}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
