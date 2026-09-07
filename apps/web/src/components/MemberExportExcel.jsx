import React, { useState } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const MemberExportExcel = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await pb.collection('members').getList(1, 500, {
        sort: 'name',
        $autoCancel: false
      });

      const members = result.items;

      if (members.length === 0) {
        toast.info('Aucun membre à exporter.');
        setIsExporting(false);
        return;
      }

      const data = members.map(m => ({
        'Nom complet': m.name || '',
        'Email': m.email || '',
        'Téléphone': m.phone || '',
        'Statut': m.status || 'Actif',
        'Date de baptême': m.baptism_date ? format(new Date(m.baptism_date), 'yyyy-MM-dd') : '',
        'Date d\'adhésion': m.church_join_date ? format(new Date(m.church_join_date), 'yyyy-MM-dd') : '',
        'Liens familiaux': m.family_links?.length ? `${m.family_links.length} lien(s)` : '0'
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Auto-fit columns
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(key.length, ...data.map(row => (row[key] ? row[key].toString().length : 0))) + 2
      }));
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Membres');

      const dateStr = format(new Date(), 'yyyy-MM-dd');
      XLSX.writeFile(workbook, `membres_${dateStr}.xlsx`);

      toast.success('Export Excel réussi !');
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      toast.error('Échec de l\'export Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport} 
      disabled={isExporting}
      className="gap-2 rounded-xl"
    >
      <FileSpreadsheet className="w-4 h-4 text-green-600" />
      {isExporting ? 'Export...' : 'Exporter Excel'}
    </Button>
  );
};

export default MemberExportExcel;