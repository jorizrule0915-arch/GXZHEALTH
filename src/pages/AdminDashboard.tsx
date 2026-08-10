import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Boxes,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Mail,
  Menu,
  Moon,
  MoreHorizontal,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Sun,
  Truck,
  UserRound,
  Users,
  X,
  LockKeyhole,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  fallbackProducts,
  normalizeCatalogProduct,
  type CatalogProduct,
} from "@/lib/products";
import syringe from "@/assets/products/syringe.png";
import balm from "@/assets/products/Body Balm.jpg";
import creatine from "@/assets/products/Creatine.jpg";

type View =
  | "dashboard"
  | "orders"
  | "customers"
  | "products"
  | "tracking"
  | "payments"
  | "emails"
  | "settings";
type ShipmentStatus =
  "Awaiting tracking" | "In transit" | "Out for delivery" | "Delivered";
type Order = {
  id: string;
  customer: string;
  email: string;
  initials: string;
  address: string;
  city: string;
  product: string;
  variant: string;
  image: string;
  quantity: number;
  total: number;
  date: string;
  payment: string;
  paymentStatus: "Paid" | "Pending" | "Refunded";
  carrier: string;
  tracking: string;
  shipmentStatus: ShipmentStatus;
  latestUpdate?: string;
  shipmentLocation?: string;
  eventDate?: string;
};

const seedOrders: Order[] = [
  {
    id: "#GXZ-1048",
    customer: "Marissa Cole",
    email: "marissa@example.com",
    initials: "MC",
    address: "1824 Willow Bend Dr",
    city: "Austin, TX 78704",
    product: "Glow Peptide Serum",
    variant: "30 ml · Monthly",
    image: syringe,
    quantity: 1,
    total: 149,
    date: "Aug 11, 2026",
    payment: "Visa ···· 4242",
    paymentStatus: "Paid",
    carrier: "",
    tracking: "",
    shipmentStatus: "Awaiting tracking",
  },
  {
    id: "#GXZ-1047",
    customer: "Daniel Kim",
    email: "daniel.k@example.com",
    initials: "DK",
    address: "77 Ocean View Ave",
    city: "San Diego, CA 92109",
    product: "GXZ Body Balm",
    variant: "3.4 oz · One-time",
    image: balm,
    quantity: 2,
    total: 84,
    date: "Aug 11, 2026",
    payment: "Apple Pay",
    paymentStatus: "Paid",
    carrier: "UPS",
    tracking: "1Z85A03E03928472",
    shipmentStatus: "In transit",
  },
  {
    id: "#GXZ-1046",
    customer: "Alicia Torres",
    email: "alicia.t@example.com",
    initials: "AT",
    address: "403 Parkside Lane",
    city: "Miami, FL 33130",
    product: "GXZ Creatine+",
    variant: "30 servings · One-time",
    image: creatine,
    quantity: 1,
    total: 58,
    date: "Aug 10, 2026",
    payment: "Mastercard ···· 8812",
    paymentStatus: "Paid",
    carrier: "USPS",
    tracking: "9400111899223102848291",
    shipmentStatus: "Out for delivery",
  },
  {
    id: "#GXZ-1045",
    customer: "Jordan Blake",
    email: "jordan.b@example.com",
    initials: "JB",
    address: "991 Forest Ave",
    city: "Portland, OR 97205",
    product: "Glow Peptide Serum",
    variant: "30 ml · Monthly",
    image: syringe,
    quantity: 1,
    total: 149,
    date: "Aug 10, 2026",
    payment: "Visa ···· 1901",
    paymentStatus: "Paid",
    carrier: "DHL",
    tracking: "GM295118963100004829",
    shipmentStatus: "Delivered",
  },
];

type StoredShipping = Pick<Order, "carrier" | "tracking" | "shipmentStatus" | "latestUpdate" | "shipmentLocation" | "eventDate">;

function readShipping(): Record<string, StoredShipping> {
  try {
    return JSON.parse(localStorage.getItem("gxz-admin-shipping") ?? "{}");
  } catch {
    return {};
  }
}

function firstOrderItem(items: Json) {
  if (
    !Array.isArray(items) ||
    !items[0] ||
    typeof items[0] !== "object" ||
    Array.isArray(items[0])
  )
    return null;
  return items[0] as Record<string, Json | undefined>;
}

function productImage(name: string, catalog: Map<string, string>) {
  const normalized = name.toLowerCase();
  const exact = catalog.get(normalized);
  if (exact) return exact;
  const partial = [...catalog.entries()].find(
    ([productName]) =>
      normalized.includes(productName) || productName.includes(normalized),
  );
  if (partial) return partial[1];
  if (normalized.includes("balm")) return balm;
  if (normalized.includes("creatine")) return creatine;
  return syringe;
}

function savedItemImage(item: Record<string, Json | undefined> | null) {
  if (!item) return "";
  const value = item.image;
  return typeof value === "string" &&
    value.trim() &&
    value !== "/placeholder.png"
    ? value.trim()
    : "";
}

const nav: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "customers", label: "Customers", icon: Users },
  { id: "products", label: "Products", icon: Boxes },
  { id: "tracking", label: "Tracking", icon: Truck },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "emails", label: "Email history", icon: Mail },
  { id: "settings", label: "Settings", icon: Settings },
];

const statusStyle: Record<ShipmentStatus, string> = {
  "Awaiting tracking":
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300",
  "In transit":
    "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-300",
  "Out for delivery":
    "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-400/10 dark:text-violet-300",
  Delivered:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300",
};

function Status({ value }: { value: ShipmentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        statusStyle[value],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem("admin_auth") === "true",
  );
  const [password, setPassword] = useState("");
  const [view, setView] = useState<View>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All orders");
  const [dark, setDark] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState<ShipmentStatus>("Awaiting tracking");
  const [latestUpdate, setLatestUpdate] = useState("");
  const [shipmentLocation, setShipmentLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const order = orders.find((item) => item.id === selected) ?? orders[0];

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  useEffect(() => {
    setCarrier(order?.carrier ?? "");
    setTracking(order?.tracking ?? "");
    setShipmentStatus(order?.shipmentStatus ?? "Awaiting tracking");
    setLatestUpdate(order?.latestUpdate ?? "");
    setShipmentLocation(order?.shipmentLocation ?? "");
    setEventDate(order?.eventDate ?? "");
  }, [order?.id]);
  useEffect(() => {
    if (!authenticated) {
      setLoading(false);
      return;
    }
    let active = true;
    const loadOrders = async () => {
      const [{ data, error }, { data: productRows }] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("products")
          .select("*")
          .order("sort_order", { ascending: true }),
      ]);
      if (!active) return;
      if (error) {
        toast({
          title: "Unable to load live orders",
          description: error.message,
          variant: "destructive",
        });
        setOrders(seedOrders);
      } else {
        const shipping = readShipping();
        const catalogProducts = productRows?.length
          ? productRows.map(normalizeCatalogProduct)
          : fallbackProducts;
        setProducts(catalogProducts);
        const imageCatalog = new Map(
          catalogProducts.map((product) => [
            product.name.trim().toLowerCase(),
            product.image,
          ]),
        );
        const mapped: Order[] = (data ?? []).map((row) => {
          const item = firstOrderItem(row.items);
          const name =
            typeof item?.name === "string" ? item.name : "Order item";
          const saved = shipping[row.id];
          return {
            id: row.order_number.startsWith("#")
              ? row.order_number
              : `#${row.order_number}`,
            customer: row.customer_name || "Guest customer",
            email: row.customer_email || "No email provided",
            initials: (row.customer_name || "Guest")
              .split(/\s+/)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
            address: row.customer_address || "No address provided",
            city: [row.customer_city, row.customer_state, row.customer_zip]
              .filter(Boolean)
              .join(", ")
              .replace(/, ([^,]+)$/, " $1"),
            product: name,
            variant:
              typeof item?.selectedOptionLabel === "string"
                ? item.selectedOptionLabel
                : "Standard",
            image: savedItemImage(item) || productImage(name, imageCatalog),
            quantity:
              typeof item?.quantity === "number"
                ? item.quantity
                : row.total_items,
            total: Number(row.total_price),
            date: new Date(row.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            payment: row.payment_method || "Not selected",
            paymentStatus: [
              "complete",
              "completed",
              "payment_submitted",
            ].includes(row.status)
              ? "Paid"
              : "Pending",
            carrier: saved?.carrier ?? "",
            tracking: saved?.tracking ?? "",
            shipmentStatus: saved?.shipmentStatus ?? "Awaiting tracking",
            latestUpdate: saved?.latestUpdate ?? "",
            shipmentLocation: saved?.shipmentLocation ?? "",
            eventDate: saved?.eventDate ?? "",
            _databaseId: row.id,
          } as Order & { _databaseId: string };
        });
        setOrders(mapped);
        setSelected(mapped[0]?.id ?? "");
      }
      setLoading(false);
    };
    void loadOrders();
    return () => {
      active = false;
    };
  }, [authenticated, toast]);

  const visible = useMemo(
    () =>
      orders.filter((item) => {
        const matches =
          `${item.id} ${item.customer} ${item.email} ${item.product}`
            .toLowerCase()
            .includes(query.toLowerCase());
        return (
          matches && (filter === "All orders" || item.shipmentStatus === filter)
        );
      }),
    [orders, query, filter],
  );

  const saveTracking = async () => {
    if (!carrier || !tracking.trim()) {
      toast({
        title: "Carrier and tracking number required",
        variant: "destructive",
      });
      return;
    }
    const databaseId = (order as Order & { _databaseId?: string })._databaseId;
    if (!databaseId) {
      toast({
        title: "Cannot email this sample order",
        variant: "destructive",
      });
      return;
    }
    const { data, error } = await supabase.functions.invoke(
      "send-shipping-email",
      {
        body: { orderId: databaseId, carrier, trackingNumber: tracking.trim(), shipmentStatus, latestUpdate, shipmentLocation, eventDate },
      },
    );
    if (error || data?.error) {
      toast({
        title: "Shipping email was not sent",
        description: data?.error || error?.message || "Please try again.",
        variant: "destructive",
      });
      return;
    }
    const next = orders.map((item) =>
      item.id === order.id
        ? {
            ...item,
            carrier,
            tracking: tracking.trim(),
            shipmentStatus,
            latestUpdate,
            shipmentLocation,
            eventDate,
          }
        : item,
    );
    setOrders(next);
    const shipping = readShipping();
    shipping[databaseId] = {
      carrier,
      tracking: tracking.trim(),
      shipmentStatus,
      latestUpdate,
      shipmentLocation,
      eventDate,
    };
    localStorage.setItem("gxz-admin-shipping", JSON.stringify(shipping));
    toast({
      title: "Tracking saved",
      description: `Shipping confirmation sent to ${order.email}.`,
    });
  };

  const pageTitle = nav.find((item) => item.id === view)?.label ?? "Dashboard";

  const login = () => {
    if (password !== "gxzhealth2025") {
      toast({
        title: "Incorrect password",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }
    sessionStorage.setItem("admin_auth", "true");
    setAuthenticated(true);
    setLoading(true);
    setPassword("");
  };
  const logout = () => {
    sessionStorage.removeItem("admin_auth");
    setAuthenticated(false);
    setOrders([]);
  };

  if (!authenticated)
    return (
      <AdminLogin password={password} setPassword={setPassword} login={login} />
    );

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[244px] border-r border-slate-200 bg-white px-3 py-5 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0",
          mobileNav ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="mb-7 flex items-center justify-between px-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#103f35] text-sm font-black text-white">
                GX
              </div>
              <div>
                <p className="text-[15px] font-bold tracking-tight">
                  GXZ Health
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">
                  Admin console
                </p>
              </div>
            </div>
            <button className="lg:hidden" onClick={() => setMobileNav(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="space-y-1">
            {nav.map((item, index) => (
              <div key={item.id}>
                {index === 4 && (
                  <p className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">
                    Operations
                  </p>
                )}
                <button
                  onClick={() => {
                    setView(item.id);
                    setMobileNav(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    view === item.id
                      ? "bg-[#eaf4ef] text-[#145844] dark:bg-emerald-400/10 dark:text-emerald-300"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
                  {item.id === "orders" && (
                    <span className="ml-auto rounded-full bg-[#145844] px-2 py-0.5 text-[10px] font-bold text-white">
                      {orders.length}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </nav>
          <div className="mt-auto rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-emerald-500">
                GH
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Gary Horace</p>
                <p className="truncate text-xs text-slate-400">Administrator</p>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="ml-auto text-slate-400 hover:text-red-500"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
      {mobileNav && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}

      <main className="lg:pl-[244px]">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:px-7">
          <button className="mr-3 lg:hidden" onClick={() => setMobileNav(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold">{pageTitle}</p>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setDark(!dark)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {dark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 dark:border-slate-700">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </button>
          </div>
        </header>

        {view === "orders" && (
          <div className="mx-auto max-w-[1500px] p-4 sm:p-7">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="mb-1 text-sm text-slate-500">
                  Manage and fulfill customer purchases.
                </p>
                <h1 className="font-sans text-2xl font-bold tracking-tight">
                  Orders
                </h1>
              </div>
              <Button className="bg-[#145844] hover:bg-[#0f4636]">
                <Package className="mr-2 h-4 w-4" />
                Export orders
              </Button>
            </div>
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <Stat
                label="Orders today"
                value="12"
                note="↑ 18% from yesterday"
                icon={<ShoppingBag />}
              />
              <Stat
                label="Awaiting fulfillment"
                value="7"
                note="3 need tracking"
                icon={<Clock3 />}
              />
              <Stat
                label="Revenue today"
                value="$1,842"
                note="↑ 12.4% this week"
                icon={<CircleDollarSign />}
              />
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,.03)] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search orders, customers or products..."
                    className="h-9 pl-9"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option>All orders</option>
                  {Object.keys(statusStyle).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <button className="flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium dark:border-slate-700">
                  Newest first <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <div className="grid min-h-[600px] xl:grid-cols-[minmax(620px,1.35fr)_minmax(390px,.8fr)]">
                <div className="overflow-x-auto border-b border-slate-200 dark:border-slate-800 xl:border-b-0 xl:border-r">
                  <table className="w-full min-w-[720px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/40">
                        <th className="px-4 py-3 font-semibold">Order</th>
                        <th className="px-4 py-3 font-semibold">Customer</th>
                        <th className="px-4 py-3 font-semibold">Total</th>
                        <th className="px-4 py-3 font-semibold">Shipping</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-16 text-center text-sm text-slate-400"
                          >
                            Loading live orders…
                          </td>
                        </tr>
                      ) : visible.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-16 text-center text-sm text-slate-400"
                          >
                            No orders found.
                          </td>
                        </tr>
                      ) : (
                        visible.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => setSelected(item.id)}
                            className={cn(
                              "cursor-pointer border-b border-slate-100 text-sm transition dark:border-slate-800",
                              selected === item.id
                                ? "bg-[#f1f8f5] dark:bg-emerald-400/5"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                            )}
                          >
                            <td className="px-4 py-4">
                              <p className="font-semibold text-[#145844] dark:text-emerald-300">
                                {item.id}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {item.date}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2.5">
                                <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-[10px] font-bold dark:bg-slate-800">
                                  {item.initials}
                                </span>
                                <div>
                                  <p className="font-medium">{item.customer}</p>
                                  <p className="text-xs text-slate-400">
                                    {item.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-semibold">
                                ${item.total.toFixed(2)}
                              </p>
                              <p className="text-xs text-emerald-600">
                                {item.paymentStatus}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <Status value={item.shipmentStatus} />
                            </td>
                            <td className="px-4">
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {order && (
                  <OrderPanel
                    order={order}
                    carrier={carrier}
                    tracking={tracking}
                    setCarrier={setCarrier}
                    setTracking={setTracking}
                    shipmentStatus={shipmentStatus}
                    setShipmentStatus={setShipmentStatus}
                    latestUpdate={latestUpdate}
                    setLatestUpdate={setLatestUpdate}
                    shipmentLocation={shipmentLocation}
                    setShipmentLocation={setShipmentLocation}
                    eventDate={eventDate}
                    setEventDate={setEventDate}
                    save={saveTracking}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {view === "tracking" && (
          <TrackingPage orders={orders} query={query} setQuery={setQuery} />
        )}
        {!["orders", "tracking"].includes(view) && (
          <AdminModule
            view={view}
            orders={orders}
            products={products}
            setView={setView}
          />
        )}
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-[11px] text-slate-400">{note}</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#eaf4ef] text-[#145844] dark:bg-emerald-400/10 [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </div>
      </div>
    </div>
  );
}

function OrderPanel({
  order,
  carrier,
  tracking,
  setCarrier,
  setTracking,
  shipmentStatus,
  setShipmentStatus,
  latestUpdate,
  setLatestUpdate,
  shipmentLocation,
  setShipmentLocation,
  eventDate,
  setEventDate,
  save,
}: {
  order: Order;
  carrier: string;
  tracking: string;
  setCarrier: (v: string) => void;
  setTracking: (v: string) => void;
  shipmentStatus: ShipmentStatus;
  setShipmentStatus: (v: ShipmentStatus) => void;
  latestUpdate: string;
  setLatestUpdate: (v: string) => void;
  shipmentLocation: string;
  setShipmentLocation: (v: string) => void;
  eventDate: string;
  setEventDate: (v: string) => void;
  save: () => void;
}) {
  return (
    <aside className="p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">
            {order.date} · 10:42 AM
          </p>
          <h2 className="mt-1 font-sans text-xl font-bold">{order.id}</h2>
        </div>
        <Status value={order.shipmentStatus} />
      </div>
      <Section title="Customer">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eaf4ef] text-xs font-bold text-[#145844]">
            {order.initials}
          </span>
          <div>
            <p className="text-sm font-semibold">{order.customer}</p>
            <p className="text-xs text-slate-400">{order.email}</p>
          </div>
        </div>
      </Section>
      <Section title="Shipping address">
        <div className="flex gap-2.5 text-sm">
          <UserRound className="mt-0.5 h-4 w-4 text-slate-400" />
          <div>
            <p>{order.address}</p>
            <p>{order.city}</p>
            <p>United States</p>
          </div>
        </div>
      </Section>
      <Section title="Products">
        <div className="flex gap-3">
          <img
            src={order.image}
            className="h-12 w-12 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold">{order.product}</p>
            <p className="text-xs text-slate-400">
              {order.variant} · Qty {order.quantity}
            </p>
          </div>
          <p className="text-sm font-semibold">${order.total.toFixed(2)}</p>
        </div>
      </Section>
      <Section title="Payment">
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="h-4 w-4 text-slate-400" />
          <span>{order.payment}</span>
          <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <Check className="h-3 w-3" />
            {order.paymentStatus}
          </span>
        </div>
      </Section>
      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
        <div className="mb-3 flex items-center gap-2">
          <Truck className="h-4 w-4 text-[#145844] dark:text-emerald-300" />
          <h3 className="text-sm font-bold">Shipping & tracking</h3>
        </div>
        <label className="mb-1.5 block text-xs font-semibold">Carrier</label>
        <select
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          className="mb-3 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Select carrier</option>
          <option>USPS</option>
          <option>UPS</option>
          <option>DHL</option>
          <option>FedEx</option>
          <option>Other</option>
        </select>
        <label className="mb-1.5 block text-xs font-semibold">
          Tracking number
        </label>
        <Input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="Enter tracking number"
          className="mb-3 h-9 bg-white dark:bg-slate-900"
        />
        <label className="mb-1.5 block text-xs font-semibold">Shipment status</label>
        <select value={shipmentStatus} onChange={(e) => setShipmentStatus(e.target.value as ShipmentStatus)} className="mb-3 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option>Awaiting tracking</option><option>In transit</option><option>Out for delivery</option><option>Delivered</option>
        </select>
        <label className="mb-1.5 block text-xs font-semibold">Latest update</label>
        <Textarea value={latestUpdate} onChange={(e) => setLatestUpdate(e.target.value)} placeholder="A shipping label has been prepared. A delivery date will be provided when USPS receives the package." className="mb-3 min-h-20 bg-white text-sm dark:bg-slate-900" />
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <div><label className="mb-1.5 block text-xs font-semibold">Event / location</label><Input value={shipmentLocation} onChange={(e) => setShipmentLocation(e.target.value)} placeholder="BAKERSFIELD, CA 93308" className="h-9 bg-white dark:bg-slate-900" /></div>
          <div><label className="mb-1.5 block text-xs font-semibold">Event date & time</label><Input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-9 bg-white dark:bg-slate-900" /></div>
        </div>
        <Button
          onClick={save}
          className="w-full bg-[#145844] hover:bg-[#0f4636]"
        >
          Save & send confirmation
        </Button>
        <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-400">
          Sends one shipping confirmation email with a<br />
          “Track My Order” button.
        </p>
      </div>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 border-b border-slate-100 pb-5 dark:border-slate-800">
      <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function TrackingPage({
  orders,
  query,
  setQuery,
}: {
  orders: Order[];
  query: string;
  setQuery: (v: string) => void;
}) {
  const shown = orders.filter((o) =>
    `${o.id} ${o.customer} ${o.tracking}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-7">
      <p className="text-sm text-slate-500">
        Monitor every shipment from label creation to delivery.
      </p>
      <h1 className="mt-1 font-sans text-2xl font-bold">Shipment tracking</h1>
      <div className="my-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Object.keys(statusStyle).map((s) => (
          <div
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            key={s}
          >
            <Status value={s as ShipmentStatus} />
            <p className="mt-3 text-3xl font-bold">
              {orders.filter((o) => o.shipmentStatus === s).length}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="relative m-4 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search shipments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-400 dark:bg-slate-950/50">
              <tr>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Carrier / tracking</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-slate-100 dark:border-slate-800"
                >
                  <td className="px-5 py-4 font-semibold text-[#145844] dark:text-emerald-300">
                    {o.id}
                  </td>
                  <td className="px-5 py-4">{o.customer}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium">{o.carrier || "—"}</p>
                    <p className="text-xs text-slate-400">
                      {o.tracking || "Not added"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <Status value={o.shipmentStatus} />
                  </td>
                  <td className="px-5 py-4 text-slate-500">{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminLogin({
  password,
  setPassword,
  login,
}: {
  password: string;
  setPassword: (value: string) => void;
  login: () => void;
}) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f4f7f6] p-5">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl" />
      <div className="relative w-full max-w-[420px] rounded-2xl border border-white bg-white p-8 shadow-[0_24px_70px_rgba(15,63,53,.12)]">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#103f35] text-sm font-black text-white">
            GX
          </div>
          <div>
            <p className="font-bold">GXZ Health</p>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">
              Admin console
            </p>
          </div>
        </div>
        <div className="mb-6">
          <h1 className="font-sans text-2xl font-bold tracking-tight">
            Welcome back, Gary
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage orders and fulfillment.
          </p>
        </div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
          Admin password
        </label>
        <div className="relative">
          <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            autoFocus
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Enter your password"
            className="h-11 pl-10"
          />
        </div>
        <Button
          onClick={login}
          className="mt-4 h-11 w-full bg-[#145844] hover:bg-[#0f4636]"
        >
          Sign in to dashboard
        </Button>
        <p className="mt-5 text-center text-xs text-slate-400">
          Authorized GXZ Health personnel only
        </p>
      </div>
    </div>
  );
}

function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-7">
      <p className="text-sm text-slate-500">{description}</p>
      <h1 className="mt-1 font-sans text-2xl font-bold tracking-tight">
        {title}
      </h1>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function DataCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
    >
      {children}
    </div>
  );
}

function AdminModule({
  view,
  orders,
  products,
  setView,
}: {
  view: View;
  orders: Order[];
  products: CatalogProduct[];
  setView: (view: View) => void;
}) {
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const customers = [
    ...new Map(orders.map((order) => [order.email, order])).values(),
  ];
  if (view === "dashboard")
    return (
      <PageShell
        title="Dashboard"
        description="A live overview of GXZ Health commerce operations."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Total revenue"
            value={`$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            note="Across all recorded orders"
            icon={<TrendingUp />}
          />
          <Stat
            label="Total orders"
            value={String(orders.length)}
            note={`${orders.filter((o) => o.paymentStatus === "Paid").length} paid`}
            icon={<ShoppingBag />}
          />
          <Stat
            label="Customers"
            value={String(customers.length)}
            note="Unique customer emails"
            icon={<Users />}
          />
          <Stat
            label="Needs tracking"
            value={String(
              orders.filter((o) => o.shipmentStatus === "Awaiting tracking")
                .length,
            )}
            note="Ready for fulfillment"
            icon={<Truck />}
          />
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.7fr]">
          <DataCard>
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <div>
                <h2 className="font-semibold">Recent orders</h2>
                <p className="text-xs text-slate-400">
                  Latest customer purchases
                </p>
              </div>
              <button
                onClick={() => setView("orders")}
                className="text-sm font-semibold text-[#145844] dark:text-emerald-300"
              >
                View all
              </button>
            </div>
            {orders.slice(0, 6).map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-3 border-b border-slate-100 p-4 last:border-0 dark:border-slate-800"
              >
                <img
                  src={o.image}
                  className="h-10 w-10 rounded-lg border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{o.customer}</p>
                  <p className="truncate text-xs text-slate-400">
                    {o.id} · {o.product}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">${o.total.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">{o.date}</p>
                </div>
              </div>
            ))}
          </DataCard>
          <DataCard>
            <div className="border-b border-slate-100 p-5 dark:border-slate-800">
              <h2 className="font-semibold">Fulfillment</h2>
              <p className="text-xs text-slate-400">Shipment progress</p>
            </div>
            <div className="space-y-5 p-5">
              {Object.keys(statusStyle).map((status) => {
                const count = orders.filter(
                  (o) => o.shipmentStatus === status,
                ).length;
                const percent = orders.length
                  ? Math.round((count / orders.length) * 100)
                  : 0;
                return (
                  <div key={status}>
                    <div className="mb-2 flex justify-between text-xs">
                      <span>{status}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-[#26715c]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </DataCard>
        </div>
      </PageShell>
    );

  if (view === "customers")
    return (
      <PageShell
        title="Customers"
        description="Customer profiles derived from completed and pending orders."
      >
        <DataCard>
          <SimpleHead
            columns={[
              "Customer",
              "Location",
              "Orders",
              "Lifetime value",
              "Last order",
            ]}
          />
          {customers.map((c) => {
            const related = orders.filter((o) => o.email === c.email);
            return (
              <SimpleRow
                key={c.email}
                cells={[
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#eaf4ef] text-xs font-bold text-[#145844]">
                      {c.initials}
                    </span>
                    <div>
                      <p className="font-semibold">{c.customer}</p>
                      <p className="text-xs text-slate-400">{c.email}</p>
                    </div>
                  </div>,
                  c.city,
                  String(related.length),
                  `$${related.reduce((sum, o) => sum + o.total, 0).toFixed(2)}`,
                  c.date,
                ]}
              />
            );
          })}
        </DataCard>
      </PageShell>
    );

  if (view === "products")
    return (
      <PageShell
        title="Products"
        description="Live catalog products and storefront availability."
      >
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Stat
            label="Catalog products"
            value={String(products.length)}
            note="Synced from Supabase"
            icon={<Boxes />}
          />
          <Stat
            label="Active"
            value={String(products.filter((p) => p.isActive).length)}
            note="Visible on storefront"
            icon={<Check />}
          />
          <Stat
            label="Out of stock"
            value={String(products.filter((p) => !p.inStock).length)}
            note="Needs attention"
            icon={<Clock3 />}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <DataCard key={p.id} className="p-4">
              <div className="flex gap-4">
                <img
                  src={p.image}
                  className="h-20 w-20 rounded-xl border object-contain"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{p.category}</p>
                  <p className="mt-2 text-lg font-bold">
                    ${p.price.toFixed(2)}
                  </p>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      p.inStock && p.isActive
                        ? "text-emerald-600"
                        : "text-amber-600",
                    )}
                  >
                    {p.inStock && p.isActive
                      ? "Active · In stock"
                      : !p.inStock
                        ? "Out of stock"
                        : "Hidden"}
                  </span>
                </div>
              </div>
            </DataCard>
          ))}
        </div>
      </PageShell>
    );

  if (view === "payments")
    return (
      <PageShell
        title="Payments"
        description="Payment activity and order reconciliation."
      >
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Stat
            label="Gross volume"
            value={`$${revenue.toFixed(2)}`}
            note="All orders"
            icon={<CircleDollarSign />}
          />
          <Stat
            label="Paid"
            value={`$${orders
              .filter((o) => o.paymentStatus === "Paid")
              .reduce((s, o) => s + o.total, 0)
              .toFixed(2)}`}
            note="Confirmed payments"
            icon={<Check />}
          />
          <Stat
            label="Pending"
            value={String(
              orders.filter((o) => o.paymentStatus === "Pending").length,
            )}
            note="Requires review"
            icon={<Clock3 />}
          />
        </div>
        <DataCard>
          <SimpleHead
            columns={["Order", "Customer", "Method", "Amount", "Status"]}
          />
          {orders.map((o) => (
            <SimpleRow
              key={o.id}
              cells={[
                <span className="font-semibold text-[#145844] dark:text-emerald-300">
                  {o.id}
                </span>,
                o.customer,
                o.payment,
                `$${o.total.toFixed(2)}`,
                <span
                  className={cn(
                    "text-xs font-bold",
                    o.paymentStatus === "Paid"
                      ? "text-emerald-600"
                      : "text-amber-600",
                  )}
                >
                  {o.paymentStatus}
                </span>,
              ]}
            />
          ))}
        </DataCard>
      </PageShell>
    );

  if (view === "emails")
    return (
      <PageShell
        title="Email history"
        description="Major-milestone customer notifications only."
      >
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          <strong>Smart automation active.</strong> Emails are limited to order
          confirmation, shipped, out for delivery, and delivered milestones.
        </div>
        <DataCard>
          <SimpleHead
            columns={["Recipient", "Event", "Order", "Status", "Date"]}
          />
          {orders.slice(0, 12).map((o) => (
            <SimpleRow
              key={o.id}
              cells={[
                <div>
                  <p className="font-medium">{o.customer}</p>
                  <p className="text-xs text-slate-400">{o.email}</p>
                </div>,
                o.tracking ? "Shipping confirmation" : "Order confirmation",
                o.id,
                <span className="text-xs font-bold text-emerald-600">
                  Sent
                </span>,
                o.date,
              ]}
            />
          ))}
        </DataCard>
      </PageShell>
    );

  return (
    <PageShell
      title="Settings"
      description="Configure store operations and administrator preferences."
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <DataCard className="p-5">
          <h2 className="font-semibold">Administrator profile</h2>
          <p className="mb-5 text-xs text-slate-400">
            Account shown across this console
          </p>
          <label className="mb-1.5 block text-xs font-semibold">Name</label>
          <Input value="Gary Horace" readOnly />
          <label className="mb-1.5 mt-4 block text-xs font-semibold">
            Role
          </label>
          <Input value="Administrator" readOnly />
        </DataCard>
        <DataCard className="p-5">
          <h2 className="font-semibold">Email automation</h2>
          <p className="mb-2 text-xs text-slate-400">
            Only meaningful customer milestones trigger messages.
          </p>
          {[
            "Order confirmation",
            "Shipping confirmation",
            "Out for delivery",
            "Delivered",
          ].map((item) => (
            <div
              className="flex items-center justify-between border-b border-slate-100 py-3 text-sm last:border-0 dark:border-slate-800"
              key={item}
            >
              <span>{item}</span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                Enabled
              </span>
            </div>
          ))}
        </DataCard>
        <DataCard className="p-5 xl:col-span-2">
          <h2 className="font-semibold">Carrier integrations</h2>
          <p className="mb-4 text-xs text-slate-400">
            Built for adding carrier APIs in the next phase.
          </p>
          <div className="flex flex-wrap gap-2">
            {["USPS", "UPS", "DHL", "FedEx"].map((c) => (
              <span
                key={c}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700"
              >
                {c}
              </span>
            ))}
          </div>
        </DataCard>
      </div>
    </PageShell>
  );
}

function SimpleHead({ columns }: { columns: string[] }) {
  return (
    <div className="hidden grid-cols-5 gap-4 bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-950/40 md:grid">
      {columns.map((column) => (
        <div key={column}>{column}</div>
      ))}
    </div>
  );
}
function SimpleRow({ cells }: { cells: React.ReactNode[] }) {
  return (
    <div className="grid gap-3 border-t border-slate-100 px-5 py-4 text-sm first:border-0 dark:border-slate-800 md:grid-cols-5 md:items-center md:gap-4">
      {cells.map((cell, index) => (
        <div key={index} className="min-w-0">
          {cell}
        </div>
      ))}
    </div>
  );
}
