import { Fragment, useEffect, useMemo, useState, type DragEvent as ReactDragEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  DollarSign,
  Filter,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  TicketPercent,
  Trash2,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Json, Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { fallbackProducts, normalizeCatalogProduct, parseLineSeparatedList, slugify, type CatalogProduct } from '@/lib/products';
import PromoProductsSection from '@/components/admin/PromoProductsSection';

type OrderRow = Tables<'orders'>;
type ProductRow = Tables<'products'>;
type ProductInsert = TablesInsert<'products'>;

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface ProductOptionForm {
  label: string;
  value: string;
  price: string;
}

interface ProductFormState {
  id?: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  category: string;
  price: string;
  imageUrl: string;
  galleryText: string;
  featuresText: string;
  highlightsText: string;
  sortOrder: string;
  inStock: boolean;
  isActive: boolean;
  options: ProductOptionForm[];
}

type AdminSection = 'overview' | 'sales' | 'pipeline' | 'orders' | 'products' | 'promo-products';
type DashboardOrder = Omit<OrderRow, 'items'> & { items: OrderItem[] };
type PipelineColumnId = 'payment_contact_requested' | 'processing' | 'complete';
type PipelineColumn = {
  id: PipelineColumnId;
  title: string;
  description: string;
  orders: DashboardOrder[];
  empty: string;
};

const ADMIN_PASSWORD = 'gxzhealth2025';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  complete: {
    label: 'Paid / Complete',
    color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  completed: {
    label: 'Paid / Complete',
    color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  processing: {
    label: 'Processing',
    color: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    icon: <RefreshCw className="h-3 w-3" />,
  },
  payment_submitted: {
    label: 'Payment Submitted',
    color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    icon: <ShieldCheck className="h-3 w-3" />,
  },
  payment_contact_requested: {
    label: 'Contact Requested',
    color: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    icon: <Mail className="h-3 w-3" />,
  },
  pending: {
    label: 'Pending',
    color: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    icon: <Clock className="h-3 w-3" />,
  },
};

const sectionItems: Array<{ id: AdminSection; label: string; description: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Dashboard', description: 'Overall activity', icon: LayoutDashboard },
  { id: 'sales', label: 'Sales', description: 'Live revenue view', icon: BarChart3 },
  { id: 'pipeline', label: 'Pipeline', description: 'Apple Pay / Zelle', icon: Workflow },
  { id: 'orders', label: 'Orders', description: 'All order records', icon: Package },
  { id: 'products', label: 'Products', description: 'Add and manage', icon: Boxes },
  { id: 'promo-products', label: 'PROMO PRODUCTS', description: 'Influencer code tracking', icon: TicketPercent },
];

function isOrderItem(value: unknown): value is OrderItem {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<OrderItem>;

  return (
    typeof candidate.name === 'string' &&
    typeof candidate.price === 'number' &&
    typeof candidate.quantity === 'number' &&
    typeof candidate.total === 'number'
  );
}

function parseOrderItems(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isOrderItem);
}

function parseStringArray(value: Json | null | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
}

function parseOptionRows(value: Json | null | undefined): ProductOptionForm[] {
  if (!Array.isArray(value)) {
    return [{ label: '', value: '', price: '' }];
  }

  const rows = value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return [];
    }

    const label = typeof entry.label === 'string' ? entry.label : '';
    const rowValue = typeof entry.value === 'string' ? entry.value : '';
    const price = typeof entry.price === 'number' ? String(entry.price) : '';

    return [{ label, value: rowValue, price }];
  });

  return rows.length > 0 ? rows : [{ label: '', value: '', price: '' }];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function emptyProductForm(): ProductFormState {
  return {
    slug: '',
    name: '',
    description: '',
    longDescription: '',
    category: '',
    price: '',
    imageUrl: '',
    galleryText: '',
    featuresText: '',
    highlightsText: '',
    sortOrder: '',
    inStock: true,
    isActive: true,
    options: [{ label: '', value: '', price: '' }],
  };
}

function productToForm(product: ProductRow): ProductFormState {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    longDescription: product.long_description ?? '',
    category: product.category,
    price: String(product.price),
    imageUrl: product.image_url ?? '',
    galleryText: parseStringArray(product.gallery).join('\n'),
    featuresText: parseStringArray(product.features).join('\n'),
    highlightsText: parseStringArray(product.highlights).join('\n'),
    sortOrder: String(product.sort_order ?? 0),
    inStock: product.in_stock,
    isActive: product.is_active,
    options: parseOptionRows(product.options),
  };
}

function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = statusConfig[status] ?? {
    label: status,
    color: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    icon: null,
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold', config.color, className)}>
      {config.icon}
      {config.label}
    </span>
  );
}

function MetricCard({
  title,
  value,
  sub,
  icon,
  gradient,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <Card className="relative overflow-hidden border-slate-800 bg-slate-900/70 backdrop-blur-sm">
      <div className={`absolute inset-0 opacity-10 ${gradient}`} />
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-400">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
            {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
          </div>
          <div className={`rounded-2xl p-3 ${gradient} bg-opacity-20`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [now, setNow] = useState(() => new Date());
  const [savingProduct, setSavingProduct] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm());
  const [handledActionKey, setHandledActionKey] = useState('');
  const [draggingOrderId, setDraggingOrderId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<PipelineColumnId | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_auth') === 'true';
    if (saved) {
      setIsAuthenticated(true);
    } else {
      setLoadingOrders(false);
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    const view = searchParams.get('view');
    if (view && sectionItems.some((item) => item.id === view)) {
      setActiveSection(view as AdminSection);
    }
  }, [searchParams]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Unable to load orders',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const normalized = (data ?? []).map((order) => ({
      ...order,
      items: parseOrderItems(order.items),
    }));

    setOrders(normalized);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: 'Products table not ready',
        description: 'Apply the latest Supabase migration to manage products from admin.',
        variant: 'destructive',
      });
      return;
    }

    setProducts(data ?? []);
  };

  const refreshAll = async (showSpinner = false) => {
    if (showSpinner) {
      setRefreshing(true);
    } else {
      setLoadingOrders(true);
      setLoadingProducts(true);
    }

    await Promise.all([fetchOrders(), fetchProducts()]);

    setLoadingOrders(false);
    setLoadingProducts(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void refreshAll();
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (password !== ADMIN_PASSWORD) {
      toast({
        title: 'Incorrect password',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return;
    }

    sessionStorage.setItem('admin_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    navigate('/');
  };

  const updateOrderStatus = async (orderId: string, status: string, description?: string) => {
    const payload: TablesUpdate<'orders'> = { status };
    const { error } = await supabase.from('orders').update(payload).eq('id', orderId);

    if (error) {
      toast({
        title: 'Unable to update order',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    setOrders((current) => current.map((order) => (
      order.id === orderId ? { ...order, status } : order
    )));

    toast({
      title: 'Order updated',
      description: description ?? `Status moved to ${status}.`,
    });

    return true;
  };

  const movePipelineOrder = async (order: DashboardOrder, targetColumn: PipelineColumnId) => {
    const nextStatus = targetColumn === 'complete' ? 'complete' : targetColumn;
    if (order.status === nextStatus || (targetColumn === 'complete' && order.status === 'completed')) {
      return;
    }

    await updateOrderStatus(order.id, nextStatus, `${order.order_number} moved to ${targetColumn === 'payment_contact_requested' ? 'Requested' : targetColumn === 'processing' ? 'Processing' : 'Paid'}.`);
  };

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm('Delete this order permanently?')) {
      return;
    }

    const { error } = await supabase.from('orders').delete().eq('id', orderId);

    if (error) {
      toast({
        title: 'Unable to delete order',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setOrders((current) => current.filter((order) => order.id !== orderId));
    toast({
      title: 'Order deleted',
      description: 'The order has been removed from the dashboard.',
    });
  };

  const addOptionRow = () => {
    setProductForm((current) => ({
      ...current,
      options: [...current.options, { label: '', value: '', price: '' }],
    }));
  };

  const updateOptionRow = (index: number, key: keyof ProductOptionForm, value: string) => {
    setProductForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => (
        optionIndex === index ? { ...option, [key]: value } : option
      )),
    }));
  };

  const removeOptionRow = (index: number) => {
    setProductForm((current) => ({
      ...current,
      options: current.options.length === 1
        ? [{ label: '', value: '', price: '' }]
        : current.options.filter((_, optionIndex) => optionIndex !== index),
    }));
  };

  const saveProduct = async () => {
    if (!productForm.name.trim() || !productForm.category.trim() || !productForm.description.trim()) {
      toast({
        title: 'Missing product details',
        description: 'Name, category, and short description are required.',
        variant: 'destructive',
      });
      return;
    }

    const slug = (productForm.slug || slugify(productForm.name)).trim();
    const price = Number(productForm.price || 0);
    const options = productForm.options
      .filter((option) => option.label.trim())
      .map((option) => ({
        label: option.label.trim(),
        value: option.value.trim() || slugify(option.label),
        ...(option.price.trim() ? { price: Number(option.price) } : {}),
      }));

    const payload: ProductInsert = {
      ...(productForm.id ? { id: productForm.id } : {}),
      slug,
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      long_description: productForm.longDescription.trim() || null,
      category: productForm.category.trim(),
      price,
      image_url: productForm.imageUrl.trim() || null,
      gallery: parseLineSeparatedList(productForm.galleryText),
      features: parseLineSeparatedList(productForm.featuresText),
      highlights: parseLineSeparatedList(productForm.highlightsText),
      options,
      in_stock: productForm.inStock,
      is_active: productForm.isActive,
      sort_order: Number(productForm.sortOrder || 0),
    };

    setSavingProduct(true);

    const { data, error } = await supabase
      .from('products')
      .upsert(payload)
      .select('*')
      .single();

    setSavingProduct(false);

    if (error) {
      toast({
        title: 'Unable to save product',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setProducts((current) => {
      const next = current.some((product) => product.id === data.id)
        ? current.map((product) => (product.id === data.id ? data : product))
        : [...current, data];

      return next.sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0));
    });

    setProductForm(emptyProductForm());
    toast({
      title: productForm.id ? 'Product updated' : 'Product created',
      description: `${data.name} is now available in admin.`,
    });
  };

  const editProduct = (product: ProductRow) => {
    setActiveSection('products');
    setProductForm(productToForm(product));
  };

  const deleteProduct = async (productId: string) => {
    if (!window.confirm('Delete this product from the catalog?')) {
      return;
    }

    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (error) {
      toast({
        title: 'Unable to delete product',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setProducts((current) => current.filter((product) => product.id !== productId));
    toast({
      title: 'Product deleted',
      description: 'The product has been removed from the catalog.',
    });
  };

  useEffect(() => {
    if (!isAuthenticated || orders.length === 0) {
      return;
    }

    const action = searchParams.get('action');
    const orderNumber = searchParams.get('order');

    if (!action || !orderNumber) {
      return;
    }

    const actionKey = `${action}:${orderNumber}`;
    if (handledActionKey === actionKey) {
      return;
    }

    const targetOrder = orders.find((order) => order.order_number === orderNumber);
    if (!targetOrder) {
      return;
    }

    const nextStatus = action === 'complete'
      ? 'complete'
      : action === 'processing'
        ? 'processing'
        : null;

    if (!nextStatus) {
      setHandledActionKey(actionKey);
      return;
    }

    setHandledActionKey(actionKey);
    setActiveSection('pipeline');

    void (async () => {
      const success = await updateOrderStatus(targetOrder.id, nextStatus, `Updated ${orderNumber} from the email action.`);
      if (success) {
        navigate('/admin?view=pipeline', { replace: true });
      }
    })();
  }, [handledActionKey, isAuthenticated, navigate, orders, searchParams]);

  const filteredOrders = useMemo(() => {
    const committedOrders = orders.filter((order) => (order.payment_method ?? '').trim().length > 0);
    const query = search.trim().toLowerCase();

    return committedOrders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      if (!query) {
        return matchesStatus;
      }

      return matchesStatus && (
        order.order_number.toLowerCase().includes(query) ||
        (order.customer_name ?? '').toLowerCase().includes(query) ||
        (order.customer_email ?? '').toLowerCase().includes(query) ||
        (order.payment_method ?? '').toLowerCase().includes(query) ||
        (order.payment_reference_id ?? '').toLowerCase().includes(query) ||
        (order.payer_account_name ?? '').toLowerCase().includes(query)
      );
    });
  }, [orders, search, statusFilter]);

  const submittedOrders = useMemo(
    () => orders.filter((order) => (order.payment_method ?? '').trim().length > 0),
    [orders],
  );

  const stats = useMemo(() => {
    const monthOrders = submittedOrders.filter((order) => {
      const created = new Date(order.created_at);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    });
    const todayOrders = submittedOrders.filter((order) => {
      const created = new Date(order.created_at);
      return created.toDateString() === now.toDateString();
    });
    const completeOrders = submittedOrders.filter((order) => order.status === 'complete' || order.status === 'completed');
    const pipelineOrders = submittedOrders.filter((order) =>
      ['Apple Pay', 'Zelle'].includes(order.payment_method ?? '') &&
      order.status !== 'complete' &&
      order.status !== 'completed'
    );

    return {
      totalOrders: submittedOrders.length,
      totalRevenue: submittedOrders.reduce((sum, order) => sum + Number(order.total_price), 0),
      monthRevenue: monthOrders.reduce((sum, order) => sum + Number(order.total_price), 0),
      todayRevenue: todayOrders.reduce((sum, order) => sum + Number(order.total_price), 0),
      monthOrders: monthOrders.length,
      todayOrders: todayOrders.length,
      completedOrders: completeOrders.length,
      pipelineOrders: pipelineOrders.length,
      averageOrder: submittedOrders.length > 0
        ? submittedOrders.reduce((sum, order) => sum + Number(order.total_price), 0) / submittedOrders.length
        : 0,
    };
  }, [now, submittedOrders]);

  const monthlySales = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
    const bucket = new Map<string, { label: string; revenue: number; orders: number }>();

    submittedOrders.forEach((order) => {
      const date = new Date(order.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const current = bucket.get(key) ?? { label: formatter.format(date), revenue: 0, orders: 0 };
      current.revenue += Number(order.total_price);
      current.orders += 1;
      bucket.set(key, current);
    });

    return [...bucket.entries()]
      .sort(([left], [right]) => (left < right ? 1 : -1))
      .slice(0, 6)
      .map(([, value]) => value);
  }, [submittedOrders]);

  const pipelineColumns = useMemo<PipelineColumn[]>(() => {
    const appleAndZelleOrders = submittedOrders.filter((order) => ['Apple Pay', 'Zelle'].includes(order.payment_method ?? ''));

    return [
      {
        id: 'payment_contact_requested',
        title: 'Requested',
        description: 'Waiting for owner follow-up',
        orders: appleAndZelleOrders.filter((order) => order.status === 'payment_contact_requested'),
        empty: 'No open requests right now.',
      },
      {
        id: 'processing',
        title: 'Processing',
        description: 'Waiting for payment confirmation',
        orders: appleAndZelleOrders.filter((order) => order.status === 'processing' || order.status === 'pending'),
        empty: 'Nothing is currently in processing.',
      },
      {
        id: 'complete',
        title: 'Paid',
        description: 'Confirmed and closed',
        orders: appleAndZelleOrders.filter((order) => order.status === 'complete' || order.status === 'completed'),
        empty: 'No confirmed Apple Pay / Zelle orders yet.',
      },
    ];
  }, [submittedOrders]);

  const handlePipelineDragStart = (event: ReactDragEvent<HTMLDivElement>, orderId: string) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', orderId);
    setDraggingOrderId(orderId);
  };

  const handlePipelineDragEnd = () => {
    setDraggingOrderId(null);
    setActiveDropColumn(null);
  };

  const handlePipelineDragOver = (event: ReactDragEvent<HTMLDivElement>, columnId: PipelineColumnId) => {
    event.preventDefault();
    if (activeDropColumn !== columnId) {
      setActiveDropColumn(columnId);
    }
  };

  const handlePipelineDrop = async (event: ReactDragEvent<HTMLDivElement>, columnId: PipelineColumnId) => {
    event.preventDefault();
    const orderId = event.dataTransfer.getData('text/plain') || draggingOrderId;
    setActiveDropColumn(null);
    setDraggingOrderId(null);

    if (!orderId) {
      return;
    }

    const order = orders.find((row) => row.id === orderId);
    if (!order) {
      return;
    }

    await movePipelineOrder(order, columnId);
  };

  const catalogProducts = useMemo(() => {
    if (products.length === 0) {
      return fallbackProducts;
    }

    return products.map(normalizeCatalogProduct);
  }, [products]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-3xl" />
        </div>
        <Card className="relative w-full max-w-sm border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
          <CardHeader className="pb-2 pt-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-600/20">
              <ShieldCheck className="h-8 w-8 text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Admin Access</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to manage sales, pipeline, orders, and products.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-4">
            <Input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && void handleLogin()}
              className="h-12 border-slate-700 bg-slate-800/70 text-white placeholder:text-slate-500"
            />
            <Button
              onClick={() => void handleLogin()}
              className="h-12 w-full bg-blue-600 text-base font-semibold text-white hover:bg-blue-500"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/GXZ-Health.png" alt="GXZ Health Logo" className="h-9 w-auto object-contain" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-white">GXZ Health Admin</p>
              <p className="text-xs text-slate-400">Live operations workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void refreshAll(true)}
              disabled={refreshing}
              className="gap-2 text-slate-300 hover:text-white"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-slate-300 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card className="border-slate-800 bg-slate-900/75">
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Live clock</p>
                  <p className="mt-2 text-2xl font-bold text-white">{now.toLocaleTimeString('en-US')}</p>
                  <p className="text-sm text-slate-400">
                    {now.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">This month</p>
                  <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(stats.monthRevenue)}</p>
                  <p className="text-sm text-slate-400">{stats.monthOrders} orders closed into revenue so far</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
              {sectionItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      'min-w-[11rem] rounded-2xl border px-4 py-3 text-left transition-colors lg:min-w-0',
                      active
                        ? 'border-blue-500/30 bg-blue-500/15 text-white'
                        : 'border-slate-800 bg-slate-900/65 text-slate-300 hover:border-slate-700 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('rounded-xl p-2', active ? 'bg-blue-500/20 text-blue-200' : 'bg-slate-800 text-slate-400')}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-xs text-slate-400">{item.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="space-y-6">
            <div className="flex flex-col gap-3 rounded-[28px] border border-slate-800 bg-slate-900/70 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
              <div>
                <h1 className="text-3xl font-bold text-white">Operations Dashboard</h1>
                <p className="mt-1 text-sm text-slate-400">
                  Track live sales, monitor Apple Pay and Zelle follow-ups, clean up old orders, and manage the product catalog from one place.
                </p>
              </div>
              <Badge className="w-fit border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-blue-200">
                {sectionItems.find((item) => item.id === activeSection)?.label}
              </Badge>
            </div>

            {activeSection === 'overview' && (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} sub="All time" gradient="bg-emerald-500" icon={<DollarSign className="h-5 w-5 text-emerald-300" />} />
                  <MetricCard title="This Month" value={formatCurrency(stats.monthRevenue)} sub={`${stats.monthOrders} orders`} gradient="bg-blue-500" icon={<TrendingUp className="h-5 w-5 text-blue-300" />} />
                  <MetricCard title="Pipeline" value={stats.pipelineOrders} sub="Apple Pay / Zelle need attention" gradient="bg-violet-500" icon={<Workflow className="h-5 w-5 text-violet-300" />} />
                  <MetricCard title="Completed" value={stats.completedOrders} sub="Orders marked paid" gradient="bg-amber-500" icon={<CheckCheck className="h-5 w-5 text-amber-300" />} />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <Card className="border-slate-800 bg-slate-900/70">
                    <CardHeader>
                      <CardTitle className="text-white">Recent Orders</CardTitle>
                      <CardDescription className="text-slate-400">Quick view of the latest customer activity.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {loadingOrders ? (
                        <p className="text-sm text-slate-400">Loading recent orders…</p>
                      ) : orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-white">{order.order_number}</p>
                            <p className="text-sm text-slate-400">{order.customer_name ?? 'Unknown customer'} · {order.payment_method ?? 'No method'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusBadge status={order.status} />
                            <span className="font-semibold text-emerald-300">{formatCurrency(Number(order.total_price))}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-slate-800 bg-slate-900/70">
                    <CardHeader>
                      <CardTitle className="text-white">Quick Actions</CardTitle>
                      <CardDescription className="text-slate-400">Jump into the parts of admin that usually need the most attention.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="h-12 w-full justify-between rounded-2xl bg-slate-800 text-white hover:bg-slate-700" onClick={() => setActiveSection('pipeline')}>
                        Apple Pay / Zelle pipeline
                        <Workflow className="h-4 w-4" />
                      </Button>
                      <Button className="h-12 w-full justify-between rounded-2xl bg-slate-800 text-white hover:bg-slate-700" onClick={() => setActiveSection('products')}>
                        Add a new product
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button className="h-12 w-full justify-between rounded-2xl bg-slate-800 text-white hover:bg-slate-700" onClick={() => setActiveSection('promo-products')}>
                        Manage promo products
                        <TicketPercent className="h-4 w-4" />
                      </Button>
                      <Button className="h-12 w-full justify-between rounded-2xl bg-slate-800 text-white hover:bg-slate-700" onClick={() => setActiveSection('orders')}>
                        Review all orders
                        <Package className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {activeSection === 'sales' && (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard title="Today" value={formatCurrency(stats.todayRevenue)} sub={`${stats.todayOrders} orders today`} gradient="bg-emerald-500" icon={<CalendarDays className="h-5 w-5 text-emerald-300" />} />
                  <MetricCard title="This Month" value={formatCurrency(stats.monthRevenue)} sub={`${stats.monthOrders} orders this month`} gradient="bg-blue-500" icon={<BarChart3 className="h-5 w-5 text-blue-300" />} />
                  <MetricCard title="Average Order" value={formatCurrency(stats.averageOrder)} sub="Across all completed sales" gradient="bg-violet-500" icon={<CreditCard className="h-5 w-5 text-violet-300" />} />
                  <MetricCard title="Live Time" value={now.toLocaleTimeString('en-US')} sub={now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} gradient="bg-amber-500" icon={<Clock className="h-5 w-5 text-amber-300" />} />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <Card className="border-slate-800 bg-slate-900/70">
                    <CardHeader>
                      <CardTitle className="text-white">Sales by Month</CardTitle>
                      <CardDescription className="text-slate-400">Revenue grouped by real calendar months.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {monthlySales.length === 0 ? (
                        <p className="text-sm text-slate-400">No sales data yet.</p>
                      ) : monthlySales.map((month) => (
                        <div key={month.label} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-white">{month.label}</p>
                              <p className="text-sm text-slate-400">{month.orders} orders</p>
                            </div>
                            <p className="text-lg font-bold text-emerald-300">{formatCurrency(month.revenue)}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-slate-800 bg-slate-900/70">
                    <CardHeader>
                      <CardTitle className="text-white">Sales Notes</CardTitle>
                      <CardDescription className="text-slate-400">A fast summary you can check any time without opening another tool.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-slate-300">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Today</p>
                        <p className="mt-2 leading-7">
                          {stats.todayOrders > 0
                            ? `You have ${stats.todayOrders} order${stats.todayOrders === 1 ? '' : 's'} today totaling ${formatCurrency(stats.todayRevenue)}.`
                            : 'No new orders have been placed today yet.'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">This Month</p>
                        <p className="mt-2 leading-7">
                          Monthly sales are currently at {formatCurrency(stats.monthRevenue)} across {stats.monthOrders} order{stats.monthOrders === 1 ? '' : 's'}.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {activeSection === 'pipeline' && (
              <div className="space-y-6">
                <Card className="border-slate-800 bg-slate-900/70">
                  <CardHeader>
                    <CardTitle className="text-white">Apple Pay / Zelle Pipeline</CardTitle>
                    <CardDescription className="text-slate-400">
                      This board is for orders that still need manual confirmation. Email shortcuts can bring you here and update the status directly.
                    </CardDescription>
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                      Drag cards between stages on desktop. Action buttons stay available for mobile and quick updates.
                    </p>
                  </CardHeader>
                </Card>

                <div className="grid gap-4 xl:grid-cols-3">
                  {pipelineColumns.map((column) => (
                    <Card
                      key={column.id}
                      className={cn(
                        'border-slate-800 bg-slate-900/70 transition-colors',
                        activeDropColumn === column.id && 'border-blue-500/60 bg-slate-900 shadow-[0_0_0_1px_rgba(59,130,246,0.35)]',
                      )}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <CardTitle className="text-white">{column.title}</CardTitle>
                            <CardDescription className="text-slate-400">{column.description}</CardDescription>
                          </div>
                          <Badge className="border-slate-700 bg-slate-800 text-slate-200">{column.orders.length}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent
                        className={cn(
                          'space-y-4 rounded-b-[inherit] transition-colors',
                          activeDropColumn === column.id && 'bg-blue-500/5',
                        )}
                        onDragOver={(event) => handlePipelineDragOver(event, column.id)}
                        onDragEnter={(event) => handlePipelineDragOver(event, column.id)}
                        onDrop={(event) => void handlePipelineDrop(event, column.id)}
                      >
                        {column.orders.length === 0 ? (
                          <div
                            className={cn(
                              'rounded-2xl border border-dashed border-slate-800 p-4 text-sm text-slate-500 transition-colors',
                              activeDropColumn === column.id && 'border-blue-400/50 bg-blue-500/10 text-slate-300',
                            )}
                          >
                            {column.empty}
                          </div>
                        ) : column.orders.map((order) => (
                          <div
                            key={order.id}
                            draggable
                            onDragStart={(event) => handlePipelineDragStart(event, order.id)}
                            onDragEnd={handlePipelineDragEnd}
                            className={cn(
                              'space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition-all',
                              'cursor-grab active:cursor-grabbing hover:border-slate-700',
                              draggingOrderId === order.id && 'scale-[0.99] border-blue-500/50 bg-slate-900 opacity-70 shadow-lg',
                            )}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="font-semibold leading-snug text-white break-words">{order.order_number}</p>
                                <p className="text-sm text-slate-400">{order.customer_name ?? 'Unknown customer'}</p>
                              </div>
                              <StatusBadge status={order.status} className="self-start whitespace-nowrap" />
                            </div>
                            <div className="space-y-1 text-sm text-slate-300">
                              <p>{order.payment_method}</p>
                              <p>{formatCurrency(Number(order.total_price))}</p>
                              <p className="text-slate-500">{formatDate(order.created_at)} · {formatTime(order.created_at)}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {column.id === 'payment_contact_requested' && (
                                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-500" onClick={() => void updateOrderStatus(order.id, 'processing')}>
                                  Move to Processing
                                </Button>
                              )}
                              {column.id === 'processing' && (
                                <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-500" onClick={() => void updateOrderStatus(order.id, 'complete')}>
                                  Mark Paid
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800"
                                onClick={() => {
                                  setExpandedRow(order.id);
                                  setActiveSection('orders');
                                }}
                              >
                                Open Order
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-300 hover:bg-red-500/10 hover:text-red-200" onClick={() => void deleteOrder(order.id)}>
                                <Trash2 className="mr-1 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'orders' && (
              <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
                <CardHeader className="border-b border-slate-800">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle className="text-white">Order Management</CardTitle>
                      <CardDescription className="text-slate-400">
                        Review every order, move statuses, or remove records that are no longer needed.
                      </CardDescription>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <Input
                          placeholder="Search order / customer…"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          className="h-10 w-full border-slate-700 bg-slate-800/70 pl-9 text-white placeholder:text-slate-500 sm:w-64"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10 w-full border-slate-700 bg-slate-800/70 text-white sm:w-44">
                          <Filter className="mr-2 h-4 w-4 text-slate-400" />
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-900 text-white">
                          <SelectItem value="all">All statuses</SelectItem>
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
                  {loadingOrders ? (
                    <div className="flex items-center justify-center py-24 text-slate-500">
                      <RefreshCw className="mr-3 h-6 w-6 animate-spin" />
                      Loading orders…
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                      <Package className="mb-3 h-12 w-12 opacity-30" />
                      <p className="font-medium">No orders found</p>
                      <p className="mt-1 text-sm">Try adjusting your search or filter.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800 hover:bg-transparent">
                          <TableHead className="w-8 text-slate-400" />
                          <TableHead className="text-slate-400">Order #</TableHead>
                          <TableHead className="text-slate-400">Customer</TableHead>
                          <TableHead className="hidden md:table-cell text-slate-400">Items</TableHead>
                          <TableHead className="text-slate-400">Total</TableHead>
                          <TableHead className="hidden sm:table-cell text-slate-400">Payment</TableHead>
                          <TableHead className="text-slate-400">Status</TableHead>
                          <TableHead className="hidden lg:table-cell text-slate-400">Date</TableHead>
                          <TableHead className="text-slate-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => {
                          const isExpanded = expandedRow === order.id;
                          const orderSubtotal = order.items.reduce((sum, item) => sum + Number(item.total ?? item.price * item.quantity), 0);
                          const orderTotal = Number(order.total_price);
                          const shippingCost = Math.max(orderTotal - orderSubtotal, 0);

                          return (
                            <Fragment key={order.id}>
                              <TableRow
                                className="cursor-pointer border-slate-800/70 transition-colors hover:bg-transparent hover:[&_td]:bg-slate-800/70"
                                onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                              >
                                <TableCell className="pr-0">
                                  {isExpanded
                                    ? <ChevronUp className="h-4 w-4 text-slate-400" />
                                    : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                </TableCell>
                                <TableCell className="font-mono text-sm font-semibold text-blue-300">{order.order_number}</TableCell>
                                <TableCell>
                                  <div className="text-sm font-medium text-white">{order.customer_name ?? '—'}</div>
                                  <div className="text-xs text-slate-500">{order.customer_email ?? ''}</div>
                                </TableCell>
                                <TableCell className="hidden text-sm text-slate-300 md:table-cell">
                                  {order.total_items} item{order.total_items !== 1 ? 's' : ''}
                                </TableCell>
                                <TableCell className="font-semibold text-emerald-300">{formatCurrency(orderTotal)}</TableCell>
                                <TableCell className="hidden text-sm text-slate-400 sm:table-cell">{order.payment_method ?? '—'}</TableCell>
                                <TableCell><StatusBadge status={order.status} /></TableCell>
                                <TableCell className="hidden text-xs text-slate-500 lg:table-cell">
                                  {formatDate(order.created_at)}
                                  <div>{formatTime(order.created_at)}</div>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void deleteOrder(order.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>

                              {isExpanded && (
                                <TableRow className="border-slate-800 bg-transparent hover:bg-transparent [&_td]:bg-slate-950/70 hover:[&_td]:bg-slate-950/80">
                                  <TableCell colSpan={9} className="px-6 py-4">
                                    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                                      <div className="space-y-4">
                                        <div>
                                          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Customer Info</p>
                                          <div className="space-y-2">
                                            {order.customer_email && (
                                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                                {order.customer_email}
                                              </div>
                                            )}
                                            {order.customer_phone && (
                                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <Phone className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                                {order.customer_phone}
                                              </div>
                                            )}
                                            {order.customer_address && (
                                              <div className="flex items-start gap-2 text-sm text-slate-300">
                                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                                                <span>
                                                  {order.customer_address}
                                                  {order.customer_city && `, ${order.customer_city}`}
                                                  {order.customer_state && `, ${order.customer_state}`}
                                                  {order.customer_zip && ` ${order.customer_zip}`}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {(order.payment_method || order.payment_reference_id || order.payer_account_name || order.payment_submitted_at) && (
                                          <div>
                                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Payment Details</p>
                                            <div className="space-y-2 text-sm text-slate-300">
                                              {order.payment_method && <p><span className="text-slate-500">Method:</span> {order.payment_method}</p>}
                                              {order.payment_reference_id && <p><span className="text-slate-500">Reference:</span> {order.payment_reference_id}</p>}
                                              {order.payer_account_name && <p><span className="text-slate-500">Account:</span> {order.payer_account_name}</p>}
                                              {order.payment_submitted_at && <p><span className="text-slate-500">Submitted:</span> {formatDate(order.payment_submitted_at)} {formatTime(order.payment_submitted_at)}</p>}
                                            </div>
                                          </div>
                                        )}

                                        <div className="flex flex-wrap gap-2 pt-2">
                                          <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-500" onClick={() => void updateOrderStatus(order.id, 'processing')}>
                                            Set Processing
                                          </Button>
                                          <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-500" onClick={() => void updateOrderStatus(order.id, 'complete')}>
                                            Mark Paid
                                          </Button>
                                          <Button size="sm" variant="ghost" className="text-red-300 hover:bg-red-500/10 hover:text-red-200" onClick={() => void deleteOrder(order.id)}>
                                            <Trash2 className="mr-1 h-4 w-4" />
                                            Delete
                                          </Button>
                                        </div>
                                      </div>

                                      <div>
                                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Items Ordered</p>
                                        <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                          {order.items.map((item, index) => (
                                            <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-4 text-sm">
                                              <div className="text-slate-300">
                                                <span className="mr-2 text-slate-500">×{item.quantity}</span>
                                                {item.name}
                                              </div>
                                              <span className="shrink-0 font-semibold text-emerald-300">
                                                {formatCurrency(Number(item.total ?? item.price * item.quantity))}
                                              </span>
                                            </div>
                                          ))}
                                          <div className="mt-3 border-t border-slate-800 pt-3 text-sm">
                                            <div className="flex items-center justify-between text-slate-400">
                                              <span>Subtotal</span>
                                              <span>{formatCurrency(orderSubtotal)}</span>
                                            </div>
                                            <div className="mt-1 flex items-center justify-between text-slate-400">
                                              <span>Shipping</span>
                                              <span>{formatCurrency(shippingCost)}</span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between font-semibold text-white">
                                              <span>Total</span>
                                              <span>{formatCurrency(orderTotal)}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}

                  {!loadingOrders && filteredOrders.length > 0 && (
                    <div className="border-t border-slate-800 px-6 py-3 text-xs text-slate-500">
                      Showing {filteredOrders.length} of {submittedOrders.length} submitted orders
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'promo-products' && (
              <PromoProductsSection />
            )}

            {activeSection === 'products' && (
              <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
                <Card className="border-slate-800 bg-slate-900/70">
                  <CardHeader>
                    <CardTitle className="text-white">{productForm.id ? 'Edit Product' : 'Add Product'}</CardTitle>
                    <CardDescription className="text-slate-400">Add products here so the storefront updates without manual code edits.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="product-name" className="font-medium text-slate-200">Name</Label>
                      <Input id="product-name" value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value, slug: current.slug || slugify(event.target.value) }))} className="border-slate-700 bg-slate-800/70 text-white" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="product-slug" className="font-medium text-slate-200">Slug</Label>
                        <Input id="product-slug" value={productForm.slug} onChange={(event) => setProductForm((current) => ({ ...current, slug: slugify(event.target.value) }))} className="border-slate-700 bg-slate-800/70 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-category" className="font-medium text-slate-200">Category</Label>
                        <Input id="product-category" value={productForm.category} onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))} className="border-slate-700 bg-slate-800/70 text-white" />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="product-price" className="font-medium text-slate-200">Price</Label>
                        <Input id="product-price" type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} className="border-slate-700 bg-slate-800/70 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-sort-order" className="font-medium text-slate-200">Sort Order</Label>
                        <Input id="product-sort-order" type="number" value={productForm.sortOrder} onChange={(event) => setProductForm((current) => ({ ...current, sortOrder: event.target.value }))} className="border-slate-700 bg-slate-800/70 text-white" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-description" className="font-medium text-slate-200">Short Description</Label>
                      <Textarea id="product-description" value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} className="min-h-[90px] border-slate-700 bg-slate-800/70 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-long-description" className="font-medium text-slate-200">Long Description</Label>
                      <Textarea id="product-long-description" value={productForm.longDescription} onChange={(event) => setProductForm((current) => ({ ...current, longDescription: event.target.value }))} className="min-h-[120px] border-slate-700 bg-slate-800/70 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-image-url" className="font-medium text-slate-200">Main Image URL</Label>
                      <Input id="product-image-url" value={productForm.imageUrl} onChange={(event) => setProductForm((current) => ({ ...current, imageUrl: event.target.value }))} className="border-slate-700 bg-slate-800/70 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-gallery" className="font-medium text-slate-200">Gallery URLs</Label>
                      <Textarea id="product-gallery" placeholder="One URL per line" value={productForm.galleryText} onChange={(event) => setProductForm((current) => ({ ...current, galleryText: event.target.value }))} className="min-h-[90px] border-slate-700 bg-slate-800/70 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-features" className="font-medium text-slate-200">Features</Label>
                      <Textarea id="product-features" placeholder="One feature per line" value={productForm.featuresText} onChange={(event) => setProductForm((current) => ({ ...current, featuresText: event.target.value }))} className="min-h-[90px] border-slate-700 bg-slate-800/70 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-highlights" className="font-medium text-slate-200">Highlights</Label>
                      <Textarea id="product-highlights" placeholder="One highlight per line" value={productForm.highlightsText} onChange={(event) => setProductForm((current) => ({ ...current, highlightsText: event.target.value }))} className="min-h-[90px] border-slate-700 bg-slate-800/70 text-white" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium text-slate-200">Options</Label>
                        <Button type="button" size="sm" variant="ghost" className="text-slate-300 hover:text-white" onClick={addOptionRow}>
                          <Plus className="mr-1 h-4 w-4" />
                          Add Option
                        </Button>
                      </div>
                      {productForm.options.map((option, index) => (
                        <div key={`${option.value}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_110px_auto]">
                            <Input placeholder="Label" value={option.label} onChange={(event) => updateOptionRow(index, 'label', event.target.value)} className="border-slate-700 bg-slate-800/70 text-white" />
                            <Input placeholder="Value" value={option.value} onChange={(event) => updateOptionRow(index, 'value', event.target.value)} className="border-slate-700 bg-slate-800/70 text-white" />
                            <Input placeholder="Price" value={option.price} onChange={(event) => updateOptionRow(index, 'price', event.target.value)} className="border-slate-700 bg-slate-800/70 text-white" />
                            <Button type="button" size="icon" variant="ghost" className="text-red-300 hover:bg-red-500/10 hover:text-red-200" onClick={() => removeOptionRow(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                        <div>
                          <p className="font-medium text-white">In stock</p>
                          <p className="text-xs text-slate-500">Show as available to buy</p>
                        </div>
                        <Switch checked={productForm.inStock} onCheckedChange={(checked) => setProductForm((current) => ({ ...current, inStock: checked }))} />
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                        <div>
                          <p className="font-medium text-white">Active</p>
                          <p className="text-xs text-slate-500">Display on storefront</p>
                        </div>
                        <Switch checked={productForm.isActive} onCheckedChange={(checked) => setProductForm((current) => ({ ...current, isActive: checked }))} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                      <Button className="h-11 flex-1 bg-blue-600 text-white hover:bg-blue-500" disabled={savingProduct} onClick={() => void saveProduct()}>
                        {savingProduct ? 'Saving…' : productForm.id ? 'Update Product' : 'Create Product'}
                      </Button>
                      <Button variant="outline" className="h-11 border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800" onClick={() => setProductForm(emptyProductForm())}>
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-800 bg-slate-900/70">
                  <CardHeader>
                    <CardTitle className="text-white">Catalog</CardTitle>
                    <CardDescription className="text-slate-400">Products added here will power the storefront without manual edits.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loadingProducts ? (
                      <p className="text-sm text-slate-400">Loading products…</p>
                    ) : catalogProducts.map((product) => (
                      <div key={product.id} className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-white">{product.name}</p>
                            <Badge className="border-slate-700 bg-slate-800 text-slate-200">{product.category}</Badge>
                            {!product.isActive && <Badge variant="outline" className="border-amber-500/20 text-amber-300">Hidden</Badge>}
                          </div>
                          <p className="mt-2 text-sm text-slate-400">{product.description}</p>
                          <p className="mt-2 text-sm text-slate-500">
                            {formatCurrency(product.price)} · {product.options.length} option{product.options.length === 1 ? '' : 's'} · sort {product.sortOrder}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {products.find((row) => row.id === product.id) && (
                            <Button size="sm" variant="outline" className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800" onClick={() => editProduct(products.find((row) => row.id === product.id)! )}>
                              <Pencil className="mr-1 h-4 w-4" />
                              Edit
                            </Button>
                          )}
                          {products.find((row) => row.id === product.id) && (
                            <Button size="sm" variant="ghost" className="text-red-300 hover:bg-red-500/10 hover:text-red-200" onClick={() => void deleteProduct(product.id)}>
                              <Trash2 className="mr-1 h-4 w-4" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
