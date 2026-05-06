import { useMemo, useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, FileDown, ArrowLeft, Info } from "lucide-react";
import jsPDF from "jspdf";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/state/AppState";
import { toast } from "sonner";
import { supabase } from "../supabase";

type LineItem = { id: string; description: string; quantity: number; unitPrice: number };

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function Invoice() {
  const { coins, setCoins, addHistory } = useApp();
  const [yourName, setYourName] = useState("Your name");
  const [yourEmail, setYourEmail] = useState("hello@yourname.com");
  const [clientName, setClientName] = useState("Acme Co.");
  const [clientEmail, setClientEmail] = useState("billing@acme.com");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-0001");
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState(today());
  const [notes, setNotes] = useState("Thanks for your business!");
  const [invoiceHistory, setInvoiceHistory] = useState<any[]>([]);
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "Website design", quantity: 1, unitPrice: 1200 },
  ]);

  const previewRef = useRef<HTMLDivElement>(null);

  const fetchInvoiceHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id) // Ensure we only get current user's invoices
        .order("created_at", { ascending: false });

      if (error) console.error("History fetch error:", error.message);
      if (data) setInvoiceHistory(data);
    }
  };

  useEffect(() => {
    fetchInvoiceHistory();
  }, []);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0),
    [items]
  );

  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const addItem = () =>
    setItems((arr) => [...arr, { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (id: string) => setItems((arr) => arr.filter((i) => i.id !== id));

  const generatePdf = async () => {
    if (coins < 1) {
      toast.error("You need at least 1 coin to generate an invoice.");
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const M = 48;
    let y = M;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("INVOICE", M, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(invoiceNumber, doc.internal.pageSize.getWidth() - M, y, { align: "right" });
    y += 28;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("From", M, y);
    doc.text("Bill To", 300, y);
    doc.setTextColor(20);
    doc.setFont("helvetica", "bold");
    doc.text(yourName || "—", M, y + 14);
    doc.text(clientName || "—", 300, y + 14);
    doc.setFont("helvetica", "normal");
    doc.text(yourEmail || "", M, y + 28);
    doc.text(clientEmail || "", 300, y + 28);
    y += 56;

    doc.setTextColor(100);
    doc.text(`Invoice date: ${invoiceDate}`, M, y);
    doc.text(`Due date: ${dueDate}`, 300, y);
    y += 24;
    doc.setTextColor(20);

    doc.setFillColor(245, 246, 250);
    doc.rect(M, y, doc.internal.pageSize.getWidth() - M * 2, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.text("Description", M + 8, y + 15);
    doc.text("Quantity", 360, y + 15, { align: "right" });
    doc.text("Unit", 440, y + 15, { align: "right" });
    doc.text("Total", doc.internal.pageSize.getWidth() - M - 4, y + 15, { align: "right" });
    y += 30;
    doc.setFont("helvetica", "normal");

    items.forEach((it) => {
      const lineTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
      const desc = doc.splitTextToSize(it.description || "—", 280);
      doc.text(desc, M + 8, y);
      doc.text(String(it.quantity || 0), 360, y, { align: "right" });
      doc.text(fmt(Number(it.unitPrice) || 0), 440, y, { align: "right" });
      doc.text(fmt(lineTotal), doc.internal.pageSize.getWidth() - M - 4, y, { align: "right" });
      y += Math.max(18, desc.length * 14);
    });

    y += 10;
    doc.setDrawColor(220);
    doc.line(M, y, doc.internal.pageSize.getWidth() - M, y);
    y += 22;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total", 360, y);
    doc.text(fmt(total), doc.internal.pageSize.getWidth() - M - 4, y, { align: "right" });

    if (notes.trim()) {
      y += 36;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Notes", M, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      const wrapped = doc.splitTextToSize(notes, doc.internal.pageSize.getWidth() - M * 2);
      doc.text(wrapped, M, y + 14);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: rpcError } = await supabase.rpc('deduct_coin', {
        target_user_id: user.id
      });

      if (!rpcError) {
        doc.save(`${invoiceNumber || "invoice"}.pdf`);
        setCoins(prev => prev - 1);

        const { error: saveError } = await supabase.from("invoices").insert([{
          user_id: user.id,
          invoice_number: invoiceNumber,
          client_name: clientName,
          amount: total
        }]);

        if (saveError) console.error("Save Error:", saveError.message);

        fetchInvoiceHistory();
        toast.success("Invoice generated. 1 coin used.");
      } else {
        toast.error("Failed to deduct coin. Check your balance.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container py-6 sm:py-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1.5 text-xs font-medium text-success">
            Invoice Builder
          </div>
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-soft">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">1 coin</span> per generated invoice design.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form Section */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
            <h2 className="text-lg font-semibold">Details</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Your Name</Label>
                <Input value={yourName} onChange={(e) => setYourName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Your Email</Label>
                <Input type="email" value={yourEmail} onChange={(e) => setYourEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Client Name</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Client Email</Label>
                <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Invoice Number</Label>
                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Invoice Date</Label>
                <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Line items</h3>
                <Button onClick={addItem} size="sm" variant="ghost" className="rounded-full">
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>

              <div className="space-y-2">
                {items.map((it) => (
                  <div key={it.id} className="grid grid-cols-12 gap-2 rounded-xl border border-border bg-background p-2">
                    <Input
                      className="col-span-12 sm:col-span-6"
                      placeholder="Description"
                      value={it.description}
                      onChange={(e) => updateItem(it.id, { description: e.target.value })}
                    />
                    <Input
                      type="number"
                      min={0}
                      className="col-span-4 sm:col-span-2"
                      placeholder="Quantity"
                      value={it.quantity}
                      onChange={(e) => updateItem(it.id, { quantity: Number(e.target.value) })}
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      className="col-span-6 sm:col-span-3"
                      placeholder="Unit price"
                      value={it.unitPrice}
                      onChange={(e) => updateItem(it.id, { unitPrice: Number(e.target.value) })}
                    />
                    <Button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      variant="ghost"
                      size="icon"
                      className="col-span-2 sm:col-span-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <Button onClick={generatePdf} className="mt-6 w-full rounded-full shadow-glow">
              <FileDown className="mr-2 h-4 w-4" /> Generate Invoice PDF
            </Button>
          </section>

          {/* Preview Section - UPDATED RESPONSIVE LAYOUT */}
          <section className="lg:sticky lg:top-24 lg:self-start">
            <div ref={previewRef} className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Invoice</p>
                  <h3 className="mt-1 text-2xl font-bold">{invoiceNumber || "—"}</h3>
                </div>
                <div className="text-right text-[10px] sm:text-xs text-muted-foreground">
                  <p>Date: <span className="text-foreground">{invoiceDate}</span></p>
                  <p>Due: <span className="text-foreground">{dueDate}</span></p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-[11px] sm:text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">From</p>
                  <p className="mt-1 font-semibold">{yourName || "—"}</p>
                  <p className="text-muted-foreground truncate">{yourEmail}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Bill to</p>
                  <p className="mt-1 font-semibold">{clientName || "—"}</p>
                  <p className="text-muted-foreground truncate">{clientEmail}</p>
                </div>
              </div>

              {/* Table - Responsive Fix */}
              <div className="mt-6 overflow-hidden rounded-xl border border-border">
                <div className="grid grid-cols-12 bg-muted px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-tight sm:text-xs">
                  <span className="col-span-5 sm:col-span-6">Description</span>
                  <span className="col-span-2 text-right">Qty</span>
                  <span className="hidden sm:block col-span-2 text-right">Unit</span>
                  <span className="col-span-5 sm:col-span-2 text-right">Total</span>
                </div>
                <ul className="divide-y divide-border">
                  {items.length === 0 ? (
                    <li className="px-3 py-6 text-center text-sm text-muted-foreground">No items yet.</li>
                  ) : (
                    items.map((it) => {
                      const lineTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
                      return (
                        <li key={it.id} className="grid grid-cols-12 items-center px-3 py-3 text-xs sm:text-sm">
                          <span className="col-span-5 sm:col-span-6 truncate font-medium">{it.description || "—"}</span>
                          <span className="col-span-2 text-right tabular-nums">{it.quantity || 0}</span>
                          <span className="hidden sm:block col-span-2 text-right tabular-nums">{fmt(Number(it.unitPrice) || 0)}</span>
                          <span className="col-span-5 sm:col-span-2 text-right font-bold tabular-nums text-foreground">{fmt(lineTotal)}</span>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-primary-soft px-4 py-3">
                <span className="text-sm font-medium text-primary">Total</span>
                <span className="text-lg font-bold tabular-nums text-primary">{fmt(total)}</span>
              </div>
            </div>

            {/* Invoice History List */}
            <div className="mt-12 space-y-4">
              <h2 className="text-xl font-bold">Recent Invoices</h2>
              <div className="grid gap-3">
                {invoiceHistory.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No invoices found. Try generating your first one!</p>
                ) : (
                  invoiceHistory.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-soft">
                      <div>
                        <p className="font-bold">{inv.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">{inv.client_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">${inv.amount}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}