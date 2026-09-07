import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { Camera, CalendarPlus as CalendarIcon } from 'lucide-react';
import MemberAvatar from '@/components/MemberAvatar.jsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils.js';

const STATUS_OPTIONS = ['Actif', 'Inactif', 'Visiteur', 'Nouveau', 'Baptisé'];

const MemberForm = ({ member, onSuccess, onCancel }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'Actif',
    join_date: null,
    church_join_date: null,
    baptism_date: null,
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Popover open states
  const [joinDateOpen, setJoinDateOpen] = useState(false);
  const [churchJoinDateOpen, setChurchJoinDateOpen] = useState(false);
  const [baptismDateOpen, setBaptismDateOpen] = useState(false);

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        email: member.email || '',
        phone: member.phone || '',
        status: member.status || 'Actif',
        join_date: member.join_date ? new Date(member.join_date) : null,
        church_join_date: member.church_join_date ? new Date(member.church_join_date) : null,
        baptism_date: member.baptism_date ? new Date(member.baptism_date) : null,
      });
      if (member.profile_photo) {
        setPhotoPreview(pb.files.getUrl(member, member.profile_photo));
      }
    }
  }, [member]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSelectChange = (value, name) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (field, date) => {
    setFormData((prev) => ({ ...prev, [field]: date }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('members.nameRequired') || 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = t('members.emailRequired') || 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('members.invalidEmail') || 'Invalid email';
    }

    // Date validation: baptism_date cannot be before church_join_date
    if (formData.baptism_date && formData.church_join_date) {
      if (formData.baptism_date < formData.church_join_date) {
        newErrors.baptism_date = 'Baptism date cannot be before church join date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('email', formData.email);
    submitData.append('phone', formData.phone);
    submitData.append('status', formData.status);

    if (formData.join_date) {
      submitData.append('join_date', `${format(formData.join_date, 'yyyy-MM-dd')} 12:00:00.000Z`);
    }
    if (formData.church_join_date) {
      submitData.append('church_join_date', `${format(formData.church_join_date, 'yyyy-MM-dd')} 12:00:00.000Z`);
    }
    if (formData.baptism_date) {
      submitData.append('baptism_date', `${format(formData.baptism_date, 'yyyy-MM-dd')} 12:00:00.000Z`);
    }

    if (photoFile) {
      submitData.append('profile_photo', photoFile);
    }

    try {
      if (member?.id) {
        await pb.collection('members').update(member.id, submitData, { $autoCancel: false });
        toast.success(t('members.memberUpdatedSuccess') || 'Member updated successfully');
      } else {
        await pb.collection('members').create(submitData, { $autoCancel: false });
        toast.success(t('members.memberCreatedSuccess') || 'Member created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error(member?.id ? (t('members.memberUpdatedError') || 'Update failed') : (t('members.memberCreatedError') || 'Creation failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      
      {/* Photo Upload Area */}
      <div className="flex flex-col items-center justify-center gap-3 mb-6">
        <div className="relative group">
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-2xl object-cover border shadow-sm" />
          ) : (
            <MemberAvatar member={member} size="lg" />
          )}
          <label className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
            <Camera className="w-6 h-6" />
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={loading} />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">Click to upload photo</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t('members.memberName')} <span className="text-destructive">*</span></Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} disabled={loading} placeholder="e.g. Maya Chen" className={errors.name ? 'border-destructive' : ''} />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('members.memberEmail')} <span className="text-destructive">*</span></Label>
        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={loading} placeholder="maya@example.com" className={errors.email ? 'border-destructive' : ''} />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">{t('members.memberPhone')}</Label>
          <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} disabled={loading} placeholder="+1 555-0123" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">{t('members.memberStatus')}</Label>
          <Select value={formData.status} onValueChange={(val) => handleSelectChange(val, 'status')} disabled={loading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Church Join Date</Label>
          <Popover open={churchJoinDateOpen} onOpenChange={setChurchJoinDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={loading}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.church_join_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.church_join_date ? format(formData.church_join_date, "PPP", { locale: fr }) : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.church_join_date}
                onSelect={(date) => {
                  handleDateChange('church_join_date', date);
                  setChurchJoinDateOpen(false);
                }}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>Baptism Date</Label>
          <Popover open={baptismDateOpen} onOpenChange={setBaptismDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={loading}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.baptism_date && "text-muted-foreground",
                  errors.baptism_date && "border-destructive"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.baptism_date ? format(formData.baptism_date, "PPP", { locale: fr }) : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.baptism_date}
                onSelect={(date) => {
                  handleDateChange('baptism_date', date);
                  setBaptismDateOpen(false);
                }}
                initialFocus
                locale={fr}
                disabled={(date) => formData.church_join_date && date < formData.church_join_date}
              />
            </PopoverContent>
          </Popover>
          {errors.baptism_date && <p className="text-sm text-destructive">{errors.baptism_date}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t mt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t('members.cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <span className="opacity-50">...</span> : (member?.id ? t('members.save') : t('members.create'))}
        </Button>
      </div>
    </form>
  );
};

export default MemberForm;