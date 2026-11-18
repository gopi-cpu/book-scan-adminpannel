import { CatalogItem } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  age?: string;
  gender?: "male" | "female" | "other";
  isAdmin?: boolean;
  role?: "customer" | "admin" | "center_staff";
  centerId?: number;
}

export interface BookingItem {
  slug?: string;
  name: string;
  type: string;
  price: number;
  qty: number;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(body?.error || "Something went wrong. Try again.", res.status);
  }
  return body as T;
}

// ---------- Auth ----------

export function apiLogin(payload: { phone: string; password: string }): Promise<{ token: string; user: AuthUser }> {
  return request("/api/auth/login", { method: "POST", body: JSON.stringify(payload) });
}

export function apiMe(token: string): Promise<AuthUser> {
  return request("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
}

// ---------- Admin: diagnostic centers ----------

export interface DiagnosticCenter {
  id: number;
  name: string;
  branch: string;
  city?: string;
  active: boolean;
  staffName?: string;
  staffPhone?: string;
  staffPassword?: string;
}

export function adminFetchCenters(token: string): Promise<DiagnosticCenter[]> {
  return request("/api/admin/centers", { headers: { Authorization: `Bearer ${token}` } });
}

export function adminCreateCenter(token: string, payload: Omit<DiagnosticCenter, "id">): Promise<DiagnosticCenter> {
  return request("/api/admin/centers", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function adminUpdateCenter(
  token: string,
  id: number,
  payload: Omit<DiagnosticCenter, "id">
): Promise<DiagnosticCenter> {
  return request(`/api/admin/centers/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function adminDeleteCenter(token: string, id: number): Promise<void> {
  return request(`/api/admin/centers/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

// ---------- Admin: per-center pricing ----------

export interface CenterPrice {
  catalogItemId: number;
  slug: string;
  type: string;
  name: string;
  group: string;
  defaultPrice: number;
  price: number;
  hasCustomPrice: boolean;
}

export function adminFetchCenterPrices(token: string, centerId: number): Promise<CenterPrice[]> {
  return request(`/api/admin/centers/${centerId}/prices`, { headers: { Authorization: `Bearer ${token}` } });
}

export function adminSetCenterPrice(
  token: string,
  centerId: number,
  catalogItemId: number,
  price: number
): Promise<{ ok: boolean }> {
  return request(`/api/admin/centers/${centerId}/prices/${catalogItemId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ price })
  });
}

export function adminResetCenterPrice(token: string, centerId: number, catalogItemId: number): Promise<void> {
  return request(`/api/admin/centers/${centerId}/prices/${catalogItemId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
}

// ---------- Admin: price-sorted center options for a booking ----------

export interface CenterOption {
  id: number;
  name: string;
  branch: string;
  city?: string;
  totalPrice: number | null;
  hasCustomPricing: boolean;
}

export function adminFetchCenterOptions(token: string, bookingId: string): Promise<CenterOption[]> {
  return request(`/api/admin/bookings/${bookingId}/center-options`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

// ---------- Admin: bookings ----------

export interface AdminBooking {
  id: string;
  patient: { name: string; age: string; gender: string; phone: string };
  modality: string;
  items: BookingItem[];
  date: string;
  slot: string;
  total: number;
  status: "Pending" | "Assigned" | "Upcoming" | "Completed" | "Cancelled";
  priority: "Normal" | "Urgent" | "High";
  sampleStatus: "Not Applicable" | "Pending Collection" | "Collected" | "In Transit" | "Received at Lab" | "Report Ready";
  createdAt: string;
  assignedAt: string | null;
  responseTime: string;
  center: { id: number; name: string; branch: string; city?: string } | null;
}

export interface BookingFilters {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  centerId?: number | string;
  status?: string;
  priority?: string;
  modality?: string;
  sampleStatus?: string;
  testType?: string;
}

export interface BookingsPage {
  bookings: AdminBooking[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function buildQuery(filters: BookingFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function adminFetchBookings(token: string, filters: BookingFilters = {}): Promise<BookingsPage> {
  return request(`/api/admin/bookings${buildQuery(filters)}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function adminExportBookingsCsv(token: string, filters: BookingFilters = {}): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/admin/bookings/export${buildQuery(filters)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new ApiError("Could not export bookings.", res.status);
  return res.blob();
}

export function adminAssignBooking(token: string, id: string, centerId: number): Promise<AdminBooking> {
  return request(`/api/admin/bookings/${id}/assign`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ centerId })
  });
}

export function adminUpdateBookingStatus(
  token: string,
  id: string,
  payload: { status?: string; priority?: string; sampleStatus?: string }
): Promise<AdminBooking> {
  return request(`/api/admin/bookings/${id}/status`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

// ---------- Admin: catalog CRUD ----------

export interface AdminCatalogItem extends CatalogItem {
  id: number;
}

export function adminFetchCatalog(token: string): Promise<AdminCatalogItem[]> {
  return request("/api/admin/catalog", { headers: { Authorization: `Bearer ${token}` } });
}

export function adminCreateCatalogItem(token: string, payload: Partial<CatalogItem>): Promise<AdminCatalogItem> {
  return request("/api/admin/catalog", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function adminUpdateCatalogItem(
  token: string,
  id: number,
  payload: Partial<CatalogItem>
): Promise<AdminCatalogItem> {
  return request(`/api/admin/catalog/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function adminDeleteCatalogItem(token: string, id: number): Promise<void> {
  return request(`/api/admin/catalog/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

// ---------- Admin: body parts CRUD ----------

export interface AdminBodyPart {
  id: number;
  name: string;
  icon: string;
  colorClass: string;
  order: number;
}

export function adminFetchBodyParts(token: string): Promise<AdminBodyPart[]> {
  return request("/api/admin/body-parts", { headers: { Authorization: `Bearer ${token}` } });
}

export function adminCreateBodyPart(
  token: string,
  payload: { name: string; icon: string; colorClass: string; order?: number }
): Promise<AdminBodyPart> {
  return request("/api/admin/body-parts", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function adminUpdateBodyPart(
  token: string,
  id: number,
  payload: { name: string; icon: string; colorClass: string; order?: number }
): Promise<AdminBodyPart> {
  return request(`/api/admin/body-parts/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function adminDeleteBodyPart(token: string, id: number): Promise<void> {
  return request(`/api/admin/body-parts/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

// ---------- Admin: concerns CRUD ----------

export interface AdminConcern {
  id: number;
  name: string;
  icon: string;
  colorClass: string;
  keywords: string[];
  order: number;
}

export function adminFetchConcerns(token: string): Promise<AdminConcern[]> {
  return request("/api/admin/concerns", { headers: { Authorization: `Bearer ${token}` } });
}

export function adminCreateConcern(
  token: string,
  payload: { name: string; icon: string; colorClass: string; keywords: string[]; order?: number }
): Promise<AdminConcern> {
  return request("/api/admin/concerns", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function adminUpdateConcern(
  token: string,
  id: number,
  payload: { name: string; icon: string; colorClass: string; keywords: string[]; order?: number }
): Promise<AdminConcern> {
  return request(`/api/admin/concerns/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function adminDeleteConcern(token: string, id: number): Promise<void> {
  return request(`/api/admin/concerns/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

// ---------- Admin: hero slides CRUD ----------

export interface AdminHeroSlide {
  id: number;
  slug: string;
  illustration: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  bg: string;
  accent: string;
  imageUrl?: string;
  badge1?: string;
  badge2?: string;
  stats?: { value: string; label: string }[];
  order: number;
  active: boolean;
}

export function adminFetchHeroSlides(token: string): Promise<AdminHeroSlide[]> {
  return request("/api/admin/hero-slides", { headers: { Authorization: `Bearer ${token}` } });
}

export function adminCreateHeroSlide(token: string, payload: Partial<AdminHeroSlide>): Promise<AdminHeroSlide> {
  return request("/api/admin/hero-slides", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function adminUpdateHeroSlide(
  token: string,
  id: number,
  payload: Partial<AdminHeroSlide>
): Promise<AdminHeroSlide> {
  return request(`/api/admin/hero-slides/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function adminDeleteHeroSlide(token: string, id: number): Promise<void> {
  return request(`/api/admin/hero-slides/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

// ---------- Admin: dashboard ----------

export interface DashboardStats {
  total: number;
  pending: number;
  assigned: number;
  completed: number;
  cancelled: number;
  revenue: number;
  today: number;
  byCenter: { id: number; name: string; branch: string; bookings: number }[];
}

export function adminFetchDashboard(token: string): Promise<DashboardStats> {
  return request("/api/admin/dashboard", { headers: { Authorization: `Bearer ${token}` } });
}

// ---------- Admin: leads ----------

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  modality?: "scan" | "pathology" | "package";
  source: string;
  status: "New" | "Contacted" | "Converted" | "Closed";
  createdAt: string;
}

export function adminFetchLeads(token: string): Promise<Lead[]> {
  return request("/api/admin/leads", { headers: { Authorization: `Bearer ${token}` } });
}

export function adminUpdateLeadStatus(token: string, id: string, status: string): Promise<Lead> {
  return request(`/api/admin/leads/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status })
  });
}

// ---------- Admin: telecaller booking creation ----------

export function adminCreateBookingForCustomer(
  token: string,
  payload: {
    name: string;
    phone: string;
    age?: string;
    gender?: string;
    items: BookingItem[];
    date: string;
    slot: string;
    total: number;
    leadId?: string;
  }
): Promise<AdminBooking> {
  return request("/api/admin/bookings", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

// ---------- Admin: tracker ----------

export interface TrackerCenter {
  id: number | null;
  name: string;
  branch: string;
  total: number;
  byDay: Record<string, number>;
}

export interface TrackerReport {
  year: number;
  month: number;
  daysInMonth: number;
  centers: TrackerCenter[];
}

export function adminFetchTracker(token: string, year: number, month: number): Promise<TrackerReport> {
  return request(`/api/admin/tracker?year=${year}&month=${month}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

// ---------- Admin: support inbox ----------

export interface SupportThreadSummary {
  id: string;
  status: "Open" | "Closed";
  user: { id: string; name: string; phone: string };
  lastMessage?: string;
  lastSender?: "user" | "admin";
  messageCount: number;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  senderType: "user" | "admin";
  message: string;
  createdAt: string;
}

export interface SupportThreadDetail {
  id: string;
  status: "Open" | "Closed";
  user: { name: string; phone: string };
  messages: SupportMessage[];
}

export function adminListThreads(token: string): Promise<SupportThreadSummary[]> {
  return request("/api/admin/support/threads", { headers: { Authorization: `Bearer ${token}` } });
}

export function adminGetThread(token: string, id: string): Promise<SupportThreadDetail> {
  return request(`/api/admin/support/threads/${id}`, { headers: { Authorization: `Bearer ${token}` } });
}

export function adminReplyToThread(token: string, id: string, message: string): Promise<{ ok: boolean }> {
  return request(`/api/admin/support/threads/${id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message })
  });
}

export function adminUpdateThreadStatus(token: string, id: string, status: "Open" | "Closed"): Promise<{ id: string; status: string }> {
  return request(`/api/admin/support/threads/${id}/status`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status })
  });
}

export { ApiError };

// ---------- Admin: users CRUD ----------

export interface ManagedUser {
  id: string;
  name: string;
  phone: string;
  age?: string;
  gender?: string;
  isAdmin: boolean;
  role: "customer" | "admin" | "center_staff";
  centerId?: number;
  createdAt: string;
}

export function adminFetchUsers(token: string, search?: string): Promise<ManagedUser[]> {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return request(`/api/admin/users${q}`, { headers: { Authorization: `Bearer ${token}` } });
}

export function adminUpdateUser(
  token: string,
  id: string,
  payload: { name: string; phone: string; age?: string; gender?: string }
): Promise<ManagedUser> {
  return request(`/api/admin/users/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function adminSetUserAdmin(token: string, id: string, isAdmin: boolean): Promise<ManagedUser> {
  return request(`/api/admin/users/${id}/admin`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ isAdmin })
  });
}

export function adminDeleteUser(token: string, id: string): Promise<void> {
  return request(`/api/admin/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

// ---------- Admin: notifications ----------

export interface Notification {
  id: string;
  type: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export function adminFetchNotifications(token: string): Promise<{ notifications: Notification[]; unread: number }> {
  return request("/api/admin/notifications", { headers: { Authorization: `Bearer ${token}` } });
}

export function adminMarkNotificationRead(token: string, id: string): Promise<{ ok: boolean }> {
  return request(`/api/admin/notifications/${id}/read`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function adminMarkAllNotificationsRead(token: string): Promise<{ ok: boolean }> {
  return request("/api/admin/notifications/read-all", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
}

// ---------- Admin: Modalities / Categories ----------

export interface AdminModality {
  id: number;
  key: string;
  name: string;
  description?: string;
  icon: string;
  colorClass: string;
  active: boolean;
  sortOrder: number;
}

export function adminFetchModalities(token: string): Promise<AdminModality[]> {
  return request("/api/admin/modalities", { headers: { Authorization: `Bearer ${token}` } });
}

export function adminCreateModality(token: string, payload: Partial<AdminModality>): Promise<AdminModality> {
  return request("/api/admin/modalities", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function adminUpdateModality(token: string, id: number, payload: Partial<AdminModality>): Promise<AdminModality> {
  return request(`/api/admin/modalities/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function adminDeleteModality(token: string, id: number): Promise<void> {
  return request(`/api/admin/modalities/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

// ---------- Admin: Scan Types ----------

export interface AdminScanType {
  id: string;
  slug: string;
  label: string;
  tint: string;
  blurb: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export function adminFetchScanTypes(token: string): Promise<AdminScanType[]> {
  return request("/api/admin/scan-types", { headers: { Authorization: `Bearer ${token}` } });
}

export function adminCreateScanType(token: string, payload: Partial<AdminScanType>): Promise<AdminScanType> {
  return request("/api/admin/scan-types", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function adminUpdateScanType(token: string, id: string, payload: Partial<AdminScanType>): Promise<AdminScanType> {
  return request(`/api/admin/scan-types/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function adminDeleteScanType(token: string, id: string): Promise<void> {
  return request(`/api/admin/scan-types/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

// ---------- Admin: Payments ----------

export interface AdminPayment {
  id: string | number;
  bookingId?: string;
  orderId?: string;
  paymentId?: string;
  userName?: string;
  userPhone?: string;
  amount: number;
  currency: string;
  method?: string;
  status: string;
  createdAt: string;
}

export function adminFetchPayments(token: string): Promise<AdminPayment[]> {
  return request("/api/admin/payments", { headers: { Authorization: `Bearer ${token}` } });
}


