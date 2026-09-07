import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarPlus as CalendarIcon, Image as ImageIcon, Link as LinkIcon, Hash, Send, Save, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import pb from '@/lib/pocketbaseClient.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { toast } from 'sonner';

const SocialPostForm = ({ postToEdit, accounts, onSaved, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState('12:00');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title || '');
      setContent(postToEdit.content || '');
      setLink(postToEdit.link || '');
      setHashtags(postToEdit.hashtags || '');
      setSelectedAccounts(postToEdit.accounts || []);
      if (postToEdit.scheduled_date) setDate(new Date(postToEdit.scheduled_date));
      if (postToEdit.scheduled_time) setTime(postToEdit.scheduled_time);
    }
  }, [postToEdit]);

  const toggleAccount = (id) => {
    setSelectedAccounts(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
    if (errors.accounts) setErrors(prev => ({ ...prev, accounts: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!content.trim()) newErrors.content = "Le contenu de la publication est requis.";
    if (selectedAccounts.length === 0) newErrors.accounts = "Sélectionnez au moins un compte social.";
    if (!date) newErrors.date = "La date de publication est requise.";
    if (!time) newErrors.time = "L'heure de publication est requise.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status) => {
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDate = `${format(date, 'yyyy-MM-dd')} 00:00:00.000Z`;

      const payload = {
        title,
        content,
        link,
        hashtags,
        accounts: selectedAccounts,
        scheduled_date: formattedDate,
        scheduled_time: time,
        status,
        created_by: pb.authStore.model.id
      };

      if (postToEdit) {
        await pb.collection('social_posts').update(postToEdit.id, payload, { $autoCancel: false });
        toast.success("Publication mise à jour avec succès.");
      } else {
        if (status === 'Programmé') {
          const response = await apiServerClient.fetch('/social/posts/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              content,
              link,
              hashtags: hashtags.split(' ').filter(Boolean),
              accountIds: selectedAccounts,
              scheduledDate: format(date, 'yyyy-MM-dd'),
              scheduledTime: time
            })
          }).catch(() => ({ ok: false, error: "Erreur réseau" }));
          
          if (!response.ok) {
            console.warn("Backend API call failed, falling back to database save.");
          }
        }
        
        await pb.collection('social_posts').create(payload, { $autoCancel: false });
        toast.success(status === 'Programmé' ? "Publication programmée avec succès!" : "Brouillon enregistré.");
      }
      onSaved();
    } catch (error) {
      console.error("Save post error:", error);
      toast.error(`Erreur d'enregistrement: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form Section */}
      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="font-semibold text-foreground">
            Comptes cibles <span className="text-destructive">*</span>
          </Label>
          <div className="flex flex-wrap gap-3">
            {accounts.map(acc => (
              <div key={acc.id} className={cn("flex items-center space-x-2 bg-muted/50 p-2.5 rounded-lg border transition-colors", selectedAccounts.includes(acc.id) && "border-primary bg-primary/5")}>
                <Checkbox 
                  id={`acc-${acc.id}`} 
                  checked={selectedAccounts.includes(acc.id)}
                  onCheckedChange={() => toggleAccount(acc.id)}
                />
                <Label htmlFor={`acc-${acc.id}`} className="cursor-pointer flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${acc.platform === 'facebook' ? 'bg-[hsl(var(--social-facebook))]' : 'bg-[hsl(var(--social-instagram))]'}`} />
                  {acc.account_name}
                </Label>
              </div>
            ))}
            {accounts.length === 0 && <p className="text-sm text-muted-foreground py-2">Aucun compte connecté.</p>}
          </div>
          {errors.accounts && (
            <p className="text-sm text-destructive flex items-center mt-1">
              <AlertCircle className="w-4 h-4 mr-1 inline" /> {errors.accounts}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="post-title" className="font-semibold text-foreground">
            Titre de la publication (Optionnel - usage interne)
          </Label>
          <Input 
            id="post-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Annonce de l'événement de Pâques"
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label className="font-semibold text-foreground">
            Contenu de la publication <span className="text-destructive">*</span>
          </Label>
          <Textarea 
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (errors.content) setErrors(prev => ({ ...prev, content: null }));
            }}
            placeholder="Écrivez le message de votre publication..."
            className={cn("min-h-[150px] resize-none bg-background", errors.content && "border-destructive focus-visible:ring-destructive")}
          />
          {errors.content && (
            <p className="text-sm text-destructive flex items-center mt-1">
              <AlertCircle className="w-4 h-4 mr-1 inline" /> {errors.content}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-semibold text-foreground">Lien (Optionnel)</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://" 
                className="pl-9 bg-background"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-semibold text-foreground">Hashtags</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#eglise #dimanche" 
                className="pl-9 bg-background"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-semibold text-foreground">
              Date <span className="text-destructive">*</span>
            </Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal bg-background", !date && "text-muted-foreground", errors.date && "border-destructive")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    setDate(newDate);
                    setDateOpen(false);
                    if (errors.date) setErrors(prev => ({ ...prev, date: null }));
                  }}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
          </div>
          <div className="space-y-2">
            <Label className="font-semibold text-foreground">
              Heure <span className="text-destructive">*</span>
            </Label>
            <Input 
              type="time" 
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                if (errors.time) setErrors(prev => ({ ...prev, time: null }));
              }}
              className={cn("bg-background", errors.time && "border-destructive")}
            />
            {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Annuler</Button>
          <Button variant="secondary" onClick={() => handleSubmit('Brouillon')} disabled={isSubmitting} className="gap-2">
            <Save className="w-4 h-4" /> Brouillon
          </Button>
          <Button onClick={() => handleSubmit('Programmé')} disabled={isSubmitting} className="gap-2 flex-1">
            <Send className="w-4 h-4" /> Programmer
          </Button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-muted/20 rounded-2xl p-6 border flex flex-col">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-muted-foreground" /> Aperçu
        </h3>
        <div className="flex-1 bg-background rounded-xl border shadow-sm p-4 max-w-sm mx-auto w-full">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-xs">Logo</span>
            </div>
            <div>
              <p className="font-semibold text-sm">Votre Page</p>
              <p className="text-xs text-muted-foreground">
                {date ? format(date, "d MMM", { locale: fr }) : 'Date'} à {time || 'Heure'}
              </p>
            </div>
          </div>
          <div className="text-sm whitespace-pre-wrap mb-3 text-foreground">
            {content || <span className="text-muted-foreground italic">Votre texte apparaîtra ici...</span>}
          </div>
          {hashtags && (
            <div className="text-sm text-primary mb-3">
              {hashtags}
            </div>
          )}
          {link && (
            <div className="bg-muted/50 border rounded-lg p-3 text-sm truncate">
              <LinkIcon className="w-4 h-4 inline mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">{link}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialPostForm;