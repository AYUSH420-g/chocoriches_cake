import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CalendarOff,
  Edit3,
  Lock,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  ShoppingBag,
  Tags,
  Trash2,
  Users
} from "lucide-react";
import { Toaster, toast } from "sonner";
import {
  adminLogin,
  blockAdminUser,
  createAdminBlockedDate,
  createAdminCategory,
  createAdminPincode,
  createAdminProduct,
  deleteAdminBlockedDate,
  deleteAdminCategory,
  deleteAdminPincode,
  deleteAdminProduct,
  getAdminBlockedDates,
  getAdminCategories,
  getAdminInquiries,
  getAdminOrders,
  getAdminPincodes,
  getAdminProducts,
  getAdminSettings,
  getAdminSummary,
  getAdminUsers,
  updateAdminBlockedDate,
  updateAdminCategory,
  updateAdminOrder,
  updateAdminPincode,
  updateAdminProduct,
  updateAdminSettings
} from "../api/client";
import { formatPrice } from "../utils/format";

const tabs = [
  ["overview", "Overview", ShieldCheck],
  ["products", "Products", Package],
  ["categories", "Categories", Tags],
  ["users", "Users", Users],
  ["orders", "Orders", ShoppingBag],
  ["pincodes", "Pincodes", MapPin],
  ["dates", "Blocked Dates", CalendarOff],
  ["settings", "Settings", AlertTriangle]
];

const emptyProduct = {
  name: "",
  price: "",
  discountPrice: "",
  image: "",
  category: "Birthday Cakes",
  stock: "",
  weight: "500g",
  description: "",
  isFeatured: false,
  isBestSeller: false,
  isTrending: false,
  customizable: false,
};

const emptyCategory = { name: "", description: "", image: "", isActive: true, sortOrder: 0 };
const emptyPincode = { pincode: "", city: "", state: "", deliveryFee: 0, isActive: true };
const emptyDate = { date: "", reason: "", isActive: true };

function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem("chocoriches_admin_token") || "");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [pincodes, setPincodes] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [settings, setSettings] = useState({ maintenanceMode: false, maintenanceMessage: "" });
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState("");
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [pincodeForm, setPincodeForm] = useState(emptyPincode);
  const [editingPincodeId, setEditingPincodeId] = useState("");
  const [dateForm, setDateForm] = useState(emptyDate);
  const [editingDateId, setEditingDateId] = useState("");

  const activeTabMeta = useMemo(() => tabs.find(([key]) => key === activeTab), [activeTab]);

  const loadAdmin = async () => {
    if (!localStorage.getItem("chocoriches_admin_token")) {
      return;
    }

    setLoading(true);
    try {
      const [
        nextSummary,
        nextUsers,
        nextProducts,
        nextCategories,
        nextOrders,
        nextInquiries,
        nextPincodes,
        nextBlockedDates,
        nextSettings
      ] = await Promise.all([
        getAdminSummary(),
        getAdminUsers(),
        getAdminProducts(),
        getAdminCategories(),
        getAdminOrders(),
        getAdminInquiries(),
        getAdminPincodes(),
        getAdminBlockedDates(),
        getAdminSettings()
      ]);

      setSummary(nextSummary);
      setUsers(nextUsers);
      setProducts(nextProducts);
      setCategories(nextCategories);
      setOrders(nextOrders);
      setInquiries(nextInquiries);
      setPincodes(nextPincodes);
      setBlockedDates(nextBlockedDates);
      setSettings(nextSettings);
    } catch {
      toast.error("Admin session expired. Please login again.");
      localStorage.removeItem("chocoriches_admin_token");
      setToken("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAdmin();
    }
  }, [token]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await adminLogin(loginForm);
      localStorage.setItem("chocoriches_admin_token", data.token);
      setToken(data.token);
      toast.success("Admin login successful");
    } catch {
      toast.error("Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("chocoriches_admin_token");
    setToken("");
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    const payload = normalizeProductForm(productForm);
    if (editingProductId) {
      await updateAdminProduct(editingProductId, payload);
      toast.success("Product updated");
    } else {
      await createAdminProduct(payload);
      toast.success("Product added");
    }
    setProductForm(emptyProduct);
    setEditingProductId("");
    await loadAdmin();
  };

  const editProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name || "",
      price: product.originalPrice || product.price || "",
      discountPrice: product.discountPrice || product.price || "",
      image: product.image || product.images?.[0]?.url || "",
      category: product.category || "Cakes",
      stock: product.stock || "",
      weight: product.weight || "500g",
      description: product.description || "",
      isFeatured: product.isFeatured,
      isBestSeller: product.isBestSeller,
      isTrending: product.isTrending,
      customizable: product.customizable,
    });
    setActiveTab("products");
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    if (editingCategoryId) {
      await updateAdminCategory(editingCategoryId, categoryForm);
      toast.success("Category updated");
    } else {
      await createAdminCategory(categoryForm);
      toast.success("Category added");
    }
    setCategoryForm(emptyCategory);
    setEditingCategoryId("");
    await loadAdmin();
  };

  const savePincode = async (event) => {
    event.preventDefault();
    if (editingPincodeId) {
      await updateAdminPincode(editingPincodeId, pincodeForm);
      toast.success("Pincode updated");
    } else {
      await createAdminPincode(pincodeForm);
      toast.success("Pincode added");
    }
    setPincodeForm(emptyPincode);
    setEditingPincodeId("");
    await loadAdmin();
  };

  const saveBlockedDate = async (event) => {
    event.preventDefault();
    if (editingDateId) {
      await updateAdminBlockedDate(editingDateId, dateForm);
      toast.success("Blocked date updated");
    } else {
      await createAdminBlockedDate(dateForm);
      toast.success("Blocked date added");
    }
    setDateForm(emptyDate);
    setEditingDateId("");
    await loadAdmin();
  };

  const toggleMaintenance = async () => {
    const nextSettings = await updateAdminSettings({
      ...settings,
      maintenanceMode: !settings.maintenanceMode,
    });
    setSettings(nextSettings);
    toast.success(nextSettings.maintenanceMode ? "Maintenance mode enabled" : "Maintenance mode disabled");
    await loadAdmin();
  };

  if (!token) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f7f7] px-4 py-6">
        <Toaster position="top-center" richColors />
        <form onSubmit={handleLogin} className="w-full max-w-md rounded-xl border border-[#ebebeb] bg-white p-5 shadow-xl shadow-black/5 sm:p-8">
          <span className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-[#fff2e9] text-[#e61951]">
            <Lock size={26} />
          </span>
          <h1 className="text-2xl font-black text-[#1f2221] sm:text-3xl">ChocoRiches Admin</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-[#6f7573]">Login to manage products, users, orders, service areas, and maintenance mode.</p>
          <Field label="Admin Email" value={loginForm.email} onChange={(value) => setLoginForm({ ...loginForm, email: value })} className="mt-6" />
          <Field label="Password" type="password" value={loginForm.password} onChange={(value) => setLoginForm({ ...loginForm, password: value })} className="mt-4" />
          <button disabled={loading} className="bk-btn mt-6 h-12 w-full text-sm disabled:opacity-60">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#1f2221]">
      <Toaster position="top-center" richColors />
      <header className="border-b border-[#ebebeb] bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-3 py-4 sm:px-4 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e61951]">Admin Control</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">ChocoRiches Operations</h1>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <button type="button" onClick={loadAdmin} className="bk-outline-btn h-11 px-3 text-xs sm:px-4 sm:text-sm">
              <RefreshCw size={16} />
              Refresh
            </button>
            <button type="button" onClick={toggleMaintenance} className={settings.maintenanceMode ? "bk-btn h-11 px-3 text-xs sm:px-4 sm:text-sm" : "bk-outline-btn h-11 px-3 text-xs sm:px-4 sm:text-sm"}>
              <AlertTriangle size={16} />
              Maintenance Mode
            </button>
            <button type="button" onClick={logout} className="col-span-2 h-11 rounded-lg border border-[#ebebeb] bg-white px-4 text-sm font-black text-[#5f6663] sm:col-span-1">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-4 px-3 py-4 sm:px-4 sm:py-5 lg:grid-cols-[260px_1fr] lg:gap-5">
        <aside className="flex gap-2 overflow-x-auto rounded-xl border border-[#ebebeb] bg-white p-2 shadow-sm lg:sticky lg:top-4 lg:block lg:self-start lg:overflow-visible">
          {tabs.map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-black transition lg:w-full lg:gap-3 lg:px-4 ${
                activeTab === key ? "bg-[#e61951] text-white" : "text-[#5f6663] hover:bg-[#fff2e9] hover:text-[#e61951]"
              }`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </aside>

        <main className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
            <div>
              <p className="text-sm font-bold text-[#6f7573]">Active area</p>
              <h2 className="text-xl font-black sm:text-2xl">{activeTabMeta?.[1]}</h2>
            </div>
            {loading && <p className="text-sm font-black text-[#e61951]">Loading...</p>}
          </div>

          {activeTab === "overview" && (
            <div className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Products" value={summary?.products || 0} icon={Package} />
                <Stat label="Users" value={summary?.users || 0} icon={Users} />
                <Stat label="Orders" value={summary?.orders || 0} icon={ShoppingBag} />
                <Stat label="Service Pincodes" value={summary?.pincodes || 0} icon={MapPin} />
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                <Panel title="Latest Orders">
                  <Rows data={orders.slice(0, 6)} columns={["orderId", "customerEmail", "status", "total"]} />
                </Panel>
                <Panel title="Custom Cake Inquiries">
                  <Rows data={inquiries.slice(0, 6)} columns={["name", "email", "eventDate", "status"]} />
                </Panel>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
              <Panel title={editingProductId ? "Edit Product" : "Add Product"}>
                <form onSubmit={saveProduct} className="grid gap-4">
                  <Field label="Name" value={productForm.name} onChange={(value) => setProductForm({ ...productForm, name: value })} required />
                  <Field label="Image URL" value={productForm.image} onChange={(value) => setProductForm({ ...productForm, image: value })} required />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="MRP" type="number" value={productForm.price} onChange={(value) => setProductForm({ ...productForm, price: value })} required />
                    <Field label="Sell Price" type="number" value={productForm.discountPrice} onChange={(value) => setProductForm({ ...productForm, discountPrice: value })} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Category" value={productForm.category} onChange={(value) => setProductForm({ ...productForm, category: value })} required />
                    <Field label="Stock" type="number" value={productForm.stock} onChange={(value) => setProductForm({ ...productForm, stock: value })} />
                  </div>
                  <Field label="Weight" value={productForm.weight} onChange={(value) => setProductForm({ ...productForm, weight: value })} />
                  <Textarea label="Description" value={productForm.description} onChange={(value) => setProductForm({ ...productForm, description: value })} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      ["isFeatured", "Featured"],
                      ["isBestSeller", "Bestseller"],
                      ["isTrending", "Trending"],
                      ["customizable", "Customizable"]
                    ].map(([key, label]) => (
                      <Check
                        key={key}
                        label={label}
                        checked={productForm[key]}
                        onChange={(checked) => setProductForm({ ...productForm, [key]: checked })}
                      />
                    ))}
                  </div>
                  <button className="bk-btn h-11 text-sm"><Save size={16} /> Save Product</button>
                </form>
              </Panel>
              <Panel title="Product Catalog">
                <div className="grid gap-3">
                  {products.map((product) => (
                    <div key={product.id} className="grid gap-3 rounded-lg border border-[#ebebeb] p-3 sm:grid-cols-[72px_1fr_auto] sm:items-center">
                      <img src={product.image} alt={product.name} className="h-20 w-20 rounded-lg object-cover" />
                      <div>
                        <h3 className="font-black">{product.name}</h3>
                        <p className="text-sm font-bold text-[#6f7573]">{product.category} | {formatPrice(product.price)} | Stock {product.stock || 0}</p>
                      </div>
                      <div className="flex gap-2">
                        <IconButton label="Edit" icon={Edit3} onClick={() => editProduct(product)} />
                        <IconButton label="Delete" icon={Trash2} danger onClick={async () => { await deleteAdminProduct(product.id); await loadAdmin(); }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "categories" && (
            <CrudPanel
              title={editingCategoryId ? "Edit Category" : "Add Category"}
              onSubmit={saveCategory}
              form={categoryForm}
              setForm={setCategoryForm}
              fields={["name", "description", "image", "sortOrder"]}
              checkboxLabel="Active"
              rows={categories}
              rowMain="name"
              rowSub="slug"
              onEdit={(item) => { setEditingCategoryId(item.id); setCategoryForm(item); }}
              onDelete={async (item) => { await deleteAdminCategory(item.id); await loadAdmin(); }}
            />
          )}

          {activeTab === "users" && (
            <Panel title="Users">
              <div className="grid gap-3">
                {users.map((user) => (
                  <div key={user.id} className="flex flex-col justify-between gap-3 rounded-lg border border-[#ebebeb] p-4 md:flex-row md:items-center">
                    <div>
                      <h3 className="font-black">{user.name}</h3>
                      <p className="text-sm font-bold text-[#6f7573]">{user.email}</p>
                      {user.isBlocked && <p className="mt-1 text-xs font-black text-[#e61951]">Blocked: {user.blockedReason || "No reason added"}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await blockAdminUser(user.id || user.email, {
                          isBlocked: !user.isBlocked,
                          blockedReason: !user.isBlocked ? "Blocked by admin" : "",
                        });
                        await loadAdmin();
                      }}
                      className={user.isBlocked ? "bk-outline-btn h-10 px-4 text-sm" : "bk-btn h-10 px-4 text-sm"}
                    >
                      <Ban size={16} />
                      {user.isBlocked ? "Unblock" : "Block"}
                    </button>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {activeTab === "orders" && (
            <Panel title="Orders">
              <div className="grid gap-3">
                {orders.map((order) => (
                  <div key={order.id} className="grid gap-3 rounded-lg border border-[#ebebeb] p-4 lg:grid-cols-[1fr_180px_auto] lg:items-center">
                    <div>
                      <h3 className="font-black">{order.orderId || order.id}</h3>
                      <p className="text-sm font-bold text-[#6f7573]">{order.customerEmail || "No email"} | {order.deliveryPincode || "No pincode"} | {formatPrice(order.total || 0)}</p>
                    </div>
                    <select
                      value={order.status || "Processing"}
                      onChange={async (event) => {
                        await updateAdminOrder(order.id, { status: event.target.value });
                        await loadAdmin();
                      }}
                      className="bk-input h-10 px-3 text-sm"
                    >
                      <option>Processing</option>
                      <option>Packed</option>
                      <option>Out For Delivery</option>
                      <option>Delivered</option>
                      <option>Cancelled</option>
                    </select>
                    <span className="rounded-full bg-[#fff2e9] px-3 py-2 text-xs font-black text-[#e61951]">{order.status}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {activeTab === "pincodes" && (
            <CrudPanel
              title={editingPincodeId ? "Edit Pincode" : "Add Pincode"}
              onSubmit={savePincode}
              form={pincodeForm}
              setForm={setPincodeForm}
              fields={["pincode", "city", "state", "deliveryFee"]}
              checkboxLabel="Active"
              rows={pincodes}
              rowMain="pincode"
              rowSub="city"
              onEdit={(item) => { setEditingPincodeId(item.id); setPincodeForm(item); }}
              onDelete={async (item) => { await deleteAdminPincode(item.id); await loadAdmin(); }}
            />
          )}

          {activeTab === "dates" && (
            <CrudPanel
              title={editingDateId ? "Edit Blocked Date" : "Block Delivery Date"}
              onSubmit={saveBlockedDate}
              form={dateForm}
              setForm={setDateForm}
              fields={["date", "reason"]}
              checkboxLabel="Active"
              rows={blockedDates}
              rowMain="date"
              rowSub="reason"
              onEdit={(item) => { setEditingDateId(item.id); setDateForm(item); }}
              onDelete={async (item) => { await deleteAdminBlockedDate(item.id); await loadAdmin(); }}
            />
          )}

          {activeTab === "settings" && (
            <Panel title="Maintenance Mode">
              <div className="grid gap-4">
                <div className={`rounded-xl p-5 ${settings.maintenanceMode ? "bg-[#fff2e9] text-[#e61951]" : "bg-[#f7f7f7] text-[#1f2221]"}`}>
                  <p className="text-sm font-black uppercase tracking-[0.12em]">{settings.maintenanceMode ? "Active" : "Inactive"}</p>
                  <h3 className="mt-2 text-2xl font-black">Customer storefront maintenance</h3>
                  <p className="mt-2 text-sm font-bold leading-6">{settings.maintenanceMessage}</p>
                </div>
                <Textarea label="Maintenance Message" value={settings.maintenanceMessage} onChange={(value) => setSettings({ ...settings, maintenanceMessage: value })} />
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={toggleMaintenance} className={settings.maintenanceMode ? "bk-btn h-11 px-5 text-sm" : "bk-outline-btn h-11 px-5 text-sm"}>
                    <AlertTriangle size={16} />
                    {settings.maintenanceMode ? "Disable Maintenance" : "Enable Maintenance"}
                  </button>
                  <button type="button" onClick={async () => { setSettings(await updateAdminSettings(settings)); toast.success("Settings saved"); }} className="bk-outline-btn h-11 px-5 text-sm">
                    <Save size={16} />
                    Save Message
                  </button>
                </div>
              </div>
            </Panel>
          )}
        </main>
      </div>
    </div>
  );
}

function normalizeProductForm(form) {
  return {
    ...form,
    price: Number(form.price || form.discountPrice || 0),
    discountPrice: Number(form.discountPrice || form.price || 0),
    stock: Number(form.stock || 0),
    images: [{ url: form.image, alt: form.name }],
  };
}

function Panel({ title, children }) {
  return (
    <section className="rounded-xl border border-[#ebebeb] bg-white p-5 shadow-sm shadow-black/5">
      <h2 className="mb-4 text-xl font-black text-[#1f2221]">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[#ebebeb] bg-white p-5 shadow-sm">
      <Icon className="text-[#e61951]" size={24} />
      <p className="mt-5 text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-bold text-[#6f7573]">{label}</p>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, required = false, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-black text-[#1f2221]">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="bk-input h-11 px-3 text-sm"
      />
    </label>
  );
}

function Textarea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#1f2221]">{label}</span>
      <textarea value={value || ""} onChange={(event) => onChange(event.target.value)} rows={4} className="bk-input resize-none px-3 py-3 text-sm" />
    </label>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-[#ebebeb] px-3 py-2 text-sm font-black text-[#5f6663]">
      {label}
      <input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#e61951]" />
    </label>
  );
}

function IconButton({ label, icon: Icon, onClick, danger = false }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`grid h-10 w-10 place-items-center rounded-lg border ${danger ? "border-red-100 text-red-500 hover:bg-red-50" : "border-[#ebebeb] text-[#1f2221] hover:bg-[#fff2e9] hover:text-[#e61951]"}`}
    >
      <Icon size={16} />
    </button>
  );
}

function Rows({ data, columns }) {
  if (!data.length) {
    return <p className="rounded-lg bg-[#f7f7f7] p-4 text-sm font-bold text-[#6f7573]">No data yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#ebebeb] text-xs font-black uppercase text-[#6f7573]">
            {columns.map((column) => <th key={column} className="py-3 pr-4">{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.id || row.orderId || index} className="border-b border-[#f1f1f1]">
              {columns.map((column) => <td key={column} className="py-3 pr-4 font-bold text-[#1f2221]">{String(row[column] ?? "-")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CrudPanel({ title, onSubmit, form, setForm, fields, checkboxLabel, rows, rowMain, rowSub, onEdit, onDelete }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <Panel title={title}>
        <form onSubmit={onSubmit} className="grid gap-4">
          {fields.map((field) => (
            <Field
              key={field}
              label={field.replace(/([A-Z])/g, " $1")}
              type={field === "date" ? "date" : field.toLowerCase().includes("fee") || field === "sortOrder" ? "number" : "text"}
              value={form[field]}
              onChange={(value) => setForm({ ...form, [field]: value })}
              required={field === "name" || field === "pincode" || field === "date"}
            />
          ))}
          <Check label={checkboxLabel} checked={form.isActive} onChange={(checked) => setForm({ ...form, isActive: checked })} />
          <button className="bk-btn h-11 text-sm"><Plus size={16} /> Save</button>
        </form>
      </Panel>
      <Panel title="Records">
        <div className="grid gap-3">
          {rows.map((item) => (
            <div key={item.id || item[rowMain]} className="flex flex-col justify-between gap-3 rounded-lg border border-[#ebebeb] p-4 md:flex-row md:items-center">
              <div>
                <h3 className="font-black">{item[rowMain]}</h3>
                <p className="text-sm font-bold text-[#6f7573]">{item[rowSub] || "No details"} | {item.isActive ? "Active" : "Inactive"}</p>
              </div>
              <div className="flex gap-2">
                <IconButton label="Edit" icon={Edit3} onClick={() => onEdit(item)} />
                <IconButton label="Delete" icon={Trash2} danger onClick={() => onDelete(item)} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export {
  Admin as default
};
