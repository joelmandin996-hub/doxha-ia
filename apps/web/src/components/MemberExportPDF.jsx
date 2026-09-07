import React, { useState, useRef } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

const MemberExportPDF = () => {
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef(null);
  const [printData, setPrintData] = useState(null);

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

      // Set data to render in the hidden div
      setPrintData({
        date: format(new Date(), 'dd/MM/yyyy HH:mm'),
        members
      });

      // Wait for React to render the hidden div
      setTimeout(async () => {
        if (!printRef.current) {
          setIsExporting(false);
          return;
        }

        try {
          const canvas = await html2canvas(printRef.current, {
            scale: 2,
            useCORS: true,
            logging: false
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          
          const dateStr = format(new Date(), 'yyyy-MM-dd');
          pdf.save(`membres_${dateStr}.pdf`);
          
          toast.success('Export PDF réussi !');
        } catch (err) {
          console.error('Erreur html2canvas/jsPDF:', err);
          toast.error('Échec de la génération du PDF.');
        } finally {
          setPrintData(null);
          setIsExporting(false);
        }
      }, 1000); // Give images time to load

    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error('Échec de l\'export PDF.');
      setIsExporting(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={handleExport} 
        disabled={isExporting}
        className="gap-2 rounded-xl"
      >
        <FileText className="w-4 h-4 text-red-500" />
        {isExporting ? 'Export...' : 'Exporter PDF'}
      </Button>

      {/* Hidden printable area */}
      {printData && (
        <div 
          style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px', backgroundColor: 'white', padding: '40px', color: 'black' }}
        >
          <div ref={printRef} style={{ backgroundColor: 'white', padding: '20px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>Liste des Membres</h1>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px', textAlign: 'center' }}>Exporté le : {printData.date}</p>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Photo</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Nom</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Téléphone</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Statut</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Adhésion</th>
                </tr>
              </thead>
              <tbody>
                {printData.members.map((m, idx) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ padding: '8px' }}>
                      {m.profile_photo ? (
                        <img 
                          src={pb.files.getUrl(m, m.profile_photo, { thumb: '50x50' })} 
                          alt="avatar" 
                          style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                          {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{m.name}</td>
                    <td style={{ padding: '8px' }}>{m.email}</td>
                    <td style={{ padding: '8px' }}>{m.phone || '-'}</td>
                    <td style={{ padding: '8px' }}>{m.status || 'Actif'}</td>
                    <td style={{ padding: '8px' }}>{m.church_join_date ? format(new Date(m.church_join_date), 'dd/MM/yyyy') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default MemberExportPDF;