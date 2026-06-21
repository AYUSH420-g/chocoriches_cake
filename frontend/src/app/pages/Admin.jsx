import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CalendarOff,
  ChevronDown,
  ChevronUp,
  Edit3,
  Layers,
  Lock,
  MapPin,
  Package,
  Plus,
  Power,
  RefreshCw,
  Save,
  ShieldCheck,
  ShoppingBag,
  Tags,
  Trash2,
  Upload,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
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
  getAdminProductsPaginated,
  getAdminSettings,
  getAdminSummary,
  getAdminUsers,
  updateAdminBlockedDate,
  updateAdminCategory,
  updateAdminOrder,
  updateAdminPincode,
  updateAdminProduct,
  updateAdminSettings,
  getAdminSubcategories,
  createAdminSubcategory,
  updateAdminSubcategory,
  deleteAdminSubcategory,
  uploadImage
} from "../api/client";
import { formatPrice } from "../utils/format";
import { isUserLoggedIn } from "../utils/session";
import { Link } from "react-router";

const tabs = [
  ["overview", "Overview", ShieldCheck],
  ["products", "Products", Package],
  ["categories", "Categories", Tags],
  ["subcategories", "Subcategories", Layers],
  ["users", "Users", Users],
  ["orders", "Orders", ShoppingBag],
  ["pincodes", "Pincodes", MapPin],
  ["dates", "Blocked Dates", CalendarOff],
  ["settings", "Settings", AlertTriangle]
];

const weightChoices = ["200 ml", "250 gm", "300 gm", "Half Kg", "1 Kg", "1.5 Kg", "2 Kg", "3 Kg", "4 Kg", "5 Kg"];

const emptyProduct = {
  name: "",
  price: "",
  discountPrice: "",
  discountPercent: "0",
  image: "",
  category: "",
  categories: [],
  subcategories: [],
  stock: "",
  weights: [{ label: "Half Kg", price: "" }],
  defaultWeight: "Half Kg",
  description: "",
  isActive: true,
  isFeatured: false,
  isBestSeller: false,
  isTrending: false,
  customizable: false,
  sameDayDelivery: false,
  tags: "",
};

const emptyCategory = { name: "", isActive: true };
const emptySubcategory = { name: "", category: "", isActive: true, sortOrder: 0 };
const emptyPincode = { pincode: "", city: "", state: "", deliveryFee: 0, isActive: true };
const emptyDate = { date: "", reason: "", isActive: true };

function normalizePincode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem("chocoriches_admin_token") || "");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [isFetchingTab, setIsFetchingTab] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [pincodes, setPincodes] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [settings, setSettings] = useState({ maintenanceMode: false, maintenanceMessage: "", dailyCakeLimit: 0 });
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState("");
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [subcategoryForm, setSubcategoryForm] = useState(emptySubcategory);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState("");
  const [pincodeForm, setPincodeForm] = useState(emptyPincode);
  const [editingPincodeId, setEditingPincodeId] = useState("");
  const [dateForm, setDateForm] = useState(emptyDate);
  const [editingDateId, setEditingDateId] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [productsPage, setProductsPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);
  const sentinelRef = useRef(null);

  const handleStatusChange = async (order, targetStatus) => {
    const statuses = ["Processing", "Packed", "Out For Delivery", "Delivered"];
    const currentIndex = statuses.indexOf(order.status || "Processing");
    const targetIndex = statuses.indexOf(targetStatus);

    if (targetIndex !== currentIndex + 1) {
      toast.error(`You can only change the status to ${statuses[currentIndex + 1]}`);
      return;
    }

    if (window.confirm(`Are you sure you want to mark this order as ${targetStatus}?`)) {
      await updateAdminOrder(order.id, { status: targetStatus });
      await loadAdmin();
    }
  };

  const activeTabMeta = useMemo(() => tabs.find(([key]) => key === activeTab), [activeTab]);
  const selectedCategories = productForm.categories?.length ? productForm.categories : [productForm.category].filter(Boolean);
  const [productCategoryFilter, setProductCategoryFilter] = useState("All Categories");

  const categoryOptions = useMemo(() => {
    const names = categories
      .filter((category) => category.isActive !== false)
      .map((category) => category.name)
      .filter(Boolean);

    return [...new Set([...names, ...selectedCategories, emptyProduct.category].filter(Boolean))];
  }, [categories, selectedCategories]);

  const subcategoryOptions = useMemo(() => {
    const names = subcategories
      .filter((sub) => sub.isActive !== false && selectedCategories.includes(sub.category?.name || sub.category))
      .map((sub) => sub.name)
      .filter(Boolean);
    return [...new Set(names)];
  }, [subcategories, selectedCategories]);

  const groupedSubcategories = useMemo(() => {
    const groups = [];
    selectedCategories.forEach((catName) => {
      const subs = subcategories
        .filter((sub) => sub.isActive !== false && (sub.category?.name || sub.category) === catName)
        .map((sub) => sub.name)
        .filter(Boolean);
      if (subs.length > 0) {
        groups.push({ category: catName, subcategories: subs });
      }
    });
    return groups;
  }, [subcategories, selectedCategories]);


  const toggleProductCategory = (categoryName) => {
    setProductForm((current) => {
      const currentCategories = current.categories?.length ? current.categories : [current.category].filter(Boolean);
      const exists = currentCategories.includes(categoryName);
      const nextCategories = exists
        ? currentCategories.filter((category) => category !== categoryName)
        : [...currentCategories, categoryName];
      const safeCategories = nextCategories.length ? nextCategories : [categoryName];
      return {
        ...current,
        categories: safeCategories,
        category: safeCategories[0] || "",
      };
    });
  };

  const updateProductWeight = (label, price) => {
    setProductForm((current) => ({
      ...current,
      weights: current.weights.map((weight) => (weight.label === label ? { ...weight, price } : weight)),
    }));
  };

  const toggleProductWeight = (label) => {
    setProductForm((current) => {
      const hasWeight = current.weights.some((weight) => weight.label === label);
      const nextWeights = hasWeight
        ? current.weights.filter((weight) => weight.label !== label)
        : [...current.weights, { label, price: "" }];
      const safeWeights = nextWeights.length ? nextWeights : [{ label, price: "" }];
      return {
        ...current,
        weights: safeWeights,
        defaultWeight: safeWeights.some((weight) => weight.label === current.defaultWeight)
          ? current.defaultWeight
          : safeWeights[0].label,
      };
    });
  };

  const setDefaultWeight = (label) => {
    setProductForm((current) => ({ ...current, defaultWeight: label }));
  };

  const handleImageFile = async (file) => {
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const loadingToast = toast.loading("Uploading image...");
    try {
      const response = await uploadImage(file);
      if (response.success && response.url) {
        setProductForm((current) => ({ ...current, image: response.url }));
        toast.success("Image uploaded successfully", { id: loadingToast });
      } else {
        toast.error(response.message || "Upload failed", { id: loadingToast });
      }
    } catch (error) {
      toast.error(error.message || "Error uploading image", { id: loadingToast });
    }
  };

  const loadAdmin = async () => {
    if (!localStorage.getItem("chocoriches_admin_token")) {
      return;
    }

    setLoading(true);
    try {
      const [nextSummary, nextSettings] = await Promise.all([
        getAdminSummary(),
        getAdminSettings()
      ]);

      setSummary(nextSummary);
      setSettings(nextSettings);
    } catch {
      toast.error("Admin session expired. Please login again.");
      localStorage.removeItem("chocoriches_admin_token");
      setToken("");
    } finally {
      setLoading(false);
      setRefreshKey((k) => k + 1);
    }
  };

  const loadMoreProducts = useCallback(async (page, overrideCategory) => {
    try {
      const cat = overrideCategory !== undefined ? overrideCategory : productCategoryFilter;
      const res = await getAdminProductsPaginated(page, 8, cat);
      setProducts((prev) => page === 1 ? res.products : [...prev, ...res.products]);
      setProductsPage(res.currentPage);
      setHasMoreProducts(res.hasMore);
      setTotalProducts(res.totalProducts);
    } catch {
      // Ignore
    }
  }, [productCategoryFilter]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || activeTab !== "products") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreProducts && !isLoadingMoreProducts && !isFetchingTab) {
          setIsLoadingMoreProducts(true);
          loadMoreProducts(productsPage + 1).finally(() => setIsLoadingMoreProducts(false));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreProducts, isLoadingMoreProducts, isFetchingTab, productsPage, loadMoreProducts, activeTab]);

  useEffect(() => {
    if (token) {
      loadAdmin();
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === "products" && !isFetchingTab) {
      setIsLoadingMoreProducts(true);
      loadMoreProducts(1, productCategoryFilter).finally(() => setIsLoadingMoreProducts(false));
    }
  }, [productCategoryFilter]);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    
    const fetchTab = async () => {
      setIsFetchingTab(true);
      try {
        if (activeTab === "products") {
          const [nextProductsRes, nextCats, nextSubcats] = await Promise.all([
            getAdminProductsPaginated(1, 8, productCategoryFilter), getAdminCategories(), getAdminSubcategories()
          ]);
          if (mounted) { 
            setProducts(nextProductsRes.products || []); 
            setProductsPage(nextProductsRes.currentPage || 1);
            setHasMoreProducts(nextProductsRes.hasMore || false);
            setTotalProducts(nextProductsRes.totalProducts || (nextProductsRes.products || []).length);
            setCategories(nextCats); 
            setSubcategories(nextSubcats); 
          }
        } else if (activeTab === "categories") {
          const nextCats = await getAdminCategories();
          if (mounted) setCategories(nextCats);
        } else if (activeTab === "subcategories") {
          const [nextCats, nextSubcats] = await Promise.all([getAdminCategories(), getAdminSubcategories()]);
          if (mounted) { setCategories(nextCats); setSubcategories(nextSubcats); }
        } else if (activeTab === "users") {
          const nextUsers = await getAdminUsers();
          if (mounted) setUsers(nextUsers);
        } else if (activeTab === "orders") {
          const nextOrders = await getAdminOrders();
          if (mounted) setOrders(nextOrders);
        } else if (activeTab === "pincodes") {
          const nextPincodes = await getAdminPincodes();
          if (mounted) setPincodes(nextPincodes);
        } else if (activeTab === "dates") {
          const nextDates = await getAdminBlockedDates();
          if (mounted) setBlockedDates(nextDates);
        } else if (activeTab === "overview") {
          const [nextOrders, nextInquiries] = await Promise.all([getAdminOrders(), getAdminInquiries()]);
          if (mounted) { setOrders(nextOrders); setInquiries(nextInquiries); }
        }
      } catch (err) {
        console.error("Tab fetch error", err);
      } finally {
        if (mounted) setIsFetchingTab(false);
      }
    };
    
    fetchTab();
    return () => { mounted = false; };
  }, [activeTab, token, refreshKey]);

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
    if (productForm.weights.some((weight) => !Number(weight.price || 0))) {
      toast.error("Add a price for every selected weight");
      return;
    }
    const payload = normalizeProductForm(productForm);
    if (!payload.weights.length || payload.weights.some((weight) => !weight.price)) {
      toast.error("Add a price for every selected weight");
      return;
    }
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
      ...product,
      tags: (product.tags || []).join(", "),
      name: product.name || "",
      price: product.originalPrice || product.price || "",
      discountPrice: product.discountPrice || product.price || "",
      discountPercent: product.discountPercent || "",
      image: product.image || product.images?.[0]?.url || "",
      category: product.category || "Cakes",
      categories: product.categories?.length ? product.categories : [product.category || "Cakes"],
      subcategories: product.subcategories?.length ? product.subcategories : (product.subcategory ? [product.subcategory] : []),
      stock: product.stock || "",
      weights: normalizeFormWeights(product.weights || product.weightOptions || [{ label: product.weight || "Half Kg", price: product.price || "" }]),
      defaultWeight: product.defaultWeight || product.weight || product.weightOptions?.[0]?.label || "Half Kg",
      description: product.description || "",
      isActive: product.isActive !== false,
      isFeatured: product.isFeatured,
      isBestSeller: product.isBestSeller,
      isTrending: product.isTrending,
      customizable: product.customizable,
      sameDayDelivery: Boolean(product.sameDayDelivery),
    });
    setActiveTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    if (editingCategoryId) {
      await updateAdminCategory(editingCategoryId, categoryForm);
      toast.success("Category updated");
    } else {
      await createAdminCategory({ ...categoryForm, sortOrder: categories.length });
      toast.success("Category added");
    }
    setCategoryForm(emptyCategory);
    setEditingCategoryId("");
    await loadAdmin();
  };

  const moveCategoryOrder = async (index, direction) => {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= categories.length) return;
    const current = categories[index];
    const neighbor = categories[swapIndex];
    const currentOrder = current.sortOrder ?? index;
    const neighborOrder = neighbor.sortOrder ?? swapIndex;
    try {
      await Promise.all([
        updateAdminCategory(current.id, { ...current, sortOrder: neighborOrder }),
        updateAdminCategory(neighbor.id, { ...neighbor, sortOrder: currentOrder }),
      ]);
      const nextCategories = [...categories];
      nextCategories[index] = { ...current, sortOrder: neighborOrder };
      nextCategories[swapIndex] = { ...neighbor, sortOrder: currentOrder };
      nextCategories.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      setCategories(nextCategories);
      toast.success("Category order updated");
    } catch {
      toast.error("Failed to update order");
    }
  };

  const saveSubcategory = async (event) => {
    event.preventDefault();
    if (editingSubcategoryId) {
      await updateAdminSubcategory(editingSubcategoryId, subcategoryForm);
      toast.success("Subcategory updated");
    } else {
      await createAdminSubcategory({ ...subcategoryForm, sortOrder: subcategories.length });
      toast.success("Subcategory added");
    }
    setSubcategoryForm(emptySubcategory);
    setEditingSubcategoryId("");
    await loadAdmin();
  };

  const moveSubcategoryOrder = async (index, direction) => {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= subcategories.length) return;
    const current = subcategories[index];
    const neighbor = subcategories[swapIndex];
    const currentOrder = current.sortOrder ?? index;
    const neighborOrder = neighbor.sortOrder ?? swapIndex;
    try {
      await Promise.all([
        updateAdminSubcategory(current.id, { ...current, sortOrder: neighborOrder }),
        updateAdminSubcategory(neighbor.id, { ...neighbor, sortOrder: currentOrder }),
      ]);
      const next = [...subcategories];
      next[index] = { ...current, sortOrder: neighborOrder };
      next[swapIndex] = { ...neighbor, sortOrder: currentOrder };
      next.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      setSubcategories(next);
      toast.success("Subcategory order updated");
    } catch {
      toast.error("Failed to update order");
    }
  };

  const moveProductOrder = async (index, direction) => {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= products.length) return;
    const current = products[index];
    const neighbor = products[swapIndex];
    const currentOrder = current.sortOrder ?? index;
    const neighborOrder = neighbor.sortOrder ?? swapIndex;
    try {
      await Promise.all([
        updateAdminProduct(current.id, { ...current, sortOrder: neighborOrder }),
        updateAdminProduct(neighbor.id, { ...neighbor, sortOrder: currentOrder }),
      ]);
      const next = [...products];
      next[index] = { ...current, sortOrder: neighborOrder };
      next[swapIndex] = { ...neighbor, sortOrder: currentOrder };
      next.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      setProducts(next);
      toast.success("Product order updated");
    } catch {
      toast.error("Failed to update product order");
    }
  };

  const savePincode = async (event) => {
    event.preventDefault();
    const payload = { ...pincodeForm, pincode: normalizePincode(pincodeForm.pincode) };
    if (payload.pincode.length !== 6) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }
    if (editingPincodeId) {
      await updateAdminPincode(editingPincodeId, payload);
      toast.success("Pincode updated");
    } else {
      await createAdminPincode(payload);
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
    if (isUserLoggedIn()) {
      return (
        <div className="bk-page grid min-h-[420px] place-items-center py-6 text-center">
          <div>
            <h1 className="text-3xl font-black text-[#1f2221]">404</h1>
            <p className="mt-2 text-sm font-bold text-[#6f7573]">Page not found</p>
            <Link to="/" className="bk-btn mt-5 h-11 px-5 text-sm">Return Home</Link>
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f7f7] px-4 py-6">
        <Toaster position="top-center" />
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
      <Toaster position="top-center" />
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
              <h2 className="flex items-center gap-3 text-xl font-black sm:text-2xl">
                {activeTabMeta?.[1]}
                {isFetchingTab && <RefreshCw size={20} className="animate-spin text-[#e61951]" />}
              </h2>
            </div>
            {loading && <p className="text-sm font-black text-[#e61951]">Loading...</p>}
          </div>

          {isFetchingTab ? (
            <div className="grid h-64 place-items-center rounded-xl border border-[#ebebeb] bg-white text-[#6f7573]">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw size={28} className="animate-spin text-[#e61951]" />
                <p className="text-sm font-bold">Loading {activeTabMeta?.[1]}...</p>
              </div>
            </div>
          ) : (
            <>

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
              <div className="xl:sticky xl:top-4 self-start max-h-[calc(100vh-140px)] overflow-y-auto rounded-xl border border-[#ebebeb] bg-white shadow-sm shadow-black/5 scrollbar-hide">
                <div className="sticky top-0 z-10 bg-white px-5 pt-5 pb-3 border-b border-[#f1f1f1]">
                  <h2 className="text-xl font-black text-[#1f2221]">{editingProductId ? "Edit Product" : "Add Product"}</h2>
                </div>
                <div className="p-5 pt-4">
                  <form onSubmit={saveProduct} className="grid gap-4">
                    <Field label="Name" value={productForm.name} onChange={(value) => setProductForm({ ...productForm, name: value })} required />
                    <ImageField value={productForm.image} onUrlChange={(value) => setProductForm({ ...productForm, image: value })} onFileChange={handleImageFile} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <MultiSelectField label="Categories" values={selectedCategories} options={categoryOptions} onToggle={toggleProductCategory} />
                      <Field label="Stock" type="number" value={productForm.stock} onChange={(value) => setProductForm({ ...productForm, stock: value })} />
                    </div>
                    <Field label="Discount Percent" type="number" value={productForm.discountPercent} onChange={(value) => setProductForm({ ...productForm, discountPercent: value })} />
                    <GroupedSubcategoryField
                      label="Subcategories"
                      values={productForm.subcategories}
                      groups={groupedSubcategories}
                      onToggle={(category, subName) => {
                        setProductForm((current) => {
                          const currentSubs = current.subcategories || [];
                          const specificName = category ? `${category}::${subName}` : subName;
                          const legacyName = subName;
                          
                          const hasSpecific = currentSubs.includes(specificName);
                          const hasLegacy = currentSubs.includes(legacyName);
                          
                          const exists = hasSpecific || hasLegacy;
                          
                          let nextSubs = [...currentSubs];
                          if (exists) {
                            nextSubs = nextSubs.filter((sub) => sub !== specificName && sub !== legacyName);
                          } else {
                            nextSubs.push(specificName);
                          }
                          
                          return {
                            ...current,
                            subcategories: nextSubs,
                          };
                        });
                      }}
                      onClear={() => setProductForm({ ...productForm, subcategories: [] })}
                    />
                    <WeightEditor
                      weights={productForm.weights}
                      defaultWeight={productForm.defaultWeight}
                      onToggle={toggleProductWeight}
                      onPriceChange={updateProductWeight}
                      onDefaultChange={setDefaultWeight}
                    />
                    <Textarea label="Short Description" value={productForm.description} onChange={(value) => setProductForm({ ...productForm, description: value })} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TagsField label="Tags" value={productForm.tags} onChange={(value) => setProductForm({ ...productForm, tags: value })} placeholder="e.g. Vegan, Eggless" />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[
                        ["isActive", "Active"],
                        ["isFeatured", "Featured"],
                        ["isBestSeller", "Bestseller"],
                        ["isTrending", "Trending"],
                        ["customizable", "Customizable"],
                        ["sameDayDelivery", "Same Day Delivery"]
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
                </div>
              </div>
              <div className="max-h-[calc(100vh-140px)] overflow-y-auto rounded-xl border border-[#ebebeb] bg-white shadow-sm shadow-black/5 scrollbar-hide">
                <div className="sticky top-0 z-10 bg-white px-5 pt-5 pb-3 border-b border-[#f1f1f1] flex items-center justify-between">
                  <h2 className="text-xl font-black text-[#1f2221]">Product Catalog</h2>
                  <div className="flex items-center gap-3">
                    <select
                      value={productCategoryFilter}
                      onChange={(e) => setProductCategoryFilter(e.target.value)}
                      className="bk-input h-8 px-2 py-0 text-xs w-[140px]"
                    >
                      <option value="All Categories">All Categories</option>
                      {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <span className="text-sm font-bold text-[#6f7573]">{totalProducts} products</span>
                  </div>
                </div>
                <div className="p-5 pt-4">
                  <div className="grid gap-3">
                    {products.map((product, index) => (
                      <div key={product.id} className="grid gap-3 rounded-lg border border-[#ebebeb] p-3 sm:grid-cols-[auto_72px_1fr_auto] sm:items-center">
                        <div className="flex flex-col gap-1 pr-2 border-r border-[#f1f1f1]">
                          <button
                            type="button"
                            title="Move up"
                            disabled={index === 0}
                            onClick={() => moveProductOrder(index, -1)}
                            className="grid h-7 w-7 place-items-center rounded border border-[#ebebeb] text-[#1f2221] hover:bg-[#fff2e9] hover:text-[#e61951] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#1f2221]"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            title="Move down"
                            disabled={index === products.length - 1}
                            onClick={() => moveProductOrder(index, 1)}
                            className="grid h-7 w-7 place-items-center rounded border border-[#ebebeb] text-[#1f2221] hover:bg-[#fff2e9] hover:text-[#e61951] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#1f2221]"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                        <img src={product.image} alt={product.name} loading="lazy" className="h-20 w-20 rounded-lg object-cover" />
                        <div>
                          <h3 className="font-black">{product.name}</h3>
                          <p className="text-sm font-bold text-[#6f7573]">
                            {(product.categories?.length ? product.categories.join(", ") : product.category)}{(product.subcategories?.length ? product.subcategories : (product.subcategory ? [product.subcategory] : [])).length > 0 ? ` / ${(product.subcategories?.length ? product.subcategories : [product.subcategory]).map(s => s.includes("::") ? s.split("::")[1] : s).join(", ")}` : ""} | {formatPrice(product.price)} | {product.defaultWeight || product.weight} | Stock {product.stock || 0}
                          </p>
                          <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-black ${product.isActive === false ? "bg-red-50 text-red-600" : "bg-[#e8f8ef] text-[#0f8b57]"}`}>
                            {product.isActive === false ? "Disabled" : "Active"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <IconButton
                            label={product.isActive === false ? "Enable" : "Disable"}
                            icon={Power}
                            onClick={async () => {
                              await updateAdminProduct(product.id, { ...product, isActive: product.isActive === false });
                              await loadAdmin();
                            }}
                          />
                          <IconButton label="Edit" icon={Edit3} onClick={() => editProduct(product)} />
                          <IconButton label="Delete" icon={Trash2} danger onClick={async () => { await deleteAdminProduct(product.id); await loadAdmin(); }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {isLoadingMoreProducts && (
                    <div className="flex justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#ebebeb] border-t-[#e61951]" />
                    </div>
                  )}
                  <div ref={sentinelRef} className="h-2" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "categories" && (
            <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
              <Panel title={editingCategoryId ? "Edit Category" : "Add Category"} className="xl:sticky xl:top-4 self-start">
                <form onSubmit={saveCategory} className="grid gap-4">
                  <Field label="Name" value={categoryForm.name} onChange={(value) => setCategoryForm({ ...categoryForm, name: value })} required />
                  <Check label="Active" checked={categoryForm.isActive} onChange={(checked) => setCategoryForm({ ...categoryForm, isActive: checked })} />
                  <button className="bk-btn h-11 text-sm"><Plus size={16} /> Save</button>
                </form>
              </Panel>
              <Panel title="Categories">
                <p className="mb-3 text-xs font-bold text-[#6f7573]">Use the arrows to reorder categories. The order here is reflected across the entire website.</p>
                <div className="grid gap-3">
                  {categories.map((item, index) => (
                    <div key={item.id || item.name} className="flex flex-col justify-between gap-3 rounded-lg border border-[#ebebeb] p-4 md:flex-row md:items-center">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            title="Move up"
                            disabled={index === 0}
                            onClick={() => moveCategoryOrder(index, -1)}
                            className="grid h-7 w-7 place-items-center rounded border border-[#ebebeb] text-[#1f2221] hover:bg-[#fff2e9] hover:text-[#e61951] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#1f2221]"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            title="Move down"
                            disabled={index === categories.length - 1}
                            onClick={() => moveCategoryOrder(index, 1)}
                            className="grid h-7 w-7 place-items-center rounded border border-[#ebebeb] text-[#1f2221] hover:bg-[#fff2e9] hover:text-[#e61951] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#1f2221]"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                        <div>
                          <h3 className="font-black">{item.name}</h3>
                          <p className="text-sm font-bold text-[#6f7573]">{item.slug || "No slug"} | Order: {item.sortOrder ?? index} | {item.isActive ? "Active" : "Inactive"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <IconButton label="Edit" icon={Edit3} onClick={() => { setEditingCategoryId(item.id); setCategoryForm(item); }} />
                        <IconButton label="Delete" icon={Trash2} danger onClick={async () => { await deleteAdminCategory(item.id); await loadAdmin(); }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "subcategories" && (
            <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
              <Panel title={editingSubcategoryId ? "Edit Subcategory" : "Add Subcategory"} className="xl:sticky xl:top-4 self-start">
                <form onSubmit={saveSubcategory} className="grid gap-4">
                  <Field label="Name" value={subcategoryForm.name} onChange={(value) => setSubcategoryForm({ ...subcategoryForm, name: value })} required />
                  <SingleSelectCheckboxField label="Category" value={subcategoryForm.category} options={categories.filter(c => c.isActive !== false).map(c => c.name)} onChange={(value) => setSubcategoryForm({ ...subcategoryForm, category: value })} required />
                  <Check label="Active" checked={subcategoryForm.isActive} onChange={(checked) => setSubcategoryForm({ ...subcategoryForm, isActive: checked })} />
                  <button className="bk-btn h-11 text-sm"><Plus size={16} /> Save</button>
                </form>
              </Panel>
              <Panel title="Subcategories">
                <p className="mb-3 text-xs font-bold text-[#6f7573]">Use the arrows to reorder subcategories. The order here is reflected across the entire website.</p>
                <div className="grid gap-3">
                  {subcategories.map((sub, index) => (
                    <div key={sub.id} className="flex flex-col justify-between gap-3 rounded-lg border border-[#ebebeb] p-4 md:flex-row md:items-center">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            title="Move up"
                            disabled={index === 0}
                            onClick={() => moveSubcategoryOrder(index, -1)}
                            className="grid h-7 w-7 place-items-center rounded border border-[#ebebeb] text-[#1f2221] hover:bg-[#fff2e9] hover:text-[#e61951] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#1f2221]"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            title="Move down"
                            disabled={index === subcategories.length - 1}
                            onClick={() => moveSubcategoryOrder(index, 1)}
                            className="grid h-7 w-7 place-items-center rounded border border-[#ebebeb] text-[#1f2221] hover:bg-[#fff2e9] hover:text-[#e61951] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#1f2221]"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                        <div>
                          <h3 className="font-black">{sub.name}</h3>
                          <p className="text-sm font-bold text-[#6f7573]">Category: {sub.category} | Order: {sub.sortOrder ?? index} | {sub.isActive ? "Active" : "Inactive"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <IconButton label="Edit" icon={Edit3} onClick={() => { setEditingSubcategoryId(sub.id); setSubcategoryForm(sub); }} />
                        <IconButton label="Delete" icon={Trash2} danger onClick={async () => { await deleteAdminSubcategory(sub.id); await loadAdmin(); }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
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
                  <div key={order.id} className="rounded-lg border border-[#ebebeb] bg-white overflow-hidden">
                    <div className="grid gap-4 p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
                      <div>
                        <h3 className="font-black">{order.customerName || order.customerEmail || "Guest User"}</h3>
                        <p className="text-sm font-bold text-[#6f7573]">Status: <span className="text-[#e61951]">{order.status}</span></p>
                      </div>
                      <div className="flex flex-wrap gap-4 items-center">
                        {["Processing", "Packed", "Out For Delivery", "Delivered"].map((status) => {
                          const statuses = ["Processing", "Packed", "Out For Delivery", "Delivered"];
                          const currentIndex = statuses.indexOf(order.status || "Processing");
                          const statusIndex = statuses.indexOf(status);
                          const isChecked = statusIndex <= currentIndex;
                          return (
                            <label key={status} className={`flex items-center gap-2 text-sm font-bold cursor-pointer ${isChecked ? "text-[#0f8b57]" : "text-[#1f2221]"}`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => !isChecked && handleStatusChange(order, status)}
                                disabled={isChecked || statusIndex > currentIndex + 1}
                                className="h-4 w-4 accent-[#e61951] disabled:opacity-50"
                              />
                              {status}
                            </label>
                          );
                        })}
                      </div>
                      <button 
                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                        className="bk-outline-btn h-10 px-4 text-sm whitespace-nowrap"
                      >
                        {expandedOrderId === order.id ? <><ChevronUp size={16}/> Hide</> : <><ChevronDown size={16}/> View Order</>}
                      </button>
                    </div>
                    {expandedOrderId === order.id && (
                      <div className="border-t border-[#ebebeb] bg-[#f7f7f7] p-5 text-sm text-[#1f2221]">
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div>
                            <h4 className="font-black mb-3 text-[#6f7573] uppercase tracking-wider text-xs">Customer Details</h4>
                            <div className="grid gap-2">
                              <p><strong className="font-black">Name:</strong> {order.customerName || "N/A"}</p>
                              <p><strong className="font-black">Email:</strong> {order.customerEmail || "N/A"}</p>
                              <p><strong className="font-black">Phone:</strong> {order.customerPhone || "N/A"}</p>
                              <p><strong className="font-black">Address:</strong> {order.deliveryAddress || "N/A"}</p>
                              <p><strong className="font-black">Delivery Area (Pincode):</strong> {order.deliveryPincode || "N/A"}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-black mb-3 text-[#6f7573] uppercase tracking-wider text-xs">Order Details</h4>
                            <div className="grid gap-2">
                              <p><strong className="font-black">Order ID:</strong> {order.orderId || order.id}</p>
                              <p><strong className="font-black">Placed At:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</p>
                              <p><strong className="font-black">Req. Delivery Date:</strong> {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "N/A"}</p>
                              {order.deliveryTimeSlot && <p><strong className="font-black">Time Slot:</strong> {order.deliveryTimeSlot}</p>}
                              <div>
                                <strong className="font-black">Items:</strong>
                                <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                                  {(order.items || []).map((item, idx) => {
                                    if (typeof item === 'string') return <li key={idx}>{item}</li>;
                                    return (
                                      <li key={idx}>
                                        <span className="font-bold">{item.name || "Item"}</span>
                                        <span className="text-[#6f7573]"> (x{item.quantity || 1})</span>
                                        <span className="text-[#6f7573]"> - Size: {item.size || "Default"}</span>
                                        {(item.baseFlavour || item.creamFlavour) && (
                                          <span className="text-[#6f7573]">
                                            {" - "}
                                            {item.baseFlavour && <span>{item.baseFlavour}</span>}
                                            {item.baseFlavour && item.creamFlavour && <span> • </span>}
                                            {item.creamFlavour && <span>{item.creamFlavour}</span>}
                                          </span>
                                        )}
                                        {item.messageOnCake && (
                                          <span className="ml-1 inline-block rounded bg-[#fff2e9] px-1.5 py-0.5 text-[10px] font-black text-[#e61951]">
                                            Msg: {item.messageOnCake}
                                          </span>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                              <p><strong className="font-black">Total Amount:</strong> {formatPrice(order.total || 0)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
                <Field
                  label="Per Day Cake Limit"
                  type="number"
                  value={settings.dailyCakeLimit || ""}
                  onChange={(value) => setSettings({ ...settings, dailyCakeLimit: Number(value || 0) })}
                />
                <Field
                  label="Global Delivery Fee"
                  type="number"
                  value={settings.deliveryFee ?? ""}
                  onChange={(value) => setSettings({ ...settings, deliveryFee: Number(value || 0) })}
                />
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={toggleMaintenance} className={settings.maintenanceMode ? "bk-btn h-11 px-5 text-sm" : "bk-outline-btn h-11 px-5 text-sm"}>
                    <AlertTriangle size={16} />
                    {settings.maintenanceMode ? "Disable Maintenance" : "Enable Maintenance"}
                  </button>
                  <button type="button" onClick={async () => { setSettings(await updateAdminSettings(settings)); toast.success("Settings saved"); }} className="bk-outline-btn h-11 px-5 text-sm">
                    <Save size={16} />
                    Save Settings
                  </button>
                </div>
              </div>
            </Panel>
          )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function normalizeFormWeights(weights = []) {
  const normalizedWeights = weights
    .map((weight) => ({
      label: weight.label || "",
      price: weight.price === 0 ? "0" : String(weight.price || ""),
    }))
    .filter((weight) => weight.label);

  return normalizedWeights.length ? normalizedWeights : [{ label: "Half Kg", price: "" }];
}

function normalizeProductForm(form) {
  const categories = form.categories?.length ? form.categories : [form.category].filter(Boolean);
  const subcategories = Array.isArray(form.subcategories) ? form.subcategories.filter(Boolean) : (form.subcategory ? [form.subcategory] : []);
  const weights = normalizeFormWeights(form.weights)
    .map((weight) => ({ label: weight.label, price: Number(weight.price || 0) }))
    .filter((weight) => weight.price > 0);
  const safeWeights = weights.length ? weights : [{ label: form.defaultWeight || "Half Kg", price: Number(form.discountPrice || form.price || 0) }];
  const defaultWeight = safeWeights.some((weight) => weight.label === form.defaultWeight)
    ? form.defaultWeight
    : safeWeights[0]?.label || "Half Kg";
  const defaultPrice = safeWeights.find((weight) => weight.label === defaultWeight)?.price || Number(form.discountPrice || form.price || 0);

  return {
    ...form,
    price: Number(defaultPrice || 0),

    discountPercent: Math.max(0, Math.min(95, Number(form.discountPercent || 0))),
    category: categories[0] || "Cakes",
    categories,
    subcategory: subcategories[0] || "",
    subcategories,
    stock: Number(form.stock || 0),
    weights: safeWeights,
    defaultWeight,
    weight: defaultWeight,
    images: [{ url: form.image, alt: form.name }],
    discountPrice: safeWeights.find((w) => w.label === defaultWeight)?.price || safeWeights[0]?.price || Number(form.discountPrice || form.price || 0),
    tags: typeof form.tags === "string" ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : (Array.isArray(form.tags) ? form.tags : []),
  };
}

function Panel({ title, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-[#ebebeb] bg-white p-5 shadow-sm shadow-black/5 ${className}`}>
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

function ImageField({ value, onUrlChange, onFileChange }) {
  return (
    <div className="grid gap-3">
      <label className="block">
        <span className="mb-2 block text-sm font-black text-[#1f2221]">Product Image</span>
        <input
          value={value ?? ""}
          onChange={(event) => onUrlChange(event.target.value)}
          required
          placeholder="Paste image URL or upload below"
          className="bk-input h-11 px-3 text-sm"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-[120px_1fr] sm:items-center">
        <div className="aspect-square overflow-hidden rounded-lg border border-[#ebebeb] bg-[#f7f7f7]">
          {value ? <img src={value} alt="Product preview" className="h-full w-full object-cover" /> : null}
        </div>
        <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#e61951]/40 bg-[#fff2e9] px-4 py-5 text-center text-sm font-bold text-[#e61951]">
          <Upload size={20} />
          <span className="mt-2">Upload Image</span>
          <input type="file" accept="image/*" onChange={(event) => onFileChange(event.target.files?.[0])} className="sr-only" />
        </label>
      </div>
    </div>
  );
}

function WeightEditor({ weights, defaultWeight, onToggle, onPriceChange, onDefaultChange }) {
  const allLabels = Array.from(new Set([...weightChoices, ...weights.map(w => w.label)]));
  
  return (
    <div>
      <span className="mb-2 block text-sm font-black text-[#1f2221]">Weights and Prices</span>
      <div className="grid gap-3">
        {allLabels.map((label) => {
          const weight = weights.find((item) => item.label === label);
          const selected = Boolean(weight);
          return (
            <div key={label} className={`grid gap-3 rounded-lg border p-3 sm:grid-cols-[110px_1fr_auto] sm:items-center ${selected ? "border-[#e61951]/35 bg-[#fff2e9]" : "border-[#ebebeb] bg-white"}`}>
              <Check label={label} checked={selected} onChange={() => onToggle(label)} />
              <input
                type="number"
                min="0"
                value={weight?.price ?? ""}
                onChange={(event) => onPriceChange(label, event.target.value)}
                disabled={!selected}
                placeholder="Price"
                className="bk-input h-10 px-3 text-sm disabled:bg-[#f7f7f7]"
              />
              <label className={`flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold ${selected ? "text-[#1f2221]" : "text-[#9a9f9d]"}`}>
                <input
                  type="radio"
                  name="defaultWeight"
                  checked={defaultWeight === label}
                  disabled={!selected}
                  onChange={() => onDefaultChange(label)}
                  className="h-4 w-4 accent-[#e61951]"
                />
                Default
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, required = false, className = "", maxLength, inputMode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-black text-[#1f2221]">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        maxLength={maxLength}
        inputMode={inputMode}
        className="bk-input h-11 px-3 text-sm"
      />
    </label>
  );
}

function SelectField({ label, value, options, onChange, required = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#1f2221]">{label}</span>
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="bk-input h-11 px-3 text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function MultiSelectField({ label, values, options, onToggle }) {
  return (
    <div>
      <span className="mb-2 block text-sm font-black text-[#1f2221]">{label}</span>
      <div className="max-h-44 overflow-y-auto rounded-lg border border-[#ebebeb] bg-white p-2">
        {options.map((option) => (
          <label key={option} className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm font-bold text-[#5f6663] hover:bg-[#fff2e9]">
            {option}
            <input
              type="checkbox"
              checked={values.includes(option)}
              onChange={() => onToggle(option)}
              className="h-4 w-4 accent-[#e61951]"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function SingleSelectCheckboxField({ label, value, options, onChange, required }) {
  return (
    <div>
      <span className="mb-2 block text-sm font-black text-[#1f2221]">{label} {required && <span className="text-red-500">*</span>}</span>
      <div className="max-h-44 overflow-y-auto rounded-lg border border-[#ebebeb] bg-white p-2">
        {options.map((option) => (
          <label key={option} className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm font-bold text-[#5f6663] hover:bg-[#fff2e9]">
            {option}
            <input
              type="checkbox"
              checked={value === option}
              onChange={() => onChange(value === option ? "" : option)}
              className="h-4 w-4 accent-[#e61951]"
            />
          </label>
        ))}
        {options.length === 0 && <p className="text-xs text-[#6f7573] p-2">No options available</p>}
      </div>
    </div>
  );
}

function GroupedSubcategoryField({ label, values = [], groups, onToggle, onClear }) {
  const allEmpty = groups.length === 0 || groups.every((g) => g.subcategories.length === 0);
  return (
    <div>
      <span className="mb-2 block text-sm font-black text-[#1f2221]">{label}</span>
      {values.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {values.map((sub) => {
            const display = sub.includes("::") ? `${sub.split("::")[0]} > ${sub.split("::")[1]}` : sub;
            return (
              <span
                key={sub}
                className="inline-flex items-center gap-1 rounded-full bg-[#fff2e9] px-2.5 py-1 text-xs font-bold text-[#e61951]"
              >
                {display}
                <button type="button" onClick={() => onToggle(sub.includes("::") ? sub.split("::")[0] : null, sub.includes("::") ? sub.split("::")[1] : sub)} className="ml-0.5 text-[#e61951]/60 hover:text-[#e61951]">&times;</button>
              </span>
            );
          })}
        </div>
      )}
      <div className="max-h-52 overflow-y-auto rounded-lg border border-[#ebebeb] bg-white p-2">
        {allEmpty && <p className="text-xs text-[#6f7573] p-2">Select a category first to see subcategories</p>}
        {groups.map((group) => (
          <div key={group.category}>
            <p className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#e61951]">{group.category}</p>
            {group.subcategories.map((subName) => {
              const specificName = `${group.category}::${subName}`;
              const isSelected = values.includes(specificName) || values.includes(subName);
              return (
                <label
                  key={specificName}
                  className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm font-bold transition ${
                    isSelected
                      ? "bg-[#fff2e9] text-[#e61951]"
                      : "text-[#5f6663] hover:bg-[#fff2e9]"
                  }`}
                >
                  {subName}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(group.category, subName)}
                    className="h-4 w-4 accent-[#e61951]"
                  />
                </label>
              );
            })}
          </div>
        ))}
        {values.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="mt-1 w-full rounded-md px-3 py-1.5 text-xs font-bold text-[#6f7573] hover:bg-[#f7f7f7] hover:text-[#e61951] transition"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

function Textarea({ label, value, onChange, rows = 4 }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#1f2221]">{label}</span>
      <textarea value={value || ""} onChange={(event) => onChange(event.target.value)} rows={rows} className="bk-input resize-none px-3 py-3 text-sm" />
    </label>
  );
}

function TagsField({ label, value, onChange, placeholder = "Separate with commas" }) {
  const displayValue = Array.isArray(value) ? value.join(", ") : value || "";
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#1f2221]">{label}</span>
      <input
        type="text"
        value={displayValue}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="bk-input h-11 px-3 text-sm"
      />
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
      <Panel title={title} className="xl:sticky xl:top-4 self-start">
        <form onSubmit={onSubmit} className="grid gap-4">
          {fields.map((field) => (
            <Field
              key={field}
              label={field.replace(/([A-Z])/g, " $1")}
              type={field === "date" ? "date" : field.toLowerCase().includes("fee") || field === "sortOrder" ? "number" : "text"}
              value={form[field]}
              onChange={(value) => setForm({ ...form, [field]: field === "pincode" ? normalizePincode(value) : value })}
              required={field === "name" || field === "pincode" || field === "date"}
              maxLength={field === "pincode" ? 6 : undefined}
              inputMode={field === "pincode" ? "numeric" : undefined}
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
