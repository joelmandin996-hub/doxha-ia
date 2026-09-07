import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Package, Plus, Search, MoreHorizontal, Pencil, Trash2, History,
  AlertTriangle, Boxes, Euro, TrendingUp, ArrowDownLeft, ArrowUpRight,
  MapPin, Calendar, Truck, FileText, PackageOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters.js';

// ---- Category color mapping (matches seeded category.color tokens) ----
const CATEGORY_STYLES = {
  amber:   { bg: 'hsl(var(--amber) / 0.12)',  text: 'hsl(var(--amber))',  ring: 'hsl(var(--amber) / 0.35)' },
  sky:     { bg: 'hsl(var(--sky) / 0.12)',    text: 'hsl(var(--sky))',    ring: 'hsl(var(--sky) / 0.35)' },
  violet:  { bg: 'hsl(var(--secondary) / 0.12)', text: 'hsl(var(--secondary))', ring: 'hsl(var(--secondary) / 0.35)' },
  rose:    { bg: 'hsl(var(--rose) / 0.12)',   text: 'hsl(var(--rose))',   ring: 'hsl(var(--rose) / 0.35)' },
  emerald: { bg: 'hsl(var(--emerald) / 0.12)', text: 'hsl(var(--emerald))', ring: 'hsl(var(--emerald) / 0.35)' },
};
const catStyle = (color) => CATEGORY_STYLES[color] || CATEGORY_STYLES.violet;

const EMPTY_FORM = {
  name: '', category_id: '', quantity: '', unit: 'pièce', min_quantity: '',
  location: '', purchase_date: '', purchase_price: '', supplier: '', invoice_id: 'none', notes: '',
};

const InventoryPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const invoiceFilter = searchParams.get('invoice') || null;
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [movementsOpen, setMovementsOpen] = useState(false);
  const [movementsItem, setMovementsItem] = useState(null);
  const [movements, setMovements] = useState([]);
  const [movLoading, setMovLoading] = useState(false);
  const [movForm, setMovForm] = useState({ type: 'entree', quantity: '', reason: '', date: '', notes: '' });
  const [movSaving, setMovSaving] = useState(false);

  const catMap = useMemo(() => {
    const m = {};
    categories.forEach((c) => { m[c.id] = c; });
    return m;
  }, [categories]);

  const invoiceMap = useMemo(() => {
    const m = {};
    invoices.forEach((i) => { m[i.id] = i; });
    return m;
  }, [invoices]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, invs, invItems] = await Promise.all([
        pb.collection('inventory_categories').getFullList({ $autoCancel: false }),
        pb.collection('transactions_depenses').getFullList({ sort: '-date', $autoCancel: false }),
        pb.collection('inventory').getFullList({
          sort: '-created',
          expand: 'category_id,invoice_id,created_by',
          $autoCancel: false,
        }),
      ]);
      setCategories(cats);
      setInvoices(invs);
      setItems(invItems);
    } catch (err) {
      console.error('fetch inventory failed', err);
      toast.error('Impossible de charger l\'inventaire.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchCat = activeCat === 'all' || it.category_id === activeCat || (it.expand && it.expand.category_id && it.expand.category_id.id === activeCat);
      const matchInvoice = !invoiceFilter || it.invoice_id === invoiceFilter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (it.name || '').toLowerCase().includes(q) ||
        (it.supplier || '').toLowerCase().includes(q) ||
        (it.location || '').toLowerCase().includes(q);
      return matchCat && matchSearch && matchInvoice;
    });
  }, [items, activeCat, search, invoiceFilter]);

  const stats = useMemo(() => {
    let totalValue = 0;
    let totalItems = 0;
    let lowStock = 0;
    let totalPurchases = 0;
    items.forEach((it) => {
      const qty = Number(it.quantity || 0);
      const price = Number(it.purchase_price || 0);
      totalValue += qty * price;
      totalItems += qty;
      totalPurchases += price * (qty > 0 ? 1 : 0); // purchase cost per line (unit price counted once per article)
      const minQ = Number(it.min_quantity || 0);
      if (minQ > 0 && qty <= minQ) lowStock += 1;
    });
    return { totalValue, totalItems, lowStock, totalPurchases };
  }, [items]);

  const topSuppliers = useMemo(() => {
    const m = {};
    items.forEach((it) => {
      if (!it.supplier) return;
      m[it.supplier] = (m[it.supplier] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, category_id: activeCat !== 'all' ? activeCat : '' });
    setFormOpen(true);
  };

  const openEdit = (it) => {
    setEditing(it);
    setForm({
      name: it.name || '',
      category_id: it.category_id || '',
      quantity: it.quantity != null ? String(it.quantity) : '',
      unit: it.unit || 'pièce',
      min_quantity: it.min_quantity != null ? String(it.min_quantity) : '',
      location: it.location || '',
      purchase_date: it.purchase_date ? it.purchase_date.slice(0, 10) : '',
      purchase_price: it.purchase_price != null ? String(it.purchase_price) : '',
      supplier: it.supplier || '',
      invoice_id: it.invoice_id || 'none',
      notes: it.notes || '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Le nom de l\'article est obligatoire.'); return; }
    if (!form.category_id) { toast.error('Veuillez sélectionner une catégorie.'); return; }
    if (form.quantity === '' || Number(form.quantity) < 0) { toast.error('Quantité invalide.'); return; }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category_id: form.category_id,
        quantity: Number(form.quantity),
        unit: form.unit || 'pièce',
        min_quantity: form.min_quantity !== '' ? Number(form.min_quantity) : 0,
        location: form.location || '',
        purchase_date: form.purchase_date || null,
        purchase_price: form.purchase_price !== '' ? Number(form.purchase_price) : 0,
        supplier: form.supplier || '',
        invoice_id: form.invoice_id && form.invoice_id !== 'none' ? form.invoice_id : null,
        notes: form.notes || '',
        created_by: user.id,
      };

      if (editing) {
        await pb.collection('inventory').update(editing.id, payload, { $autoCancel: false });
        toast.success('Article mis à jour.');
      } else {
        await pb.collection('inventory').create(payload, { $autoCancel: false });
        toast.success('Article ajouté à l\'inventaire.');
      }
      setFormOpen(false);
      fetchAll();
    } catch (err) {
      console.error('save inventory failed', err);
      toast.error('Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (it) => {
    if (!window.confirm(`Supprimer « ${it.name} » de l'inventaire ?`)) return;
    try {
      await pb.collection('inventory').delete(it.id, { $autoCancel: false });
      toast.success('Article supprimé.');
      fetchAll();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la suppression.');
    }
  };

  const openMovements = async (it) => {
    setMovementsItem(it);
    setMovementsOpen(true);
    setMovForm({ type: 'entree', quantity: '', reason: '', date: new Date().toISOString().slice(0, 10), notes: '' });
    await loadMovements(it.id);
  };

  const loadMovements = async (itemId) => {
    setMovLoading(true);
    try {
      const list = await pb.collection('inventory_movements').getFullList({
        filter: `inventory_id = "${itemId}"`,
        sort: '-date',
        expand: 'created_by',
        $autoCancel: false,
      });
      setMovements(list);
    } catch (err) {
      console.error(err);
      setMovements([]);
    } finally {
      setMovLoading(false);
    }
  };

  const handleMovSave = async () => {
    if (!movementsItem) return;
    if (movForm.quantity === '' || Number(movForm.quantity) <= 0) { toast.error('Quantité invalide.'); return; }
    if (!movForm.date) { toast.error('Date requise.'); return; }

    setMovSaving(true);
    try {
      const qty = Number(movForm.quantity);
      await pb.collection('inventory_movements').create({
        inventory_id: movementsItem.id,
        type: movForm.type,
        quantity: qty,
        reason: movForm.reason || '',
        date: movForm.date,
        notes: movForm.notes || '',
        created_by: user.id,
      }, { $autoCancel: false });

      // Adjust stock quantity
      const current = Number(movementsItem.quantity || 0);
      const next = movForm.type === 'entree' ? current + qty : Math.max(0, current - qty);
      const updated = await pb.collection('inventory').update(movementsItem.id, { quantity: next }, { $autoCancel: false });
      setMovementsItem(updated);
      toast.success(movForm.type === 'entree' ? 'Entrée de stock enregistrée.' : 'Sortie de stock enregistrée.');
      setMovForm({ type: 'entree', quantity: '', reason: '', date: new Date().toISOString().slice(0, 10), notes: '' });
      await loadMovements(movementsItem.id);
      fetchAll();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'enregistrement du mouvement.');
    } finally {
      setMovSaving(false);
    }
  };

  const isLowStock = (it) => {
    const minQ = Number(it.min_quantity || 0);
    return minQ > 0 && Number(it.quantity || 0) <= minQ;
  };

  const resolveCat = (it) => {
    if (it.expand && it.expand.category_id) return it.expand.category_id;
    return catMap[it.category_id] || null;
  };
  const resolveInvoice = (it) => {
    if (it.expand && it.expand.invoice_id) return it.expand.invoice_id;
    return invoiceMap[it.invoice_id] || null;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-7xl">
      <Helmet>
        <title>Inventaire Technique - ChurchFlow</title>
        <meta name="description" content="Gestion du stock technique : lumière, son, matériel. Liaison avec les factures du budget." />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-premium-tight text-gradient">Inventaire Technique</h1>
          <p className="text-muted-foreground mt-1">Gérez le stock lumière, son et matériel technique — relié aux factures du budget.</p>
        </div>
        <Button onClick={openCreate} className="btn-gradient h-11 px-5 rounded-xl font-semibold tracking-premium">
          <Plus className="w-4 h-4 mr-2" /> Ajouter un article
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Boxes className="w-5 h-5" />} label="Articles en stock" value={stats.totalItems} tint="primary" loading={loading} />
        <StatCard icon={<Euro className="w-5 h-5" />} label="Valeur du stock" value={formatCurrency(stats.totalValue)} tint="emerald" loading={loading} />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Coût des achats" value={formatCurrency(stats.totalPurchases)} tint="sky" loading={loading} />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Alertes stock bas" value={stats.lowStock} tint="rose" loading={loading} />
      </div>

      {/* Invoice filter banner (bidirectional link from Budget) */}
      {invoiceFilter && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--mod-inventory)/0.35)] bg-[hsl(var(--mod-inventory)/0.08)] p-3">
          <p className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-[hsl(var(--mod-inventory))]" />
            <span>Affichage des articles liés à une facture Budget.</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchParams({})}
            className="text-muted-foreground hover:text-foreground"
          >
            Voir tout l'inventaire
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <CatChip active={activeCat === 'all'} onClick={() => setActiveCat('all')} label="Tous" emoji="📦" />
          {categories.map((c) => (
            <CatChip
              key={c.id}
              active={activeCat === c.id}
              onClick={() => setActiveCat(c.id)}
              label={c.name}
              emoji={c.emoji}
              color={c.color}
            />
          ))}
        </div>
        <div className="relative md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un article, fournisseur, lieu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
      </div>

      {/* Suppliers strip */}
      {!loading && topSuppliers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Truck className="w-4 h-4" />
          <span className="font-medium">Fournisseurs principaux :</span>
          {topSuppliers.map(([name, count]) => (
            <Badge key={name} variant="outline" className="font-premium tracking-premium rounded-full bg-card">
              {name} <span className="ml-1 text-muted-foreground">· {count}</span>
            </Badge>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <PackageOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucun article trouvé. Ajoutez votre premier article technique.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((it) => {
            const cat = resolveCat(it);
            const inv = resolveInvoice(it);
            const st = catStyle(cat?.color);
            const low = isLowStock(it);
            return (
              <Card
                key={it.id}
                className="premium-shadow premium-shadow-hover border-border/70 overflow-hidden group"
                style={{ borderTop: `3px solid ${st.ring}` }}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: st.bg }}
                      >
                        {cat?.emoji || '📦'}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold tracking-premium-tight truncate text-foreground">{it.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{cat?.name || 'Sans catégorie'}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(it)}><Pencil className="w-4 h-4 mr-2" /> Modifier</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openMovements(it)}><History className="w-4 h-4 mr-2" /> Mouvements / Historique</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(it)} className="text-destructive focus:bg-destructive/10">
                          <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="rounded-full font-semibold tabular-nums-custom"
                      style={{ color: low ? 'hsl(var(--destructive))' : st.text, borderColor: low ? 'hsl(var(--destructive) / 0.35)' : st.ring, background: low ? 'hsl(var(--destructive) / 0.10)' : st.bg }}
                    >
                      <Package className="w-3 h-3 mr-1" />
                      {it.quantity} {it.unit || 'pièce'}
                    </Badge>
                    {low && (
                      <Badge variant="outline" className="rounded-full badge-destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Stock bas
                      </Badge>
                    )}
                    {inv && (
                      <Badge variant="outline" className="rounded-full badge-muted">
                        <FileText className="w-3 h-3 mr-1" /> Facture liée
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted-foreground pt-1">
                    {it.location && (
                      <span className="flex items-center gap-1.5 truncate"><MapPin className="w-3.5 h-3.5 shrink-0" /> {it.location}</span>
                    )}
                    {it.purchase_date && (
                      <span className="flex items-center gap-1.5 truncate"><Calendar className="w-3.5 h-3.5 shrink-0" /> {new Date(it.purchase_date).toLocaleDateString('fr-FR')}</span>
                    )}
                    {it.supplier && (
                      <span className="flex items-center gap-1.5 truncate"><Truck className="w-3.5 h-3.5 shrink-0" /> {it.supplier}</span>
                    )}
                    {Number(it.purchase_price || 0) > 0 && (
                      <span className="flex items-center gap-1.5 truncate"><Euro className="w-3.5 h-3.5 shrink-0" /> {formatCurrency(it.purchase_price)} / unité</span>
                    )}
                  </div>

                  {inv && (
                    <div className="rounded-xl border border-border/70 bg-muted/40 p-2.5 text-xs">
                      <p className="font-semibold text-foreground flex items-center gap-1.5 mb-0.5">
                        <FileText className="w-3.5 h-3.5 text-[hsl(var(--mod-inventory))]" /> Facture Budget
                      </p>
                      <p className="text-muted-foreground truncate">
                        {inv.note || inv.categorie || 'Dépense'} — {formatCurrency(inv.montant)} · {new Date(inv.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier l\'article' : 'Nouvel article'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Mettez à jour les informations de l\'article technique.' : 'Ajoutez un article à l\'inventaire technique.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="inv-name">Nom de l'article *</Label>
              <Input id="inv-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex : Projecteur LED Par 64" />
            </div>

            <div className="space-y-1.5">
              <Label>Catégorie *</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-unit">Unité</Label>
              <Input id="inv-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pièce, mètre, paire..." />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-qty">Quantité actuelle *</Label>
              <Input id="inv-qty" type="number" min="0" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-min">Quantité minimale (alerte)</Label>
              <Input id="inv-min" type="number" min="0" step="any" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} placeholder="0 = pas d'alerte" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-loc">Localisation</Label>
              <Input id="loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex : Local technique - Étagère B" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-date">Date d'achat</Label>
              <Input id="inv-date" type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-price">Prix unitaire (€)</Label>
              <Input id="inv-price" type="number" min="0" step="0.01" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} placeholder="0.00" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-sup">Fournisseur</Label>
              <Input id="inv-sup" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Ex : Sonorisation Pro SARL" />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label>Lier à une facture Budget</Label>
              <Select value={form.invoice_id} onValueChange={(v) => setForm({ ...form, invoice_id: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Aucune facture" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Aucune facture —</SelectItem>
                  {invoices.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.note || inv.categorie || 'Dépense'} · {formatCurrency(inv.montant)} · {new Date(inv.date).toLocaleDateString('fr-FR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Sélectionnez une dépense du module Budget comme facture d'achat.</p>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="inv-notes">Notes</Label>
              <Textarea id="inv-notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Remarques, état, numéro de série..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving} className="btn-gradient">
              {saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movements dialog */}
      <Dialog open={movementsOpen} onOpenChange={setMovementsOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-4 h-4 text-[hsl(var(--mod-inventory))]" />
              Mouvements de stock
            </DialogTitle>
            <DialogDescription>
              {movementsItem?.name} — Stock actuel : <span className="font-semibold text-foreground">{movementsItem?.quantity} {movementsItem?.unit || 'pièce'}</span>
            </DialogDescription>
          </DialogHeader>

          {/* New movement */}
          <div className="rounded-xl border border-border/70 bg-muted/40 p-3 space-y-3">
            <p className="text-sm font-semibold">Nouveau mouvement</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={movForm.type} onValueChange={(v) => setMovForm({ ...movForm, type: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entree">Entrée (+)</SelectItem>
                    <SelectItem value="sortie">Sortie (−)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mov-qty">Quantité</Label>
                <Input id="mov-qty" type="number" min="0" step="any" value={movForm.quantity} onChange={(e) => setMovForm({ ...movForm, quantity: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mov-reason">Raison</Label>
                <Input id="mov-reason" value={movForm.reason} onChange={(e) => setMovForm({ ...movForm, reason: e.target.value })} placeholder="achat, utilisation, perte..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mov-date">Date</Label>
                <Input id="mov-date" type="date" value={movForm.date} onChange={(e) => setMovForm({ ...movForm, date: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="mov-notes">Notes</Label>
                <Input id="mov-notes" value={movForm.notes} onChange={(e) => setMovForm({ ...movForm, notes: e.target.value })} placeholder="Détail du mouvement" />
              </div>
            </div>
            <Button onClick={handleMovSave} disabled={movSaving} size="sm" className="btn-gradient w-full">
              {movSaving ? 'Enregistrement...' : 'Enregistrer le mouvement'}
            </Button>
          </div>

          <Separator />

          {/* History */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Historique</p>
            {movLoading ? (
              <div className="space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : movements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun mouvement enregistré.</p>
            ) : (
              <ScrollArea className="h-56 pr-2">
                <div className="space-y-2">
                  {movements.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-2.5">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: m.type === 'entree' ? 'hsl(var(--success) / 0.12)' : 'hsl(var(--destructive) / 0.12)',
                          color: m.type === 'entree' ? 'hsl(var(--success))' : 'hsl(var(--destructive))',
                        }}
                      >
                        {m.type === 'entree' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {m.type === 'entree' ? 'Entrée' : 'Sortie'} de {m.quantity} {movementsItem?.unit || 'pièce'}
                          {m.reason ? <span className="text-muted-foreground font-normal"> · {m.reason}</span> : null}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.date).toLocaleDateString('fr-FR')}
                          {m.expand?.created_by?.name ? ` · ${m.expand.created_by.name}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementsOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ---- Stat card ----
const StatCard = ({ icon, label, value, tint, loading }) => {
  const tints = {
    primary: { bg: 'hsl(var(--primary) / 0.12)', text: 'hsl(var(--primary))' },
    emerald: { bg: 'hsl(var(--emerald) / 0.12)', text: 'hsl(var(--emerald))' },
    sky: { bg: 'hsl(var(--sky) / 0.12)', text: 'hsl(var(--sky))' },
    rose: { bg: 'hsl(var(--rose) / 0.12)', text: 'hsl(var(--rose))' },
  };
  const t = tints[tint] || tints.primary;
  return (
    <Card className="premium-shadow border-border/70">
      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-20" />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 truncate">{label}</p>
              <p className="text-2xl font-extrabold tabular-nums-custom text-foreground truncate">{value}</p>
            </div>
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.bg, color: t.text }}>
              {icon}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ---- Category chip ----
const CatChip = ({ active, onClick, label, emoji, color }) => {
  const st = catStyle(color);
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 border ${
        active ? 'text-primary-foreground shadow-[0_8px_20px_-10px_hsl(var(--primary)/0.6)]' : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
      }`}
      style={active ? {
        backgroundImage: color
          ? `linear-gradient(135deg, ${st.text}, ${st.text})`
          : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
        borderColor: 'transparent',
      } : undefined}
    >
      <span>{emoji}</span>
      <span className="tracking-premium">{label}</span>
    </button>
  );
};

export default InventoryPage;
