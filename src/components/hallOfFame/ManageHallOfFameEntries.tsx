
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Edit, Trash2, CalendarDays, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ManualHallOfFameEntry } from "@/types/hallOfFame";

export const ManageHallOfFameEntries = () => {
  const [entries, setEntries] = useState<ManualHallOfFameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<ManualHallOfFameEntry | null>(null);
  const [formData, setFormData] = useState({
    category: 'sale' as 'sale' | 'day' | 'month',
    user_display_name: '',
    points: 0,
    description: '',
    date: null as Date | null,
    month: ''
  });
  const [staffOptions, setStaffOptions] = useState<string[]>([]);

  // Fetch entries
  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hall_of_fame_manual')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching manual entries:', error);
      toast.error('Kunde inte hämta manuella rekord');
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff
  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_roles')
        .select('user_display_name')
        .eq('hidden', false)
        .order('user_display_name');

      if (error) throw error;
      setStaffOptions(data.map(s => s.user_display_name));
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchStaff();
  }, []);

  const handleAdd = async () => {
    try {
      // Validate form
      if (!formData.user_display_name || formData.points <= 0) {
        toast.error('Vänligen fyll i alla obligatoriska fält');
        return;
      }

      const entryData: any = {
        category: formData.category,
        user_display_name: formData.user_display_name,
        points: formData.points,
        description: formData.description || null
      };

      // Handle date/month based on category
      if (formData.category === 'sale' || formData.category === 'day') {
        entryData.date = formData.date ? formData.date.toISOString() : null;
      } else if (formData.category === 'month') {
        entryData.month = formData.month || null;
      }

      const { error } = await supabase
        .from('hall_of_fame_manual')
        .insert(entryData);

      if (error) throw error;
      
      toast.success('Rekord tillagt');
      setIsAddDialogOpen(false);
      resetForm();
      fetchEntries();
    } catch (error) {
      console.error('Error adding entry:', error);
      toast.error('Kunde inte lägga till rekord');
    }
  };

  const handleEdit = async () => {
    try {
      if (!currentEntry) return;
      
      // Validate form
      if (!formData.user_display_name || formData.points <= 0) {
        toast.error('Vänligen fyll i alla obligatoriska fält');
        return;
      }

      const entryData: any = {
        category: formData.category,
        user_display_name: formData.user_display_name,
        points: formData.points,
        description: formData.description || null
      };

      // Handle date/month based on category
      if (formData.category === 'sale' || formData.category === 'day') {
        entryData.date = formData.date ? formData.date.toISOString() : null;
        entryData.month = null; // Clear month when it's a sale or day
      } else if (formData.category === 'month') {
        entryData.month = formData.month || null;
        entryData.date = null; // Clear date when it's a month
      }

      const { error } = await supabase
        .from('hall_of_fame_manual')
        .update(entryData)
        .eq('id', currentEntry.id);

      if (error) throw error;
      
      toast.success('Rekord uppdaterat');
      setIsEditDialogOpen(false);
      resetForm();
      fetchEntries();
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('Kunde inte uppdatera rekord');
    }
  };

  const handleDelete = async () => {
    try {
      if (!currentEntry) return;

      const { error } = await supabase
        .from('hall_of_fame_manual')
        .delete()
        .eq('id', currentEntry.id);

      if (error) throw error;
      
      toast.success('Rekord borttaget');
      setIsDeleteDialogOpen(false);
      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Kunde inte ta bort rekord');
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'sale',
      user_display_name: '',
      points: 0,
      description: '',
      date: null,
      month: ''
    });
    setCurrentEntry(null);
  };

  const openEditDialog = (entry: ManualHallOfFameEntry) => {
    setCurrentEntry(entry);
    setFormData({
      category: entry.category,
      user_display_name: entry.user_display_name,
      points: entry.points,
      description: entry.description || '',
      date: entry.date ? new Date(entry.date) : null,
      month: entry.month || ''
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (entry: ManualHallOfFameEntry) => {
    setCurrentEntry(entry);
    setIsDeleteDialogOpen(true);
  };

  const categoryDisplay = (category: string) => {
    switch (category) {
      case 'sale': return 'Högsta sälj';
      case 'day': return 'Bästa dag';
      case 'month': return 'Bästa månad';
      default: return category;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Hall of Fame - Manuella rekord</h2>
        <Button 
          onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" /> Lägg till rekord
        </Button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-card rounded-md" />
          ))}
        </div>
      ) : entries.length > 0 ? (
        <div className="space-y-4">
          {entries.map(entry => (
            <div key={entry.id} className="flex items-center justify-between bg-card p-4 rounded-lg border border-border">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-primary">{entry.user_display_name}</span>
                  <span className="text-sm px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {categoryDisplay(entry.category)}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {entry.points} poäng • 
                  {entry.category === 'month' ? ` ${entry.month}` : 
                   entry.date ? ` ${format(new Date(entry.date), 'd MMMM yyyy', { locale: sv })}` : 
                   ''}
                </div>
                {entry.description && (
                  <div className="text-sm mt-1 text-gray-300">{entry.description}</div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(entry)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(entry)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 border border-dashed border-gray-700 rounded-lg">
          <p className="text-gray-400">
            Inga manuella rekord har lagts till än.
          </p>
        </div>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lägg till rekord</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(value: 'sale' | 'day' | 'month') => setFormData({...formData, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Högsta sälj</SelectItem>
                  <SelectItem value="day">Bästa dag</SelectItem>
                  <SelectItem value="month">Bästa månad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">Säljare</Label>
              <Select
                value={formData.user_display_name}
                onValueChange={(value) => setFormData({...formData, user_display_name: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj säljare" />
                </SelectTrigger>
                <SelectContent>
                  {staffOptions.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Poäng</Label>
              <Input
                id="points"
                type="number"
                value={formData.points || ''}
                onChange={(e) => setFormData({...formData, points: Number(e.target.value)})}
              />
            </div>

            {(formData.category === 'sale' || formData.category === 'day') && (
              <div className="space-y-2">
                <Label>Datum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, 'PPP', { locale: sv }) : <span>Välj datum</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date || undefined}
                      onSelect={(date) => setFormData({...formData, date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {formData.category === 'month' && (
              <div className="space-y-2">
                <Label htmlFor="month">Månad (t.ex. "Februari 2023")</Label>
                <Input
                  id="month"
                  value={formData.month}
                  onChange={(e) => setFormData({...formData, month: e.target.value})}
                  placeholder="Februari 2023"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Beskrivning (valfritt)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Beskriv prestationen..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Avbryt</Button>
            <Button onClick={handleAdd}>Lägg till</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera rekord</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Same form fields as Add Dialog */}
            <div className="space-y-2">
              <Label htmlFor="edit-category">Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(value: 'sale' | 'day' | 'month') => setFormData({...formData, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Högsta sälj</SelectItem>
                  <SelectItem value="day">Bästa dag</SelectItem>
                  <SelectItem value="month">Bästa månad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-user">Säljare</Label>
              <Select
                value={formData.user_display_name}
                onValueChange={(value) => setFormData({...formData, user_display_name: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj säljare" />
                </SelectTrigger>
                <SelectContent>
                  {staffOptions.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-points">Poäng</Label>
              <Input
                id="edit-points"
                type="number"
                value={formData.points || ''}
                onChange={(e) => setFormData({...formData, points: Number(e.target.value)})}
              />
            </div>

            {(formData.category === 'sale' || formData.category === 'day') && (
              <div className="space-y-2">
                <Label>Datum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, 'PPP', { locale: sv }) : <span>Välj datum</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date || undefined}
                      onSelect={(date) => setFormData({...formData, date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {formData.category === 'month' && (
              <div className="space-y-2">
                <Label htmlFor="edit-month">Månad (t.ex. "Februari 2023")</Label>
                <Input
                  id="edit-month"
                  value={formData.month}
                  onChange={(e) => setFormData({...formData, month: e.target.value})}
                  placeholder="Februari 2023"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-description">Beskrivning (valfritt)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Beskriv prestationen..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Avbryt</Button>
            <Button onClick={handleEdit}>Spara ändringar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta bort rekord</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Är du säker på att du vill ta bort detta rekord? Åtgärden kan inte ångras.
            </p>
            {currentEntry && (
              <div className="mt-4 p-4 bg-card/50 rounded-lg">
                <div className="font-medium">{currentEntry.user_display_name}</div>
                <div className="text-sm text-gray-400 mt-1">
                  {categoryDisplay(currentEntry.category)} • {currentEntry.points} poäng
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Avbryt</Button>
            <Button variant="destructive" onClick={handleDelete}>Ta bort</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
