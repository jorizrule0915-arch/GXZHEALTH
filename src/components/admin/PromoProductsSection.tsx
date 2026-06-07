import { useEffect, useMemo, useState } from 'react';
import { Package, TicketPercent, Trash2, UserRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type PromoProductRow = Tables<'promo_products'>;
type PromoCodeRow = Tables<'promo_codes'>;
type ProductRow = Tables<'products'>;
type PromoProductInsert = TablesInsert<'promo_products'>;
type PromoCodeInsert = TablesInsert<'promo_codes'>;

const ALL_PRODUCTS_NAME = 'All Products';
const ALL_PRODUCTS_SKU = '__ALL__';

interface CreateVoucherForm {
  code: string;
  productName: string;
  influencerName: string;
  discountPercent: string;
  expirationDate: string;
  usageLimit: string;
  minimumOrderRequirement: string;
}

function emptyForm(): CreateVoucherForm {
  return { code: '', productName: '', influencerName: '', discountPercent: '', expirationDate: '', usageLimit: '', minimumOrderRequirement: '' };
}

function normalizeCode(value: string) {
  return value.toUpperCase().replace(/\s+/g, '');
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDate(dateValue: string | null) {
  if (!dateValue) return '-';
  return new Date(dateValue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PromoProductsSection() {
  const { toast } = useToast();
  const [promoProducts, setPromoProducts] = useState<PromoProductRow[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCodeRow[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingCodeId, setDeletingCodeId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateVoucherForm>(emptyForm());
  const [filterProductId, setFilterProductId] = useState<string | 'all'>('all');

  const load = async () => {
    setLoading(true);
    const [{ data: products, error: pe }, { data: codes, error: ce }, { data: catalog, error: catalogError }] = await Promise.all([
      supabase.from('promo_products').select('*').order('created_at', { ascending: true }),
      supabase.from('promo_codes').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    ]);
    setLoading(false);
    if (pe) { toast({ title: 'Unable to load products', description: pe.message, variant: 'destructive' }); return; }
    if (ce) { toast({ title: 'Unable to load codes', description: ce.message, variant: 'destructive' }); return; }
    if (catalogError) {
      toast({ title: 'Unable to load catalog products', description: catalogError.message, variant: 'destructive' });
    }
    setPromoProducts(products ?? []);
    setPromoCodes(codes ?? []);
    setCatalogProducts(catalog ?? []);
  };

  useEffect(() => { void load(); }, []);

  const codesByProductId = useMemo(() =>
    promoCodes.reduce<Record<string, PromoCodeRow[]>>((acc, code) => {
      (acc[code.promo_product_id] ??= []).push(code);
      return acc;
    }, {}),
  [promoCodes]);

  const visibleCodes = useMemo(() =>
    filterProductId === 'all' ? promoCodes : (codesByProductId[filterProductId] ?? []),
  [filterProductId, promoCodes, codesByProductId]);

  const productSuggestions = useMemo(() => {
    const names = new Map<string, string>();
    names.set(ALL_PRODUCTS_NAME.toLowerCase(), ALL_PRODUCTS_NAME);
    catalogProducts.forEach((product) => names.set(product.name.toLowerCase(), product.name));
    promoProducts.forEach((product) => names.set(product.name.toLowerCase(), product.name));
    return [...names.values()].sort((left, right) => {
      if (left === ALL_PRODUCTS_NAME) return -1;
      if (right === ALL_PRODUCTS_NAME) return 1;
      return left.localeCompare(right);
    });
  }, [catalogProducts, promoProducts]);

  const saveVoucher = async () => {
    const normalizedCode = normalizeCode(form.code);
    const productName = form.productName.trim();

    if (!normalizedCode) {
      toast({ title: 'Voucher code is required', variant: 'destructive' }); return;
    }
    if (!productName) {
      toast({ title: 'Product name is required', description: 'This tells the system which product the code applies to.', variant: 'destructive' }); return;
    }
    if (!form.influencerName.trim()) {
      toast({ title: 'Creator / label name is required', variant: 'destructive' }); return;
    }

    const parsedDiscount = form.discountPercent.trim() ? Number(form.discountPercent) : null;
    const parsedLimit = form.usageLimit.trim() ? Number(form.usageLimit) : null;
    const parsedMinOrder = form.minimumOrderRequirement.trim() ? Number(form.minimumOrderRequirement) : 0;

    if (parsedDiscount !== null && (Number.isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100)) {
      toast({ title: 'Discount must be between 0 and 100', variant: 'destructive' }); return;
    }
    if (parsedLimit !== null && (!Number.isInteger(parsedLimit) || parsedLimit < 1)) {
      toast({ title: 'Usage limit must be a whole number 1 or higher', variant: 'destructive' }); return;
    }
    if (Number.isNaN(parsedMinOrder) || parsedMinOrder < 0 || !Number.isInteger(parsedMinOrder)) {
      toast({ title: 'Previous orders required must be a whole number 0 or higher', variant: 'destructive' }); return;
    }

    setSaving(true);

    // 1. Find or create the promo product by name (case-insensitive match)
    const isAllProductsVoucher = productName.toLowerCase() === ALL_PRODUCTS_NAME.toLowerCase();
    let product = promoProducts.find((p) => (
      isAllProductsVoucher
        ? p.sku === ALL_PRODUCTS_SKU || p.name.toLowerCase() === ALL_PRODUCTS_NAME.toLowerCase()
        : p.name.toLowerCase() === productName.toLowerCase()
    )) ?? null;

    if (!product) {
      const payload: PromoProductInsert = {
        name: isAllProductsVoucher ? ALL_PRODUCTS_NAME : productName,
        sku: isAllProductsVoucher ? ALL_PRODUCTS_SKU : null,
      };
      const { data, error } = await supabase.from('promo_products').insert(payload).select('*').single();
      if (error) {
        setSaving(false);
        toast({ title: 'Unable to create product entry', description: error.message, variant: 'destructive' }); return;
      }
      product = data;
      setPromoProducts((prev) => [...prev, data]);
    } else if (isAllProductsVoucher && product.sku !== ALL_PRODUCTS_SKU) {
      const { data, error } = await supabase
        .from('promo_products')
        .update({ name: ALL_PRODUCTS_NAME, sku: ALL_PRODUCTS_SKU })
        .eq('id', product.id)
        .select('*')
        .single();

      if (error) {
        setSaving(false);
        toast({ title: 'Unable to update all-products entry', description: error.message, variant: 'destructive' }); return;
      }

      product = data;
      setPromoProducts((prev) => prev.map((entry) => (entry.id === data.id ? data : entry)));
    }

    // 2. Insert the promo code linked to that product
    const expiresAt = form.expirationDate
      ? new Date(`${form.expirationDate}T23:59:59.999Z`).toISOString()
      : null;

    const codePayload: PromoCodeInsert = {
      promo_product_id: product.id,
      code: normalizedCode,
      influencer_name: form.influencerName.trim(),
      discount_percent: parsedDiscount,
      expires_at: expiresAt,
      usage_limit: parsedLimit,
      minimum_order_requirement: parsedMinOrder,
    };

    const { data: newCode, error: codeError } = await supabase
      .from('promo_codes').insert(codePayload).select('*').single();

    setSaving(false);

    if (codeError) {
      toast({ title: 'Unable to save voucher code', description: codeError.message, variant: 'destructive' }); return;
    }

    setPromoCodes((prev) => [newCode, ...prev]);
    setForm(emptyForm());
    toast({
      title: 'Voucher created',
      description: isAllProductsVoucher
        ? `${newCode.code} is now active for all products.`
        : `${newCode.code} is now active for carts containing "${product.name}".`,
    });
  };

  const deleteCode = async (code: PromoCodeRow) => {
    if (!window.confirm(`Delete voucher code "${code.code}"?`)) return;
    setDeletingCodeId(code.id);
    const { error } = await supabase.from('promo_codes').delete().eq('id', code.id);
    setDeletingCodeId(null);
    if (error) { toast({ title: 'Unable to delete code', description: error.message, variant: 'destructive' }); return; }
    setPromoCodes((prev) => prev.filter((c) => c.id !== code.id));
    toast({ title: 'Voucher deleted', description: `${code.code} was removed.` });
  };

  const deleteProduct = async (product: PromoProductRow) => {
    if (!window.confirm(`Delete "${product.name}" and ALL its voucher codes?`)) return;
    setDeletingProductId(product.id);
    const { error } = await supabase.from('promo_products').delete().eq('id', product.id);
    setDeletingProductId(null);
    if (error) { toast({ title: 'Unable to delete product', description: error.message, variant: 'destructive' }); return; }
    setPromoProducts((prev) => prev.filter((p) => p.id !== product.id));
    setPromoCodes((prev) => prev.filter((c) => c.promo_product_id !== product.id));
    if (filterProductId === product.id) setFilterProductId('all');
    toast({ title: 'Product deleted', description: `${product.name} and its codes were removed.` });
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <Card className="border-slate-800 bg-slate-900/70">
        <CardHeader>
          <CardTitle className="text-white">Voucher Codes</CardTitle>
          <CardDescription className="text-slate-400">
            Create product-specific voucher codes, or choose All Products to make a code work for the whole cart.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 2xl:grid-cols-[28rem_minmax(0,1fr)]">

        {/* Create voucher form */}
        <Card className="border-slate-800 bg-slate-900/70">
          <CardHeader>
            <CardTitle className="text-white">Create New Voucher</CardTitle>
            <CardDescription className="text-slate-400">
              Use Discount % for the amount off. Leave Previous orders required at 0 unless this is a loyalty-only code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="vc-code" className="text-slate-200">
                Voucher Code <span className="text-red-400">*</span>
              </Label>
              <Input
                id="vc-code"
                placeholder="SAVE25"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: normalizeCode(e.target.value) }))}
                className="border-slate-700 bg-slate-800/70 font-mono text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500">Auto-uppercased. This is what the customer types at checkout.</p>
            </div>

            {/* Product name lock */}
            <div className="space-y-2">
              <Label htmlFor="vc-product" className="text-slate-200">
                Applies to Product <span className="text-red-400">*</span>
              </Label>

              {productSuggestions.length > 0 && (
                <div className="mb-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/40 p-2">
                  {productSuggestions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, productName: name }))}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                        form.productName.toLowerCase() === name.toLowerCase()
                          ? 'border-blue-500/50 bg-blue-500/20 text-blue-200'
                          : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}

              <Input
                id="vc-product"
                list="promo-product-suggestions"
                placeholder="Choose All Products or a specific product"
                value={form.productName}
                onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                className="border-slate-700 bg-slate-800/70 text-white placeholder:text-slate-500"
              />
              <datalist id="promo-product-suggestions">
                {productSuggestions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <p className="text-xs text-slate-500">
                Choose All Products for a sitewide code. For product-only codes, click the exact storefront product.
              </p>
            </div>

            {/* Creator / label */}
            <div className="space-y-2">
              <Label htmlFor="vc-influencer" className="text-slate-200">
                Creator / Label <span className="text-red-400">*</span>
              </Label>
              <Input
                id="vc-influencer"
                placeholder="e.g. Verse, Dr. Smith"
                value={form.influencerName}
                onChange={(e) => setForm((f) => ({ ...f, influencerName: e.target.value }))}
                className="border-slate-700 bg-slate-800/70 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Discount + expiry + limit + minimum order */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vc-discount" className="text-slate-200">Discount % off</Label>
                <Input
                  id="vc-discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="25"
                  value={form.discountPercent}
                  onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
                  className="border-slate-700 bg-slate-800/70 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vc-limit" className="text-slate-200">Usage Limit</Label>
                <Input
                  id="vc-limit"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="100"
                  value={form.usageLimit}
                  onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                  className="border-slate-700 bg-slate-800/70 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vc-min-orders" className="text-slate-200">Previous Orders Required</Label>
                <Input
                  id="vc-min-orders"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.minimumOrderRequirement}
                  onChange={(e) => setForm((f) => ({ ...f, minimumOrderRequirement: e.target.value }))}
                  className="border-slate-700 bg-slate-800/70 text-white"
                />
                <p className="text-xs text-slate-500">Use 0 for a normal 25% off code. This is not the discount amount.</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="vc-expiry" className="text-slate-200">Expiration Date</Label>
                <Input
                  id="vc-expiry"
                  type="date"
                  value={form.expirationDate}
                  onChange={(e) => setForm((f) => ({ ...f, expirationDate: e.target.value }))}
                  className="border-slate-700 bg-slate-800/70 text-white"
                />
              </div>
            </div>

            {/* Preview pill */}
            {(form.code || form.productName) && (
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm">
                <p className="font-semibold text-blue-200">Preview</p>
                <p className="mt-1 text-slate-300">
                  Code <span className="font-mono font-bold text-white">{form.code || '-'}</span>
                  {form.discountPercent && <span className="text-emerald-300"> ({form.discountPercent}% off)</span>}
                  {' '}will activate for{' '}
                  <span className="font-semibold text-white">
                    {form.productName.toLowerCase() === ALL_PRODUCTS_NAME.toLowerCase()
                      ? 'all products'
                      : `"${form.productName || '-'}" only`}
                  </span>.
                </p>
                {form.minimumOrderRequirement && Number(form.minimumOrderRequirement) > 0 && (
                  <p className="mt-2 text-xs text-orange-300">
                    <span className="font-semibold">Requires {form.minimumOrderRequirement} previous order(s)</span> to activate
                  </p>
                )}
              </div>
            )}

            <Button
              className="h-11 w-full bg-blue-600 text-white hover:bg-blue-500"
              onClick={() => void saveVoucher()}
              disabled={saving}
            >
              <TicketPercent className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Create Voucher Code'}
            </Button>
          </CardContent>
        </Card>

        {/* Right panel: product list + codes table */}
        <div className="space-y-6">

          {/* Product buckets */}
          <Card className="border-slate-800 bg-slate-900/70">
            <CardHeader>
              <CardTitle className="text-white">Products with Vouchers</CardTitle>
              <CardDescription className="text-slate-400">All Products codes are sitewide. Other buckets are locked to that product.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-slate-400">Loading...</p>
              ) : promoProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
                  No products yet. Create your first voucher code on the left.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {promoProducts.map((product) => {
                    const codes = codesByProductId[product.id] ?? [];
                    const isSelected = filterProductId === product.id;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setFilterProductId(isSelected ? 'all' : product.id)}
                        className={`rounded-2xl border p-4 text-left transition-colors ${
                          isSelected
                            ? 'border-blue-500/40 bg-blue-500/10'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Package className="h-4 w-4 shrink-0 text-slate-400" />
                            <p className="truncate font-semibold text-white">{product.name}</p>
                          </div>
                          <Badge className="shrink-0 border-slate-700 bg-slate-800 text-slate-200">
                            {codes.length} code{codes.length === 1 ? '' : 's'}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-xs text-slate-500">
                            {codes.reduce((s, c) => s + c.total_uses, 0)} total uses
                          </p>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); void deleteProduct(product); }}
                            disabled={deletingProductId === product.id}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Codes table */}
          <Card className="border-slate-800 bg-slate-900/70">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-white">
                    {filterProductId === 'all' ? 'All Voucher Codes' : `Codes for "${promoProducts.find((p) => p.id === filterProductId)?.name}"`}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {filterProductId === 'all' ? 'Click a product above to filter.' : 'Showing codes locked to this product only.'}
                  </CardDescription>
                </div>
                {filterProductId !== 'all' && (
                  <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setFilterProductId('all')}>
                    Show all
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="block space-y-3 p-4 lg:hidden">
                {loading ? (
                  <p className="py-6 text-center text-sm text-slate-500">Loading...</p>
                ) : visibleCodes.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">No voucher codes yet.</p>
                ) : visibleCodes.map((code) => {
                  const product = promoProducts.find((p) => p.id === code.promo_product_id);
                  const isExpired = Boolean(code.expires_at && new Date(code.expires_at) < new Date());
                  const limitReached = code.usage_limit !== null && code.total_uses >= code.usage_limit;

                  return (
                    <div key={code.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-blue-300">{code.code}</span>
                            {code.discount_percent !== null && (
                              <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                                {code.discount_percent}% off
                              </Badge>
                            )}
                          </div>
                          <p className="mt-2 truncate text-sm text-slate-300">{product?.name ?? '-'}</p>
                          <p className="mt-1 text-xs text-slate-500">Creator: {code.influencer_name}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                          onClick={() => void deleteCode(code)}
                          disabled={deletingCodeId === code.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                          <p className="text-slate-500">Uses</p>
                          <p className="mt-1 font-semibold text-slate-200">
                            {code.total_uses}{code.usage_limit !== null ? ` / ${code.usage_limit}` : ''}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                          <p className="text-slate-500">Revenue</p>
                          <p className="mt-1 font-semibold text-emerald-300">{formatCurrency(Number(code.total_revenue))}</p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                          <p className="text-slate-500">Previous orders</p>
                          <p className="mt-1 font-semibold text-slate-200">{code.minimum_order_requirement ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                          <p className="text-slate-500">Expiry</p>
                          <p className="mt-1 font-semibold text-slate-200">{formatDate(code.expires_at)}</p>
                        </div>
                      </div>
                      {(isExpired || limitReached) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {isExpired && <Badge variant="outline" className="border-red-500/30 text-red-300">Expired</Badge>}
                          {limitReached && <Badge variant="outline" className="border-amber-500/30 text-amber-300">Limit reached</Badge>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="hidden overflow-x-auto lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Code</TableHead>
                    <TableHead className="text-slate-400">Applies to Product</TableHead>
                    <TableHead className="text-slate-400">Creator</TableHead>
                    <TableHead className="text-slate-400">Min Orders</TableHead>
                    <TableHead className="text-slate-400">Uses</TableHead>
                    <TableHead className="text-slate-400">Revenue</TableHead>
                    <TableHead className="text-slate-400">Expiry</TableHead>
                    <TableHead className="text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow className="border-slate-800">
                      <TableCell colSpan={8} className="py-10 text-center text-sm text-slate-500">Loading...</TableCell>
                    </TableRow>
                  ) : visibleCodes.length === 0 ? (
                    <TableRow className="border-slate-800">
                      <TableCell colSpan={8} className="py-10 text-center text-sm text-slate-500">
                        No voucher codes yet.
                      </TableCell>
                    </TableRow>
                  ) : visibleCodes.map((code) => {
                    const product = promoProducts.find((p) => p.id === code.promo_product_id);
                    const isExpired = Boolean(code.expires_at && new Date(code.expires_at) < new Date());
                    const limitReached = code.usage_limit !== null && code.total_uses >= code.usage_limit;

                    return (
                      <TableRow key={code.id} className="border-slate-800/70 hover:bg-transparent">
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-blue-300">{code.code}</span>
                            {code.discount_percent !== null && (
                              <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                                {code.discount_percent}% off
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                            <Package className="h-3 w-3" />
                            {product?.name ?? '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          <span className="inline-flex items-center gap-2">
                            <UserRound className="h-4 w-4 text-slate-500" />
                            {code.influencer_name}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {code.minimum_order_requirement && code.minimum_order_requirement > 0
                            ? (
                              <Badge className="border-orange-500/30 bg-orange-500/10 text-orange-300">
                                {code.minimum_order_requirement} order{code.minimum_order_requirement !== 1 ? 's' : ''}
                              </Badge>
                            )
                            : <span className="text-slate-500">-</span>
                          }
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {code.total_uses}
                          {code.usage_limit !== null && (
                            <span className="ml-1 text-xs text-slate-500">/ {code.usage_limit}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-emerald-300">
                          {formatCurrency(Number(code.total_revenue))}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {formatDate(code.expires_at)}
                          {isExpired && <span className="ml-2 text-xs text-red-300">Expired</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {limitReached && (
                              <Badge variant="outline" className="border-amber-500/30 text-amber-300">Limit reached</Badge>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
                              onClick={() => void deleteCode(code)}
                              disabled={deletingCodeId === code.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
