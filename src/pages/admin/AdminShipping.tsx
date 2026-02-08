import { useState, useRef } from 'react';
import { Plus, Trash2, Pencil, Check, X, Truck, Upload, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ALGERIA_WILAYAS } from '@/data/wilayas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  useShippingCompanies,
  useShippingRates,
  useCreateShippingCompany,
  useUpdateShippingCompany,
  useDeleteShippingCompany,
  useBulkUpsertShippingRates,
} from '@/hooks/useShipping';

export default function AdminShipping() {
  const { data: companies = [], isLoading } = useShippingCompanies();
  const createCompany = useCreateShippingCompany();
  const updateCompany = useUpdateShippingCompany();
  const deleteCompany = useDeleteShippingCompany();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    createCompany.mutate(newName.trim(), { onSuccess: () => setNewName('') });
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateCompany.mutate({ id, name: editName.trim() }, { onSuccess: () => setEditingId(null) });
  };

  const handleLogoUpload = async (companyId: string, file: File) => {
    setUploadingLogo(companyId);
    try {
      const ext = file.name.split('.').pop();
      const path = `${companyId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('shipping-logos')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shipping-logos')
        .getPublicUrl(path);

      updateCompany.mutate({ id: companyId, logo_url: publicUrl });
      toast.success('Logo uploaded');
    } catch (e: any) {
      toast.error('Upload failed: ' + e.message);
    } finally {
      setUploadingLogo(null);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shipping Management</h1>
          <p className="text-muted-foreground">Manage shipping companies and rates per wilaya</p>
        </div>
      </div>

      {/* Add Company */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Shipping Companies
        </h2>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Company name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="max-w-xs"
          />
          <Button onClick={handleAdd} disabled={createCompany.isPending}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : companies.length === 0 ? (
          <p className="text-muted-foreground">No shipping companies yet. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {companies.map((company) => (
              <CompanyRow
                key={company.id}
                company={company}
                isSelected={selectedCompany === company.id}
                isEditing={editingId === company.id}
                editName={editName}
                isUploadingLogo={uploadingLogo === company.id}
                onEditStart={() => { setEditingId(company.id); setEditName(company.name); }}
                onEditChange={setEditName}
                onEditSave={() => handleSaveEdit(company.id)}
                onEditCancel={() => setEditingId(null)}
                onToggleActive={(checked) => updateCompany.mutate({ id: company.id, is_active: checked })}
                onSelectRates={() => setSelectedCompany(selectedCompany === company.id ? null : company.id)}
                onDelete={() => deleteCompany.mutate(company.id)}
                onLogoUpload={(file) => handleLogoUpload(company.id, file)}
                onLogoRemove={() => updateCompany.mutate({ id: company.id, logo_url: null })}
              />
            ))}
          </div>
        )}
      </div>

      {selectedCompany && (
        <RatesEditor
          companyId={selectedCompany}
          companyName={companies.find(c => c.id === selectedCompany)?.name || ''}
        />
      )}
    </div>
  );
}

function CompanyRow({
  company,
  isSelected,
  isEditing,
  editName,
  isUploadingLogo,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onToggleActive,
  onSelectRates,
  onDelete,
  onLogoUpload,
  onLogoRemove,
}: {
  company: { id: string; name: string; logo_url: string | null; is_active: boolean };
  isSelected: boolean;
  isEditing: boolean;
  editName: string;
  isUploadingLogo: boolean;
  onEditStart: () => void;
  onEditChange: (v: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onToggleActive: (checked: boolean) => void;
  onSelectRates: () => void;
  onDelete: () => void;
  onLogoUpload: (file: File) => void;
  onLogoRemove: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Logo */}
        <div className="relative group">
          <div className="w-10 h-10 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain" />
            ) : (
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onLogoUpload(file);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingLogo}
            className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <Upload className="h-3 w-3 text-white" />
          </button>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => onEditChange(e.target.value)}
              className="max-w-xs h-8"
              onKeyDown={(e) => e.key === 'Enter' && onEditSave()}
            />
            <Button size="sm" variant="ghost" onClick={onEditSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onEditCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <span className="font-medium text-foreground">{company.name}</span>
            <Button size="sm" variant="ghost" onClick={onEditStart}>
              <Pencil className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {company.logo_url && (
          <Button size="sm" variant="ghost" onClick={onLogoRemove} className="text-muted-foreground text-xs">
            Remove logo
          </Button>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{company.is_active ? 'Active' : 'Inactive'}</span>
          <Switch checked={company.is_active} onCheckedChange={onToggleActive} />
        </div>
        <Button size="sm" variant="outline" onClick={onSelectRates}>
          Set Rates
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function RatesEditor({ companyId, companyName }: { companyId: string; companyName: string }) {
  const { data: existingRates = [], isLoading } = useShippingRates(companyId);
  const bulkUpsert = useBulkUpsertShippingRates();

  const [rates, setRates] = useState<Record<string, { desk: string; home: string }>>({});
  const [initialized, setInitialized] = useState<string | null>(null);

  if (!isLoading && initialized !== companyId) {
    const map: Record<string, { desk: string; home: string }> = {};
    ALGERIA_WILAYAS.forEach((w) => {
      const existing = existingRates.find(r => r.wilaya_code === w.code);
      map[w.code] = {
        desk: existing ? String(existing.desk_price) : '0',
        home: existing ? String(existing.home_price) : '0',
      };
    });
    setRates(map);
    setInitialized(companyId);
  }

  const handleSetAll = (type: 'desk' | 'home', value: string) => {
    setRates((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((code) => {
        next[code] = { ...next[code], [type]: value };
      });
      return next;
    });
  };

  const handleSave = () => {
    const ratesList = Object.entries(rates).map(([wilaya_code, r]) => ({
      company_id: companyId,
      wilaya_code,
      desk_price: Math.max(0, Number(r.desk) || 0),
      home_price: Math.max(0, Number(r.home) || 0),
    }));
    bulkUpsert.mutate(ratesList);
  };

  const [bulkDesk, setBulkDesk] = useState('');
  const [bulkHome, setBulkHome] = useState('');

  if (isLoading) return <p className="text-muted-foreground">Loading rates...</p>;

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Rates for <span className="text-primary">{companyName}</span>
        </h2>
        <Button onClick={handleSave} disabled={bulkUpsert.isPending}>
          {bulkUpsert.isPending ? 'Saving...' : 'Save All Rates'}
        </Button>
      </div>

      <div className="flex items-end gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
        <div>
          <label className="text-xs text-muted-foreground">Set all Desk prices</label>
          <div className="flex gap-1">
            <Input className="w-24 h-8" type="number" min="0" value={bulkDesk} onChange={(e) => setBulkDesk(e.target.value)} placeholder="DA" />
            <Button size="sm" variant="secondary" onClick={() => bulkDesk && handleSetAll('desk', bulkDesk)}>Apply</Button>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Set all Home prices</label>
          <div className="flex gap-1">
            <Input className="w-24 h-8" type="number" min="0" value={bulkHome} onChange={(e) => setBulkHome(e.target.value)} placeholder="DA" />
            <Button size="sm" variant="secondary" onClick={() => bulkHome && handleSetAll('home', bulkHome)}>Apply</Button>
          </div>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Code</TableHead>
              <TableHead>Wilaya</TableHead>
              <TableHead className="w-32">Desk (DA)</TableHead>
              <TableHead className="w-32">Home (DA)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ALGERIA_WILAYAS.map((w) => (
              <TableRow key={w.code}>
                <TableCell className="font-mono text-muted-foreground">{w.code}</TableCell>
                <TableCell className="font-medium">{w.name}</TableCell>
                <TableCell>
                  <Input
                    type="number" min="0" className="h-8 w-24"
                    value={rates[w.code]?.desk || '0'}
                    onChange={(e) => setRates((prev) => ({ ...prev, [w.code]: { ...prev[w.code], desk: e.target.value } }))}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number" min="0" className="h-8 w-24"
                    value={rates[w.code]?.home || '0'}
                    onChange={(e) => setRates((prev) => ({ ...prev, [w.code]: { ...prev[w.code], home: e.target.value } }))}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
