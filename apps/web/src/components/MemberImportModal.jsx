import React, { useState, useRef } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, AlertCircle, CheckCircle2, FileUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

import { detectColumns } from '@/components/ColumnMapper.jsx';
import ColumnMappingPreview from '@/components/ColumnMappingPreview.jsx';
import { normalizeDate, normalizeStatus, validateEmail, validatePhone } from '@/lib/dataUtils.js';

const MemberImportModal = ({ open, onOpenChange, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('upload'); // upload, preview, importing, results
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const reset = () => {
    setFile(null);
    setStep('upload');
    setParsedData([]);
    setHeaders([]);
    setMapping({});
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    processFile(selectedFile);
  };

  const processFile = (file) => {
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          if (res.data.length === 0) {
            toast.error('Le fichier CSV est vide.');
            reset();
            return;
          }
          const fileHeaders = res.meta.fields || Object.keys(res.data[0] || {});
          setupPreview(res.data, fileHeaders);
        },
        error: (error) => {
          toast.error(`Erreur de lecture CSV: ${error.message}`);
          reset();
        }
      });
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          
          if (json.length === 0) {
            toast.error('Le fichier Excel est vide.');
            reset();
            return;
          }

          const fileHeaders = [];
          const range = XLSX.utils.decode_range(worksheet['!ref']);
          for (let C = range.s.c; C <= range.e.c; ++C) {
              const cell = worksheet[XLSX.utils.encode_cell({c: C, r: range.s.r})];
              if (cell && cell.v !== undefined) {
                fileHeaders.push(String(cell.v));
              } else {
                fileHeaders.push(`Col${C}`);
              }
          }
          setupPreview(json, fileHeaders);
        } catch (err) {
          toast.error(`Erreur de lecture Excel: ${err.message}`);
          reset();
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('Format de fichier non supporté. Utilisez .csv ou .xlsx');
      reset();
    }
  };

  const setupPreview = (data, fileHeaders) => {
    if (!fileHeaders || fileHeaders.length === 0) {
      toast.error("Aucune colonne trouvée dans le fichier.");
      reset();
      return;
    }

    const detectedMapping = detectColumns(fileHeaders);
    
    // Check if we detected ANY valid columns
    const hasDetectedColumns = Object.values(detectedMapping).some(val => val !== 'ignore');
    if (!hasDetectedColumns) {
      toast.error("Aucune colonne valide détectée. Vérifiez le format du fichier.");
      reset();
      return;
    }

    setParsedData(data);
    setHeaders(fileHeaders);
    setMapping(detectedMapping);
    setStep('preview');
  };

  const executeImport = async (finalMapping) => {
    setStep('importing');
    const errors = [];
    let successCount = 0;

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const rowNum = i + 2; // +1 for 0-index, +1 for header
      const mappedRow = {};

      // Apply mapping
      for (const origHeader in finalMapping) {
        const targetField = finalMapping[origHeader];
        if (targetField && targetField !== 'ignore') {
          mappedRow[targetField] = row[origHeader];
        }
      }

      // Construct and normalize data
      const firstName = (mappedRow.firstName || '').toString().trim();
      const lastName = (mappedRow.lastName || '').toString().trim();
      const name = mappedRow.name ? mappedRow.name.toString().trim() : `${firstName} ${lastName}`.trim();
      
      const email = (mappedRow.email || '').toString().trim();
      const phone = (mappedRow.phone || '').toString().trim();
      const status = normalizeStatus(mappedRow.status);
      const baptism_date = normalizeDate(mappedRow.baptism_date);
      const church_join_date = normalizeDate(mappedRow.church_join_date);

      // Validation
      if (!name) {
        errors.push({ row: rowNum, reason: 'Nom/Prénom manquant' });
        continue;
      }
      if (!email || !validateEmail(email)) {
        errors.push({ row: rowNum, reason: `Email invalide: ${email || 'vide'}` });
        continue;
      }
      if (!validatePhone(phone)) {
        errors.push({ row: rowNum, reason: `Téléphone invalide: ${phone}` });
        continue;
      }

      try {
        // Check for duplicates
        const existing = await pb.collection('members').getList(1, 1, {
          filter: `email="${email}"`,
          $autoCancel: false
        });

        if (existing.items.length > 0) {
          errors.push({ row: rowNum, reason: `Email déjà existant: ${email}` });
          continue;
        }

        // Create member
        const payload = {
          name,
          email,
          phone,
          status,
        };
        if (baptism_date) payload.baptism_date = baptism_date;
        if (church_join_date) payload.church_join_date = church_join_date;

        await pb.collection('members').create(payload, { $autoCancel: false });
        successCount++;
      } catch (err) {
        errors.push({ row: rowNum, reason: `Erreur serveur: ${err.message}` });
      }
    }

    setResults({ successCount, errors });
    setStep('results');
    
    if (successCount > 0) {
      toast.success(`${successCount} membre(s) importé(s) avec succès.`);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val && step !== 'importing') {
        reset();
        onOpenChange(val);
      }
    }}>
      <DialogContent className="sm:max-w-[700px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Importer des Membres</DialogTitle>
          {step === 'upload' && (
            <DialogDescription>
              Téléchargez un fichier CSV ou Excel (.xlsx) contenant les informations des membres.
            </DialogDescription>
          )}
          {step === 'preview' && (
            <DialogDescription>
              Vérifiez et corrigez l'association automatique des colonnes de votre fichier avec les champs du système.
            </DialogDescription>
          )}
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6 py-8">
            <div 
              className="border-2 border-dashed border-primary/20 bg-primary/5 rounded-2xl p-10 text-center hover:bg-primary/10 transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
              />
              <FileUp className="w-12 h-12 text-primary/60 group-hover:text-primary transition-colors mx-auto mb-4" />
              <p className="text-base font-medium text-foreground">Cliquez pour sélectionner un fichier</p>
              <p className="text-sm text-muted-foreground mt-2">Format CSV ou Excel accepté</p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <ColumnMappingPreview
            data={parsedData}
            headers={headers}
            initialMapping={mapping}
            onConfirm={executeImport}
            onCancel={reset}
          />
        )}

        {step === 'importing' && (
          <div className="py-16 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-lg font-medium animate-pulse">Importation des données en cours...</p>
            <p className="text-sm text-muted-foreground">Veuillez patienter, cela peut prendre quelques instants.</p>
          </div>
        )}

        {step === 'results' && results && (
          <div className="space-y-6 py-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 p-5 bg-green-50 border border-green-200 rounded-xl text-green-800 shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-lg">Import terminé</p>
                <p className="text-green-700">{results.successCount} membre(s) ajouté(s) avec succès dans la base de données.</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="border border-red-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-red-50 p-4 border-b border-red-200 flex items-center gap-3 text-red-800">
                  <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                  <div>
                    <span className="font-semibold">{results.errors.length} erreur(s) rencontrée(s)</span>
                    <p className="text-xs text-red-700 mt-0.5">Ces lignes ont été ignorées lors de l'import.</p>
                  </div>
                </div>
                <ScrollArea className="h-[250px] bg-white">
                  <div className="p-0">
                    {results.errors.map((err, idx) => (
                      <div key={idx} className="px-5 py-3 border-b border-border/40 last:border-0 text-sm flex gap-4 hover:bg-muted/20 transition-colors">
                        <span className="text-muted-foreground font-mono text-xs w-16 shrink-0 pt-0.5">Ligne {err.row}</span>
                        <span className="text-red-600 font-medium">{err.reason}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <Button onClick={() => onOpenChange(false)} className="rounded-xl shadow-sm px-6">
                Fermer
              </Button>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
};

export default MemberImportModal;