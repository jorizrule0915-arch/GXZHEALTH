import { useEffect, useMemo, useState } from 'react';
import { Plus, TicketPercent, Trash2, UserRound } from 'lucide-react';
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
type PromoProductInsert = TablesInsert<'promo_products'>;
type PromoCodeInsert = TablesInsert<'promo_codes'>;

interface PromoProductFormState {
  name: string;
  sku: string;
}

interface PromoCodeFormState {
  code: string;
  influencerName: string;
  discountPercent: string;
  expirationDate: string;
  usageLimit: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDateTime(dateValue: string | null) {
  if (!dateValue) {
    return '—';
  }

  return new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function normalizeCode(value: string) {
  return value.toUpperCase().replace(/\s+/g, '');
}

function emptyPromoProductForm(): PromoProductFormState {
  return {
    name: '',
    sku: '',
  };
}

function emptyPromoCodeForm(): PromoCodeFormState {
  return {
    code: '',
    influencerName: '',
    discountPercent: '',
    expirationDate: '',
    usageLimit: '',
  };
}

export default function PromoProductsSection() {
  const { toast } = useToast();
  const [promoProducts, setPromoProducts] = useState<PromoProductRow[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCodeRow[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPromoProduct, setSavingPromoProduct] = useState(false);
  const [savingPromoCode, setSavingPromoCode] = useState(false);
  const [deletingPromoProductId, setDeletingPromoProductId] = useState<string | null>(null);
  const [deletingPromoCodeId, setDeletingPromoCodeId] = useState<string | null>(null);
  const [promoProductForm, setPromoProductForm] = useState<PromoProductFormState>(emptyPromoProductForm());
  const [promoCodeForm, setPromoCodeForm] = useState<PromoCodeFormState>(emptyPromoCodeForm());

  const refreshPromoData = async () => {
    setLoading(true);

    const [{ data: productData, error: productError }, { data: codeData, error: codeError }] = await Promise.all([
      supabase
        .from('promo_products')
        .select('*')
        .order('created_at', { ascending: true }),
      supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    setLoading(false);

    if (productError) {
      toast({
        title: 'Unable to load promo products',
        description: productError.message,
        variant: 'destructive',
      });
      return;
    }

    if (codeError) {
      toast({
        title: 'Unable to load promo codes',
        description: codeError.message,
        variant: 'destructive',
      });
      return;
    }

    const nextProducts = productData ?? [];
    const nextCodes = codeData ?? [];

    setPromoProducts(nextProducts);
    setPromoCodes(nextCodes);
    setSelectedProductId((current) => {
      if (current && nextProducts.some((product) => product.id === current)) {
        return current;
      }

      return nextProducts[0]?.id ?? null;
    });
  };

  useEffect(() => {
    void refreshPromoData();
  }, []);

  const selectedProduct = useMemo(
    () => promoProducts.find((product) => product.id === selectedProductId) ?? null,
    [promoProducts, selectedProductId],
  );

  const codesByProductId = useMemo(() => {
    return promoCodes.reduce<Record<string, PromoCodeRow[]>>((acc, code) => {
      if (!acc[code.promo_product_id]) {
        acc[code.promo_product_id] = [];
      }

      acc[code.promo_product_id].push(code);
      return acc;
    }, {});
  }, [promoCodes]);

  const selectedProductCodes = selectedProductId ? (codesByProductId[selectedProductId] ?? []) : [];

  const selectedProductStats = useMemo(() => {
    return selectedProductCodes.reduce(
      (acc, code) => {
        acc.totalUses += code.total_uses;
        acc.totalRevenue += Number(code.total_revenue);
        return acc;
      },
      { totalUses: 0, totalRevenue: 0 },
    );
  }, [selectedProductCodes]);

  const savePromoProduct = async () => {
    if (!promoProductForm.name.trim()) {
      toast({
        title: 'Product name is required',
        description: 'Please enter a product name before saving.',
        variant: 'destructive',
      });
      return;
    }

    const payload: PromoProductInsert = {
      name: promoProductForm.name.trim(),
      sku: promoProductForm.sku.trim() || null,
    };

    setSavingPromoProduct(true);
    const { data, error } = await supabase
      .from('promo_products')
      .insert(payload)
      .select('*')
      .single();
    setSavingPromoProduct(false);

    if (error) {
      toast({
        title: 'Unable to save promo product',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setPromoProducts((current) => [...current, data]);
    setSelectedProductId(data.id);
    setPromoProductForm(emptyPromoProductForm());
    toast({
      title: 'Promo product created',
      description: `${data.name} is ready for influencer codes.`,
    });
  };

  const deletePromoProduct = async (promoProduct: PromoProductRow) => {
    if (!window.confirm(`Delete "${promoProduct.name}" and all its promo codes?`)) {
      return;
    }

    setDeletingPromoProductId(promoProduct.id);
    const { error } = await supabase.from('promo_products').delete().eq('id', promoProduct.id);
    setDeletingPromoProductId(null);

    if (error) {
      toast({
        title: 'Unable to delete promo product',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const remainingProducts = promoProducts.filter((item) => item.id !== promoProduct.id);
    setPromoProducts(remainingProducts);
    setPromoCodes((current) => current.filter((code) => code.promo_product_id !== promoProduct.id));
    setSelectedProductId((current) => (current === promoProduct.id ? (remainingProducts[0]?.id ?? null) : current));
    toast({
      title: 'Promo product deleted',
      description: `${promoProduct.name} and its codes were removed.`,
    });
  };

  const savePromoCode = async () => {
    if (!selectedProduct) {
      toast({
        title: 'Choose a promo product first',
        description: 'Select a promo product before creating a promo code.',
        variant: 'destructive',
      });
      return;
    }

    const normalizedCode = normalizeCode(promoCodeForm.code);
    if (!normalizedCode || !promoCodeForm.influencerName.trim()) {
      toast({
        title: 'Missing promo code details',
        description: 'Code and influencer name are required.',
        variant: 'destructive',
      });
      return;
    }

    const parsedDiscount = promoCodeForm.discountPercent.trim()
      ? Number(promoCodeForm.discountPercent)
      : null;
    const parsedUsageLimit = promoCodeForm.usageLimit.trim()
      ? Number(promoCodeForm.usageLimit)
      : null;

    if (parsedDiscount !== null && (Number.isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100)) {
      toast({
        title: 'Invalid discount percent',
        description: 'Use a value between 0 and 100.',
        variant: 'destructive',
      });
      return;
    }

    if (parsedUsageLimit !== null && (!Number.isInteger(parsedUsageLimit) || parsedUsageLimit < 1)) {
      toast({
        title: 'Invalid usage limit',
        description: 'Usage limit must be a whole number greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    const expiresAt = promoCodeForm.expirationDate
      ? new Date(`${promoCodeForm.expirationDate}T23:59:59.999Z`).toISOString()
      : null;

    const payload: PromoCodeInsert = {
      promo_product_id: selectedProduct.id,
      code: normalizedCode,
      influencer_name: promoCodeForm.influencerName.trim(),
      discount_percent: parsedDiscount,
      expires_at: expiresAt,
      usage_limit: parsedUsageLimit,
    };

    setSavingPromoCode(true);
    const { data, error } = await supabase
      .from('promo_codes')
      .insert(payload)
      .select('*')
      .single();
    setSavingPromoCode(false);

    if (error) {
      toast({
        title: 'Unable to save promo code',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setPromoCodes((current) => [data, ...current]);
    setPromoCodeForm(emptyPromoCodeForm());
    toast({
      title: 'Promo code created',
      description: `${data.code} is now assigned to ${selectedProduct.name}.`,
    });
  };

  const deletePromoCode = async (promoCode: PromoCodeRow) => {
    if (!window.confirm(`Delete promo code "${promoCode.code}"?`)) {
      return;
    }

    setDeletingPromoCodeId(promoCode.id);
    const { error } = await supabase.from('promo_codes').delete().eq('id', promoCode.id);
    setDeletingPromoCodeId(null);

    if (error) {
      toast({
        title: 'Unable to delete promo code',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setPromoCodes((current) => current.filter((code) => code.id !== promoCode.id));
    toast({
      title: 'Promo code deleted',
      description: `${promoCode.code} was removed.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-800 bg-slate-900/70">
        <CardHeader>
          <CardTitle className="text-white">PROMO PRODUCTS</CardTitle>
          <CardDescription className="text-slate-400">
            Create promo products, assign influencer codes, and monitor code-level performance for checkout.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <Card className="border-slate-800 bg-slate-900/70">
          <CardHeader>
            <CardTitle className="text-white">Promo Products List</CardTitle>
            <CardDescription className="text-slate-400">Add a product, then assign multiple influencer codes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="space-y-2">
                <Label htmlFor="promo-product-name" className="text-slate-200">Product Name</Label>
                <Input
                  id="promo-product-name"
                  placeholder="GXZ GLP-1"
                  value={promoProductForm.name}
                  onChange={(event) => setPromoProductForm((current) => ({ ...current, name: event.target.value }))}
                  className="border-slate-700 bg-slate-800/70 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-product-sku" className="text-slate-200">SKU (optional)</Label>
                <Input
                  id="promo-product-sku"
                  placeholder="GXZ-GLP1-001"
                  value={promoProductForm.sku}
                  onChange={(event) => setPromoProductForm((current) => ({ ...current, sku: event.target.value }))}
                  className="border-slate-700 bg-slate-800/70 text-white"
                />
              </div>
              <Button
                className="h-11 w-full bg-blue-600 text-white hover:bg-blue-500"
                onClick={() => void savePromoProduct()}
                disabled={savingPromoProduct}
              >
                <Plus className="mr-2 h-4 w-4" />
                {savingPromoProduct ? 'Saving…' : 'Add Promo Product'}
              </Button>
            </div>

            {loading ? (
              <p className="text-sm text-slate-400">Loading promo products…</p>
            ) : promoProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-4 text-sm text-slate-500">
                No promo products yet. Start by adding GXZ GLP-1.
              </div>
            ) : (
              <div className="space-y-3">
                {promoProducts.map((promoProduct) => {
                  const codes = codesByProductId[promoProduct.id] ?? [];
                  const isActive = selectedProductId === promoProduct.id;

                  return (
                    <button
                      key={promoProduct.id}
                      type="button"
                      onClick={() => setSelectedProductId(promoProduct.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                        isActive
                          ? 'border-blue-500/30 bg-blue-500/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{promoProduct.name}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {promoProduct.sku ? `SKU: ${promoProduct.sku}` : 'No SKU yet'}
                          </p>
                        </div>
                        <Badge className="border-slate-700 bg-slate-800 text-slate-200">
                          {codes.length} code{codes.length === 1 ? '' : 's'}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {!selectedProduct ? (
          <Card className="border-slate-800 bg-slate-900/70">
            <CardContent className="py-16 text-center text-slate-400">
              Select a promo product to view its detail page and influencer codes.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900/70">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-white">{selectedProduct.name}</CardTitle>
                    <CardDescription className="text-slate-400">
                      Promo Product Detail
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-fit text-red-300 hover:bg-red-500/10 hover:text-red-200"
                    onClick={() => void deletePromoProduct(selectedProduct)}
                    disabled={deletingPromoProductId === selectedProduct.id}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Assigned Codes</p>
                  <p className="mt-2 text-2xl font-bold text-white">{selectedProductCodes.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Total Uses</p>
                  <p className="mt-2 text-2xl font-bold text-white">{selectedProductStats.totalUses}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Total Revenue</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-300">{formatCurrency(selectedProductStats.totalRevenue)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-white">Add Promo Code</CardTitle>
                <CardDescription className="text-slate-400">Assign a new influencer code to this promo product.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="promo-code-value" className="text-slate-200">Code</Label>
                  <Input
                    id="promo-code-value"
                    placeholder="VERSE10"
                    value={promoCodeForm.code}
                    onChange={(event) => setPromoCodeForm((current) => ({ ...current, code: normalizeCode(event.target.value) }))}
                    className="border-slate-700 bg-slate-800/70 font-mono text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-code-influencer" className="text-slate-200">Influencer Name</Label>
                  <Input
                    id="promo-code-influencer"
                    placeholder="Verse"
                    value={promoCodeForm.influencerName}
                    onChange={(event) => setPromoCodeForm((current) => ({ ...current, influencerName: event.target.value }))}
                    className="border-slate-700 bg-slate-800/70 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-code-discount" className="text-slate-200">Discount % (optional)</Label>
                  <Input
                    id="promo-code-discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="10"
                    value={promoCodeForm.discountPercent}
                    onChange={(event) => setPromoCodeForm((current) => ({ ...current, discountPercent: event.target.value }))}
                    className="border-slate-700 bg-slate-800/70 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-code-expiration" className="text-slate-200">Expiration Date</Label>
                  <Input
                    id="promo-code-expiration"
                    type="date"
                    value={promoCodeForm.expirationDate}
                    onChange={(event) => setPromoCodeForm((current) => ({ ...current, expirationDate: event.target.value }))}
                    className="border-slate-700 bg-slate-800/70 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-code-limit" className="text-slate-200">Usage Limit (optional)</Label>
                  <Input
                    id="promo-code-limit"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="50"
                    value={promoCodeForm.usageLimit}
                    onChange={(event) => setPromoCodeForm((current) => ({ ...current, usageLimit: event.target.value }))}
                    className="border-slate-700 bg-slate-800/70 text-white"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    className="h-11 w-full bg-blue-600 text-white hover:bg-blue-500"
                    onClick={() => void savePromoCode()}
                    disabled={savingPromoCode}
                  >
                    <TicketPercent className="mr-2 h-4 w-4" />
                    {savingPromoCode ? 'Saving…' : 'Add Promo Code'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-white">Promo Code Analytics</CardTitle>
                <CardDescription className="text-slate-400">
                  Code performance per influencer for this promo product.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">Code</TableHead>
                      <TableHead className="text-slate-400">Influencer</TableHead>
                      <TableHead className="text-slate-400">Uses</TableHead>
                      <TableHead className="text-slate-400">Revenue</TableHead>
                      <TableHead className="text-slate-400">Expiry</TableHead>
                      <TableHead className="text-slate-400">Last Used</TableHead>
                      <TableHead className="text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProductCodes.length === 0 ? (
                      <TableRow className="border-slate-800">
                        <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                          No promo codes yet for this product.
                        </TableCell>
                      </TableRow>
                    ) : selectedProductCodes.map((promoCode) => {
                      const isExpired = Boolean(promoCode.expires_at && new Date(promoCode.expires_at) < new Date());
                      const limitReached = promoCode.usage_limit !== null && promoCode.total_uses >= promoCode.usage_limit;

                      return (
                        <TableRow key={promoCode.id} className="border-slate-800/70 hover:bg-transparent">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-blue-300">{promoCode.code}</span>
                              {promoCode.discount_percent !== null && (
                                <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                                  {promoCode.discount_percent}% off
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            <span className="inline-flex items-center gap-2">
                              <UserRound className="h-4 w-4 text-slate-500" />
                              {promoCode.influencer_name}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {promoCode.total_uses}
                            {promoCode.usage_limit !== null && (
                              <span className="ml-1 text-xs text-slate-500">/ {promoCode.usage_limit}</span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold text-emerald-300">
                            {formatCurrency(Number(promoCode.total_revenue))}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {formatDateTime(promoCode.expires_at)}
                            {isExpired && <span className="ml-2 text-xs text-red-300">Expired</span>}
                          </TableCell>
                          <TableCell className="text-slate-300">{formatDateTime(promoCode.last_used_at)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {limitReached && (
                                <Badge variant="outline" className="border-amber-500/30 text-amber-300">
                                  Limit reached
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
                                onClick={() => void deletePromoCode(promoCode)}
                                disabled={deletingPromoCodeId === promoCode.id}
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
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
