import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { CalendarPlus as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils.js';

const TransactionForm = ({ isOpen, onClose, onSuccess, initialData = null, defaultType = 'expense' }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [dateOpen, setDateOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    category_id: '',
    type: defaultType,
    date: new Date(),
    description: '',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount,
        category_id: initialData.category_id,
        type: initialData.type,
        date: initialData.date ? new Date(initialData.date) : new Date(),
        description: initialData.description || '',
        notes: initialData.notes || ''
      });
    } else {
      setFormData(prev => ({
        ...prev,
        type: defaultType,
        date: new Date(),
        amount: '',
        category_id: '',
        description: '',
        notes: ''
      }));
    }
  }, [initialData, defaultType, isOpen]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const records = await pb.collection('budget_categories').getFullList({
          filter: `type = "${formData.type}"`,
          sort: 'name',
          $autoCancel: false
        });
        setCategories(records);
        
        // Reset category if current selection doesn't match new type
        if (!initialData && records.length > 0 && !records.find(c => c.id === formData.category_id)) {
          setFormData(prev => ({ ...prev, category_id: records[0].id }));
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    
    if (isOpen) {
      fetchCategories();
    }
  }, [formData.type, isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      return toast.error("Please enter a valid positive amount.");
    }
    if (!formData.category_id || formData.category_id === 'none') {
      return toast.error("Please select a valid category.");
    }
    if (!formData.date) {
      return toast.error("Please select a date.");
    }

    setLoading(true);
    try {
      const payload = {
        amount: Number(formData.amount),
        category_id: formData.category_id,
        type: formData.type,
        date: `${format(formData.date, 'yyyy-MM-dd')} 12:00:00.000Z`,
        description: formData.description,
        notes: formData.notes,
        created_by: currentUser.id
      };

      if (initialData) {
        await pb.collection('budget_transactions').update(initialData.id, payload, { $autoCancel: false });
        toast.success("Transaction updated successfully!");
      } else {
        await pb.collection('budget_transactions').create(payload, { $autoCancel: false });
        toast.success("Transaction created successfully!");
      }
      
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "An error occurred while saving the transaction.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Transaction Type</Label>
          <Select value={formData.type || undefined} onValueChange={(val) => handleSelectChange('type', val)} disabled={!!initialData}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category_id">Category *</Label>
          <Select value={formData.category_id || undefined} onValueChange={(val) => handleSelectChange('category_id', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
              {categories.length === 0 && (
                <SelectItem value="none" disabled>No categories available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input 
              id="amount" 
              name="amount" 
              type="number" 
              step="0.01"
              min="0.01"
              value={formData.amount} 
              onChange={handleChange} 
              className="pl-7"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Date *</Label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date ? format(formData.date, "PPP", { locale: fr }) : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(date) => {
                  setFormData(prev => ({ ...prev, date }));
                  setDateOpen(false);
                }}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input 
          id="description" 
          name="description" 
          value={formData.description} 
          onChange={handleChange} 
          placeholder="Brief description of transaction" 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea 
          id="notes" 
          name="notes" 
          value={formData.notes} 
          onChange={handleChange} 
          placeholder="Any extra details..." 
          className="resize-none h-20"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Transaction' : 'Save Transaction'}
        </Button>
      </div>
    </form>
  );
};

export default TransactionForm;