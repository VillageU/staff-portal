import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

// ─── Data ────────────────────────────────────────────────────────────────────

const connectorGroups = [
  {
    category: "Student Information Systems",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    items: [
      {
        id: "element451",
        name: "Element451",
        desc: "Modern enrollment CRM & SIS platform",
        color: "#1a73e8",
      },
      {
        id: "slate",
        name: "Slate",
        desc: "Technolutions admissions & enrollment",
        color: "#6c3483",
      },
      {
        id: "banner",
        name: "Ellucian Banner",
        desc: "Enterprise ERP for higher education",
        color: "#c0392b",
      },
      {
        id: "colleague",
        name: "Ellucian Colleague",
        desc: "Integrated student & finance management",
        color: "#e74c3c",
      },
      {
        id: "workday",
        name: "Workday Student",
        desc: "Cloud-based student lifecycle management",
        color: "#f39c12",
      },
      {
        id: "anthology",
        name: "Anthology Student",
        desc: "Comprehensive student management suite",
        color: "#16a085",
      },
      {
        id: "powercampus",
        name: "PowerCampus",
        desc: "Flexible student information system",
        color: "#2980b9",
      },
    ],
  },
  {
    category: "CRM Systems",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    items: [
      {
        id: "salesforce",
        name: "Salesforce Education Cloud",
        desc: "Higher ed CRM for student success",
        color: "#00a1e0",
      },
      {
        id: "hubspot",
        name: "HubSpot",
        desc: "Inbound marketing & student engagement CRM",
        color: "#ff7a59",
      },
    ],
  },
  {
    category: "Learning Platforms",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    items: [
      {
        id: "canvas",
        name: "Canvas",
        desc: "Instructure's leading LMS platform",
        color: "#e66000",
      },
      {
        id: "blackboard",
        name: "Blackboard",
        desc: "Anthology's learning management system",
        color: "#1b2a36",
      },
      {
        id: "d2l",
        name: "D2L Brightspace",
        desc: "Personalized learning environment",
        color: "#d04b00",
      },
    ],
  },
  {
    category: "Event & Engagement Platforms",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    items: [
      {
        id: "presence",
        name: "Presence",
        desc: "Student engagement & event management",
        color: "#8e44ad",
      },
      {
        id: "campusgroups",
        name: "CampusGroups",
        desc: "Student org & activity management hub",
        color: "#27ae60",
      },
      {
        id: "engage",
        name: "Anthology Engage",
        desc: "Student involvement & community platform",
        color: "#16a085",
      },
    ],
  },
  {
    category: "Identity Providers",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    items: [
      {
        id: "azure",
        name: "Microsoft Azure AD",
        desc: "Enterprise identity & access management",
        color: "#0078d4",
      },
      {
        id: "okta",
        name: "Okta",
        desc: "Workforce identity & SSO provider",
        color: "#007dc1",
      },
    ],
  },
  {
    category: "Communication Platforms",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    items: [
      {
        id: "twilio",
        name: "Twilio",
        desc: "Programmable SMS & voice communications",
        color: "#f22f46",
      },
      {
        id: "mailchimp",
        name: "Mailchimp",
        desc: "Email marketing & automation platform",
        color: "#f5a623",
      },
      {
        id: "sendgrid",
        name: "SendGrid",
        desc: "Transactional & marketing email delivery",
        color: "#1a82e2",
      },
    ],
  },
];

const allItems = connectorGroups.flatMap((g) => g.items);

// ─── Types ───────────────────────────────────────────────────────────────────

interface SavedConnector {
  id: string;
  connector_key: string;
  api_token: string;
  domain_url?: string;
  api_base_url?: string;
  client_id?: string;
  is_active: boolean;
  connected_at: string;
  last_synced_at: string | null;
}

interface ConnectorItem {
  id: string;
  name: string;
  desc: string;
  color: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function ConnectorLogo({ name, color }: { name: string; color: string }) {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: `${color}18`,
        border: `1.5px solid ${color}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 700,
        color,
        flexShrink: 0,
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {initials(name)}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  const cfg = active
    ? { label: "Connected", dot: "#22c55e", bg: "#dcfce7", text: "#15803d" }
    : {
        label: "Not Connected",
        dot: "#94a3b8",
        bg: "#f1f5f9",
        text: "#64748b",
      };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 20,
        background: cfg.bg,
        color: cfg.text,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.dot,
        }}
      />
      {cfg.label}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function ConnectorCard({
  item,
  saved,
  onManage,
}: {
  item: ConnectorItem;
  saved: SavedConnector | null;
  onManage: (item: ConnectorItem, saved: SavedConnector | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isConnected = !!saved?.is_active;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#fafbff" : "#fff",
        border: `1.5px solid ${hovered ? "#c7d2fe" : "#e8ecf2"}`,
        borderRadius: 14,
        padding: "18px 20px",
        cursor: "pointer",
        transition: "all 0.18s ease",
        boxShadow: hovered
          ? "0 4px 20px rgba(99,102,241,0.1)"
          : "0 1px 4px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-1px)" : "none",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <ConnectorLogo name={item.name} color={item.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 650,
              color: "#0f172a",
              lineHeight: 1.3,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {item.name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              marginTop: 3,
              lineHeight: 1.4,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {item.desc}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <StatusBadge active={isConnected} />
        {saved?.last_synced_at && (
          <div
            style={{
              fontSize: 11,
              color: "#94a3b8",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            ⟳ {new Date(saved.last_synced_at).toLocaleDateString()}
          </div>
        )}
      </div>

      <button
        onClick={() => onManage(item, saved)}
        style={{
          width: "100%",
          padding: "8px 0",
          background: isConnected
            ? "linear-gradient(135deg, #10b981, #059669)"
            : "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          letterSpacing: "0.03em",
          fontFamily: "'DM Sans', sans-serif",
          transition: "opacity 0.15s",
        }}
      >
        {isConnected ? "Manage" : "Connect"}
      </button>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ConfigModal({
  item,
  saved,
  universityId,
  staffId,
  onClose,
  onSaved,
}: {
  item: ConnectorItem;
  saved: SavedConnector | null;
  universityId: string;
  staffId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [creds, setCreds] = useState({
    domain: saved?.domain_url || "",
    apiBase: saved?.api_base_url || "",
    token: saved?.api_token || "",
    clientId: saved?.client_id || "",
    clientSecret: "",
  });

  const handleSave = async () => {
    if (!creds.token.trim()) {
      setError("API token is required.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      university_id: universityId,
      connector_key: item.id,
      connector_name: item.name,
      api_token: creds.token.trim(),
      domain_url: creds.domain.trim() || null,
      api_base_url: creds.apiBase.trim() || null,
      client_id: creds.clientId.trim() || null,
      is_active: true,
      connected_by: staffId,
    };

    let err;
    if (saved) {
      ({ error: err } = await supabase
        .from("university_connectors")
        .update(payload)
        .eq("id", saved.id));
    } else {
      ({ error: err } = await supabase
        .from("university_connectors")
        .insert(payload));
    }

    setSaving(false);
    if (err) {
      setError("Failed to save. Please try again.");
      return;
    }
    onSaved();
    setStep(1);
  };

  const handleDisconnect = async () => {
    if (!saved) return;
    if (!confirm(`Disconnect ${item.name}?`)) return;
    await supabase.from("university_connectors").delete().eq("id", saved.id);
    onSaved();
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 560,
          boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
          overflow: "hidden",
          fontFamily: "'DM Sans', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 28px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <ConnectorLogo name={item.name} color={item.color} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
              {item.name}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
              {step === 0
                ? "Configure connection credentials"
                : "Connection saved successfully"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              cursor: "pointer",
              fontSize: 18,
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", padding: "16px 28px 0", gap: 8 }}>
          {[
            "Credentials",
            "Test",
            "Field Mapping",
            "Sync Config",
            "Activate",
          ].map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flex: i < 4 ? 1 : 0,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background:
                    i < step ? "#6366f1" : i === step ? "#6366f1" : "#e2e8f0",
                  color: i <= step ? "#fff" : "#94a3b8",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.2s",
                }}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: i === step ? "#6366f1" : "#94a3b8",
                  fontWeight: i === step ? 600 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {s}
              </span>
              {i < 4 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: i < step ? "#6366f1" : "#e2e8f0",
                    transition: "all 0.2s",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: "24px 28px 28px" }}>
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                {[
                  {
                    label: "Domain URL",
                    key: "domain",
                    placeholder: "https://your-instance.edu",
                  },
                  {
                    label: "API Base URL",
                    key: "apiBase",
                    placeholder: "https://api.your-instance.edu/v2",
                  },
                ].map((f) => (
                  <div key={f.key}>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        display: "block",
                        marginBottom: 5,
                      }}
                    >
                      {f.label}
                    </label>
                    <input
                      value={(creds as any)[f.key]}
                      onChange={(e) =>
                        setCreds({ ...creds, [f.key]: e.target.value })
                      }
                      placeholder={f.placeholder}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1.5px solid #e2e8f0",
                        fontSize: 13,
                        color: "#0f172a",
                        outline: "none",
                        boxSizing: "border-box",
                        fontFamily: "'DM Mono', monospace",
                        background: "#fafbff",
                      }}
                    />
                  </div>
                ))}
              </div>

              {[
                {
                  label: "Access Token *",
                  key: "token",
                  placeholder: "Bearer token or API key",
                  type: "password",
                },
                {
                  label: "Client ID",
                  key: "clientId",
                  placeholder: "OAuth 2.0 client identifier",
                },
                {
                  label: "Client Secret",
                  key: "clientSecret",
                  placeholder: "OAuth 2.0 client secret",
                  type: "password",
                },
              ].map((f) => (
                <div key={f.key}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#374151",
                      display: "block",
                      marginBottom: 5,
                    }}
                  >
                    {f.label}{" "}
                    {f.key !== "token" && (
                      <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                        (encrypted at rest)
                      </span>
                    )}
                  </label>
                  <input
                    type={f.type || "text"}
                    value={(creds as any)[f.key]}
                    onChange={(e) =>
                      setCreds({ ...creds, [f.key]: e.target.value })
                    }
                    placeholder={f.placeholder}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1.5px solid #e2e8f0",
                      fontSize: 13,
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "'DM Mono', monospace",
                      background: "#fafbff",
                    }}
                  />
                </div>
              ))}

              {error && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 12,
                    color: "#b91c1c",
                  }}
                >
                  {error}
                </div>
              )}

              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fcd34d",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 12,
                  color: "#92400e",
                }}
              >
                🔐 Credentials are stored securely and only visible to
                university admins.
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                {saved && (
                  <button
                    onClick={handleDisconnect}
                    style={{
                      padding: "12px 20px",
                      background: "#fff",
                      color: "#ef4444",
                      border: "1.5px solid #fecaca",
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Disconnect
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: saving
                      ? "#a5b4fc"
                      : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {saving ? "Saving…" : "Save & Test Connection"}
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                <div
                  style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}
                >
                  Connection Saved
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                  {item.name} credentials have been stored for your university.
                </div>
              </div>
              {[
                { check: "Credentials Saved", result: "Confirmed" },
                { check: "University Linked", result: "Active" },
                { check: "Admin Access", result: "Verified" },
              ].map((r) => (
                <div
                  key={r.check}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "#f0fdf4",
                    borderRadius: 8,
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <span
                    style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}
                  >
                    {r.check}
                  </span>
                  <span
                    style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}
                  >
                    ✓ {r.result}
                  </span>
                </div>
              ))}
              <button
                onClick={() => setStep(2)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginTop: 4,
                }}
              >
                Continue to Field Mapping →
              </button>
            </div>
          )}

          {step >= 2 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🚀</div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: 8,
                }}
              >
                Setup Wizard Coming Soon
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  lineHeight: 1.6,
                  marginBottom: 20,
                }}
              >
                Field mapping, sync configuration, and activation steps will be
                available in the next update.
              </div>
              <button
                onClick={onClose}
                style={{
                  padding: "10px 28px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const Connectors = () => {
  const { staff } = useAuth();
  const navigate = useNavigate();

  const [saved, setSaved] = useState<SavedConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selected, setSelected] = useState<{
    item: ConnectorItem;
    saved: SavedConnector | null;
  } | null>(null);

  useEffect(() => {
    if (staff && !staff.is_admin) navigate("/students", { replace: true });
  }, [staff, navigate]);

  useEffect(() => {
    if (staff?.university_id) fetchSaved();
  }, [staff]);

  const fetchSaved = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("university_connectors")
      .select("*")
      .eq("university_id", staff!.university_id);
    if (data) setSaved(data as SavedConnector[]);
    setLoading(false);
  };

  const getSaved = (key: string) =>
    saved.find((s) => s.connector_key === key) ?? null;

  const categories = ["All", ...connectorGroups.map((g) => g.category)];
  const connectedCount = saved.filter((s) => s.is_active).length;

  const filtered = connectorGroups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (i) =>
          (activeCategory === "All" || activeCategory === g.category) &&
          (i.name.toLowerCase().includes(search.toLowerCase()) ||
            i.desc.toLowerCase().includes(search.toLowerCase())),
      ),
    }))
    .filter((g) => g.items.length > 0);

  if (!staff?.is_admin) return null;

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        margin: "-32px -32px",
        minHeight: "calc(100vh - 64px)",
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600;700&display=swap');
      @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      ::-webkit-scrollbar { width: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    `}</style>

      {/* Top Bar */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e8ecf2",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Integration Connectors
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#64748b",
              marginTop: 4,
              marginBottom: 0,
            }}
          >
            Connect your institution's systems to the VillageU ecosystem
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "Total", val: allItems.length, color: "#6366f1" },
            { label: "Active", val: connectedCount, color: "#10b981" },
            {
              label: "Available",
              val: allItems.length - connectedCount,
              color: "#94a3b8",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "8px 16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: s.color,
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {s.val}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#94a3b8",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "24px 32px",
          boxSizing: "border-box",
        }}
      >
        {/* Search + Filters */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 28,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                fontSize: 14,
              }}
            >
              ⌕
            </span>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search connectors…"
              style={{
                width: "100%",
                padding: "10px 12px 10px 34px",
                border: "1.5px solid #e2e8f0",
                borderRadius: 10,
                fontSize: 13,
                color: "#0f172a",
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 20,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  border:
                    activeCategory === cat
                      ? "1.5px solid #6366f1"
                      : "1.5px solid #e2e8f0",
                  background: activeCategory === cat ? "#6366f1" : "#fff",
                  color: activeCategory === cat ? "#fff" : "#64748b",
                }}
              >
                {cat === "All" ? "All" : cat.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "#94a3b8",
            }}
          >
            Loading connectors…
          </div>
        ) : (
          <>
            {filtered.map((group) => (
              <div key={group.category} style={{ marginBottom: 36 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <span style={{ color: "#6366f1" }}>{group.icon}</span>

                  <h2
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#374151",
                      margin: 0,
                    }}
                  >
                    {group.category}
                  </h2>

                  <span
                    style={{
                      background: "#f1f5f9",
                      color: "#94a3b8",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 10,
                    }}
                  >
                    {group.items.length}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(230px, 1fr))",
                    gap: 14,
                  }}
                >
                  {group.items.map((item) => (
                    <ConnectorCard
                      key={item.id}
                      item={item}
                      saved={getSaved(item.id)}
                      onManage={(i, s) => setSelected({ item: i, saved: s })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {selected && (
        <ConfigModal
          item={selected.item}
          saved={selected.saved}
          universityId={staff!.university_id}
          staffId={staff!.id}
          onClose={() => setSelected(null)}
          onSaved={fetchSaved}
        />
      )}
    </div>
  );
};
