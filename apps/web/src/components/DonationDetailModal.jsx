import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarPlus as CalendarIcon, User, Download, FileText, Mail, Trash2, Edit } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import FiscalReceiptGenerator from './FiscalReceiptGenerator.jsx';
import ReceiptEmailSender from './ReceiptEmailSender.jsx';

const DonationDetailModal = ({ isOpen, onClose, donation, onEdit, onDelete, onReceiptUpdate }) => {
  const [receipt, setReceipt] = useState(null);
  const [emails, setEmails] = useState([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && donation?.id) {
      fetchReceiptData();
    }
  }, [isOpen, donation]);

  const fetchReceiptData = async () => {
    setLoading(true);
    try {
      const recuRecords = await pb.collection('recus_fiscaux').getFullList({
        filter: `don_id="${donation.id}"`,
        sort: '-created',
        $autoCancel: false
      });
      
      if (recuRecords.length > 0) {
        setReceipt(recuRecords[0]);
        
        const emailRecords = await pb.collection('emails_recus').getFullList({
          filter: `recu_id="${recuRecords[0].id}"`,
          sort: '-created',
          $autoCancel: false
        });
        setEmails(emailRecords);
      } else {
        setReceipt(null);
        setEmails([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!donation) return null;

  const handleDelete = () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce don ? Cette action est irréversible.")) {
      onDelete(donation.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-[1.5rem]">
        <div className="bg-muted/20 border-b p-6">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <Badge variant="outline" className="mb-3 badge-primary">
                  {donation.type_don === 'unique' ? 'Don Unique' : 'Don Récurrent'}
                </Badge>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  Détails du Don
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Enregistré le {format(new Date(donation.created), 'dd MMM yyyy', { locale: fr })}
                </DialogDescription>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold tabular-nums-custom tracking-tight text-foreground">
                  {donation.montant.toFixed(2)} €
                </p>
                <Badge className={`mt-2 ${donation.statut === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                  {donation.statut === 'completed' ? 'Complété' : 'En attente'}
                </Badge>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 bg-background">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-card border shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Donateur</p>
              <p className="text-base font-bold text-foreground">{donation.expand?.membre_id?.name || 'Membre inconnu'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border rounded-xl p-4 shadow-sm space-y-1.5">
              <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" /> Date du don
              </span>
              <p className="font-semibold text-[15px] tabular-nums-custom">
                {format(new Date(donation.date_don), 'PPP', { locale: fr })}
              </p>
            </div>
            <div className="bg-card border rounded-xl p-4 shadow-sm space-y-1.5">
              <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Motif
              </span>
              <p className="font-semibold text-[14px] line-clamp-2">
                {donation.description || 'Non spécifié'}
              </p>
            </div>
          </div>

          {/* Section Reçu Fiscal */}
          <div className="pt-4 border-t space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Reçu Fiscal
            </h4>
            
            {loading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : receipt ? (
              <div className="bg-muted/30 border rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm">N° {receipt.numero_recu}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Généré le {format(new Date(receipt.date_generation), 'dd/MM/yyyy')}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild className="rounded-lg shadow-sm">
                    <a href={pb.files.getURL(receipt, receipt.pdf_url)} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" /> Télécharger
                    </a>
                  </Button>
                </div>
                
                {emails.length > 0 && (
                  <div className="text-xs text-muted-foreground pt-2 border-t mt-2">
                    <p className="font-medium mb-1 flex items-center gap-1.5"><Mail className="w-3 h-3" /> Historique d'envoi :</p>
                    {emails.map(e => (
                      <div key={e.id} className="flex justify-between py-1">
                        <span>{format(new Date(e.date_envoi), 'dd/MM/yyyy HH:mm')}</span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">{e.statut}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border border-dashed rounded-xl bg-muted/10">
                <p className="text-sm text-muted-foreground">Aucun reçu fiscal généré pour ce don.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-muted/20 border-t flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => { onClose(); onEdit(donation); }} className="text-muted-foreground hover:text-foreground">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            {!receipt ? (
              <FiscalReceiptGenerator 
                donation={donation} 
                onGenerated={(data) => {
                  fetchReceiptData();
                  if (onReceiptUpdate) onReceiptUpdate();
                }}
                className="rounded-xl shadow-sm"
              />
            ) : (
              <Button onClick={() => setIsEmailModalOpen(true)} className="rounded-xl shadow-sm">
                <Mail className="w-4 h-4 mr-2" /> Envoyer par Email
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      <ReceiptEmailSender 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
        receipt={receipt} 
        donorEmail={donation.expand?.membre_id?.email}
        onSent={fetchReceiptData}
      />
    </Dialog>
  );
};

export default DonationDetailModal;